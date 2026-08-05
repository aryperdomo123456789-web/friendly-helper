import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAccount, updateMyAccount } from "@/lib/account.functions";
import { getMercadoPagoConfig, createPaymentPreference } from "@/lib/payments.functions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserCog, Link as LinkIcon, Copy, CreditCard, Check, Crown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { title: "Minha Conta | WebPlayer IPTV" },
      {
        name: "description",
        content: "Gerencie seu plano, conexões e credenciais de acesso ao WebPlayer IPTV.",
      },
      { property: "og:title", content: "Minha Conta | WebPlayer IPTV" },
      { property: "og:description", content: "Gerencie seu plano e credenciais de acesso." },
    ],
  }),
  component: ContaPage,
});

function ContaPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const saveAccount = useServerFn(updateMyAccount);
  const mpPreference = useServerFn(createPaymentPreference);

  const account = useQuery({ 
    queryKey: ["my-account"], 
    queryFn: () => fetchAccount() 
  });

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!account.data) return;
    setUsername(account.data.username);
    setDisplayName(account.data.display_name ?? "");
  }, [account.data]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("A nova senha e a confirmacao nao sao iguais");
      return;
    }
    setLoading(true);
    try {
      const result = await saveAccount({
        data: {
          username,
          display_name: displayName,
          current_password: currentPassword,
          new_password: newPassword,
        },
      });
      // Re-autentica com as credenciais novas para manter a sessao valida.
      await supabase.auth.signInWithPassword({
        email: `${result.username}@iptv.local`,
        password: newPassword || currentPassword,
      });
      toast.success("Dados de acesso atualizados com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      void account.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setPlanLoading(planId);
    try {
      const result = await mpPreference({ data: { planId } });
      if (result.init_point) {
        window.location.href = result.init_point;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar pagamento");
    } finally {
      setPlanLoading(null);
    }
  };

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/teste/gratis?ref=${account.data?.referral_code}` 
    : '';

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link de indicação copiado!");
  };

  if (account.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = account.data?.plan;
  const availablePlans = account.data?.availablePlans || [];
  const expiresDate = account.data?.expires_at ? new Date(account.data.expires_at) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic text-primary">Minha Conta</h1>
        <p className="text-muted-foreground font-medium">Gerencie seu plano, indicações e segurança.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card do Plano Atual */}
        <Card className="md:col-span-1 border-primary/20 bg-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
            <Crown className="h-8 w-8 text-primary/20 rotate-12" />
          </div>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              Meu Plano
            </CardTitle>
            <CardDescription>Status da sua assinatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col">
              <span className="text-3xl font-black uppercase text-primary tracking-tighter">
                {currentPlan?.name || "Sem Plano"}
              </span>
              <Badge variant="outline" className="w-fit mt-1 border-primary/30 text-[10px] font-bold uppercase">
                {account.data?.max_connections} Conexão(ões)
              </Badge>
            </div>
            
            <div className="space-y-1 pt-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Vencimento</Label>
              <p className="text-sm font-medium">
                {expiresDate ? (
                  format(expiresDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                ) : (
                  "Vitalício / Sem limite"
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card de Indicação */}
        <Card className="md:col-span-2 border-primary/10 bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" /> Programa de Indicação
            </CardTitle>
            <CardDescription>Indique amigos e ganhe dias extras ou descontos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input readOnly value={referralLink} className="bg-muted/50 font-mono text-xs" />
              <Button size="icon" onClick={copyReferral} variant="secondary">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
              <p className="text-xs font-medium text-primary leading-relaxed">
                Cada novo usuário que assinar através do seu link gera benefícios automáticos na sua próxima renovação.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Planos e Upgrade */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black tracking-tighter uppercase italic text-primary flex items-center gap-2">
          <CreditCard className="h-6 w-6" /> Planos Disponíveis
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availablePlans.map((plan: any) => {
            const isCurrent = currentPlan?.id === plan.id;
            return (
              <Card key={plan.id} className={cn(
                "relative flex flex-col border-primary/10 transition-all hover:border-primary/40",
                isCurrent && "border-primary bg-primary/5 ring-1 ring-primary"
              )}>
                {isCurrent && (
                  <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground font-black italic uppercase text-[10px]">
                    Atual
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-lg font-bold uppercase tracking-tighter">{plan.name}</CardTitle>
                  <CardDescription>{plan.duration_days} dias de acesso</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold">R$</span>
                    <span className="text-3xl font-black tracking-tighter">{Number(plan.price).toFixed(2)}</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-xs font-medium">
                      <Check className="h-3 w-3 text-primary" /> {plan.max_connections} Conexão(ões) Simultâneas
                    </li>
                    <li className="flex items-center gap-2 text-xs font-medium">
                      <Check className="h-3 w-3 text-primary" /> Canais, Filmes e Séries 4K
                    </li>
                    <li className="flex items-center gap-2 text-xs font-medium">
                      <Check className="h-3 w-3 text-primary" /> Suporte Prioritário 24h
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full font-black uppercase italic tracking-widest" 
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || !!planLoading}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {planLoading === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrent ? (
                      "Plano Ativo"
                    ) : (
                      "Assinar Agora"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Seção de Segurança / Credenciais */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" /> Segurança da Conta
          </CardTitle>
          <CardDescription>Gerencie seu usuário e altere sua senha de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="conta-username" className="text-xs uppercase font-bold tracking-widest">Usuário de Acesso</Label>
                <Input
                  id="conta-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-muted/30"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="conta-display" className="text-xs uppercase font-bold tracking-widest">Nome de Exibição</Label>
                <Input
                  id="conta-display"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome no sistema"
                  className="bg-muted/30"
                />
              </div>
            </div>

            <div className="h-px bg-border my-2" />

            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="conta-current" className="text-xs uppercase font-bold tracking-widest text-primary">Senha Atual</Label>
                <Input
                  id="conta-current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-muted/30"
                  placeholder="Obrigatório para salvar alterações"
                  required
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="conta-new" className="text-xs uppercase font-bold tracking-widest">Nova Senha</Label>
                  <Input
                    id="conta-new"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-muted/30"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="conta-confirm" className="text-xs uppercase font-bold tracking-widest">Confirmar Nova Senha</Label>
                  <Input
                    id="conta-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-muted/30"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full font-black uppercase italic tracking-widest h-12 text-lg shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Atualizar Meus Dados
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
