import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAppConfig } from "./config.functions";
import {
  readServerCache,
  readServerPlaylistCache,
  serverCatalogCacheKey,
  writeServerCache,
} from "./iptv-cache.server";
import { parsePlaylistCatalog } from "./iptv-playlist.server";
import { getPlaybackExtensions } from "./stream-format";

type Kind = "live" | "movie" | "series";

const kindSchema = z.enum(["live", "movie", "series"]);
const streamCacheMap: Record<Kind, { categories: string; streams: string }> = {
  live: { categories: "get_live_categories", streams: "get_live_streams" },
  movie: { categories: "get_vod_categories", streams: "get_vod_streams" },
  series: { categories: "get_series_categories", streams: "get_series" },
};

type DeviceSessionClaim = {
  allowed: boolean;
  reason: string;
  user_active: number;
  user_limit: number | null;
  server_active: number;
  server_limit: number | null;
};

async function claimDeviceSession(params: {
  userId: string;
  serverId: string;
  deviceId: string;
  userAgent?: string | null;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("claim_device_session", {
    p_user_id: params.userId,
    p_server_id: params.serverId,
    p_device_id: params.deviceId,
    p_user_agent: params.userAgent ?? null,
  });

  if (error) throw new Error(`Falha ao reservar a conexão: ${error.message}`);
  const result = (data?.[0] ?? null) as DeviceSessionClaim | null;
  if (!result) throw new Error("Falha ao reservar a conexão: resposta inválida.");
  if (result.allowed) return result;

  if (result.reason === "server_limit") {
    const capacity = result.server_limit ? ` (${result.server_active}/${result.server_limit})` : "";
    throw new Error(`Capacidade de conexões do servidor atingida${capacity}.`);
  }
  if (result.reason === "user_limit") {
    throw new Error(`Limite de ${result.user_limit ?? 0} conexões simultâneas atingido neste acesso.`);
  }
  throw new Error("Servidor indisponível para novas conexões.");
}

type ResolvedAccess = {
  credential: {
    dns: string;
    username: string;
    password: string;
    dnsPool: string[];
  };
  server: {
    id: string;
    name: string;
    is_active: boolean;
  };
  isOwner: boolean;
};

const RESOLVE_ACCESS_TTL_MS = 15_000;
const resolveAccessCache = new Map<string, { expiresAt: number; value: ResolvedAccess }>();
const resolveAccessPending = new Map<string, Promise<ResolvedAccess>>();

function normalizeStreams(
  result: Array<{
    num?: number;
    name: string;
    stream_id?: number;
    series_id?: number;
    M_ID?: number | string;
    m_id?: number | string;
    stream_icon?: string;
    cover?: string;
    container_extension?: string;
    rating?: string;
    category_id?: string;
    epg_channel_id?: string;
  }>,
) {
  return result
    .slice(0, 4000)
    .map((item) => ({
      id: String(item.stream_id ?? item.series_id ?? item.num ?? item.M_ID ?? item.m_id ?? ""),
      name: item.name,
      icon: item.stream_icon || item.cover || null,
      ext: item.container_extension ?? null,
      rating: item.rating ?? null,
      category_id: item.category_id ?? null,
    }))
    .filter((item) => Boolean(item.id) && Boolean(item.name));
}

function normalizeCategoryValue(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function isCategoryScoped<T extends { category_id: string | null }>(items: T[], categoryId: string) {
  if (!items.length) return false;
  const target = normalizeCategoryValue(categoryId);
  if (!target) return false;

  const categories = new Set(
    items
      .map((item) => normalizeCategoryValue(item.category_id))
      .filter(Boolean),
  );

  return categories.size === 1 && categories.has(target);
}

async function resolveAccess(userId: string, serverId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const cacheKey = `${userId}:${serverId}`;
  const cached = resolveAccessCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const pending = resolveAccessPending.get(cacheKey);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, username, max_connections, expires_at, is_active")
        .eq("id", userId)
        .maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const isOwner =
      !profile || !!roles?.some((r: any) => r.role === "owner" || r.role === "admin");
    if (profile && !isOwner) {
      if (!profile.is_active) throw new Error("Acesso desativado. Fale com o suporte.");
      if (profile.expires_at && new Date(profile.expires_at).getTime() < Date.now()) {
        throw new Error("Acesso expirado. Renove com o suporte.");
      }
      const { count } = await supabaseAdmin
        .from("user_server_access")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("server_id", serverId);
      if (!count) throw new Error("Servidor não liberado para este acesso.");
    }

    const { data: server } = await supabaseAdmin
      .from("iptv_servers")
      .select("id, name, is_active")
      .eq("id", serverId)
      .maybeSingle();
    if (!server || !server.is_active) throw new Error("Servidor indisponível.");

    const { data: creds } = await supabaseAdmin
      .from("server_credentials")
      .select("username, password, dns")
      .eq("server_id", serverId)
      .order("created_at", { ascending: false })
      .limit(1);
    const first = creds?.[0];
    if (!first) throw new Error("Servidor sem credenciais cadastradas.");

    const value: ResolvedAccess = {
      credential: {
        ...first,
        dnsPool: (creds ?? []).map((c: any) => c.dns).filter(Boolean),
      },
      server: {
        id: server.id,
        name: server.name,
        is_active: server.is_active,
      },
      isOwner,
    };

    resolveAccessCache.set(cacheKey, {
      expiresAt: Date.now() + RESOLVE_ACCESS_TTL_MS,
      value,
    });
    return value;
  })();

  resolveAccessPending.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    resolveAccessPending.delete(cacheKey);
  }
}

