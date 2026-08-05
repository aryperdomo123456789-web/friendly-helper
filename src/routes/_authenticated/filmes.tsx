import { createFileRoute } from "@tanstack/react-router";
import { Catalog } from "@/components/player/Catalog";

export const Route = createFileRoute("/_authenticated/filmes")({
  head: () => ({
    meta: [
      { title: "Filmes | WebPlayer IPTV" },
      { name: "description", content: "Catalogo de filmes on demand do servidor selecionado." },
      { property: "og:title", content: "Filmes | WebPlayer IPTV" },
      { property: "og:description", content: "Filmes on demand multi-servidor." },
    ],
  }),
  component: () => <Catalog kind="movie" />,
});
