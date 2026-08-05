import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { usePlayerSession } from "@/lib/player-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, MonitorPlay, Server, Tv, Zap, CreditCard, Loader2, MessageSquare, X, Send, Image as ImageIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createPaymentPreference, getMercadoPagoConfig } from "@/lib/payments.functions";
import { getPlans } from "@/lib/plans.functions";
import { getOrCreateThread, markThreadRead } from "@/lib/chat.functions";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { TMDBHeroCarousel } from "@/components/home/TMDBHeroCarousel";

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
      {/* TMDB Hero Carousel */}
      <TMDBHeroCarousel />

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

      {!isOwner && <FloatingChat userId={profile?.id as any} />}
    </div>
  );
}

function FloatingChat({ userId }: { userId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [thread, setThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchThread = useServerFn(getOrCreateThread);
  const mutationMarkRead = useServerFn(markThreadRead);

  useEffect(() => {
    if (!userId || !isOpen) return;

    let channel: any;

    const init = async () => {
      try {
        const data = await fetchThread({ data: { userId } });
        setThread(data);
        setUnread(0);
        
        await mutationMarkRead({ data: { threadId: data['id'], isOwner: false } });

        // Carregar mensagens iniciais
        const { data: msgs, error: fetchErr } = await (supabase
          .from('support_messages' as any)
          .select('*')
          .eq('thread_id', data['id'])
          .order('created_at', { ascending: true }) as any);
        
        if (fetchErr) throw fetchErr;
        if (msgs) setMessages(msgs);

        // Subscrição em tempo real otimizada
        channel = supabase
          .channel(`thread_user:${data['id']}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'support_messages', 
            filter: `thread_id=eq.${data['id']}` 
          }, (payload) => {
            console.log("Nova mensagem recebida via Realtime:", payload.new);
            setMessages(prev => {
              // Verificação de ID para evitar duplicidade em carga alta
              if (prev.some(m => m['id'] === payload.new['id'])) return prev;
              return [...prev, payload.new];
            });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log("Canal de chat assinado com sucesso.");
            }
          });
      } catch (err) {
        console.error("Erro ao inicializar chat:", err);
        toast.error("Erro ao carregar mensagens");
      }
    };
    
    init();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, isOpen]);

  // Handle unread indicator when closed
  useEffect(() => {
    if (!userId || isOpen) return;
    const checkUnread = async () => {
      const { data } = await (supabase
        .from('support_threads' as any)
        .select('unread_count_user')
        .eq('user_id', userId)
        .maybeSingle() as any);
      if (data) setUnread(data.unread_count_user);
    };
    checkUnread();
  }, [userId, isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageToSend = newMessage.trim();
    if (!messageToSend || !thread) return;

    setSending(true);
    try {
      // Check if it's the first message of the day for auto-reply
      const today = new Date().toISOString().split('T')[0];
      const hasMessagesToday = messages.some(m => 
        m.created_at.split('T')[0] === today
      );

      const { data, error } = await supabase
        .from('support_messages')
        .insert([{
          thread_id: thread['id'],
          sender_id: userId || null,
          content: messageToSend
        }])
        .select()
        .single();

      if (error) throw error;
      
      setMessages(prev => [...prev, data]);

      // Handle Auto-Reply logic
      if (!hasMessagesToday) {
        // Fetch config for auto-reply message
        const { data: configData } = await supabase.from('app_config').select('config').maybeSingle();
        const config = (configData?.config as any) || {};
        const autoReplyMsg = config.support_auto_reply || "Olá! Esta é uma resposta automática. Recebemos sua mensagem e em breve um de nossos atendentes irá te ajudar.";
        
        // Short delay to feel more natural
        setTimeout(async () => {
          const { data: autoReplyData } = await supabase
            .from('support_messages')
            .insert([{
              thread_id: thread['id'],
              sender_id: null, // System/Admin message
              content: autoReplyMsg
            }])
            .select()
            .single();
            
          if (autoReplyData) {
            setMessages(prev => [...prev, autoReplyData]);
          }
        }, 1000);
      }

      await supabase
        .from('support_threads')
        .update({ 
          last_message: messageToSend, 
          last_message_at: new Date().toISOString(),
          unread_count_owner: (thread['unread_count_owner'] || 0) + 1
        })
        .eq('id', thread['id']);
      
      setNewMessage("");
      toast.success("Mensagem enviada!");
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Falha na conexão"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <Card className="mb-4 w-[320px] sm:w-[380px] h-[450px] flex flex-col shadow-2xl overflow-hidden border-primary/20 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="font-bold">Suporte Direto</span>
            </div>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="bg-primary/10 p-4 rounded-full">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium">Como podemos ajudar?</p>
                <p className="text-xs text-muted-foreground">Envie sua dúvida para o dono do sistema.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg['sender_id'] === userId;
                return (
                  <div key={msg['id']} className={cn("chat-bubble-container flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                      isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"
                    )}>
                      {msg['file_url'] ? (
                        <div className="space-y-1">
                          {msg['file_type'] === 'image' ? (
                            <img src={msg['file_url']} alt="Envio" className="max-w-full rounded-lg" />
                          ) : (
                            <a href={msg['file_url']} target="_blank" className="flex items-center gap-2 underline text-xs">
                              <ImageIcon className="h-3 w-3" /> Ver Arquivo
                            </a>
                          )}
                        </div>
                      ) : (
                        msg['content']
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 border-t bg-card shrink-0">
            <div className="flex gap-2">
              <Input 
                placeholder="Diga algo..." 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="bg-muted/50 border-none h-9 text-sm"
              />
              <Button type="submit" size="icon" className="h-9 w-9" disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Button 
        size="lg" 
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105",
          unread > 0 ? "animate-bounce" : ""
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageSquare className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </Button>
    </div>
  );
}
