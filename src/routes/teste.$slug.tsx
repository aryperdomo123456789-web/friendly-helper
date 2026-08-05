import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createTestUser } from "@/lib/test-links.functions";
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/30">
            <Tv className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-center">WEBPLAYER IPTV</h1>
          <p className="text-muted-foreground mt-2 font-medium">Teste Grátis - {slug}</p>
        </div>

        {!credentials ? (
          <Card className={`border-primary/20 bg-card/50 backdrop-blur-xl shadow-2xl ${blocked ? 'opacity-75 grayscale' : ''}`}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{blocked ? "Acesso Limitado" : "Experimente Agora"}</CardTitle>
              <CardDescription>
                {blocked 
                  ? "Este dispositivo já atingiu o limite de testes gratuitos." 
                  : "Clique no botão abaixo para gerar seus dados de acesso temporário."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${blocked ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/5 border-primary/10'}`}>
                <Zap className={`w-5 h-5 shrink-0 mt-0.5 ${blocked ? 'text-destructive' : 'text-primary'}`} />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {blocked 
                    ? "Para garantir a qualidade do serviço para todos, limitamos a um teste por aparelho. Caso precise de ajuda, entre em contato com o suporte."
                    : "Seu acesso será liberado instantaneamente. Aproveite canais, filmes e séries com qualidade máxima."}
                </p>
              </div>
              <Button 
                onClick={handleCreateTest} 
                disabled={loading || blocked}
                variant={blocked ? "destructive" : "default"}
                className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
              >
                {loading ? "Gerando..." : blocked ? "LIMITE ATINGIDO" : "GERAR TESTE GRÁTIS"}
              </Button>
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
