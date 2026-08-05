/**
 * ja testei dois servidores e não esta reproduzindo so conteudos 
 * preciso de fluides que abra rapido os canais leve fluido parrudo
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tv, ShieldCheck, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAppConfig } from "@/lib/config.functions";
import { createFirstOwner } from "@/lib/bootstrap.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WebPlayer IPTV — TMDB & EPG" },
      {
        name: "description",
        content:
          "Entre no WebPlayer IPTV: canais com guia de programação (EPG), filmes e séries enriquecidos com TMDB.",
      },
      { property: "og:title", content: "WebPlayer IPTV — Multi-Servidor" },
      {
        property: "og:description",
        content:
          "Webplayer avançado com integração TMDB e guia de programação em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});




function ThemeAwareLogo({ className }: { className?: string }) {
  const fetchConfig = useServerFn(getAppConfig);
  const { data: config } = useQuery({
    queryKey: ["app-config-public"],
    queryFn: () => fetchConfig(),
    staleTime: 5 * 60_000,
  });

  if (config?.logo_url) {
    return <img src={config.logo_url} alt="Logo" className="h-full w-full object-contain" />;
  }

  return <Tv className={className} />;
}


function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch() as any;
  const [hasSession, setHasSession] = useState(false);
  const [username, setUsername] = useState(search.username || "");
  const [password, setPassword] = useState(search.password || "");
  const [loading, setLoading] = useState(false);
  const [isOwnerLogin, setIsOwnerLogin] = useState(false);


  const runBootstrap = useServerFn(createFirstOwner);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setHasSession(true);
        navigate({ to: "/inicio", replace: true });
      }
    });
    return () => {
      active = false;
    };
  }, [navigate]);


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
  if (hasSession) return null;


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Background Decor */}
      <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />

      <Card className="z-10 w-full max-w-[400px] border-border/40 bg-card/60 backdrop-blur-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15 text-primary shadow-xl shadow-primary/20 overflow-hidden">
            {/* Logo Dinâmico no Login */}
            <ThemeAwareLogo className="h-10 w-10" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">WEBPLAYER</CardTitle>
          <CardDescription className="font-medium text-muted-foreground/80">
            {isOwnerLogin ? "Painel administrativo do sistema" : "Entre com suas credenciais de acesso"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Usuario</Label>
              <div className="relative">
                <User className="absolute top-3 left-3 h-4 w-4 text-primary/60" />
                <Input
                  id="username"
                  placeholder="Nome de usuario"
                  className="pl-10 h-12 bg-background/40 border-border/40 focus:border-primary/50 transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 ml-1">Senha</Label>
              <div className="relative">
                <Lock className="absolute top-3 left-3 h-4 w-4 text-primary/60" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-background/40 border-border/40 focus:border-primary/50 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Entrar agora"
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
      
      <div className="absolute bottom-8 flex flex-col items-center gap-2 px-6 text-center">
        <p className="text-xs font-medium text-primary/80 animate-pulse">
          Fluxo Ultra-Rápido · Handshake Otimizado · VPS Ready
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          &copy; 2024 WebPlayer IPTV · Conexão Blindada e Estável
        </p>
      </div>
    </div>
  );
}