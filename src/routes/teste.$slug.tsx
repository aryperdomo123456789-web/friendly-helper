import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createTestUser, checkDeviceBlocked } from "@/lib/test-links.functions";
import { toast } from "sonner";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Tv, 
  Copy, 
  Check, 
  User, 
  Key, 
  Calendar,
  ExternalLink,
  Zap
} from "lucide-react";

export const Route = createFileRoute("/teste/$slug")({
  head: () => ({
    meta: [
      { title: "Teste Grátis | MAGO PLAYER PRO" },
      { name: "description", content: "Solicite seu teste grátis e experimente o melhor do IPTV." },
    ],
  }),
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData();
        const slugFromForm = formData.get("slug")?.toString().trim();
        const fingerprintFromForm = formData.get("fingerprint")?.toString().trim() ?? "";
        const referralCodeRaw = formData.get("referral_code")?.toString().trim() ?? "";
        const referralCode = referralCodeRaw.length > 0 ? referralCodeRaw : null;

        const slug =
          slugFromForm ||
          new URL(request.url).pathname.split("/").filter(Boolean).at(-1) ||
          "teste";

        const fingerprint =
          fingerprintFromForm || deriveServerFingerprint(request, slug, referralCode);

        const result = await createTestUser({
          data: { slug, fingerprint, referral_code: referralCode },
        });

        const redirectUrl = new URL(request.url);
        redirectUrl.searchParams.set("username", result.username);
        redirectUrl.searchParams.set("password", result.password);
        redirectUrl.searchParams.set("expiresAt", result.expiresAt);
        redirectUrl.searchParams.set("generated", "1");

        return new Response(null, {
          status: 303,
          headers: {
            location: redirectUrl.toString(),
            "cache-control": "no-store, no-cache, must-revalidate, private",
          },
        });
      },
    },
  },
  component: TestePublico,
});

