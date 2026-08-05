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
import { DEFAULT_BRAND_IMAGE_URL, getAppConfig } from "../lib/config.functions";
import { useGlobalRemoteNavigation } from "../lib/remote-navigation";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

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
        { title: "WebPlayer IPTV" },
        { name: "description", content: "O melhor player IPTV multi-servidor." },
        { name: "author", content: "WebPlayer" },
        { property: "og:title", content: "WebPlayer IPTV" },
        { property: "og:description", content: "O melhor player IPTV multi-servidor." },
        { property: "og:type", content: "website" },
        { property: "og:image", content: DEFAULT_BRAND_IMAGE_URL },
        { property: "og:image:secure_url", content: DEFAULT_BRAND_IMAGE_URL },
        { property: "og:image:alt", content: "WebPlayer IPTV" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@Lovable" },
        { name: "twitter:image", content: DEFAULT_BRAND_IMAGE_URL },
        { name: "twitter:image:alt", content: "WebPlayer IPTV" },
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
      </body>
    </html>
  );
}

function ThemeApplier() {
  const fetchConfig = useServerFn(getAppConfig);

  const { data: config } = useQuery({
    queryKey: ["app-config-public"],
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
      link.href = DEFAULT_BRAND_IMAGE_URL;
    }
  }, [config]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useGlobalRemoteNavigation();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeApplier />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
