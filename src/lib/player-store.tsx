import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMySession, heartbeat } from "@/lib/player.functions";
import { getDeviceId, SERVER_KEY } from "@/lib/device";
import { toast } from "sonner";

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
  blocked: string | null;
  expired: boolean;
};

const SessionContext = createContext<SessionValue | null>(null);

export function PlayerSessionProvider({ children }: { children: ReactNode }) {
  const fetchSession = useServerFn(getMySession);
  const ping = useServerFn(heartbeat);
  const [serverId, setServerIdState] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

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
    setServerIdState((current) => current ?? valid);
  }, [servers]);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    const send = async () => {
      try {
        const result = await ping({
          data: { device_id: getDeviceId(), user_agent: navigator.userAgent.slice(0, 280) },
        });
        if (!cancelled) {
          setBlocked(result.expired ? "Plano Expirado" : null);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Conexao recusada";
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
      setServerId: (id: string) => {
        setServerIdState(id);
        window.localStorage.setItem(SERVER_KEY, id);
        toast.success(`Servidor ativo: ${servers.find((s: ServerRow) => s.id === id)?.name ?? ""}`);
      },
      blocked,
      expired: Boolean(data?.expired),
    }),
    [blocked, data, isLoading, serverId, servers],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function usePlayerSession(): SessionValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("usePlayerSession precisa estar dentro do PlayerSessionProvider");
  return context;
}
