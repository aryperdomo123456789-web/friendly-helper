import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const src = url.searchParams.get("src");

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

        const upstream = await fetch(target.toString(), {
          redirect: "follow",
          headers: {
            "User-Agent": "WebPlayer/1.0",
            Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          },
        });

        if (!upstream.ok) {
          return new Response("Image unavailable", { status: 502 });
        }

        const contentType = upstream.headers.get("content-type") ?? "";
        if (!contentType.startsWith("image/")) {
          return new Response("Not an image", { status: 415 });
        }

        const headers = new Headers();
        headers.set("content-type", contentType);
        headers.set("cache-control", "no-store, no-cache, must-revalidate, private");
        headers.set("x-content-type-options", "nosniff");
        headers.set("referrer-policy", "no-referrer");

        return new Response(upstream.body, {
          status: 200,
          headers,
        });
      },
    },
  },
});
