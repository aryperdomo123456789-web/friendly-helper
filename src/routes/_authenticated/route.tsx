import { createFileRoute, Outlet, redirect, Link, useRouter, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PlayerSessionProvider, usePlayerSession } from "@/lib/player-store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  Film,
  MonitorPlay,
  Tv,
  Server,
  ShieldCheck,
  LogOut,
  AlertTriangle,
  Menu,
  UserCog,
  Users,
  MessageSquare,
  Bell,
  History,
  Clock,
  X,
  Send,
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSupportThreads, getOrCreateThread, markThreadRead } from "@/lib/chat.functions";

import { getNotifications, markNotificationRead } from "@/lib/notifications.functions";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/" });
  },
  component: Shell,
});

const NAV = [
  { to: "/inicio", label: "Inicio", icon: Home, restricted: true },
  { to: "/canais", label: "TV ao Vivo", icon: Tv, restricted: true },
  { to: "/filmes", label: "Filmes", icon: Film, restricted: true },
  { to: "/series", label: "Series", icon: MonitorPlay, restricted: true },
  { to: "/servidores", label: "Servidores", icon: Server, restricted: true },
] as const;

function Shell() {
  return (
    <PlayerSessionProvider>
      <ShellLayout />
    </PlayerSessionProvider>
  );
}

function ShellLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ShellLayoutInner />
      <SupportBubble />
    </div>
  );
}