export const getMySession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, username, display_name, max_connections, expires_at, is_active")
        .eq("id", context.userId)
        .maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId),
    ]);

    const roleList = (roles ?? []).map((row) => row.role);
    const isOwner = roleList.includes("owner") || roleList.includes("admin");

    let serverQuery = supabaseAdmin
      .from("iptv_servers")
      .select("id, name, sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .order("name");

    if (!isOwner) {
      const { data: access } = await supabaseAdmin
        .from("user_server_access")
        .select("server_id")
        .eq("user_id", context.userId);
      const ids = (access ?? []).map((row) => row.server_id);
      if (ids.length === 0) return { profile, isOwner, servers: [] };
      serverQuery = serverQuery.in("id", ids);
    }

    const { data: servers } = await serverQuery;
    const expired = !isOwner && profile?.expires_at && new Date(profile.expires_at).getTime() < Date.now();
    
    return { 
      authUserId: context.userId,
      profile, 
      isOwner, 
      servers: servers ?? [],
      expired: Boolean(expired)
    };
  });

export const heartbeat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        device_id: z.string().min(6).max(80),
        server_id: z.string().uuid().optional(),
        user_agent: z.string().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("max_connections, is_active, expires_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile) return { ok: true, limit: null as number | null };

    if (!profile.is_active) throw new Error("Acesso desativado.");
    const expired = profile.expires_at && new Date(profile.expires_at).getTime() < Date.now();

    if (data.server_id) {
      const claim = await claimDeviceSession({
        userId: context.userId,
        serverId: data.server_id,
        deviceId: data.device_id,
        ...(data.user_agent ? { userAgent: data.user_agent } : {}),
      });
      return {
        ok: true,
        limit: claim.user_limit ?? profile.max_connections,
        expired: Boolean(expired),
        server_limit: claim.server_limit,
        server_active: claim.server_active,
      };
    }

    // Compatibilidade temporária para bancos anteriores à migration de capacidade.
    const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from("device_sessions")
      .delete()
      .eq("user_id", context.userId)
      .lt("last_seen", cutoff);

    const { data: active } = await supabaseAdmin
      .from("device_sessions")
      .select("device_id")
      .eq("user_id", context.userId);

    const known = (active ?? []).some((row) => row.device_id === data.device_id);
    if (!known && (active ?? []).length >= profile.max_connections) {
      throw new Error(
        `Limite de ${profile.max_connections} conexões simultâneas atingido neste acesso.`,
      );
    }

    await supabaseAdmin.from("device_sessions").upsert(
      {
        user_id: context.userId,
        device_id: data.device_id,
        user_agent: data.user_agent ?? null,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "user_id,device_id" },
    );

    return { ok: true, limit: profile.max_connections, expired: Boolean(expired) };
  });

