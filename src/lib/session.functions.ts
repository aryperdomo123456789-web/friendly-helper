import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