function SupportBubble() {
  const { isOwner, profile } = usePlayerSession();
  const [isOpen, setIsOpen] = useState(false);
  const [thread, setThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchOrCreateThread = useServerFn(getOrCreateThread);
  const queryClient = useQueryClient();

  // Se for dono, nao mostra a bolha (ja tem aba suporte)
  if (isOwner || !profile) return null;

  const toggleChat = async () => {
    if (!isOpen && !thread) {
      try {
        const data = await fetchOrCreateThread({ data: { userId: profile.id } });
        setThread(data);
      } catch (err) {
        console.error("Erro ao abrir suporte:", err);
      }
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!thread?.id || !isOpen) return;

    let isMounted = true;
    const fetchMessages = async () => {
      const { data } = await (supabase
        .from('support_messages' as any)
        .select('*')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true }) as any);
      if (data && isMounted) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat_bubble:${thread.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages', 
        filter: `thread_id=eq.${thread.id}` 
      }, (payload) => {
        if (isMounted) {
          setMessages(prev => {
            if (prev.some(m => m['id'] === payload.new['id'])) return prev;
            return [...prev, payload.new];
          });
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [thread?.id, isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !thread) return;

    setSending(true);
    try {
      const { data: msgData, error } = await supabase
        .from('support_messages')
        .insert([{
          thread_id: thread.id,
          sender_id: profile.id,
          content: newMessage
        }])
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('support_threads')
        .update({ 
          last_message: newMessage, 
          last_message_at: new Date().toISOString(),
          unread_count_owner: (thread.unread_count_owner || 0) + 1
        })
        .eq('id', thread.id);
      
      setNewMessage("");
      if (msgData) setMessages(prev => [...prev, msgData]);
    } catch (err: any) {
      toast.error("Erro ao enviar: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <Card className="mb-4 flex h-[450px] w-[320px] flex-col overflow-hidden border-primary/20 bg-sidebar/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-sidebar-border bg-primary/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground shadow-lg">
                SUP
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Suporte Online</p>
                <p className="text-[9px] font-bold text-online animate-pulse">Atendente pronto</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center space-y-2 opacity-40">
                <MessageSquare className="h-10 w-10" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Inicie uma conversa</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === profile.id;
                return (
                  <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-[12px] shadow-sm",
                      isMe 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-sidebar-accent border border-sidebar-border rounded-tl-none"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-sidebar-border p-3 bg-sidebar/50">
            <div className="flex gap-2">
              <Input 
                placeholder="Dúvida?" 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="h-9 text-xs bg-sidebar-accent/50"
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Button
        onClick={toggleChat}
        className="h-14 w-14 rounded-full shadow-2xl shadow-primary/40 hover:scale-105 transition-all"
        aria-label="Suporte"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    </div>
  );
}

function ShellLayoutInner() {
  const { profile, isOwner, servers, serverId, setServerId, blocked, expired } = usePlayerSession();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const queryClient = useQueryClient();
  const router = useRouter();

  const fetchThreads = useServerFn(listSupportThreads);
  const fetchNotifications = useServerFn(getNotifications);
  const mutationMarkRead = useServerFn(markNotificationRead);

  const { data: threads } = useQuery({
    queryKey: ["support-threads-nav"],
    queryFn: () => fetchThreads(),
    enabled: isOwner,
    refetchInterval: 10000,
  });

  const { data: userNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(),
    refetchInterval: 30000,
  });

  const unreadNotificationsCount = useMemo(() => 
    (userNotifications ?? []).filter((n: any) => !n.is_read).length,
  [userNotifications]);

  const totalUnread = (threads ?? []).reduce((acc: number, t: any) => acc + (t.unread_count_owner || 0), 0);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void router.navigate({ to: "/", replace: true });
  };

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >

        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
            W
          </span>
          <span className="text-sm font-bold tracking-[0.18em] text-sidebar-foreground">
            WEBPLAYER
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const isRestricted = !isOwner && (blocked || expired) && item.restricted;
            if (isRestricted) return null;
            
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        
          <Link
            to="/conta"
            onClick={() => setOpen(false)}
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <UserCog className="h-4 w-4" />
            Conta
          </Link>
          {isOwner ? (
            <>
              <Link
                to="/usuarios"
                onClick={() => setOpen(false)}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-sidebar-accent"
              >
                <Users className="h-4 w-4" />
                Usuarios
              </Link>
              <Link
                to="/painel"
                onClick={() => setOpen(false)}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-sidebar-accent"
              >
                <ShieldCheck className="h-4 w-4" />
                Painel do Dono
              </Link>
              <Link
                to="/suporte"
                onClick={() => setOpen(false)}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-sidebar-accent"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4" />
                  Suporte
                </div>
                {totalUnread > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
                    {totalUnread}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <Link
              to="/suporte"
              onClick={() => setOpen(false)}
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <History className="h-4 w-4" />
              Historico de Suporte
            </Link>
          )}
        </nav>


        <div className="space-y-3 border-t border-sidebar-border p-4">
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold text-sidebar-foreground">
              {profile?.display_name || profile?.username || (isOwner ? "Dono" : "Acesso")}
            </p>
            {profile ? (
              <p>
                {profile.max_connections} conexao(oes)
                {profile.expires_at
                  ? ` · vence ${new Date(profile.expires_at).toLocaleDateString("pt-BR")}`
                  : " · sem validade"}
              </p>
            ) : (
              <p>Acesso administrativo</p>
            )}
          </div>
          <Button variant="secondary" size="sm" className="w-full" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex flex-col flex-1 lg:pl-64 min-w-0 w-full overflow-x-hidden">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 font-semibold">
            {location.pathname === "/painel" && (
              <span className="flex items-center gap-2 text-gold">
                <ShieldCheck className="h-5 w-5" /> Configurações do Sistema
              </span>
            )}
            {location.pathname === "/suporte" && (
              <span className="flex items-center gap-2 text-primary font-bold">
                <MessageSquare className="h-5 w-5" /> Chat de Atendimento
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full border border-border/50 bg-sidebar/40 hover:bg-primary/10 hover:text-primary transition-all">
                  <Bell className="h-5 w-5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground shadow-lg animate-bounce">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-sidebar border-sidebar-border p-2 shadow-2xl backdrop-blur-xl">
                <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notificações</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                      {unreadNotificationsCount} NOVAS
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-sidebar-border opacity-50" />
                <div className="max-h-[350px] overflow-y-auto py-1 custom-scrollbar">
                  {userNotifications?.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent/50 opacity-20">
                        <Bell className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground">Tudo em dia! Nenhuma notificação por aqui.</p>
                    </div>
                  ) : (
                    userNotifications?.map((n: any) => (
                      <DropdownMenuItem 
                        key={n.id} 
                        className={cn(
                          "flex flex-col items-start gap-1 p-3 rounded-xl transition-all mb-1 cursor-default",
                          !n.is_read ? "bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary" : "opacity-60 grayscale hover:grayscale-0 hover:bg-sidebar-accent"
                        )}
                        onSelect={async () => {
                          if (!n.is_read) {
                            await mutationMarkRead({ data: n.id });
                            queryClient.invalidateQueries({ queryKey: ["notifications"] });
                          }
                        }}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className={cn(
                            "text-xs font-black uppercase tracking-tight",
                            n.type === 'expiration' ? 'text-destructive' : 'text-primary'
                          )}>
                            {n.title}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/60">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-sidebar-foreground/80">{n.content}</p>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {servers.length > 0 && location.pathname !== "/painel" && location.pathname !== "/suporte" ? (
              <Select value={serverId ?? ""} onValueChange={setServerId}>
                <SelectTrigger className="w-[190px] bg-sidebar/50 border-border/50 h-10 rounded-xl">
                  <SelectValue placeholder="Servidor" />
                </SelectTrigger>

                <SelectContent className="bg-sidebar border-sidebar-border">
                  {servers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        </header>

        {blocked && !expired ? (
          <div className="flex items-start gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{blocked}</span>
          </div>
        ) : null}

        <main className="p-4 lg:p-6">
          {!isOwner && (blocked || expired) && location.pathname !== "/conta" ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 rounded-full bg-destructive/10 p-6">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-primary">Acesso Suspenso</h2>
              <p className="mt-2 max-w-md text-muted-foreground font-medium">
                Seu plano expirou ou o acesso foi bloqueado. Para continuar assistindo, renove sua assinatura agora mesmo.
              </p>
              <Button asChild className="mt-8 font-black uppercase italic tracking-widest h-12 px-8 shadow-lg shadow-primary/20">
                <Link to="/conta">Ir para Renovação</Link>
              </Button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </>
  );
}
