// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const fileEnv = loadEnv("production", process.cwd(), "");
const publicEnvValue = (name: string) => process.env[name] || fileEnv[name] || "";

export default defineConfig({
  // Only the two public Supabase values used by src/integrations/supabase/client.ts
  // are exposed to the browser. This prevents unrelated legacy VITE_* values,
  // especially VITE_SUPABASE_PROJECT_ID, from leaking into the release bundle.
  envDefine: false,
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(publicEnvValue("VITE_SUPABASE_URL")),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        publicEnvValue("VITE_SUPABASE_PUBLISHABLE_KEY"),
      ),
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