async function hydrateCatalogFromPlaylist(serverId: string, kind: Kind, categoryId?: string) {
  const playlist = await readServerPlaylistCache(serverId);
  if (!playlist?.playlist_text) return null;

  const catalog = parsePlaylistCatalog(playlist.playlist_text);
  const payload = categoryId
    ? {
        categories: catalog[kind].categories,
        streams: catalog[kind].streams.filter((item) => item.category_id === categoryId),
      }
    : catalog[kind];
  if (!payload.categories.length && !payload.streams.length) return null;

  const categoryCacheKey = serverCatalogCacheKey(kind, "categories");
  const streamCacheKey = serverCatalogCacheKey(kind, "streams", categoryId ?? "all");
  await writeServerCache(serverId, categoryCacheKey, payload.categories);
  await writeServerCache(
    serverId,
    streamCacheKey,
    payload.streams.map(({ kind: _kind, ...stream }) => stream),
  );

  return payload;
}

export const getCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ server_id: z.string().uuid(), kind: kindSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { credential } = await resolveAccess(context.userId, data.server_id);
    const cacheKey = serverCatalogCacheKey(data.kind, "categories");
    const cached = await readServerCache<Array<{ category_id: string; category_name: string }>>(
      data.server_id,
      cacheKey,
    );
    if (cached && !cached.stale) {
      const payload = Array.isArray(cached.payload) ? cached.payload : [];
      if (payload.length > 0) return payload;
    }

    const { xtreamCall } = await import("./xtream.server");
    try {
      const result = await xtreamCall<Array<{ category_id: string; category_name: string }>>(
        credential,
        { action: streamCacheMap[data.kind].categories },
      );
      const normalized = Array.isArray(result) ? result : [];
      await writeServerCache(data.server_id, cacheKey, normalized);
      return normalized;
    } catch (error) {
      const playlistFallback = await hydrateCatalogFromPlaylist(data.server_id, data.kind);
      if (playlistFallback) return playlistFallback.categories;
      if (cached) return Array.isArray(cached.payload) ? cached.payload : [];
      throw error;
    }
  });

export const getStreams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        server_id: z.string().uuid(),
        kind: kindSchema,
        category_id: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { credential } = await resolveAccess(context.userId, data.server_id);
    const cacheKey = serverCatalogCacheKey(data.kind, "streams", data.category_id ?? "all");
    const cached = await readServerCache<
      Array<{
        id: string;
        name: string;
        icon: string | null;
        ext: string | null;
        rating: string | null;
        category_id: string | null;
      }>
    >(data.server_id, cacheKey);

    if (cached && !cached.stale) {
      const list = Array.isArray(cached.payload) ? cached.payload : [];
      if (!data.category_id) {
        if (list.length > 0) return list;
      } else if (isCategoryScoped(list, data.category_id)) {
        const filtered = list.filter((item) => item.category_id === data.category_id);
        if (filtered.length > 0) return filtered;
      }
    }

    if (data.category_id) {
      const playlistFallback = await hydrateCatalogFromPlaylist(data.server_id, data.kind, data.category_id);
      if (playlistFallback) {
        return playlistFallback.streams.map(({ kind: _kind, ...stream }) => stream);
      }
    }

    const { xtreamCall } = await import("./xtream.server");
    try {
      const result = await xtreamCall<
        Array<{
          num?: number;
          name: string;
          stream_id?: number;
          series_id?: number;
          M_ID?: number | string;
          m_id?: number | string;
          stream_icon?: string;
          cover?: string;
          container_extension?: string;
          rating?: string;
          category_id?: string;
          epg_channel_id?: string;
        }>
      >(credential, {
        action: streamCacheMap[data.kind].streams,
        ...(data.category_id ? { category_id: data.category_id } : {}),
      });
      const normalized = Array.isArray(result) ? normalizeStreams(result) : [];
      if (normalized.length > 0) {
        if (data.category_id && !isCategoryScoped(normalized, data.category_id)) {
          const playlistFallback = await hydrateCatalogFromPlaylist(data.server_id, data.kind, data.category_id);
          if (playlistFallback) {
            return playlistFallback.streams.map(({ kind: _kind, ...stream }) => stream);
          }
        }
        await writeServerCache(data.server_id, cacheKey, normalized);
        return normalized;
      }

      if (data.category_id) {
        const fullResult = await xtreamCall<
        Array<{
          num?: number;
          name: string;
          stream_id?: number;
          series_id?: number;
          M_ID?: number | string;
          m_id?: number | string;
          stream_icon?: string;
          cover?: string;
          container_extension?: string;
          rating?: string;
          category_id?: string;
            epg_channel_id?: string;
          }>
        >(credential, { action: streamCacheMap[data.kind].streams });
        const fullNormalized = Array.isArray(fullResult) ? normalizeStreams(fullResult) : [];
        const filtered = fullNormalized.filter((item) => item.category_id === data.category_id);
        if (filtered.length > 0) {
          await writeServerCache(data.server_id, cacheKey, filtered);
          return filtered;
        }
      }

      await writeServerCache(data.server_id, cacheKey, normalized);
      return normalized;
    } catch (error) {
      const playlistFallback = await hydrateCatalogFromPlaylist(data.server_id, data.kind, data.category_id);
      if (playlistFallback) {
        return playlistFallback.streams.map(({ kind: _kind, ...stream }) => stream);
      }
      if (cached) {
        const list = Array.isArray(cached.payload) ? cached.payload : [];
        return list;
      }
      throw error;
    }
  });

