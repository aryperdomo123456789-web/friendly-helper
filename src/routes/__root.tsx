import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";
import {
  APP_CONFIG_QUERY_KEY,
  DEFAULT_BRAND_IMAGE_URL,
  getAppConfig,
} from "../lib/config.functions";
import { useGlobalRemoteNavigation } from "../lib/remote-navigation";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { RuntimeErrorMonitor } from "@/components/ui/runtime-error-monitor";

const LEGACY_CSS_BOOTSTRAP = `
(function () {
  try {
    var ua = navigator.userAgent || "";
    var isTvBrowser = /(webos|tizen|smarttv|smart-tv|android tv|googletv|hbbtv|firetv|appletv|netcast)/i.test(ua);
    var needsLegacy = isTvBrowser || !("CSSLayerBlockRule" in window) || !window.CSS || !window.CSS.supports || !window.CSS.supports("color", "oklch(0 0 0)");
    if (!needsLegacy || document.querySelector('link[data-legacy-css="true"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/api/public/legacy-css?v=20260805";
    link.setAttribute("data-legacy-css", "true");
    document.head.appendChild(link);
  } catch (error) {}
})();`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    // Note: We use a separate query or fetch in ThemeApplier for runtime, 
    // but head() is SSR-ready. For dynamic favicons/titles, we'd need to pre-fetch.
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "Aplicativo IPTV" },
        { name: "description", content: "Aplicativo IPTV multi-servidor." },
        { name: "author", content: "Sistema" },
        { property: "og:title", content: "Aplicativo IPTV" },
        { property: "og:description", content: "Aplicativo IPTV multi-servidor." },
        { property: "og:type", content: "website" },
        { property: "og:image", content: DEFAULT_BRAND_IMAGE_URL },
        { property: "og:image:secure_url", content: DEFAULT_BRAND_IMAGE_URL },
        { property: "og:image:alt", content: "Aplicativo IPTV" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@app" },
        { name: "twitter:image", content: DEFAULT_BRAND_IMAGE_URL },
        { name: "twitter:image:alt", content: "Aplicativo IPTV" },
        { name: "theme-color", content: "#05070b" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "icon", href: DEFAULT_BRAND_IMAGE_URL, type: "image/png" },
        { rel: "manifest", href: "/manifest.webmanifest" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
    return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: LEGACY_CSS_BOOTSTRAP }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        <RuntimeErrorMonitor />
      </body>
    </html>
  );
}

function ThemeApplier() {
  const fetchConfig = useServerFn(getAppConfig);

  const { data: config } = useQuery({
    queryKey: APP_CONFIG_QUERY_KEY,
    queryFn: () => fetchConfig(),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const mode = config?.theme_mode ?? "azul";
    document.documentElement.setAttribute("data-theme", mode);
    document.documentElement.classList.toggle("dark", mode !== "light");

    const head = document.getElementsByTagName("head")[0];
    if (head) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        head.appendChild(link);
      }
      link.href = config?.favicon_url || config?.logo_small_url || config?.logo_url || DEFAULT_BRAND_IMAGE_URL;
    }

    const primary = config?.theme?.primary || "#3ba0ff";
    const background = config?.theme?.bg || "#05070b";
    const brandName = config?.short_name || config?.name || "Sistema IPTV";
    const description = config?.description || "Aplicativo IPTV multi-servidor.";
    const luminance = (() => {
      const hex = primary.replace("#", "");
      if (hex.length !== 6) return 0.2;
      const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
      const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
      const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
      const linear = [r, g, b].map((value) => (
        value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
      ));
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    })();
    const primaryForeground = luminance > 0.45 ? "#05070b" : "#ffffff";

    document.documentElement.style.setProperty("--background", background);
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--primary-foreground", primaryForeground);
    document.documentElement.style.setProperty("--sidebar-primary", primary);
    document.documentElement.style.setProperty("--sidebar-primary-foreground", primaryForeground);
    document.documentElement.style.setProperty("--ring", primary);
    document.documentElement.style.setProperty("--theme-color", primary);

    document.title = `${document.title.replace(/\s*\|.*$/, "").trim()} | ${brandName}`;

    const themeColorMeta = document.querySelector("meta[name='theme-color']");
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", primary);
    }

    const upsertMeta = (selector: string, attr: "name" | "property", key: string, value: string) => {
      let meta = document.querySelector<HTMLMetaElement>(selector);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, key);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", value);
    };

    upsertMeta("meta[name='description']", "name", "description", description);
    upsertMeta("meta[name='author']", "name", "author", brandName);
    upsertMeta("meta[property='og:title']", "property", "og:title", `${document.title}`);
    upsertMeta("meta[property='og:description']", "property", "og:description", description);
    upsertMeta("meta[property='og:image:alt']", "property", "og:image:alt", brandName);
    upsertMeta("meta[name='twitter:image:alt']", "name", "twitter:image:alt", brandName);
  }, [config]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useGlobalRemoteNavigation();

  useEffect(() => {
    const reloadFlagKey = "wp-chunk-reload-once";
    sessionStorage.removeItem(reloadFlagKey);

    const shouldReloadForChunkError = (value: unknown) => {
      const message =
        typeof value === "string"
          ? value.toLowerCase()
          : value instanceof Error
            ? `${value.name}: ${value.message}`.toLowerCase()
            : "";

      if (!message) return false;
      return (
        message.includes("failed to fetch dynamically imported module") ||
        message.includes("importing a module script failed") ||
        message.includes("chunkloaderror") ||
        message.includes("vite:preloaderror")
      );
    };

    const triggerSafeReload = () => {
      if (sessionStorage.getItem(reloadFlagKey) === "1") return;
      sessionStorage.setItem(reloadFlagKey, "1");
      window.location.reload();
    };

    const onVitePreloadError = (event: Event) => {
      event.preventDefault();
      triggerSafeReload();
    };

    const onWindowError = (event: ErrorEvent) => {
      if (shouldReloadForChunkError(event.error ?? event.message)) {
        event.preventDefault();
        triggerSafeReload();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (shouldReloadForChunkError(event.reason)) {
        event.preventDefault();
        triggerSafeReload();
      }
    };

    window.addEventListener("vite:preloadError", onVitePreloadError);
    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("vite:preloadError", onVitePreloadError);
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
