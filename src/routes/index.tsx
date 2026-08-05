import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayerSession } from "@/lib/player-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tv, ShieldCheck, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createFirstOwner } from "@/lib/bootstrap.functions";

export const Route = createFileRoute("/")({
  component: LoginPage,
});


function LoginPage() {
  const navigate = useNavigate();
  const { profile, isOwner } = usePlayerSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOwnerLogin, setIsOwnerLogin] = useState(false);
  
  const runBootstrap = useServerFn(createFirstOwner);

  useEffect(() => {
    if (profile) {
      navigate({ to: "/inicio", replace: true });
    }
  }, [profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      if (isOwnerLogin && username.toLowerCase() === "dono") {
        try {
          await runBootstrap({ data: { username: "dono", password } });
          toast.success("Sistema inicializado como Dono!");
        } catch (err) {
          // Ignoramos erro de bootstrap se o dono ja existir
        }
      }

      const email = isOwnerLogin && !username.includes("@") 
        ? `${username.toLowerCase()}@iptv.local` 
        : username.includes("@") ? username : `${username.toLowerCase()}@iptv.local`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Acesso autorizado!");
      navigate({ to: "/inicio" });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao acessar o sistema");
    } finally {
      setLoading(false);
    }
  };


  // O loading agora e gerido pelo contexto do router/shell, mas podemos adicionar um local se quiser
  if (profile) return null;


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Background Decor */}
      <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />

      <Card className="z-10 w-full max-w-[400px] border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Tv className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">WebPlayer IPTV</CardTitle>
          <CardDescription>
            {isOwnerLogin ? "Acesso administrativo do sistema" : "Entre com suas credenciais de acesso"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <div className="relative">
                <User className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Seu usuario"
                  className="pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Entrar no Player"
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs hover:bg-primary/5 hover:text-primary"
              onClick={() => setIsOwnerLogin(!isOwnerLogin)}
              disabled={loading}
            >
              {isOwnerLogin ? (
                <User className="mr-2 h-3.5 w-3.5" />
              ) : (
                <ShieldCheck className="mr-2 h-3.5 w-3.5" />
              )}
              {isOwnerLogin ? "Voltar para Login de Usuario" : "Acesso Dono do Sistema"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <p className="absolute bottom-8 text-center text-xs text-muted-foreground">
        &copy; 2024 WebPlayer IPTV · Multi-Servidor Inteligente
      </p>
    </div>
  );
}
