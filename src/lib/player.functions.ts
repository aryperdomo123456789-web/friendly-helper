import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { kindSchema } from "./types";
import { resolveAccess, checkConcurrentConnections } from "./server/access.server";

export const getCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ server_id: z.string().uuid(), kind: kindSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { credential } = await resolveAccess(context.userId, data.server_id);
    const { xtreamCall } = await import("./xtream.server");
    const action: Record<string, string> = {
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
    const action: Record<string, string> = {
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
    
    await checkConcurrentConnections(supabaseAdmin, context.userId, data.device_id);

    const { buildStreamUrl } = await import("./xtream.server");
    const { signStreamUrl } = await import("./stream-proxy.server");
    const direct = buildStreamUrl(credential, data.kind, data.stream_id, data.ext ?? undefined);
    const proxied = await signStreamUrl(direct, { subject: context.userId, ttlSeconds: 6 * 60 * 60 });
    const isHls = direct.endsWith(".m3u8");
    return { url: isHls ? `${proxied}&hls=1` : proxied };
  });
