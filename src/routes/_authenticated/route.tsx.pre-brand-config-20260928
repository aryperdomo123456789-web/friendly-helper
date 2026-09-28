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
  LayoutDashboard,
  CircleUserRound,
  LifeBuoy,
} from "lucide-react";
import { useState, useEffect, useMemo, type ElementType, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  APP_CONFIG_QUERY_KEY,
  DEFAULT_BRAND_IMAGE_URL,
  getAppConfig,
} from "@/lib/config.functions";
import { listSupportThreads } from "@/lib/chat.functions";
import { getNotifications, markNotificationRead } from "@/lib/notifications.functions";
import { cn } from "@/lib/utils";
import { SectionErrorBoundary } from "@/components/ui/section-error-boundary";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCategories } from "@/lib/player.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/" });
  },
  component: Shell,
});

const USER_NAV = [
  { to: "/inicio", label: "Início", icon: Home, restricted: true },
  { to: "/canais", label: "TV ao Vivo", icon: Tv, restricted: true },
  { to: "/filmes", label: "Filmes", icon: Film, restricted: true },
  { to: "/series", label: "Séries", icon: MonitorPlay, restricted: true },
  { to: "/servidores", label: "Servidores", icon: Server, restricted: true },
] as const;

const OWNER_NAV = [
  { to: "/usuarios", label: "Usuários", icon: Users },
  { to: "/painel", label: "Painel do dono", icon: ShieldCheck },
  { to: "/suporte", label: "Suporte", icon: MessageSquare },
] as const;

const PRIMARY_TABS = [
  { to: "/inicio", label: "Início" },
  { to: "/canais", label: "TV ao Vivo" },
  { to: "/filmes", label: "Filmes" },
  { to: "/series", label: "Séries" },
] as const;

function SidebarSection({
  title,
  description,
  icon: Icon,
  titleClassName,
  children,
}: {
  title: string;
  description?: string;
  icon: ElementType;
  titleClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3 px-3">
        <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl border border-sidebar-border bg-sidebar-accent/60 text-sidebar-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className={cn("text-[11px] font-black uppercase tracking-[0.22em] text-sidebar-foreground/50", titleClassName)}>
            {title}
          </p>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-sidebar-foreground/60">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-1.5 px-1">{children}</div>
    </section>
  );
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  onClick,
  activeClassName,
  className,
  badge,
  preload = "intent",
}: {
  to: string;
  label: string;
  icon: ElementType;
  onClick?: () => void;
  activeClassName?: string;
  className?: string;
  badge?: ReactNode;
  preload?: "intent" | false;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      preload={preload}
      preloadDelay={80}
      activeProps={{ className: activeClassName ?? "bg-sidebar-accent text-sidebar-accent-foreground" }}
      className={cn(
        "flex items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-all hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        className,
      )}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      {badge}
    </Link>
  );
}

function Shell() {
  return (
    <PlayerSessionProvider>
      <ShellLayout />
    </PlayerSessionProvider>
  );
}