function deriveServerFingerprint(request: Request, slug: string, referralCode: string | null) {
  const headers = request.headers;
  const raw = [
    headers.get("user-agent") ?? "",
    headers.get("accept-language") ?? "",
    headers.get("x-forwarded-for") ?? headers.get("x-real-ip") ?? "",
    headers.get("sec-ch-ua") ?? "",
    headers.get("sec-ch-ua-platform") ?? "",
    slug,
    referralCode ?? "",
  ].join("|");

  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = ((hash << 5) - hash + raw.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

function TestePublico() {
  const { slug } = Route.useParams();
  const search = Route.useSearch() as any;
  const referralCode = search.ref || null;
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
    expiresAt: string;
  } | null>(
    search.username && search.password && search.expiresAt
      ? {
          username: String(search.username),
          password: String(search.password),
          expiresAt: String(search.expiresAt),
        }
      : null,
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [fingerprint, setFingerprint] = useState("");

  const mutationCreateTest = useServerFn(createTestUser);
  const mutationCheckDevice = useServerFn(checkDeviceBlocked);

  useEffect(() => {
    const currentFingerprint = getFingerprint();
    setFingerprint(currentFingerprint);

    const checkStatus = async () => {
      if (!currentFingerprint) return;
      try {
        const res = await mutationCheckDevice({ data: { fingerprint: currentFingerprint, slug } });
        if (res.blocked) setBlocked(true);
      } catch (e) {
        console.error("Erro ao validar dispositivo:", e);
      }
    };
    checkStatus();
  }, []);

  const getFingerprint = () => {
    if (typeof window === 'undefined') return '';
    const data = [
      navigator.userAgent,
      screen.width,
      screen.height,
      navigator.language,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
    ].join("|");
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  };

  const handleCreateTest = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setLoading(true);
    try {
      const currentFingerprint = fingerprint || getFingerprint();
      setFingerprint(currentFingerprint);
      const res = await mutationCreateTest({
        data: { slug, fingerprint: currentFingerprint, referral_code: referralCode },
      });
      setCredentials(res);
      toast.success("Teste gerado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar teste:", err);
      const message = err.message || "Erro ao gerar teste";
      toast.error(message);
      if (message.toLowerCase().includes("dispositivo") || message.toLowerCase().includes("já gerou")) {
        setBlocked(true);
      }
    } finally {
      setLoading(false);
    }
  };


  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0c] overflow-hidden relative font-sans">
      {/* Elementos 3D e Neon de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-10 space-y-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <div className="relative w-20 h-20 bg-black rounded-2xl flex items-center justify-center border border-white/10">
              <Tv className="w-10 h-10 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              MAGO PLAYER <span className="text-primary italic">PRO</span>
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary/50" />
              <p className="text-[10px] text-primary uppercase tracking-[0.3em] font-bold">Acesso Exclusivo</p>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary/50" />
            </div>
          </div>
        </div>

        {!credentials ? (
          <Card className={`border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 ${blocked ? 'opacity-75' : 'hover:border-primary/30'}`}>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl font-black text-white tracking-tight">
                {blocked ? "ACESSO NEGADO" : "EXPERIÊNCIA 4K"}
              </CardTitle>
              <CardDescription className="text-white/60 text-sm font-medium">
                {blocked 
                  ? "Limite de teste por dispositivo atingido." 
                  : "Libere agora seu acesso ultra-rápido de forma gratuita."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className={`p-4 rounded-2xl border transition-all duration-300 ${blocked ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/10 group hover:bg-primary/10'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${blocked ? 'bg-destructive/20' : 'bg-primary/20 animate-pulse'}`}>
                    <Zap className={`w-5 h-5 shrink-0 ${blocked ? 'text-destructive' : 'text-primary'}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Status do Sistema</h4>
                    <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                      {blocked 
                        ? "Detectamos que este aparelho já usufruiu do teste grátis. Para novas assinaturas, contate o suporte oficial."
                        : "Servidores ONLINE. Liberação instantânea de 10.000+ canais, filmes e séries em alta definição."}
                    </p>
                  </div>
                </div>
              </div>
              
              <form className="relative group" method="post" action={`/teste/${slug}`} onSubmit={handleCreateTest}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="fingerprint" value={fingerprint} />
                <input type="hidden" name="referral_code" value={referralCode ?? ""} />
                {!blocked && (
                  <div className="absolute -inset-0.5 pointer-events-none bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
                )}
                <Button 
                  data-tv-focus
                  type="submit"
                  disabled={loading || blocked}
                  variant={blocked ? "destructive" : "default"}
                  className={`relative z-10 w-full h-16 text-xl font-black rounded-2xl transition-all duration-300 transform active:scale-95 ${!blocked ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]' : ''}`}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      PROCESSANDO...
                    </div>
                  ) : blocked ? "BLOQUEADO" : "GERAR ACESSO AGORA"}
                </Button>
              </form>

              {!blocked && (
                <p className="text-[9px] text-center text-white/30 uppercase tracking-[0.2em] font-bold">
                  ⚡ LIBERAÇÃO AUTOMÁTICA EM 2 SEGUNDOS
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Card className="border-green-500/20 bg-green-500/[0.02] backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(34,197,94,0.2)] overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-green-500 to-emerald-400" />
              <CardHeader className="pb-2 text-center">
                <CardTitle className="text-3xl font-black text-green-500 flex items-center justify-center gap-3 tracking-tighter">
                  <div className="p-1.5 bg-green-500/20 rounded-full animate-bounce">
                    <Check className="h-6 w-6" />
                  </div> 
                  ACESSO ATIVO
                </CardTitle>
                <CardDescription className="text-white/60 font-medium">Copie seus dados e comece a assistir agora.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-primary font-black ml-1">USUÁRIO</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center text-white/30">
                      <User className="h-5 w-5" />
                    </div>
                    <Input 
                      readOnly 
                      value={credentials.username} 
                      className="pl-12 pr-12 h-14 bg-white/[0.03] border-white/10 font-mono text-xl text-white selection:bg-primary/30"
                    />
                    <Button 
                      data-tv-focus
                      type="button"
                      size="icon" 
                      variant="ghost" 
                      className="absolute right-2 top-2 h-10 w-10 text-white/50 hover:text-white hover:bg-white/10"
                      onClick={() => copyToClipboard(credentials.username, "user")}
                    >
                      {copied === "user" ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.2em] text-primary font-black ml-1">SENHA</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center text-white/30">
                      <Key className="h-5 w-5" />
                    </div>
                    <Input 
                      readOnly 
                      value={credentials.password} 
                      className="pl-12 pr-12 h-14 bg-white/[0.03] border-white/10 font-mono text-xl text-white selection:bg-primary/30"
                    />
                    <Button 
                      data-tv-focus
                      type="button"
                      size="icon" 
                      variant="ghost" 
                      className="absolute right-2 top-2 h-10 w-10 text-white/50 hover:text-white hover:bg-white/10"
                      onClick={() => copyToClipboard(credentials.password, "pass")}
                    >
                      {copied === "pass" ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-white/50 mt-6">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span>Expira em: <b className="text-white">{new Date(credentials.expiresAt).toLocaleString("pt-BR")}</b></span>
                </div>

                <div className="pt-6 space-y-4">
                  <Button
                    asChild
                    data-tv-focus
                    className="w-full h-16 font-black text-lg gap-3 rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:scale-[1.02] transition-transform shadow-[0_0_30px_-5px_rgba(var(--primary),0.5)]"
                  >
                    <Link to="/" search={{ username: credentials.username, password: credentials.password, auto: "1" }}>
                      ACESSAR MAGO PLAYER PRO <ExternalLink className="h-5 w-5" />
                    </Link>
                  </Button>
                  <p className="text-[9px] text-center text-white/30 uppercase tracking-[0.2em] font-black animate-pulse">
                    🚀 REDIRECIONAMENTO COM UM CLIQUE
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="mt-12 text-center pb-8">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">
            &copy; 2026 MAGO PLAYER PRO · TECNOLOGIA DE PONTA
          </p>
        </div>
      </div>
    </div>
  );
}
