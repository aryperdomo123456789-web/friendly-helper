import { createFileRoute } from "@tanstack/react-router";
import { Film } from "lucide-react";
import { Catalog } from "@/components/player/Catalog";
import { UserPageShell } from "@/components/user-shell/user-page-shell";
import { usePlayerSession } from "@/lib/player-store";

export const Route = createFileRoute("/_authenticated/filmes")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "Filmes" },
      { name: "description", content: "Catálogo de filmes on demand do servidor selecionado." },
      { property: "og:title", content: "Filmes" },
      { property: "og:description", content: "Filmes on demand multi-servidor." },
    ],
  }),
  component: FilmesPage,
});

function FilmesPage() {
  const search = Route.useSearch();
  const initialSearch = typeof search.q === "string" ? search.q : "";
  const { serverId } = usePlayerSession();
  return (
    <UserPageShell
      className="flex h-full min-h-0 flex-col"
      contentClassName="flex-1 min-h-0"
      title="Filmes"
      description=""
      icon={Film}
    >
      <Catalog key={serverId ?? "no-server"} kind="movie" initialSearch={initialSearch} hideHeader />
    </UserPageShell>
  );
}
