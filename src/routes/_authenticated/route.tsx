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
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSupportThreads } from "@/lib/chat.functions";
import { cn } from "@/lib/utils";

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

  const { data: threads } = useQuery({
    queryKey: ["support-threads-nav"],
    queryFn: () => fetchThreads(),
    enabled: isOwner,
    refetchInterval: 10000,
  });

  const totalUnread = (threads ?? []).reduce((acc: number, t: any) => acc + (t.unread_count_owner || 0), 0);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void router.navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
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
          ) : null}

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
    </div>
  );
}
