import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAccount, updateMyAccount } from "@/lib/account.functions";
import { getMercadoPagoConfig, createPaymentPreference } from "@/lib/payments.functions";
import { simulatePaymentSuccess } from "@/lib/test-flow.functions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Check, Copy, CreditCard, Crown, Link as LinkIcon, Loader2, LogOut, UserCog } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { copyToClipboard } from "@/lib/clipboard";
import { UserPageShell } from "@/components/user-shell/user-page-shell";
import { ContentEmptyState } from "@/components/ui/content-empty-state";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { title: "Minha Conta" },
      {
        name: "description",
        content: "Gerencie seu plano, conexões e credenciais de acesso.",
      },
      { property: "og:title", content: "Minha Conta" },
      { property: "og:description", content: "Gerencie seu plano e credenciais de acesso." },
    ],
  }),
  component: ContaPage,
});

function ContaPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const fetchAccount = useServerFn(getMyAccount);
  const saveAccount = useServerFn(updateMyAccount);
  const mpPreference = useServerFn(createPaymentPreference);
  const runSimulation = useServerFn(simulatePaymentSuccess);

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
  const initializedAccountId = useRef<string | null>(null);

  useEffect(() => {
    if (!account.data?.userId) return;
    if (initializedAccountId.current === account.data.userId) return;
    initializedAccountId.current = account.data.userId;
    setUsername(account.data.username);
    setDisplayName(account.data.display_name ?? "");
  }, [account.data]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("A nova senha e a confirmação não são iguais");
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
      setUsername(result.username);
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

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void router.navigate({ to: "/", replace: true });
  };

  const handleUpgrade = async (planId: string) => {
    setPlanLoading(planId);
    try {
      const result = await mpPreference({ data: { planId } });
      
      if ((result as any).simulate_success) {
        toast.info("Modo de teste: simulando ativação sem Mercado Pago...");
        if (!account.data?.userId) {
          throw new Error("Conta não carregada para simulação");
        }
        await runSimulation({ 
          data: { 
            userId: account.data.userId,
            planId 
          } 
        });
        toast.success("Plano ativado e bônus processado, quando aplicável!");
        void account.refetch();
        return;
      }

      if (result.init_point) {
        window.location.href = result.init_point;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar pagamento");
    } finally {
      setPlanLoading(null);
    }
  };

  const referralLink = typeof window !== 'undefined' && account.data?.referral_code
    ? `${window.location.origin}/teste/gratis?ref=${account.data.referral_code}`
    : '';

  const [copyingLink, setCopyingLink] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!copyNotice) return;
    const timer = window.setTimeout(() => setCopyNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [copyNotice]);

  const copyReferral = async () => {
    const ok = await copyToClipboard(referralLink);
    if (ok) {
      toast.success("Link de indicação copiado!");
      setCopyNotice("Link de indicação copiado!");
    } else {
      toast.error("Não foi possível copiar o link.");
      setCopyNotice("Não foi possível copiar o link.");
    }
  };

  if (account.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (account.isError) {
    return (
      <UserPageShell
        className="mx-auto max-w-4xl pb-20"
        title="Minha Conta"
        description="Confira seu plano, conexões e segurança de acesso."
        icon={UserCog}
      >
        <ContentEmptyState
          icon={AlertTriangle}
          title="Não foi possível carregar sua conta"
          description="A sessão continua protegida, mas os dados da conta não responderam. Tente novamente antes de alterar qualquer informação."
          action={
            <Button type="button" onClick={() => void account.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      </UserPageShell>
    );
  }

  const currentPlan = account.data?.plan;
  const isOwner = account.data?.isOwner;
  const ownerReferralLinks = isOwner ? (account.data?.ownerTestLinks ?? []) : [];
  const publicReferralLinks = account.data?.testLinks ?? [];
  const availablePlans = (account.data?.availablePlans || []).filter((plan: any) => {
    const isTestPlan = plan.name.toLowerCase().includes("teste") || Number(plan.price) === 0;
    const isMyPlan = currentPlan?.id === plan.id;
    // Esconde o plano "Teste" se não for o plano atual e não for o dono
    if (isTestPlan && !isMyPlan && !isOwner) return false;
    return true;
  });
  const expiresDate = account.data?.expires_at ? new Date(account.data.expires_at) : null;

  return (
    <UserPageShell
      className="mx-auto max-w-4xl pb-20"
      title="Minha Conta"
      description=""
      icon={UserCog}
    >

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card do Plano Atual */}
        <Card className="md:col-span-1 border-primary/20 bg-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
            <Crown className="h-8 w-8 text-primary/20 rotate-12" />
          </div>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              Meu plano
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
              <LinkIcon className="h-5 w-5 text-primary" /> Programa de indicação
            </CardTitle>
            <CardDescription>Indique amigos e ganhe dias extras ou descontos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!account.data?.referral_code ? (
              <div className="rounded-lg bg-muted/50 p-6 text-center border border-dashed">
                <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">
                  Seu link de indicação será liberado após assinar um plano válido.
                </p>
              </div>
            ) : publicReferralLinks.length === 0 && ownerReferralLinks.length === 0 ? (
              <div className="rounded-lg bg-muted/50 p-6 text-center border border-dashed">
                <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Nenhum link de indicação disponível no momento.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {isOwner && ownerReferralLinks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-primary">Link exclusivo do dono</p>
                      <Badge variant="secondary" className="text-[9px] uppercase font-bold">Somente o dono</Badge>
                    </div>
                    <div className="grid gap-4">
                      {ownerReferralLinks.map((link: any) => {
                        const fullUrl = `${window.location.origin}/teste/${link.slug}?ref=${account.data?.referral_code}`;
                        return (
                          <div key={link.slug} className="space-y-2 p-4 rounded-xl border border-primary/10 bg-primary/5">
                            <div className="flex items-center justify-between">
                              <Label className="text-[10px] uppercase font-black tracking-widest text-primary">
                                {link.description || `Link: ${link.slug}`}
                              </Label>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] uppercase font-bold border-primary/30">Ativo</Badge>
                                <Badge variant="outline" className="text-[9px] uppercase font-bold border-online/30 text-online">Sem Bloqueio</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Input readOnly value={fullUrl} className="bg-background font-mono text-[10px] h-8" />
                              <Button
                                size="icon"
                                type="button"
                                disabled={copyingLink === link.slug}
                                onClick={async () => {
                                  setCopyingLink(link.slug);
                                  const ok = await copyToClipboard(fullUrl);
                                  if (ok) {
                                    toast.success("Link de indicação copiado!");
                                    setCopyNotice("Link de indicação copiado!");
                                  } else {
                                    toast.error("Não foi possível copiar o link.");
                                    setCopyNotice("Não foi possível copiar o link.");
                                  }
                                  setCopyingLink((current) => (current === link.slug ? null : current));
                                }}
                                variant="secondary"
                                className="h-8 w-8"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {publicReferralLinks.length > 0 && (
                  <div className="space-y-3">
                    {isOwner && (
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/80">Links públicos</p>
                    )}
                    <div className="grid gap-4">
                      {publicReferralLinks.map((link: any) => {
                        const fullUrl = `${window.location.origin}/teste/${link.slug}?ref=${account.data?.referral_code}`;
                        return (
                          <div key={link.slug} className="space-y-2 p-4 rounded-xl border border-primary/10 bg-primary/5">
                            <div className="flex items-center justify-between">
                              <Label className="text-[10px] uppercase font-black tracking-widest text-primary">
                                {link.description || `Link: ${link.slug}`}
                              </Label>
                              <Badge variant="outline" className="text-[9px] uppercase font-bold border-primary/30">Ativo</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Input readOnly value={fullUrl} className="bg-background font-mono text-[10px] h-8" />
                              <Button
                                size="icon"
                                type="button"
                                disabled={copyingLink === link.slug}
                                onClick={async () => {
                                  setCopyingLink(link.slug);
                                  const ok = await copyToClipboard(fullUrl);
                                  if (ok) {
                                    toast.success("Link de indicação copiado!");
                                    setCopyNotice("Link de indicação copiado!");
                                  } else {
                                    toast.error("Não foi possível copiar o link.");
                                    setCopyNotice("Não foi possível copiar o link.");
                                  }
                                  setCopyingLink((current) => (current === link.slug ? null : current));
                                }}
                                variant="secondary"
                                className="h-8 w-8"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
              <p className="text-xs font-medium text-primary leading-relaxed">
                Cada novo usuário que assinar através de qualquer um dos seus links gera benefícios automáticos na sua conta.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {copyNotice && (
        <div className="fixed bottom-6 right-6 z-[80] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-primary/30 bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary">
                <Copy className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{copyNotice}</p>
                <p className="text-[11px] text-muted-foreground">Pronto, o link já está na área de transferência.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção de Planos e Upgrade */}
      <section className="space-y-4">
        <h2 className="text-2xl font-black tracking-tighter uppercase italic text-primary flex items-center gap-2">
          <CreditCard className="h-6 w-6" /> Planos disponíveis
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
                  <CardDescription>{plan.duration_value} {plan.duration_unit === 'minutes' ? 'minutos' : plan.duration_unit === 'hours' ? 'horas' : 'dias'} de acesso</CardDescription>
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
                      "Plano ativo"
                    ) : (
                      "Assinar agora"
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
            <UserCog className="h-6 w-6 text-primary" /> Segurança da conta
          </CardTitle>
          <CardDescription>Gerencie seu usuário e altere sua senha de acesso.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="conta-username" className="text-xs uppercase font-bold tracking-widest">Usuário de acesso</Label>
                <Input
                  id="conta-username"
                  name="account_username"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-muted/30"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="conta-display" className="text-xs uppercase font-bold tracking-widest">Nome de exibição</Label>
                <Input
                  id="conta-display"
                  name="account_display_name"
                  autoComplete="off"
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
                <Label htmlFor="conta-current" className="text-xs uppercase font-bold tracking-widest text-primary">Senha atual</Label>
                <Input
                  id="conta-current"
                  type="password"
                  name="account_current_password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-muted/30"
                  placeholder="Obrigatório para salvar alterações"
                  required
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="conta-new" className="text-xs uppercase font-bold tracking-widest">Nova senha</Label>
                  <Input
                    id="conta-new"
                    type="password"
                    name="account_new_password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-muted/30"
                    placeholder="Mínimo de 6 caracteres"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="conta-confirm" className="text-xs uppercase font-bold tracking-widest">Confirmar nova senha</Label>
                  <Input
                    id="conta-confirm"
                    type="password"
                    name="account_confirm_password"
                    autoComplete="new-password"
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

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
            <LogOut className="h-5 w-5 text-destructive" /> Encerrar sessão
          </CardTitle>
          <CardDescription>
            Use este botão para sair com segurança deste dispositivo.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            type="button"
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 sm:w-auto"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
        </CardFooter>
      </Card>
    </UserPageShell>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
