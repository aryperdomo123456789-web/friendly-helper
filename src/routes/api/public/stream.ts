import { createFileRoute } from "@tanstack/react-router";

// Public because the <video>/hls.js element cannot attach an Authorization header.
// Every URL is HMAC-signed by the server, so only links we produced are honoured.
export const Route = createFileRoute("/api/public/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { readSignedStreamUrl, looksLikePlaylist, rewritePlaylist } = await import(
          "@/lib/stream-proxy.server"
        );
        const url = new URL(request.url);
        const target = await readSignedStreamUrl(url.searchParams.get("u"), url.searchParams.get("t"));
        if (!target) return new Response("Assinatura invalida", { status: 403 });

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
          return new Response(`Servidor de midia respondeu ${upstream.status}`, {
            status: upstream.status === 404 ? 404 : 502,
          });
        }

        // Playlists must be rewritten so segments keep flowing through this proxy.
        if (/mpegurl|application\/vnd\.apple|text\/plain|text\/html/i.test(contentType) || target.includes(".m3u8")) {
          const body = await upstream.text();
          if (looksLikePlaylist(contentType, body)) {
            return new Response(await rewritePlaylist(body, baseUrl), {
              status: 200,
              headers: {
                "content-type": "application/vnd.apple.mpegurl",
                "cache-control": "no-store",
              },
            });
          }
          return new Response(body.slice(0, 400) || "Fluxo indisponivel", { status: 502 });
        }

        const headers = new Headers();
        headers.set("content-type", contentType || "video/mp2t");
        for (const key of ["content-length", "content-range", "accept-ranges"]) {
          const value = upstream.headers.get(key);
          if (value) headers.set(key, value);
        }
        headers.set("cache-control", "no-store");

        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});
