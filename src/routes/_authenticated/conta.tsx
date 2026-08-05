import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAccount, updateMyAccount } from "@/lib/account.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { title: "Minha Conta | WebPlayer IPTV" },
      {
        name: "description",
        content: "Altere seu nome de usuario e sua senha de acesso ao WebPlayer IPTV.",
      },
      { property: "og:title", content: "Minha Conta | WebPlayer IPTV" },
      { property: "og:description", content: "Gerencie usuario e senha do seu acesso." },
    ],
  }),
  component: ContaPage,
});

function ContaPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const saveAccount = useServerFn(updateMyAccount);

  const account = useQuery({ queryKey: ["my-account"], queryFn: () => fetchAccount() });

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      toast.success("Dados de acesso atualizados!");
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

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minha Conta</h1>
        <p className="text-muted-foreground">Atualize seu usuario e sua senha de acesso.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCog className="h-5 w-5 text-primary" /> Credenciais
          </CardTitle>
          <CardDescription>
            Confirme a senha atual para salvar qualquer alteracao.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="conta-username">Usuario</Label>
              <Input
                id="conta-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conta-display">Nome de exibicao</Label>
              <Input
                id="conta-display"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Como quer ser chamado"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conta-current">Senha atual</Label>
              <Input
                id="conta-current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="conta-new">Nova senha (opcional)</Label>
                <Input
                  id="conta-new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="conta-confirm">Confirmar nova senha</Label>
                <Input
                  id="conta-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || account.isLoading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Salvar alteracoes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
