import { IPTVKind } from "../types";

export async function resolveAccess(userId: string, serverId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, username, max_connections, expires_at, is_active")
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
  ]);

  const isOwner = !profile || !!roles?.some((r) => r.role === "owner" || r.role === "admin");

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
    .order("created_at")
    .limit(1);

  const credential = creds?.[0];
  if (!credential) throw new Error("Servidor sem credenciais cadastradas");

  return { credential, server, isOwner };
}

export async function checkConcurrentConnections(supabaseAdmin: any, userId: string, deviceId: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("max_connections")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return;

  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from("device_sessions")
    .delete()
    .eq("user_id", userId)
    .lt("last_seen", cutoff);

  const { data: active } = await supabaseAdmin
    .from("device_sessions")
    .select("device_id")
    .eq("user_id", userId);

  const known = (active ?? []).some((row: any) => row.device_id === deviceId);
  if (!known && (active ?? []).length >= profile.max_connections) {
    throw new Error(`Limite de ${profile.max_connections} conexao(oes) simultanea(s) atingido`);
  }

  await supabaseAdmin.from("device_sessions").upsert(
    {
      user_id: userId,
      device_id: deviceId,
      last_seen: new Date().toISOString(),
    },
    { onConflict: "user_id,device_id" },
  );
}
