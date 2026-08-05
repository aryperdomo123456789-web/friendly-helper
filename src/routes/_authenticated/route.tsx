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
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DEFAULT_BRAND_IMAGE_URL } from "@/lib/config.functions";
import { listSupportThreads } from "@/lib/chat.functions";
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
  const { profile, isOwner, servers, serverId, setServerId, blocked, expired } = usePlayerSession();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const location = useLocation();
  const queryClient = useQueryClient();
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

  useEffect(() => {
    if (!isOwner) return;

    const channel = supabase
      .channel("support_threads_nav")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_threads",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["support-threads-nav"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOwner, queryClient]);

  const unreadNotificationsCount = useMemo(
    () => (userNotifications ?? []).filter((n: any) => !n.is_read).length,
    [userNotifications],
  );

  const totalUnread = (threads ?? []).reduce((acc: number, t: any) => acc + (t.unread_count_owner || 0), 0);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void router.navigate({ to: "/", replace: true });
  };

  return (
    <div className="relative h-dvh overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-dvh w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-primary/10 text-sm font-black text-primary-foreground">
            <img
              src={DEFAULT_BRAND_IMAGE_URL}
              alt="Logo"
              className="h-full w-full object-contain p-1"
            />
          </div>
          <span className="text-sm font-bold tracking-[0.18em] text-sidebar-foreground">
            WEBPLAYER
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 custom-scrollbar">
          {NAV.map((item) => {
            const isRestricted = !isOwner && (blocked || expired) && item.restricted;
            if (isRestricted) return null;
            
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
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
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
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
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              >
                <Users className="h-4 w-4" />
                Usuarios
              </Link>
              <Link
                to="/painel"
                onClick={() => setOpen(false)}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              >
                <ShieldCheck className="h-4 w-4" />
                Painel do Dono
              </Link>
              <Link
                to="/suporte"
                onClick={() => setOpen(false)}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
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
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
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

      <div className="flex h-dvh min-w-0 w-full flex-1 flex-col overflow-hidden lg:pl-64">
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
                          !n.is_read ? "bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary" : "opacity-60 grayscale hover:grayscale-0 hover:bg-sidebar-accent",
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
                            n.type === "expiration" ? "text-destructive" : "text-primary",
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
                <SelectTrigger className="w-[190px] bg-sidebar/50 border-border/50">
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

        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
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
    </div>
  );
}
