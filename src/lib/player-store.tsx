import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCategories, getMySession, heartbeat } from "@/lib/player.functions";
import { getDeviceId } from "@/lib/device";
import {
  getServerSelectionStorageKey,
  isPlayerQuery,
  isServerScopedQuery,
  resolveServerSelection,
} from "@/lib/player-isolation";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ServerRow = { id: string; name: string; sort_order: number };

type SessionValue = {
  loading: boolean;
  isOwner: boolean;
  authUserId: string | null;
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    max_connections: number;
    expires_at: string | null;
    is_active: boolean;
  } | null;
  servers: ServerRow[];
  serverId: string | null;
  activeServer: ServerRow | null;
  setServerId: (id: string) => void;
  preloadServerCatalog: (id: string) => void;
  blocked: string | null;
  expired: boolean;
};

const SessionContext = createContext<SessionValue | null>(null);

export function PlayerSessionProvider({ children }: { children: ReactNode }) {
  const fetchSession = useServerFn(getMySession);
  const ping = useServerFn(heartbeat);
  const fetchCategories = useServerFn(getCategories);
  const queryClient = useQueryClient();
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [serverId, setServerIdState] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const catalogInvalidateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warmedServersRef = useRef(new Set<string>());
  const warmingServersRef = useRef(new Set<string>());
  const previousAuthUserIdRef = useRef<string | null>(null);

  const scheduleCatalogInvalidation = () => {
    if (catalogInvalidateTimer.current) {
      clearTimeout(catalogInvalidateTimer.current);
    }
    catalogInvalidateTimer.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["streams"] });
      queryClient.invalidateQueries({ queryKey: ["series-info"] });
      queryClient.invalidateQueries({ queryKey: ["epg"] });
      catalogInvalidateTimer.current = null;
    }, 600);
  };

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (mounted) setAuthUserId(sessionData.session?.user.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["player-session", authUserId],
    queryFn: () => fetchSession(),
    staleTime: 60_000,
    enabled: authUserId !== null,
  });

  const servers: ServerRow[] = data?.servers ?? [];

  useEffect(() => {
    const previousAuthUserId = previousAuthUserIdRef.current;
    if (previousAuthUserId === authUserId) return;

    if (previousAuthUserId !== null) {
      void queryClient.cancelQueries({ predicate: (query) => isPlayerQuery(query.queryKey) });
      queryClient.removeQueries({ predicate: (query) => isPlayerQuery(query.queryKey) });
      warmedServersRef.current.clear();
      warmingServersRef.current.clear();
      setServerIdState(null);
      setBlocked(null);
    }
    previousAuthUserIdRef.current = authUserId;
  }, [authUserId, queryClient]);

  useEffect(() => {
    if (!authUserId || servers.length === 0) {
      setServerIdState(null);
      return;
    }

    const storageKey = getServerSelectionStorageKey(authUserId);
    const stored = storageKey ? window.localStorage.getItem(storageKey) : null;
    const valid = resolveServerSelection(servers, stored);
    setServerIdState((current) =>
      current && servers.some((server) => server.id === current) ? current : valid,
    );
  }, [authUserId, servers]);

  const warmServerCatalog = useCallback(
    async (targetServerId: string) => {
      if (!targetServerId) return;
      if (
        warmingServersRef.current.has(targetServerId) ||
        warmedServersRef.current.has(targetServerId)
      ) {
        return;
      }

      warmingServersRef.current.add(targetServerId);
      const kinds = ["live", "movie", "series"] as const;

      try {
        await Promise.all(
          kinds.map((kind) =>
            queryClient.prefetchQuery({
              queryKey: ["categories", kind, targetServerId],
              queryFn: () =>
                fetchCategories({
                  data: {
                    server_id: targetServerId,
                    kind,
                  },
                }),
              staleTime: 60_000,
            }),
          ),
        );
        warmedServersRef.current.add(targetServerId);
      } catch {
        // Aquecimento opcional: não interfere na troca caso o servidor demore ou falhe.
      } finally {
        warmingServersRef.current.delete(targetServerId);
      }
    },
    [fetchCategories, queryClient],
  );

  useEffect(() => {
    const channel = supabase
      .channel("player_session_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "iptv_servers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["player-session"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_server_access" }, () => {
        queryClient.invalidateQueries({ queryKey: ["player-session"] });
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "iptv_server_cache" },
        (payload) => {
          const affectedServerId =
            (payload.new as { server_id?: string } | null | undefined)?.server_id ??
            (payload.old as { server_id?: string } | null | undefined)?.server_id ??
            null;
          if (serverId && affectedServerId && affectedServerId !== serverId) return;
          scheduleCatalogInvalidation();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "iptv_server_m3u_cache" },
        (payload) => {
          const affectedServerId =
            (payload.new as { server_id?: string } | null | undefined)?.server_id ??
            (payload.old as { server_id?: string } | null | undefined)?.server_id ??
            null;
          if (serverId && affectedServerId && affectedServerId !== serverId) return;
          scheduleCatalogInvalidation();
        },
      )
      .subscribe();

    return () => {
      if (catalogInvalidateTimer.current) {
        clearTimeout(catalogInvalidateTimer.current);
        catalogInvalidateTimer.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [queryClient, serverId]);

  useEffect(() => {
    if (isLoading || !authUserId) return;
    let cancelled = false;
    const send = async () => {
      try {
        const result = await ping({
          data: {
            device_id: getDeviceId(),
            server_id: serverId ?? undefined,
            user_agent: navigator.userAgent.slice(0, 280),
          },
        });
        if (!cancelled) {
          setBlocked(result.expired ? "Plano expirado" : null);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Conexão recusada.";
          setBlocked(message);
        }
      }
    };
    void send();
    const timer = setInterval(send, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [authUserId, isLoading, ping, serverId]);

  const value = useMemo<SessionValue>(
    () => ({
      loading: isLoading,
      isOwner: Boolean(data?.isOwner),
      authUserId,
      profile: (data?.profile as SessionValue["profile"]) ?? null,
      servers,
      serverId,
      activeServer: servers.find((server: ServerRow) => server.id === serverId) ?? null,
      preloadServerCatalog: (id: string) => {
        void warmServerCatalog(id);
      },
      setServerId: (id: string) => {
        const selectedServer = servers.find((server: ServerRow) => server.id === id);
        if (!selectedServer) {
          setBlocked("Servidor não autorizado para este acesso.");
          return;
        }

        const previousServerId = serverId;
        setServerIdState(id);
        const storageKey = getServerSelectionStorageKey(authUserId);
        if (storageKey) window.localStorage.setItem(storageKey, id);
        if (previousServerId && previousServerId !== id) {
          void queryClient.cancelQueries({
            predicate: (query) => isServerScopedQuery(query.queryKey, previousServerId),
          });
          queryClient.removeQueries({
            predicate: (query) => isServerScopedQuery(query.queryKey, previousServerId),
          });
        }
        toast.success(`Servidor ativo: ${selectedServer.name}`);
      },
      blocked,
      expired: Boolean(data?.expired),
    }),
    [authUserId, blocked, data, isLoading, queryClient, serverId, servers, warmServerCatalog],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function usePlayerSession(): SessionValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("usePlayerSession precisa estar dentro do PlayerSessionProvider");
  return context;
}
