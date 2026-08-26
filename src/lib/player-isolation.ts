export const LEGACY_SERVER_SELECTION_KEY = "wp_server_id";

const SERVER_SCOPED_QUERY_SCOPES = new Set([
  "categories",
  "streams",
  "series-info",
  "epg",
  "playback-url",
]);

export function getServerSelectionStorageKey(userId: string | null | undefined) {
  const normalized = userId?.trim();
  return normalized ? `${LEGACY_SERVER_SELECTION_KEY}:${normalized}` : null;
}

export function resolveServerSelection<T extends { id: string }>(
  servers: T[],
  storedServerId: string | null,
) {
  return servers.find((server) => server.id === storedServerId)?.id ?? servers[0]?.id ?? null;
}

export function isServerScopedQuery(queryKey: readonly unknown[], serverId?: string | null) {
  if (!Array.isArray(queryKey) || !SERVER_SCOPED_QUERY_SCOPES.has(String(queryKey[0])))
    return false;
  if (!serverId) return true;
  return queryKey.slice(1).some((part) => part === serverId);
}

export function isPlayerQuery(queryKey: readonly unknown[]) {
  return queryKey[0] === "player-session" || isServerScopedQuery(queryKey);
}
