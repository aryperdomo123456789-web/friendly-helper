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
import { getDeviceId, SERVER_KEY } from "@/lib/device";
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

function isServerScopedQuery(queryKey: readonly unknown[], serverId: string) {
  if (!Array.isArray(queryKey)) return false;
  const [scope, second, third] = queryKey;
  return (
    (scope === "categories" || scope === "series-info" || scope === "epg") && second === serverId ||
    (scope === "streams" || scope === "playback-url") && (second === serverId || third === serverId)
  );
}

export function PlayerSessionProvider({ children }: { children: ReactNode }) {
  const fetchSession = useServerFn(getMySession);
  const ping = useServerFn(heartbeat);
  const fetchCategories = useServerFn(getCategories);
  const queryClient = useQueryClient();
  const [serverId, setServerIdState] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const catalogInvalidateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warmedServersRef = useRef(new Set<string>());
  const warmingServersRef = useRef(new Set<string>());

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

  const { data, isLoading } = useQuery({
    queryKey: ["player-session"],
    queryFn: () => fetchSession(),
    staleTime: 60_000,
  });

  const servers: ServerRow[] = data?.servers ?? [];

  useEffect(() => {
    if (servers.length === 0) return;
    const stored = typeof window !== "undefined" ? window.localStorage.getItem(SERVER_KEY) : null;
    const valid = servers.find((server: ServerRow) => server.id === stored)?.id ?? servers[0]!.id;
    setServerIdState((current) => {
      if (!current) return valid;
      return servers.some((server: ServerRow) => server.id === current) ? current : valid;
    });
  }, [servers]);

  const warmServerCatalog = useCallback(
    async (targetServerId: string) => {
      if (!targetServerId) return;
      if (warmingServersRef.current.has(targetServerId) || warmedServersRef.current.has(targetServerId)) {
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "iptv_servers" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["player-session"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_server_access" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["player-session"] });
        },
      )
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
    if (isLoading) return;
    let cancelled = false;
    const send = async () => {
      try {
        const result = await ping({
          data: { device_id: getDeviceId(), user_agent: navigator.userAgent.slice(0, 280) },
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
  }, [isLoading, ping]);

  const value = useMemo<SessionValue>(
    () => ({
      loading: isLoading,
      isOwner: Boolean(data?.isOwner),
      authUserId: (data as any)?.authUserId ?? null,
      profile: (data?.profile as SessionValue["profile"]) ?? null,
      servers,
      serverId,
      activeServer: servers.find((server: ServerRow) => server.id === serverId) ?? null,
      preloadServerCatalog: (id: string) => {
        void warmServerCatalog(id);
      },
      setServerId: (id: string) => {
        const previousServerId = serverId;
        setServerIdState(id);
        window.localStorage.setItem(SERVER_KEY, id);
        if (previousServerId && previousServerId !== id) {
          void queryClient.cancelQueries({
            predicate: (query) => isServerScopedQuery(query.queryKey, previousServerId),
          });
          queryClient.removeQueries({
            predicate: (query) => isServerScopedQuery(query.queryKey, previousServerId),
          });
        }
        toast.success(`Servidor ativo: ${servers.find((s: ServerRow) => s.id === id)?.name ?? ""}`);
      },
      blocked,
      expired: Boolean(data?.expired),
    }),
    [blocked, data, isLoading, queryClient, serverId, servers, warmServerCatalog],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function usePlayerSession(): SessionValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("usePlayerSession precisa estar dentro do PlayerSessionProvider");
  return context;
}
