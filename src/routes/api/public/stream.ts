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
        const upstream = await fetch(target, {
          redirect: "follow",
          headers: {
            "User-Agent": "VLC/3.0.20 LibVLC/3.0.20",
            Accept: "*/*",
            ...(range ? { Range: range } : {}),
          },
        });

        const contentType = upstream.headers.get("content-type") ?? "";
        const baseUrl = upstream.url || target;

        if (!upstream.ok && upstream.status !== 206) {
          // Never echo the upstream URL/body: it would expose the panel host.
          return new Response("Canal indisponivel no servidor", {
            status: upstream.status === 404 ? 404 : 502,
            headers: baseSecurityHeaders(),
          });
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
          return new Response("Fluxo indisponivel", { status: 502, headers: baseSecurityHeaders() });
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
