import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAppConfig } from "./config.functions";

type Kind = "live" | "movie" | "series";

const kindSchema = z.enum(["live", "movie", "series"]);

async function resolveAccess(userId: string, serverId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

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
    if (!count) throw new Error("Servidor nao liberado para este acesso");
  }


  const { data: server } = await supabaseAdmin
    .from("iptv_servers")
    .select("id, name, is_active")
    .eq("id", serverId)
    .maybeSingle();
  if (!server || !server.is_active) throw new Error("Servidor indisponivel");

  const { data: creds } = await supabaseAdmin
    .from("server_credentials")
    .select("username, password, dns")
    .eq("server_id", serverId)
    .order("created_at");
  const first = creds?.[0];
  if (!first) throw new Error("Servidor sem credenciais cadastradas");
  // Failover: alguns DNS do servidor podem responder 404/offline.
  const credential = {
    ...first,
    dnsPool: (creds ?? []).map((c: any) => c.dns).filter(Boolean),
  };

  return { credential, server, isOwner };
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
    z.object({ device_id: z.string().min(6).max(80), user_agent: z.string().max(300).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("max_connections, is_active, expires_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (!profile) return { ok: true, limit: null as number | null };

    if (!profile.is_active) throw new Error("Acesso desativado");
    const expired = profile.expires_at && new Date(profile.expires_at).getTime() < Date.now();
    
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

    const known = (active ?? []).some((row: any) => row.device_id === data.device_id);
    if (!known && (active ?? []).length >= profile.max_connections) {
      throw new Error(
        `Limite de ${profile.max_connections} conexao(oes) simultanea(s) atingido neste acesso`,
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

export const getCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ server_id: z.string().uuid(), kind: kindSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { credential } = await resolveAccess(context.userId, data.server_id);
    const { xtreamCall } = await import("./xtream.server");
    const action: Record<Kind, string> = {
      live: "get_live_categories",
      movie: "get_vod_categories",
      series: "get_series_categories",
    };
    const result = await xtreamCall<Array<{ category_id: string; category_name: string }>>(
      credential,
      { action: action[data.kind] },
    );
    return Array.isArray(result) ? result : [];
  });

export const getStreams = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        server_id: z.string().uuid(),
        kind: kindSchema,
        category_id: z.string().max(40).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { credential } = await resolveAccess(context.userId, data.server_id);
    const { xtreamCall } = await import("./xtream.server");
    const action: Record<Kind, string> = {
      live: "get_live_streams",
      movie: "get_vod_streams",
      series: "get_series",
    };
    const result = await xtreamCall<
      Array<{
        num?: number;
        name: string;
        stream_id?: number;
        series_id?: number;
        stream_icon?: string;
        cover?: string;
        container_extension?: string;
        rating?: string;
        category_id?: string;
        epg_channel_id?: string;
      }>
    >(credential, { action: action[data.kind], category_id: data.category_id });
    if (!Array.isArray(result)) return [];
    return result.slice(0, 4000).map((item) => ({
      id: String(item.stream_id ?? item.series_id ?? ""),
      name: item.name,
      icon: item.stream_icon || item.cover || null,
      ext: item.container_extension ?? null,
      rating: item.rating ?? null,
      category_id: item.category_id ?? null,
    }));
  });

export const getSeriesInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ server_id: z.string().uuid(), series_id: z.string().max(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { credential } = await resolveAccess(context.userId, data.server_id);
    const { xtreamCall } = await import("./xtream.server");
    const result = await xtreamCall<{
      info?: { name?: string; plot?: string; cover?: string; genre?: string; releaseDate?: string };
      episodes?: Record<
        string,
        Array<{ id: string; title: string; episode_num: number; container_extension?: string }>
      >;
    }>(credential, { action: "get_series_info", series_id: data.series_id });
    return {
      info: result.info ?? {},
      seasons: Object.entries(result.episodes ?? {}).map(([season, episodes]) => ({
        season,
        episodes: (episodes ?? []).map((episode) => ({
          id: String(episode.id),
          title: episode.title,
          episode_num: episode.episode_num,
          ext: episode.container_extension ?? "mp4",
        })),
      })),
    };
  });

export const getVodInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ server_id: z.string().uuid(), vod_id: z.string().max(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { credential } = await resolveAccess(context.userId, data.server_id);
    const { xtreamCall } = await import("./xtream.server");
    const result = await xtreamCall<{
      info?: { plot?: string; movie_image?: string; genre?: string; releasedate?: string; duration?: string; rating?: string };
      movie_data?: { name?: string; container_extension?: string };
    }>(credential, { action: "get_vod_info", vod_id: data.vod_id });
    return {
      info: result.info ?? {},
      name: result.movie_data?.name ?? "",
      ext: result.movie_data?.container_extension ?? "mp4",
    };
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
      const known = (active ?? []).some((row: any) => row.device_id === data.device_id);
      if (!known && (active ?? []).length >= profile.max_connections) {
        throw new Error(`Limite de ${profile.max_connections} conexao(oes) simultanea(s) atingido`);
      }
      await supabaseAdmin.from("device_sessions").upsert(
        {
          user_id: context.userId,
          device_id: data.device_id,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "user_id,device_id" },
      );
    }

    const { buildStreamUrl } = await import("./xtream.server");
    const { signStreamUrl } = await import("./stream-proxy.server");
    const direct = buildStreamUrl(credential, data.kind, data.stream_id, data.ext ?? undefined);
    const playbackTtlSeconds = 24 * 60 * 60;
    // Proxied through our own origin: the panels only serve plain HTTP and the
    // browser refuses mixed content on an HTTPS page.
    const proxied = await signStreamUrl(direct, { subject: context.userId, ttlSeconds: playbackTtlSeconds });
    const isHls = direct.endsWith(".m3u8") || direct.includes("m3u8");
    // For live channels, force HLS mode if the URL structure suggests it
    const forceHls = data.kind === "live" && !direct.includes("ext=ts");
    return { url: (isHls || forceHls) ? `${proxied}&hls=1` : proxied };
  });

export const getChannelEPG = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ server_id: z.string().uuid(), stream_id: z.string().max(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { credential } = await resolveAccess(context.userId, data.server_id);
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
      return result.epg_listings.map((item) => ({
        title: decode(item.title),
        description: decode(item.description),
        start: item.start,
        end: item.end,
        start_timestamp: item.start_timestamp,
        stop_timestamp: item.stop_timestamp,
      }));
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
        console.error("Erro no EPG Inteligente:", e);
      }
    }

    return [];
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
    console.error("TMDB Fetch Error:", e);
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
