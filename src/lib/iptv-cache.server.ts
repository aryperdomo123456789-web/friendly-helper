import { xtreamCall, type XtreamCreds } from "./xtream.server";
import {
  createEmptyPlaylistCatalog,
  fetchRemotePlaylist,
  parsePlaylistCatalog,
  type PlaylistCatalog,
  type PlaylistSnapshot,
} from "./iptv-playlist.server";
import {
  clearLocalServerCache,
  clearLocalServerPlaylist,
  readLocalServerCache,
  readLocalServerPlaylist,
  writeLocalServerCache,
  writeLocalServerPlaylist,
  withServerFilesystemLock,
  type ServerFilesystemLockObserver,
} from "./server-filesystem-cache.server";
import { clearLocalImageCache } from "./server-media-cache.server";
import {
  createObservationId,
  hashObservationId,
  recordLockAcquired,
  recordLockContended,
  recordLockStaleRemoved,
  recordLockTimedOut,
  recordRefreshCoalesced,
  recordRefreshFallback,
  recordRefreshServerCompleted,
  recordRefreshServerFailed,
  recordRefreshServerStarted,
  workerLog,
} from "./worker-observability.server";
import {
  createLongOperationMetadata,
  LongOperationCancelledError,
  type LongOperationStage,
  type LongOperationState,
} from "./long-operation";
import {
  isRefreshOperationCancellationRequested,
  updateRefreshOperation,
  type RefreshOperationRow,
} from "./long-running-operations.server";

type Kind = "live" | "movie" | "series";

type RefreshResult = {
  kinds: Record<Kind, { categories: number; streams: number }>;
  source: "m3u" | "xtream";
};

type RefreshExecutionHooks = {
  onProgress?: (
    state: LongOperationState,
    stage: LongOperationStage,
    details?: Record<string, unknown>,
  ) => Promise<unknown>;
  isCancellationRequested?: () => Promise<boolean>;
};

type CachedRow<T> = {
  payload: T;
  fetched_at: string;
};

type CategoryRow = { category_id: string; category_name: string };
type StreamRow = {
  stream_id?: number;
  series_id?: number;
  M_ID?: number | string;
  m_id?: number | string;
  name: string;
  stream_icon?: string;
  cover?: string;
  container_extension?: string;
  rating?: string;
  category_id?: string;
};

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const refreshInFlight = new Map<string, Promise<RefreshResult>>();

function normalizeItems<T>(rows: T[] | null | undefined): T[] {
  return Array.isArray(rows) ? rows : [];
}

function cacheKey(...parts: Array<string | undefined | null>) {
  return parts.filter(Boolean).join(":");
}

function logRefreshOperationState(
  refreshRef: string,
  serverRef: string,
  state: LongOperationState,
  stage: LongOperationStage,
  startedAt: number,
  fields: Record<string, unknown> = {},
) {
  workerLog("info", "refresh_operation_state", {
    ...createLongOperationMetadata(hashObservationId(refreshRef), state, stage, startedAt),
    server_ref: serverRef,
    ...fields,
  });
}

async function getSupabaseAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function isMissingTableError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "PGRST205"
  );
}

type PlaylistCacheRow = PlaylistSnapshot & {
  server_id: string;
};

type DynamicQueryResult = {
  data?: unknown;
  error: unknown | null;
};

type DynamicCacheQuery = {
  select: (columns: string) => DynamicCacheQuery;
  eq: (column: string, value: unknown) => DynamicCacheQuery;
  delete: () => DynamicCacheQuery;
  maybeSingle: () => Promise<DynamicQueryResult>;
  upsert: (
    values: Record<string, unknown>,
    options?: { onConflict?: string },
  ) => Promise<DynamicQueryResult>;
};

type DynamicSupabaseClient = {
  from: (table: string) => DynamicCacheQuery;
};

