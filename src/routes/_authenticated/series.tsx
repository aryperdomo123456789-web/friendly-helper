import { createFileRoute } from "@tanstack/react-router";
import { Catalog } from "@/components/player/Catalog";

export const Route = createFileRoute("/_authenticated/series")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "Series | WebPlayer IPTV" },
      { name: "description", content: "Series com temporadas e episodios do servidor ativo." },
      { property: "og:title", content: "Series | WebPlayer IPTV" },
      { property: "og:description", content: "Series on demand multi-servidor." },
    ],
  }),
  component: SeriesPage,
});

function SeriesPage() {
  const { q } = Route.useSearch();
  return <Catalog kind="series" initialSearch={q} />;
}