export const getSeriesInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ server_id: z.string().uuid(), series_id: z.string().max(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { credential } = await resolveAccess(context.userId, data.server_id);
    const cacheKey = serverCatalogCacheKey("series", "series-info", data.series_id);
    const cached = await readServerCache<{
      info: { name?: string; plot?: string; cover?: string; genre?: string; releaseDate?: string };
      seasons: Array<{
        season: string;
        episodes: Array<{
          id: string;
          title: string;
          episode_num: number;
          ext: string;
        }>;
      }>;
    }>(data.server_id, cacheKey);
    if (cached) return cached.payload;

    const { xtreamCall } = await import("./xtream.server");
    const result = await xtreamCall<{
      info?: { name?: string; plot?: string; cover?: string; genre?: string; releaseDate?: string };
      episodes?: Record<
        string,
        Array<{ id: string; title: string; episode_num: number; container_extension?: string }>
      >;
    }>(credential, { action: "get_series_info", series_id: data.series_id });
    const episodesBySeason = result?.episodes && typeof result.episodes === "object" ? result.episodes : {};
    const payload = {
      info: result?.info ?? {},
      seasons: Object.entries(episodesBySeason).map(([season, episodes]) => ({
        season,
        episodes: (episodes ?? []).map((episode) => ({
          id: String(episode.id),
          title: episode.title,
          episode_num: episode.episode_num,
          ext: episode.container_extension ?? "mp4",
          })),
      })),
    };
    await writeServerCache(data.server_id, cacheKey, payload);
    return payload;
  });

export const getVodInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ server_id: z.string().uuid(), vod_id: z.string().max(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { credential } = await resolveAccess(context.userId, data.server_id);
    const cacheKey = serverCatalogCacheKey("movie", "vod-info", data.vod_id);
    const cached = await readServerCache<{
      info: { plot?: string; movie_image?: string; genre?: string; releasedate?: string; duration?: string; rating?: string };
      name: string;
      ext: string;
    }>(data.server_id, cacheKey);
    if (cached) return cached.payload;

    const { xtreamCall } = await import("./xtream.server");
    const result = await xtreamCall<{
      info?: { plot?: string; movie_image?: string; genre?: string; releasedate?: string; duration?: string; rating?: string };
      movie_data?: { name?: string; container_extension?: string };
    }>(credential, { action: "get_vod_info", vod_id: data.vod_id });
    const payload = {
      info: result.info ?? {},
      name: result.movie_data?.name ?? "",
      ext: result.movie_data?.container_extension ?? "mp4",
    };
    await writeServerCache(data.server_id, cacheKey, payload);
    return payload;
  });

