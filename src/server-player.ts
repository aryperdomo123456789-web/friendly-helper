import { readStreamToken, looksLikePlaylist, rewritePlaylist } from "@/lib/stream-proxy.server";
import { isMainModule, startFetchService } from "@/lib/node-fetch-server.server";

type PlayerServiceEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const SECURITY_HEADERS = {
  "cache-control": "no-store, no-cache, must-revalidate, private",
  pragma: "no-cache",
  expires: "0",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow",
  "x-served-by": "stream-mago-bot-player",
};

const playerService = {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return jsonResponse({ ok: true, service: "player" });
    }

    if (url.pathname !== "/api/public/stream") {
      return new Response("Not found", { status: 404, headers: SECURITY_HEADERS });
    }

    try {
      const token = await readStreamToken(url.searchParams.get("s"));
      if (!token) return textResponse("Token inválido ou expirado.", 403);

      const target = token.url;
      const range = request.headers.get("range");
      const expectsHls = url.searchParams.get("hls") === "1" || target.includes(".m3u8");
      const requestSignal = request.signal;

      const attemptFetch = async (): Promise<Response | null> => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 60_000);
        const abortForwarded = () => controller.abort();
        if (requestSignal.aborted) {
          controller.abort();
        } else {
          requestSignal.addEventListener("abort", abortForwarded, { once: true });
        }
          try {
            return await fetch(target, {
              redirect: "follow",
              signal: controller.signal,
              headers: {
                "User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
                "Accept-Encoding": "identity",
                "Icy-MetaData": "1",
                Accept: "*/*",
                ...(range ? { Range: range } : {}),
              },
            });
        } catch {
          return null;
        } finally {
          clearTimeout(timer);
          requestSignal.removeEventListener("abort", abortForwarded);
        }
      };

      let upstream: Response | null = null;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        upstream = await attemptFetch();

        if (upstream && (upstream.status === 301 || upstream.status === 302)) {
            const location = upstream.headers.get("location");
            if (location) {
              const redirectRes = await fetch(location, {
                signal: requestSignal,
                headers: {
                  "User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
                Accept: "*/*",
              },
            });
            if (redirectRes.ok || redirectRes.status === 206) {
              upstream = redirectRes;
              break;
            }
          }
        }

        if (upstream && (upstream.ok || upstream.status === 206 || upstream.status === 404)) break;
        await upstream?.body?.cancel().catch(() => undefined);
      }

      if (!upstream) {
        return expectsHls ? unavailableHlsResponse() : unavailableMediaResponse();
      }

      const contentType = upstream.headers.get("content-type") ?? "";
      const baseUrl = upstream.url || target;

      if (!upstream.ok && upstream.status !== 206) {
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
          const headers = new Headers(SECURITY_HEADERS);
          headers.set("content-type", "application/vnd.apple.mpegurl");
          return new Response(rewritten, { status: 200, headers });
        }
        return unavailableHlsResponse();
      }

      const headers = new Headers(SECURITY_HEADERS);
      headers.set("content-type", contentType || "video/mp2t");
      for (const key of ["content-length", "content-range", "accept-ranges"]) {
        const value = upstream.headers.get(key);
        if (value) headers.set(key, value);
      }

      return new Response(upstream.body, { status: upstream.status, headers });
    } catch (error) {
      console.error("Player service failed", error);
      return unavailableMediaResponse();
    }
  },
} satisfies PlayerServiceEntry;

if (isMainModule(import.meta.url)) {
  void startFetchService((request) => playerService.fetch(request), { serviceName: "player" });
}

export default playerService;

function textResponse(message: string, status = 200): Response {
  return new Response(message, {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function unavailableHlsResponse(): Response {
  const headers = new Headers(SECURITY_HEADERS);
  headers.set("content-type", "application/vnd.apple.mpegurl");
  headers.set("x-stream-status", "unavailable");
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
  const headers = new Headers(SECURITY_HEADERS);
  headers.set("x-stream-status", "unavailable");
  return new Response(null, { status: 204, headers });
}
