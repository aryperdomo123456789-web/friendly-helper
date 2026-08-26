import { createFileRoute } from "@tanstack/react-router";
import { readLocalImageCache, writeLocalImageCache } from "@/lib/server-media-cache.server";

export const Route = createFileRoute("/api/public/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const src = url.searchParams.get("src");
        const serverId = url.searchParams.get("server_id");

        if (!src) return new Response("Missing src", { status: 400 });

        let target: URL;
        try {
          target = new URL(src);
        } catch {
          return new Response("Invalid src", { status: 400 });
        }

        if (target.protocol !== "http:" && target.protocol !== "https:") {
          return new Response("Unsupported protocol", { status: 400 });
        }

        const cached = await readLocalImageCache(target.toString(), serverId);
        const serveCached = (reason = "hit") => {
          if (!cached?.body) return null;

          const headers = new Headers();
          headers.set("content-type", cached.meta.content_type);
          headers.set("cache-control", "public, max-age=86400, stale-while-revalidate=604800");
          headers.set("x-content-type-options", "nosniff");
          headers.set("referrer-policy", "no-referrer");
          headers.set("x-image-cache", reason);
          if (serverId) headers.set("x-server-id", serverId);

          return new Response(cached.body, {
            status: 200,
            headers,
          });
        };

        if (cached?.body && !cached.stale) {
          return serveCached("hit");
        }

        try {
          const upstream = await fetch(target.toString(), {
            redirect: "follow",
            headers: {
              "User-Agent": "IPTV-System/1.0",
              Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            },
          });

          if (!upstream.ok) {
            return serveCached("stale-fallback") ?? new Response("Image unavailable", { status: 502 });
          }

          const contentType = upstream.headers.get("content-type") ?? "";
          if (!contentType.startsWith("image/")) {
            return serveCached("stale-fallback") ?? new Response("Not an image", { status: 415 });
          }

          const upstreamBody = await upstream.arrayBuffer();
          const body = Buffer.from(upstreamBody);
          await writeLocalImageCache(target.toString(), serverId, contentType, body);

          const headers = new Headers();
          headers.set("content-type", contentType);
          headers.set("cache-control", "public, max-age=86400, stale-while-revalidate=604800");
          headers.set("x-content-type-options", "nosniff");
          headers.set("referrer-policy", "no-referrer");
          headers.set("x-image-cache", "miss");
          if (serverId) headers.set("x-server-id", serverId);

          return new Response(body, {
            status: 200,
            headers,
          });
        } catch {
          return serveCached("stale-fallback") ?? new Response("Image unavailable", { status: 502 });
        }
      },
    },
  },
});
