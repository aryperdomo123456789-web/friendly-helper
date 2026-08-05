import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_BRAND_IMAGE_URL, getAppConfig } from "@/lib/config.functions";
import { createFirstOwner } from "@/lib/bootstrap.functions";

type LoginMode = "public" | "owner";

type LoginScreenProps = {
  mode: LoginMode;
  initialUsername?: string;
  initialPassword?: string;
  autoLogin?: boolean;
};

export function LoginScreen({
  mode,
  initialUsername = "",
  initialPassword = "",
  autoLogin = false,
}: LoginScreenProps) {
  const navigate = useNavigate();
  const fetchConfig = useServerFn(getAppConfig);
  const [hasSession, setHasSession] = useState(false);
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [loading, setLoading] = useState(false);
  const autoLoginAttemptedRef = useRef(false);
  const runBootstrap = useServerFn(createFirstOwner);
  const { data: appConfig } = useQuery({
    queryKey: ["public-app-config"],
    queryFn: () => fetchConfig(),
  });

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

  useEffect(() => {
    if (initialUsername) {
      setUsername(initialUsername);
    }
  }, [initialUsername]);

  useEffect(() => {
    if (initialPassword) {
      setPassword(initialPassword);
    }
  }, [initialPassword]);

  useEffect(() => {
    if (mode !== "public") return;
    if (!autoLogin) return;
    if (hasSession || loading) return;
    if (autoLoginAttemptedRef.current) return;
    if (!username.trim() || !password) return;

    autoLoginAttemptedRef.current = true;
    const timer = window.setTimeout(() => {
      void submitLogin(username, password);
    }, 200);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, autoLogin, hasSession, loading, username, password]);

  if (hasSession) return null;

  const isOwnerMode = mode === "owner";
  const title = isOwnerMode ? "Acesso do Dono" : "WEBPLAYER";
  const description = isOwnerMode
    ? "Entrada administrativa exclusiva do dono do sistema"
    : "Entre com suas credenciais de acesso";
  const telegramHandle = (appConfig?.telegram_handle || "@MagoPD").trim().replace(/^@/, "");

  const submitLogin = async (loginUsername: string, loginPassword: string) => {
    if (!loginUsername || !loginPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    const normalizedUsername = loginUsername.trim().toLowerCase();
    const isOwnerAlias = normalizedUsername === "dono" || normalizedUsername === "magodono";

    if (!isOwnerMode && isOwnerAlias) {
      toast.info("O acesso do dono fica em /dono");
      navigate({ to: "/dono", replace: true });
      return;
    }

    if (isOwnerMode && !isOwnerAlias) {
      toast.error("Use apenas o acesso do dono em /dono.");
      return;
    }

    setLoading(true);
    try {
      if (isOwnerMode && isOwnerAlias) {
        try {
          await runBootstrap({ data: { username: normalizedUsername, password: loginPassword } });
        } catch {
          // Se o dono já existir, seguimos com o login normal.
        }
      }

      const email = loginUsername.includes("@")
        ? loginUsername
        : `${normalizedUsername}@iptv.local`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: loginPassword,
      });

      if (error) throw error;

      toast.success(isOwnerMode ? "Acesso do dono autorizado!" : "Acesso autorizado!");
      navigate({ to: "/inicio" });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao acessar o sistema");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitLogin(username, password);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />

      <Card className="z-10 w-full max-w-[400px] border-border/40 bg-card/60 backdrop-blur-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/15 text-primary shadow-xl shadow-primary/20 overflow-hidden">
            <img
              src={DEFAULT_BRAND_IMAGE_URL}
              alt="Logo"
              className="h-full w-full object-contain p-2"
            />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight">
            {title}
          </CardTitle>
          <CardDescription className="font-medium text-muted-foreground/80">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="ml-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                Usuário
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                <Input
                  id="username"
                  placeholder="Nome de usuário"
                  className="h-12 border-border/40 bg-background/40 pl-10 transition-all focus:border-primary/50"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="ml-1 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 border-border/40 bg-background/40 pl-10 transition-all focus:border-primary/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

              <Button type="submit" className="h-12 w-full text-base font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {autoLogin ? "Entrando automaticamente..." : "Verificando..."}
                  </>
                ) : (
                  "Entrar agora"
                )}
              </Button>

            {isOwnerMode && (
              <>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Ou</span>
                  </div>
                </div>

              <Button
                asChild
                type="button"
                variant="ghost"
                className="w-full text-xs hover:bg-primary/5 hover:text-primary"
                disabled={loading}
              >
                <Link to="/">
                  <User className="mr-2 h-3.5 w-3.5" />
                  Voltar para Login de Cliente
                </Link>
              </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="absolute bottom-8 flex flex-col items-center gap-2 px-6 text-center">
        <a
          href={`https://t.me/${telegramHandle}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir Telegram do sistema"
          className="text-xs font-medium text-primary/80 transition-colors hover:text-primary"
        >
          © 2026 MagoPD · Todos os direitos reservados
        </a>
      </div>
    </div>
  );
}
