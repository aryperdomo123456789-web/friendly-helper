import { createFileRoute } from "@tanstack/react-router";

// Public because <video>/hls.js cannot attach an Authorization header.
// Security model: the querystring carries ONLY an AES-256-GCM ciphertext produced
// by the server. The panel DNS/user/password never reach the browser, so a
// network capture on the client side yields nothing reusable outside its TTL.
export const Route = createFileRoute("/api/public/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { readStreamToken, looksLikePlaylist, rewritePlaylist } = await import(
          "@/lib/stream-proxy.server"
        );
        const url = new URL(request.url);
        const token = await readStreamToken(url.searchParams.get("s"));
        if (!token) return new Response("Token invalido ou expirado", { status: 403 });

        const target = token.url;
        const range = request.headers.get("range");
        const expectsHls = url.searchParams.get("hls") === "1" || target.includes(".m3u8");
        // Panels hand out short-lived, sometimes IP-bound redirect tokens and
        // occasionally answer 5xx while re-arming the stream. A single attempt
        // therefore fails intermittently -> retry before giving up.
        const attemptFetch = async (): Promise<Response | null> => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 20_000);
          try {
            return await fetch(target, {
              redirect: "follow",
              signal: controller.signal,
              headers: {
                "User-Agent": "VLC/3.0.20 LibVLC/3.0.20",
                Accept: "*/*",
                ...(range ? { Range: range } : {}),
              },
            });
          } catch {
            return null;
          } finally {
            clearTimeout(timer);
          }
        };

        let upstream: Response | null = null;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
          upstream = await attemptFetch();
          if (upstream && (upstream.ok || upstream.status === 206 || upstream.status === 404)) break;
          // A failed response can still carry a body. Explicitly cancel it before
          // retrying so the provider does not count abandoned requests as active
          // media connections.
          await upstream?.body?.cancel().catch(() => undefined);
        }

        if (!upstream) {
          if (expectsHls) return unavailableHlsResponse();
          return unavailableMediaResponse();
        }


        const contentType = upstream.headers.get("content-type") ?? "";
        const baseUrl = upstream.url || target;

        if (!upstream.ok && upstream.status !== 206) {
          // Never echo the upstream URL/body: it would expose the panel host.
          // A media provider being temporarily unavailable is a playback state,
          // not an application/route crash. Returning a valid, finished HLS
          // manifest keeps the player error local instead of turning it into a
          // platform-level 502 and blank error screen.
          if (expectsHls) {
            await upstream.body?.cancel().catch(() => undefined);
            return unavailableHlsResponse();
          }
          await upstream.body?.cancel().catch(() => undefined);
          return unavailableMediaResponse();
        }

        if (
          /mpegurl|application\/vnd\.apple|text\/plain|text\/html/i.test(contentType) ||
          target.includes(".m3u8")
        ) {
          const body = await upstream.text();
          if (looksLikePlaylist(contentType, body)) {
            const ttlSeconds = Math.max(60, token.expiresAt - Math.floor(Date.now() / 1000));
            const rewritten = await rewritePlaylist(body, baseUrl, {
              ttlSeconds,
              ...(token.subject ? { subject: token.subject } : {}),
            });
            const headers = baseSecurityHeaders();
            headers.set("content-type", "application/vnd.apple.mpegurl");
            return new Response(rewritten, { status: 200, headers });
          }
          return unavailableHlsResponse();
        }

        const headers = baseSecurityHeaders();
        headers.set("content-type", contentType || "video/mp2t");
        for (const key of ["content-length", "content-range", "accept-ranges"]) {
          const value = upstream.headers.get(key);
          if (value) headers.set(key, value);
        }

        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});

function baseSecurityHeaders(): Headers {
  const headers = new Headers();
  // No caching anywhere: proxied media must not be persisted by CDNs/browsers.
  headers.set("cache-control", "no-store, no-cache, must-revalidate, private");
  headers.set("referrer-policy", "no-referrer");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-robots-tag", "noindex, nofollow");
  return headers;
}

function unavailableHlsResponse(): Response {
  const headers = baseSecurityHeaders();
  headers.set("content-type", "application/vnd.apple.mpegurl");
  headers.set("x-stream-status", "unavailable");
  // This is intentionally a syntactically valid, completed media playlist.
  // It contains no upstream details and prevents a provider outage from being
  // reported as an application HTTP 502.
  const playlist = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    "#EXT-X-TARGETDURATION:1",
    "#EXT-X-MEDIA-SEQUENCE:0",
    "#EXT-X-ENDLIST",
    "",
  ].join("\n");
  return new Response(playlist, { status: 200, headers });
}

function unavailableMediaResponse(): Response {
  const headers = baseSecurityHeaders();
  headers.set("x-stream-status", "unavailable");
  // 204 is a successful route response with no media payload. The video element
  // reports its normal playback error without the hosting layer replacing the
  // whole application with an HTTP 502 error boundary.
  return new Response(null, { status: 204, headers });
}
