import { createFileRoute } from "@tanstack/react-router";
import fs from "node:fs/promises";
import path from "node:path";

export const Route = createFileRoute("/api/public/legacy-css")({
  server: {
    handlers: {
      GET: async () => {
        const legacyCssPath = path.join(process.cwd(), ".output/public/legacy.css");

        try {
          const css = await fs.readFile(legacyCssPath, "utf8");

          return new Response(css, {
            status: 200,
            headers: {
              "content-type": "text/css; charset=utf-8",
              "cache-control": "no-store, no-cache, must-revalidate, private",
              "x-content-type-options": "nosniff",
              "referrer-policy": "no-referrer",
            },
          });
        } catch (error) {
          console.error("Failed to serve legacy CSS:", error);
          return new Response("/* legacy css unavailable */", {
            status: 500,
            headers: {
              "content-type": "text/css; charset=utf-8",
              "cache-control": "no-store, no-cache, must-revalidate, private",
              "x-content-type-options": "nosniff",
            },
          });
        }
      },
    },
  },
});
