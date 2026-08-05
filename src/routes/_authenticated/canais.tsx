import { createFileRoute } from "@tanstack/react-router";
import { Catalog } from "@/components/player/Catalog";

export const Route = createFileRoute("/_authenticated/canais")({
  head: () => ({
    meta: [
      { title: "TV ao Vivo | WebPlayer IPTV" },
      { name: "description", content: "Assista os canais ao vivo do servidor selecionado." },
      { property: "og:title", content: "TV ao Vivo | WebPlayer IPTV" },
      { property: "og:description", content: "Canais ao vivo multi-servidor." },
    ],
  }),
  component: () => <Catalog kind="live" />,
});
