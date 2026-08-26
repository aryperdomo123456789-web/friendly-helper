import { createFileRoute } from "@tanstack/react-router";
import { Tv } from "lucide-react";
import { Catalog } from "@/components/player/Catalog";
import { UserPageShell } from "@/components/user-shell/user-page-shell";
import { usePlayerSession } from "@/lib/player-store";

export const Route = createFileRoute("/_authenticated/canais")({
  head: () => ({
    meta: [
      { title: "TV ao Vivo" },
      { name: "description", content: "Assista os canais ao vivo do servidor selecionado." },
      { property: "og:title", content: "TV ao Vivo" },
      { property: "og:description", content: "Canais ao vivo multi-servidor." },
    ],
  }),
  component: CanaisPage,
});

function CanaisPage() {
  const { serverId } = usePlayerSession();
  return (
    <UserPageShell
      className="flex h-full min-h-0 flex-col"
      contentClassName="flex-1 min-h-0"
      title="TV ao Vivo"
      description=""
      icon={Tv}
    >
      <Catalog key={serverId ?? "no-server"} kind="live" hideHeader />
    </UserPageShell>
  );
}