function ShellLayout() {
  const { profile, isOwner, servers, serverId, setServerId, preloadServerCatalog, blocked, expired } = usePlayerSession();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const location = useLocation();
  const queryClient = useQueryClient();
  const fetchConfig = useServerFn(getAppConfig);
  const fetchThreads = useServerFn(listSupportThreads);
  const fetchNotifications = useServerFn(getNotifications);
  const fetchCategories = useServerFn(getCategories);
  const mutationMarkRead = useServerFn(markNotificationRead);
  const { data: appConfig } = useQuery({
    queryKey: APP_CONFIG_QUERY_KEY,
    queryFn: () => fetchConfig(),
    staleTime: 5 * 60_000,
  });

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
  const userSectionTitle = profile?.display_name?.trim() || profile?.username || "Seu perfil";
  const showPrimaryTabs = !isOwner && ["/inicio", "/canais", "/filmes", "/series"].includes(location.pathname);

  useEffect(() => {
    if (isOwner || !showPrimaryTabs || !serverId) return;

    const kindFromPath =
      location.pathname === "/canais"
        ? ("live" as const)
        : location.pathname === "/filmes"
          ? ("movie" as const)
          : location.pathname === "/series"
            ? ("series" as const)
            : null;

    if (!kindFromPath) return;

    let cancelled = false;
    const schedule =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback.bind(window)
        : (callback: () => void) => window.setTimeout(callback, 300);
    const cancel =
      typeof window !== "undefined" && "cancelIdleCallback" in window
        ? window.cancelIdleCallback.bind(window)
        : window.clearTimeout.bind(window);

    const handle = schedule(() => {
      if (cancelled) return;
      void queryClient.prefetchQuery({
        queryKey: ["categories", kindFromPath, serverId],
        queryFn: () => fetchCategories({ data: { server_id: serverId, kind: kindFromPath } }),
        staleTime: 60_000,
      }).catch(() => undefined);
    });

    return () => {
      cancelled = true;
      cancel(handle);
    };
  }, [fetchCategories, isOwner, location.pathname, queryClient, serverId, showPrimaryTabs]);

  useEffect(() => {
    if (!isOwner) return;

    const invalidateSupportScopes = () => {
      queryClient.invalidateQueries({ queryKey: ["support-threads-nav"] });
      queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
      queryClient.invalidateQueries({ queryKey: ["support-thread-user"] });
      queryClient.invalidateQueries({ queryKey: ["support-my-threads"] });
      queryClient.invalidateQueries({ queryKey: ["support-messages-page"] });
      queryClient.invalidateQueries({ queryKey: ["floating-support-messages"] });
      queryClient.invalidateQueries({ queryKey: ["support-stats"] });
    };

    const invalidateUserScopes = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["my-account"] });
      queryClient.invalidateQueries({ queryKey: ["player-session"] });
    };

    const invalidateServerScopes = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
      queryClient.invalidateQueries({ queryKey: ["player-session"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["streams"] });
      queryClient.invalidateQueries({ queryKey: ["series-info"] });
      queryClient.invalidateQueries({ queryKey: ["epg"] });
    };

    const invalidatePlanScopes = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-plans-page"] });
      queryClient.invalidateQueries({ queryKey: ["available-plans"] });
      queryClient.invalidateQueries({ queryKey: ["my-account"] });
    };

    const invalidateTestLinkScopes = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-test-links"] });
      queryClient.invalidateQueries({ queryKey: ["admin-test-links-page"] });
      queryClient.invalidateQueries({ queryKey: ["my-account"] });
    };

    const channel = supabase
      .channel("owner_shell_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_threads",
        },
        invalidateSupportScopes,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
        },
        invalidateSupportScopes,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "iptv_servers",
        },
        invalidateServerScopes,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "server_credentials",
        },
        invalidateServerScopes,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_server_access",
        },
        invalidateUserScopes,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        invalidateUserScopes,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
        },
        invalidateUserScopes,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscription_plans",
        },
        invalidatePlanScopes,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "test_links",
        },
        invalidateTestLinkScopes,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_config",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: APP_CONFIG_QUERY_KEY });
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
              src={appConfig?.logo_small_url || appConfig?.logo_url || DEFAULT_BRAND_IMAGE_URL}
              alt="Logo"
              className="h-full w-full object-contain p-1"
            />
          </div>
          <span className="text-sm font-bold tracking-[0.18em] text-sidebar-foreground">
            {appConfig?.short_name || "Sistema IPTV"}
          </span>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 custom-scrollbar">
          <SidebarSection
            title={userSectionTitle}
            description={undefined}
            icon={CircleUserRound}
            titleClassName="normal-case tracking-[0.06em] text-sidebar-foreground"
          >
            {USER_NAV.map((item) => {
              const isRestricted = !isOwner && (blocked || expired) && item.restricted;
              if (isRestricted) return null;
              
              return (
                <SidebarLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  label={item.label}
                  icon={item.icon}
                />
              );
            })}
            <SidebarLink
              to="/conta"
              onClick={() => setOpen(false)}
              label="Conta"
              icon={UserCog}
            />
            <SidebarLink
              to="/suporte"
              onClick={() => setOpen(false)}
              label={isOwner ? "Suporte" : "Histórico de Suporte"}
              icon={isOwner ? MessageSquare : History}
              badge={isOwner ? (
                totalUnread > 0 ? (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
                    {totalUnread}
                  </span>
                ) : null
              ) : null}
              className={cn(!isOwner && "bg-sidebar-accent/20")}
            />
          </SidebarSection>

          {isOwner ? (
            <>
              <div className="border-t border-sidebar-border/70" />
              <SidebarSection
                title="Núcleo administrativo"
                description="Controles internos, operação e auditoria do sistema."
                icon={LayoutDashboard}
              >
                {OWNER_NAV.map((item) => (
                  <SidebarLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    label={item.label}
                    icon={item.icon}
                    className="text-gold"
                  />
                ))}
              </SidebarSection>
            </>
          ) : null}

          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sidebar-foreground/50">
                  Núcleo ativo
                </p>
                <p className="mt-1 text-sm font-semibold text-sidebar-foreground">
                  {isOwner ? "Administração e suporte" : "Experiência do cliente"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-sidebar-foreground/60">
                  {isOwner
                    ? "Apenas o dono acessa estas rotinas de controle."
                    : "A interface mantém o foco no uso diário e no consumo do catálogo."}
                </p>
              </div>
            </div>
          </div>
        </nav>


        <div className="space-y-3 border-t border-sidebar-border p-4">
          <div className="text-xs text-muted-foreground">
            <p className="font-semibold text-sidebar-foreground">
              {profile?.display_name || profile?.username || (isOwner ? "Administrador" : "Acesso")}
            </p>
            {profile ? (
              <p>
                {profile.max_connections} conexão(ões)
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
            className="relative z-10 lg:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
            {showPrimaryTabs ? (
              <nav className="hidden min-w-0 flex-1 justify-center lg:flex">
                <div className="flex min-w-0 max-w-4xl items-center justify-center gap-1.5 overflow-x-auto rounded-full border border-border/60 bg-sidebar/35 px-1.5 py-1.5 shadow-sm backdrop-blur">
                  {PRIMARY_TABS.map((tab) => (
                    <Link
                      key={tab.to}
                      to={tab.to}
                      preload="intent"
                      preloadDelay={80}
                      className="whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold text-sidebar-foreground/75 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      activeProps={{
                        className: "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
                      }}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              </nav>
            ) : (
              <div className="min-w-0 flex-1">
                {isOwner && location.pathname === "/painel" && (
                  <span className="flex items-center gap-2 text-gold">
                    <ShieldCheck className="h-5 w-5" /> Núcleo administrativo
                  </span>
                )}
                {location.pathname === "/suporte" && (
                  <span className="flex items-center gap-2 font-bold text-primary">
                    <MessageSquare className="h-5 w-5" /> {isOwner ? "Suporte do dono" : userSectionTitle}
                  </span>
                )}
                {!isOwner && ["/servidores", "/conta"].includes(location.pathname) && (
                  <span className="flex items-center gap-2 text-sidebar-foreground/70">
                    <CircleUserRound className="h-5 w-5" /> {userSectionTitle}
                  </span>
                )}
              </div>
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
                    <SelectItem
                      key={server.id}
                      value={server.id}
                      onMouseEnter={() => preloadServerCatalog(server.id)}
                      onFocus={() => preloadServerCatalog(server.id)}
                    >
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
          <SectionErrorBoundary
            title="Essa área encontrou um problema"
            description="O núcleo principal segue carregado. Você pode tentar novamente sem perder a navegação lateral."
            resetKey={location.pathname}
            className="h-full"
          >
            {!isOwner && (blocked || expired) && location.pathname !== "/conta" ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 rounded-full bg-destructive/10 p-6">
                  <AlertTriangle className="h-16 w-16 text-destructive" />
                </div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-primary">Acesso suspenso</h2>
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
          </SectionErrorBoundary>
        </main>
      </div>
    </div>
  );
}
