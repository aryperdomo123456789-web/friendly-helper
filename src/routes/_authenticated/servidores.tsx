import { createFileRoute } from "@tanstack/react-router";
import { usePlayerSession } from "@/lib/player-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Server } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UserPageShell } from "@/components/user-shell/user-page-shell";

export const Route = createFileRoute("/_authenticated/servidores")({
  head: () => ({
    meta: [
      { title: "Servidores" },
      { name: "description", content: "Troque entre os servidores IPTV liberados para o seu acesso." },
      { property: "og:title", content: "Servidores" },
      { property: "og:description", content: "Multi-servidor sem misturar catálogos." },
    ],
  }),
  component: Servidores,
});

function Servidores() {
  const { servers, serverId, setServerId, preloadServerCatalog } = usePlayerSession();

  return (
    <UserPageShell
      title="Servidores"
      description=""
      icon={Server}
    >

      {servers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Nenhum servidor liberado para este acesso.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {servers.map((server) => {
            const active = server.id === serverId;
            return (
              <Card
                key={server.id}
                className={cn(active && "border-primary")}
                onMouseEnter={() => preloadServerCatalog(server.id)}
                onFocusCapture={() => preloadServerCatalog(server.id)}
                tabIndex={0}
              >
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid h-11 w-11 place-items-center rounded-xl",
                        active ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      <Server className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{server.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {active ? "Em uso agora" : "Disponível"}
                      </p>
                    </div>
                  </div>
                  {active ? (
                    <Check className="h-5 w-5 text-online" />
                  ) : (
                    <Button size="sm" onClick={() => {
                      if (confirm("Deseja alternar para este servidor?")) {
                        setServerId(server.id);
                        toast.success("Servidor alterado com sucesso!");
                      }
                    }}>
                      Usar
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </UserPageShell>
  );
}
