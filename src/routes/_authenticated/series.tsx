import { createFileRoute } from "@tanstack/react-router";
import { MonitorPlay } from "lucide-react";
import { Catalog } from "@/components/player/Catalog";
import { UserPageShell } from "@/components/user-shell/user-page-shell";
import { usePlayerSession } from "@/lib/player-store";

export const Route = createFileRoute("/_authenticated/series")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "Séries" },
      { name: "description", content: "Séries com temporadas e episódios do servidor ativo." },
      { property: "og:title", content: "Séries" },
      { property: "og:description", content: "Séries on demand multi-servidor." },
    ],
  }),
  component: SeriesPage,
});

function SeriesPage() {
  const search = Route.useSearch();
  const initialSearch = typeof search.q === "string" ? search.q : "";
  const { serverId } = usePlayerSession();
  return (
    <UserPageShell
      className="flex h-full min-h-0 flex-col"
      contentClassName="flex-1 min-h-0"
      title="Séries"
      description=""
      icon={MonitorPlay}
    >
      <Catalog key={serverId ?? "no-server"} kind="series" initialSearch={initialSearch} hideHeader />
    </UserPageShell>
  );
}
