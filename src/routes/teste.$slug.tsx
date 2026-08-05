import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
      { title: "Teste Grátis | WebPlayer IPTV" },
      { name: "description", content: "Solicite seu teste grátis e experimente o melhor do IPTV." },
    ],
  }),
  component: TestePublico,
});

function TestePublico() {
  const { slug } = Route.useParams();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  const mutationCreateTest = useServerFn(createTestUser);
  const mutationCheckDevice = useServerFn(checkDeviceBlocked);

  useEffect(() => {
    const checkStatus = async () => {
      const fingerprint = getFingerprint();
      if (fingerprint) {
        try {
          const res = await mutationCheckDevice({ data: { fingerprint } });
          if (res.blocked) setBlocked(true);
        } catch (e) {
          console.error("Erro ao validar dispositivo:", e);
        }
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

  const handleCreateTest = async () => {
    setLoading(true);
    try {
      const fingerprint = getFingerprint();
      const res = await mutationCreateTest({ data: { slug, fingerprint } });
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
              WEBPLAYER <span className="text-primary italic">PRO</span>
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
              
              <div className="relative group">
                {!blocked && (
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
                )}
                <Button 
                  onClick={handleCreateTest} 
                  disabled={loading || blocked}
                  variant={blocked ? "destructive" : "default"}
                  className={`relative w-full h-16 text-xl font-black rounded-2xl transition-all duration-300 transform active:scale-95 ${!blocked ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]' : ''}`}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      PROCESSANDO...
                    </div>
                  ) : blocked ? "BLOQUEADO" : "GERAR ACESSO AGORA"}
                </Button>
              </div>

              {!blocked && (
                <p className="text-[9px] text-center text-white/30 uppercase tracking-[0.2em] font-bold">
                  ⚡ LIBERAÇÃO AUTOMÁTICA EM 2 SEGUNDOS
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-green-500/30 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="h-1.5 bg-green-500" />
              <CardHeader className="pb-2 text-center">
                <CardTitle className="text-green-500 flex items-center justify-center gap-2">
                  <Check className="h-6 w-6" /> Teste Liberado!
                </CardTitle>
                <CardDescription>Guarde seus dados de acesso abaixo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Usuário</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <Input 
                      readOnly 
                      value={credentials.username} 
                      className="pl-10 pr-12 h-12 bg-background/50 font-mono text-lg"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute right-1 top-1 h-10 w-10"
                      onClick={() => copyToClipboard(credentials.username, "user")}
                    >
                      {copied === "user" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Senha</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                      <Key className="h-4 w-4" />
                    </div>
                    <Input 
                      readOnly 
                      value={credentials.password} 
                      className="pl-10 pr-12 h-12 bg-background/50 font-mono text-lg"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute right-1 top-1 h-10 w-10"
                      onClick={() => copyToClipboard(credentials.password, "pass")}
                    >
                      {copied === "pass" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground mt-4">
                  <Calendar className="h-4 w-4" />
                  <span>Válido até: <b>{new Date(credentials.expiresAt).toLocaleString("pt-BR")}</b></span>
                </div>

                <div className="pt-6 space-y-3">
                  <Link to="/" search={{ username: credentials.username, password: credentials.password }}>
                    <Button className="w-full h-12 font-bold gap-2 rounded-xl">
                      IR PARA LOGIN <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                    Clique em ir para login para entrar automaticamente
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/60">
            &copy; 2024 WebPlayer IPTV · Sistema Profissional
          </p>
        </div>
      </div>
    </div>
  );
}