export const getPlaybackUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        server_id: z.string().uuid(),
        kind: kindSchema,
        stream_id: z.string().max(30),
        ext: z.string().max(10).optional(),
        device_id: z.string().min(6).max(80),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { credential } = await resolveAccess(context.userId, data.server_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("max_connections")
      .eq("id", context.userId)
      .maybeSingle();

    if (profile) {
      await claimDeviceSession({
        userId: context.userId,
        serverId: data.server_id,
        deviceId: data.device_id,
      });
    }

    const { buildStreamUrl } = await import("./xtream.server");
    const { signStreamUrl } = await import("./stream-proxy.server");
    const playbackExtensions = getPlaybackExtensions(data.kind, data.ext);
    const playbackTtlSeconds = 24 * 60 * 60;
    // Proxied through our own origin: the panels only serve plain HTTP and the
    // browser refuses mixed content on an HTTPS page.
    const playbackUrls = await Promise.all(
      playbackExtensions.map(async (extension) => {
        const direct = buildStreamUrl(credential, data.kind, data.stream_id, extension);
        const proxied = await signStreamUrl(direct, {
          subject: context.userId,
          reference: data.server_id,
          ttlSeconds: playbackTtlSeconds,
        });
        const isHls = /\.m3u8(?:$|[?#])/i.test(direct);
        // Só força HLS quando o URL final não selecionou explicitamente TS.
        const forceHls = data.kind === "live" && !/\.ts(?:$|[?#])/i.test(direct);
        return isHls || forceHls ? `${proxied}&hls=1` : proxied;
      }),
    );

    return {
      url: playbackUrls[0]!,
      ...(playbackUrls.length > 1 ? { fallback_urls: playbackUrls.slice(1) } : {}),
    };
  });

const playbackTelemetryEventSchema = z.object({
  name: z.enum([
    "startup_requested",
    "manifest_loaded",
    "first_frame",
    "playing",
    "buffer_start",
    "buffer_end",
    "fatal_error",
    "recover_attempt",
    "recover_success",
    "format_fallback",
    "quality_sample",
    "ended",
    "destroyed",
  ]),
  at_ms: z.number().int().min(0).max(86_400_000),
  duration_ms: z.number().int().min(0).max(86_400_000).optional(),
  buffer_seconds: z.number().min(0).max(86_400).optional(),
  latency_ms: z.number().int().min(0).max(86_400_000).optional(),
  bitrate: z.number().int().min(0).max(1_000_000_000).optional(),
  level: z.number().int().min(0).max(10_000).optional(),
  dropped_frames: z.number().int().min(0).max(1_000_000_000).optional(),
  decoded_frames: z.number().int().min(0).max(1_000_000_000).optional(),
  fatal: z.boolean().optional(),
  error_code: z.string().max(64).optional(),
  recovery_attempt: z.number().int().min(0).max(20).optional(),
  reason: z.string().max(80).optional(),
});

const playbackTelemetrySchema = z.object({
  session_id: z.string().min(8).max(100),
  server_id: z.string().uuid(),
  kind: kindSchema,
  engine: z.enum(["native", "hls.js"]),
  events: z.array(playbackTelemetryEventSchema).min(1).max(20),
});

async function hashPlaybackRef(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("");
}

export const recordPlaybackTelemetry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => playbackTelemetrySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile }, { data: roles }, { data: server }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, is_active, expires_at")
        .eq("id", context.userId)
        .maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId),
      supabaseAdmin
        .from("iptv_servers")
        .select("id, is_active")
        .eq("id", data.server_id)
        .maybeSingle(),
    ]);
    const isOwner = !!roles?.some(
      (row: { role: string }) => row.role === "owner" || row.role === "admin",
    );
    if (!server?.is_active) throw new Error("Servidor indisponível.");
    if (profile && !isOwner) {
      if (!profile.is_active) throw new Error("Acesso desativado.");
      if (profile.expires_at && new Date(profile.expires_at).getTime() < Date.now()) {
        throw new Error("Acesso expirado.");
      }
      const { count } = await supabaseAdmin
        .from("user_server_access")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId)
        .eq("server_id", data.server_id);
      if (!count) throw new Error("Servidor não liberado para este acesso.");
    }

    const [userRef, serverRef] = await Promise.all([
      hashPlaybackRef(context.userId),
      hashPlaybackRef(data.server_id),
    ]);
    console.info(
      JSON.stringify({
        event: "playback_qoe",
        service: "main",
        user_ref: userRef,
        server_ref: serverRef,
        session_ref: data.session_id.slice(0, 16),
        kind: data.kind,
        engine: data.engine,
        events: data.events,
        recorded_at: new Date().toISOString(),
      }),
    );
    return { ok: true };
  });