async function loadServerCredential(serverId: string): Promise<{
  server: { id: string; name: string; is_active: boolean } | null;
  credential: XtreamCreds | null;
}> {
  const supabaseAdmin = await getSupabaseAdmin();
  const [{ data: server }, { data: creds }] = await Promise.all([
    supabaseAdmin
      .from("iptv_servers")
      .select("id, name, is_active")
      .eq("id", serverId)
      .maybeSingle(),
    supabaseAdmin
      .from("server_credentials")
      .select("username, password, dns")
      .eq("server_id", serverId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const credentialRow = normalizeItems(creds)[0];
  if (!server || !credentialRow) {
    return { server: server ?? null, credential: null };
  }

  const dnsPool = normalizeItems(creds)
    .map((row: { dns?: string }) => row.dns)
    .filter((dns): dns is string => Boolean(dns));

  return {
    server,
    credential: {
      username: credentialRow.username,
      password: credentialRow.password,
      dns: credentialRow.dns,
      dnsPool,
    },
  };
}

export function serverCatalogCacheKey(
  kind: Kind,
  scope: "categories" | "streams" | "series-info" | "vod-info" | "epg",
  id?: string,
) {
  return cacheKey("catalog", kind, scope, id);
}

export async function readServerCache<T>(serverId: string, cacheKeyName: string) {
  const local = await readLocalServerCache<T>(serverId, cacheKeyName);
  if (local) return local;

  const supabaseAdmin = await getSupabaseAdmin();
  const cacheClient = supabaseAdmin as unknown as DynamicSupabaseClient;
  const { data, error } = await cacheClient
    .from("iptv_server_cache")
    .select("payload, fetched_at")
    .eq("server_id", serverId)
    .eq("cache_key", cacheKeyName)
    .maybeSingle();
  if (error || !data) return null;

  const entry = data as CachedRow<T>;
  const fetchedAt = new Date(entry.fetched_at).getTime();
  const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > CACHE_TTL_MS;
  return { payload: entry.payload as T, fetchedAt: entry.fetched_at, stale };
}

export async function writeServerCache<T>(serverId: string, cacheKeyName: string, payload: T) {
  try {
    await writeLocalServerCache(serverId, cacheKeyName, payload);
  } catch (error) {
    console.warn("Falha ao gravar cache local do servidor", { serverId, cacheKeyName, error });
  }

  const supabaseAdmin = await getSupabaseAdmin();
  const cacheClient = supabaseAdmin as unknown as DynamicSupabaseClient;
  const { error } = await cacheClient.from("iptv_server_cache").upsert(
    {
      server_id: serverId,
      cache_key: cacheKeyName,
      payload,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "server_id,cache_key" },
  );
  if (error && !isMissingTableError(error)) throw error;
}

export async function clearServerCache(serverId: string) {
  try {
    await clearLocalServerCache(serverId);
  } catch (error) {
    console.warn("Falha ao limpar cache local do servidor", { serverId, error });
  }

  const supabaseAdmin = await getSupabaseAdmin();
  const cacheClient = supabaseAdmin as unknown as DynamicSupabaseClient;
  const { error } = await (cacheClient
    .from("iptv_server_cache")
    .delete()
    .eq("server_id", serverId) as any);
  if (error && !isMissingTableError(error)) throw error;
}

export async function clearServerPlaylistCache(serverId: string) {
  try {
    await clearLocalServerPlaylist(serverId);
  } catch (error) {
    console.warn("Falha ao limpar playlist local do servidor", { serverId, error });
  }

  const supabaseAdmin = await getSupabaseAdmin();
  const cacheClient = supabaseAdmin as unknown as DynamicSupabaseClient;
  const { error } = await (cacheClient
    .from("iptv_server_m3u_cache")
    .delete()
    .eq("server_id", serverId) as any);
  if (error && !isMissingTableError(error)) throw error;
}

export async function readServerPlaylistCache(serverId: string) {
  const local = await readLocalServerPlaylist(serverId);
  if (local) return local;

  const supabaseAdmin = await getSupabaseAdmin();
  const cacheClient = supabaseAdmin as unknown as DynamicSupabaseClient;
  const { data, error } = await cacheClient
    .from("iptv_server_m3u_cache")
    .select("server_id, source_url, playlist_text, playlist_hash, item_count, fetched_at")
    .eq("server_id", serverId)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as unknown as PlaylistCacheRow;
  const fetchedAt = new Date(row.fetched_at).getTime();
  const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > CACHE_TTL_MS;
  return { ...row, stale };
}

export async function writeServerPlaylistCache(serverId: string, snapshot: PlaylistSnapshot) {
  try {
    await writeLocalServerPlaylist(serverId, snapshot);
  } catch (error) {
    console.warn("Falha ao gravar playlist local do servidor", { serverId, error });
  }

  const supabaseAdmin = await getSupabaseAdmin();
  const cacheClient = supabaseAdmin as unknown as DynamicSupabaseClient;
  const { error } = await cacheClient.from("iptv_server_m3u_cache").upsert(
    {
      server_id: serverId,
      source_url: snapshot.source_url,
      playlist_text: snapshot.playlist_text,
      playlist_hash: snapshot.playlist_hash,
      item_count: snapshot.item_count,
      fetched_at: snapshot.fetched_at,
    },
    { onConflict: "server_id" },
  );
  if (error && !isMissingTableError(error)) throw error;
}

async function writeCatalogRows(serverId: string, catalog: PlaylistCatalog) {
  const rows = (Object.keys(catalog) as Kind[]).flatMap((kind) => [
    {
      server_id: serverId,
      cache_key: serverCatalogCacheKey(kind, "categories"),
      payload: catalog[kind].categories,
      fetched_at: new Date().toISOString(),
    },
    {
      server_id: serverId,
      cache_key: serverCatalogCacheKey(kind, "streams"),
      payload: catalog[kind].streams.map(({ kind: _kind, ...stream }) => stream),
      fetched_at: new Date().toISOString(),
    },
  ]);

  await Promise.all(rows.map((row) => writeServerCache(serverId, row.cache_key, row.payload)));
}

async function fetchCatalogKind(credential: XtreamCreds, kind: Kind) {
  const actionMap: Record<Kind, { categories: string; streams: string }> = {
    live: { categories: "get_live_categories", streams: "get_live_streams" },
    movie: { categories: "get_vod_categories", streams: "get_vod_streams" },
    series: { categories: "get_series_categories", streams: "get_series" },
  };

  const categories = await xtreamCall<CategoryRow[]>(credential, {
    action: actionMap[kind].categories,
  });
  const streams = await xtreamCall<StreamRow[]>(credential, { action: actionMap[kind].streams });

  return {
    categories: normalizeItems(categories).map((item) => ({
      category_id: item.category_id,
      category_name: item.category_name,
    })),
    streams: normalizeItems(streams)
      .slice(0, 4000)
      .map((item) => ({
        id: String(item.stream_id ?? item.series_id ?? item.M_ID ?? item.m_id ?? ""),
        name: item.name,
        icon: item.stream_icon || item.cover || null,
        ext: item.container_extension ?? null,
        rating: item.rating ?? null,
        category_id: item.category_id ?? null,
      })),
  };
}

export async function executeServerCatalogRefresh(
  serverId: string,
  refreshRef: string,
  options: { clearLocalBeforeFetch?: boolean } = {},
  hooks: RefreshExecutionHooks = {},
): Promise<RefreshResult> {
  const serverRef = hashObservationId(serverId);
  const refreshStartedAt = Date.now();
  const progress = async (
    state: LongOperationState,
    stage: LongOperationStage,
    details: Record<string, unknown> = {},
  ) => {
    logRefreshOperationState(refreshRef, serverRef, state, stage, refreshStartedAt, details);
    await hooks.onProgress?.(state, stage, details);
  };
  const assertNotCancelled = async () => {
    if (await hooks.isCancellationRequested?.()) {
      throw new LongOperationCancelledError();
    }
  };

  recordRefreshServerStarted();
  await progress("running", "acquiring_lock");
  workerLog("info", "refresh_server_started", {
    refresh_ref: hashObservationId(refreshRef),
    server_ref: serverRef,
  });

  const lockObserver: ServerFilesystemLockObserver = {
    onAcquired: (waitMs) => {
      recordLockAcquired();
      workerLog("debug", "refresh_lock_acquired", {
        refresh_ref: hashObservationId(refreshRef),
        server_ref: serverRef,
        wait_ms: waitMs,
      });
    },
    onContended: () => {
      recordLockContended();
      workerLog("warn", "refresh_lock_contended", {
        refresh_ref: hashObservationId(refreshRef),
        server_ref: serverRef,
      });
    },
    onStaleRemoved: () => {
      recordLockStaleRemoved();
      workerLog("warn", "refresh_lock_stale_removed", {
        refresh_ref: hashObservationId(refreshRef),
        server_ref: serverRef,
      });
    },
    onTimedOut: (waitMs) => {
      recordLockTimedOut();
      workerLog("error", "refresh_lock_timeout", {
        refresh_ref: hashObservationId(refreshRef),
        server_ref: serverRef,
        wait_ms: waitMs,
      });
    },
  };
  if (hooks.isCancellationRequested)
    lockObserver.isCancellationRequested = hooks.isCancellationRequested;

  const job = withServerFilesystemLock(
    serverId,
    async () => {
      await assertNotCancelled();
      const { credential } = await loadServerCredential(serverId);
      if (!credential) throw new Error("Servidor sem credenciais cadastradas.");

      let catalog: PlaylistCatalog | null = null;
      let playlistSnapshot: PlaylistSnapshot | null = null;
      let source: "m3u" | "xtream" | null = null;

      await progress("running", "fetching_m3u");
      try {
        await assertNotCancelled();
        playlistSnapshot = await fetchRemotePlaylist(credential);
        await assertNotCancelled();
        await progress("running", "parsing_catalog");
        catalog = parsePlaylistCatalog(playlistSnapshot.playlist_text);
        const hasAnyEntries = (Object.keys(catalog) as Kind[]).some(
          (kind) => catalog![kind].streams.length > 0,
        );
        if (!hasAnyEntries) {
          catalog = null;
          recordRefreshFallback();
          workerLog("warn", "refresh_m3u_empty_fallback", {
            refresh_ref: hashObservationId(refreshRef),
            server_ref: serverRef,
            item_count: playlistSnapshot.item_count,
          });
        } else {
          source = "m3u";
          workerLog("info", "refresh_source_selected", {
            refresh_ref: hashObservationId(refreshRef),
            server_ref: serverRef,
            source,
            item_count: playlistSnapshot.item_count,
          });
        }
      } catch (error) {
        if (error instanceof LongOperationCancelledError) throw error;
        recordRefreshFallback();
        workerLog("warn", "refresh_m3u_failed_fallback", {
          refresh_ref: hashObservationId(refreshRef),
          server_ref: serverRef,
          error,
        });
      }

      if (!catalog) {
        const kinds: Kind[] = ["live", "movie", "series"];
        catalog = createEmptyPlaylistCatalog();

        for (const kind of kinds) {
          await assertNotCancelled();
          // Fetch one catalog kind at a time so large Xtream responses do not
          // remain resident together with the other kinds during a refresh.
          await progress("running", "fetching_catalog", { kind });
          catalog[kind] = await fetchCatalogKind(credential, kind);
        }

        source = "xtream";
        workerLog("info", "refresh_source_selected", {
          refresh_ref: hashObservationId(refreshRef),
          server_ref: serverRef,
          source,
        });
      }

      await assertNotCancelled();
      await progress("running", "persisting_cache");
      if (options.clearLocalBeforeFetch) {
        await Promise.allSettled([
          clearLocalServerCache(serverId),
          clearLocalServerPlaylist(serverId),
          clearLocalImageCache(serverId),
        ]);
      }

      if (playlistSnapshot) {
        await writeServerPlaylistCache(serverId, playlistSnapshot);
      }

      await writeCatalogRows(serverId, catalog);

      const kinds = (Object.keys(catalog) as Kind[]).reduce(
        (acc, kind) => {
          acc[kind] = {
            categories: catalog![kind].categories.length,
            streams: catalog![kind].streams.length,
          };
          return acc;
        },
        {} as Record<Kind, { categories: number; streams: number }>,
      );
      const result: RefreshResult = { kinds, source: source ?? "xtream" };
      recordRefreshServerCompleted();
      await progress("succeeded", "completed", {
        source: result.source,
        kinds: result.kinds,
      });
      workerLog("info", "refresh_server_completed", {
        refresh_ref: hashObservationId(refreshRef),
        server_ref: serverRef,
        source: result.source,
        kinds: result.kinds,
        duration_ms: Date.now() - refreshStartedAt,
      });
      return result;
    },
    lockObserver,
  );

  try {
    return await job;
  } catch (error) {
    const cancelled = error instanceof LongOperationCancelledError;
    if (!cancelled) recordRefreshServerFailed();
    const finalState: LongOperationState = cancelled ? "cancelled" : "failed";
    const finalStage: LongOperationStage = cancelled ? "cancelled" : "failed";
    await progress(finalState, finalStage, {
      reason: cancelled ? "cooperative_cancel" : "execution_error",
    }).catch((progressError) =>
      workerLog("error", "refresh_operation_snapshot_failed", { error: progressError }),
    );
    workerLog(
      cancelled ? "info" : "error",
      cancelled ? "refresh_server_cancelled" : "refresh_server_failed",
      {
        refresh_ref: hashObservationId(refreshRef),
        server_ref: serverRef,
        error,
      },
    );
    throw cancelled ? error : normalizeRefreshServerError(error);
  }
}

export async function refreshServerCatalogCache(
  serverId: string,
  options: { clearLocalBeforeFetch?: boolean } = {},
) {
  const refreshRef = hashObservationId(createObservationId());
  const ongoing = refreshInFlight.get(serverId);
  if (ongoing) {
    recordRefreshCoalesced();
    workerLog("info", "refresh_server_coalesced", {
      refresh_ref: hashObservationId(refreshRef),
      server_ref: hashObservationId(serverId),
    });
    return ongoing;
  }

  const job = executeServerCatalogRefresh(serverId, refreshRef, options);
  refreshInFlight.set(serverId, job);
  try {
    return await job;
  } finally {
    refreshInFlight.delete(serverId);
  }
}

function normalizeRefreshServerError(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (/<!doctype html|^<html[\s>]|bad gateway|502/i.test(message)) {
    return new Error(
      "Falha ao recarregar o cache do servidor. O servidor respondeu com erro 502 ou conteúdo inválido.",
    );
  }
  if (error instanceof Error) return error;
  return new Error("Falha ao recarregar o cache do servidor.");
}
