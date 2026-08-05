import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Kind = "live" | "movie" | "series";

const kindSchema = z.enum(["live", "movie", "series"]);

async function resolveAccess(userId: string, serverId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, username, max_connections, expires_at, is_active")
    .eq("id", userId)
    .maybeSingle();
  const isOwner = !profile;
  if (profile) {
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
    .order("created_at")
    .limit(1);
  const credential = creds?.[0];
  if (!credential) throw new Error("Servidor sem credenciais cadastradas");

  return { credential, server, isOwner };
}

export const getMySession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("username, display_name, max_connections, expires_at, is_active")
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
    return { profile, isOwner, servers: servers ?? [] };
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
    if (profile.expires_at && new Date(profile.expires_at).getTime() < Date.now()) {
      throw new Error("Acesso expirado");
    }

    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
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

    return { ok: true, limit: profile.max_connections };
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
      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
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
    return {
      url: buildStreamUrl(credential, data.kind, data.stream_id, data.ext ?? undefined),
    };
  });