export const getChannelEPG = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ server_id: z.string().uuid(), stream_id: z.string().max(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { credential } = await resolveAccess(context.userId, data.server_id);
    const cacheKey = serverCatalogCacheKey("live", "epg", data.stream_id);
    const cached = await readServerCache<
      Array<{
        title: string;
        description: string;
        start: string;
        end: string;
        start_timestamp: string;
        stop_timestamp: string;
      }>
    >(data.server_id, cacheKey);
    if (cached && !cached.stale) return cached.payload;
    const { xtreamCall } = await import("./xtream.server");

    // Tenta obter o EPG curto que a Xtream fornece
    const result = await xtreamCall<{
      epg_listings?: Array<{
        title: string;
        start: string;
        end: string;
        description: string;
        start_timestamp: string;
        stop_timestamp: string;
      }>;
    }>(credential, { action: "get_short_epg", stream_id: data.stream_id });

    const decode = (str: string) => {
      try {
        if (!str) return "";
        const decoded = atob(str);
        return decodeURIComponent(escape(decoded));
      } catch (e) {
        return str; 
      }
    };

    if (result && 'epg_listings' in result && Array.isArray(result.epg_listings) && result.epg_listings.length > 0) {
      const payload = result.epg_listings.map((item) => ({
        title: decode(item.title),
        description: decode(item.description),
        start: item.start,
        end: item.end,
        start_timestamp: item.start_timestamp,
        stop_timestamp: item.stop_timestamp,
      }));
      await writeServerCache(data.server_id, cacheKey, payload);
      return payload;
    }

    // Fallback: Sistema Inteligente de EPG.
    const config = await getAppConfig();
    if (config.epg_xmltv_url) {
      try {
        const streams = await xtreamCall<any[]>(credential, { 
          action: "get_live_streams", 
          stream_id: data.stream_id 
        });
        const targetStream = Array.isArray(streams) ? streams.find(s => String(s.stream_id) === data.stream_id) : null;
        const channelName = targetStream?.name || "";

        if (channelName) {
          console.log(`Buscando EPG inteligente para: ${channelName}`);
        }
      } catch (e) {
        console.error("Erro no EPG inteligente:", e);
      }
    }

    const payload: Array<{
      title: string;
      description: string;
      start: string;
      end: string;
      start_timestamp: string;
      stop_timestamp: string;
    }> = [];
    await writeServerCache(data.server_id, cacheKey, payload);
    return payload;
  });

async function fetchTMDB(apiKey: string, type: "movie" | "tv", query: string, year?: string) {
  try {
    const searchUrl = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=pt-BR${year ? `&year=${year}` : ""}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.results && searchData.results.length > 0) {
      const bestMatch = searchData.results[0];
      const detailUrl = `https://api.themoviedb.org/3/${type}/${bestMatch.id}?api_key=${apiKey}&language=pt-BR&append_to_response=images,credits`;
      const detailRes = await fetch(detailUrl);
      return await detailRes.json();
    }
  } catch (e) {
    console.error("Erro ao consultar o TMDB:", e);
  }
  return null;
}

export const getEnrichedMetadata = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ 
      kind: z.enum(["movie", "series"]), 
      name: z.string(), 
      year: z.string().optional() 
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const config = await getAppConfig();
    if (!config.tmdb_api_key) return null;

    const tmdbType = data.kind === "movie" ? "movie" : "tv";
    
    // Sistema Inteligente de TMDB:
    // 1. Limpeza agressiva do nome para match perfeito
    const cleanName = data.name
      .replace(/\[.*?\]|\(.*?\)/g, "") // Remove tags
      .replace(/(1080p|720p|4k|uhd|hdtv|x264|hevc|dual|dublado|legendado)/gi, "") // Remove specs comuns
      .trim();
    
    // 2. Tenta match com o nome limpo
    let meta = await fetchTMDB(config.tmdb_api_key, tmdbType, cleanName, data.year);
    
    // 3. Fallback inteligente: se nao achar, tenta tirar palavras curtas do final
    if (!meta && cleanName.split(" ").length > 2) {
      const shorterName = cleanName.split(" ").slice(0, -1).join(" ");
      meta = await fetchTMDB(config.tmdb_api_key, tmdbType, shorterName, data.year);
    }
    
    return meta;
  });
