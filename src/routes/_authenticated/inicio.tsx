import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { usePlayerSession } from "@/lib/player-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, MonitorPlay, Server, Tv, Zap, CreditCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createPaymentPreference, getMercadoPagoConfig } from "@/lib/payments.functions";
import { getPlans } from "@/lib/plans.functions";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

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
  const search = Route.useSearch() as any;
  const navigate = useNavigate();
  const createPayment = useServerFn(createPaymentPreference);

  useEffect(() => {
    if (search.payment === 'success') {
      toast.success("Pagamento aprovado! Seu acesso foi renovado.");
      navigate({ to: "/inicio", search: {}, replace: true });
    } else if (search.payment === 'failure') {
      toast.error("O pagamento falhou ou foi cancelado.");
      navigate({ to: "/inicio", search: {}, replace: true });
    }
  }, [search.payment, navigate]);

  const fetchPlans = useServerFn(getPlans);
  const { data: plans } = useQuery({
    queryKey: ["available-plans"],
    queryFn: () => fetchPlans(),
  });

  const [paymentLoading, setPaymentLoading] = useState(false);

  const handlePay = async (planId: string) => {
    setPaymentLoading(true);
    try {
      const res = await createPayment({ data: { planId } });
      window.location.href = res.init_point;
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar pagamento");
    } finally {
      setPaymentLoading(false);
    }
  };

  const isExpired = profile?.expires_at && new Date(profile.expires_at).getTime() < Date.now();


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

      {isExpired && !isOwner && (
        <Card className="border-destructive/50 bg-destructive/10 animate-pulse">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center gap-2">
              <Zap className="h-5 w-5" /> ACESSO EXPIRADO
            </CardTitle>
            <CardDescription className="text-destructive/80 font-medium">
              Sua assinatura venceu. Escolha um plano abaixo para continuar assistindo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plans?.filter(p => p.price > 0).map((plan) => (
                <Card key={plan.id} className="bg-card/50 border-destructive/20">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <div className="text-xl font-black text-primary">R$ {Number(plan.price).toFixed(2)}</div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Button 
                      className="w-full h-10 font-bold" 
                      onClick={() => handlePay(plan.id)}
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CreditCard className="mr-2 h-4 w-4" /> RENOVAR AGORA</>}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
