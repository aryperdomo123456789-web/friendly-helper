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

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  { to: "/inicio", label: "Inicio", icon: Home },
  { to: "/canais", label: "TV ao Vivo", icon: Tv },
  { to: "/filmes", label: "Filmes", icon: Film },
  { to: "/series", label: "Series", icon: MonitorPlay },
  { to: "/servidores", label: "Servidores", icon: Server },
] as const;

function Shell() {
  return (
    <PlayerSessionProvider>
      <ShellLayout />
    </PlayerSessionProvider>
  );
}

function ShellLayout() {
  const { profile, isOwner, servers, serverId, setServerId, blocked } = usePlayerSession();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const location = useLocation();
  const queryClient = useQueryClient();


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
          {NAV.map((item) => (
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
          ))}
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

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
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
          </div>

          <div className="ml-auto flex items-center gap-3">
            {servers.length > 0 && location.pathname !== "/painel" ? (
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

        {blocked ? (
          <div className="flex items-start gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{blocked}</span>
          </div>
        ) : null}

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
