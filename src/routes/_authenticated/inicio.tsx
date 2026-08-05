import { createFileRoute, Link } from "@tanstack/react-router";
import { usePlayerSession } from "@/lib/player-store";
import { Card, CardContent } from "@/components/ui/card";
import { Film, MonitorPlay, Server, Tv } from "lucide-react";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Inicio | WebPlayer IPTV" },
      { name: "description", content: "Painel inicial do WebPlayer com acesso rapido ao catalogo." },
      { property: "og:title", content: "Inicio | WebPlayer IPTV" },
      { property: "og:description", content: "Seu player IPTV multi-servidor." },
    ],
  }),
  component: Inicio,
});

const CARDS = [
  { to: "/canais", label: "TV ao Vivo", desc: "Canais em tempo real", icon: Tv },
  { to: "/filmes", label: "Filmes", desc: "Catalogo on demand", icon: Film },
  { to: "/series", label: "Series", desc: "Temporadas e episodios", icon: MonitorPlay },
  { to: "/servidores", label: "Servidores", desc: "Trocar de servidor", icon: Server },
] as const;

function Inicio() {
  const { profile, activeServer, isOwner, servers } = usePlayerSession();

  return (
    <div className="space-y-6 min-w-0 w-full overflow-x-hidden">
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-4 lg:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">WebPlayer</p>
        <h1 className="mt-2 text-3xl font-bold">
          Bem-vindo, {profile?.display_name || profile?.username || (isOwner ? "Dono" : "usuario")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Servidor ativo:{" "}
          <span className="font-semibold text-foreground">{activeServer?.name ?? "nenhum"}</span> ·{" "}
          {servers.length} servidor(es) liberado(s)
          {profile ? ` · limite de ${profile.max_connections} conexao(oes)` : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => (
          <Link key={card.to} to={card.to}>
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/60">
              <CardContent className="flex items-center gap-4 p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                  <card.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{card.label}</p>
                  <p className="text-xs text-muted-foreground">{card.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
