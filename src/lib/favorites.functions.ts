import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const serverIdSchema = z.string().uuid();
const favoriteInputSchema = z.object({
  server_id: serverIdSchema,
  channel_id: z.string().trim().min(1).max(500),
});

function sanitizedFavoriteError(error: unknown): Error {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";

  if (code === "42501") return new Error("Você não tem acesso a este servidor.");
  if (code === "22023") return new Error("Dados de favorito inválidos.");
  return new Error("Não foi possível atualizar os favoritos agora.");
}

async function assertActiveServerAccess(supabase: any, userId: string, serverId: string) {
  const { data, error } = await supabase
    .from("user_server_access")
    .select("server_id, iptv_servers!inner(id, is_active)")
    .eq("user_id", userId)
    .eq("server_id", serverId)
    .eq("iptv_servers.is_active", true)
    .maybeSingle();

  if (error) throw new Error("Não foi possível validar o acesso ao servidor.");
  if (!data) throw new Error("Você não tem acesso a este servidor.");
}

export const toggleUserChannelFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => favoriteInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertActiveServerAccess(context.supabase, context.userId, data.server_id);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await (supabaseAdmin as any).rpc(
      "toggle_user_channel_favorite",
      {
        p_user_id: context.userId,
        p_server_id: data.server_id,
        p_channel_id: data.channel_id,
      },
    );

    if (error) throw sanitizedFavoriteError(error);
    return result as {
      favorited: boolean;
      channel_id: string;
      sort_order?: number;
    };
  });

export const getUserChannelFavorites = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => serverIdSchema.parse(input))
  .handler(async ({ data: serverId, context }) => {
    await assertActiveServerAccess(context.supabase, context.userId, serverId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("user_channel_favorites")
      .select("channel_id, sort_order, created_at")
      .eq("user_id", context.userId)
      .eq("server_id", serverId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw sanitizedFavoriteError(error);
    return (rows ?? []).map((row: { channel_id: string }) => row.channel_id);
  });
