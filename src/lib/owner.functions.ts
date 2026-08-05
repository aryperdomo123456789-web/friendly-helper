import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const SYNTHETIC_EMAIL_DOMAIN = "iptv.local";

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

const credentialSchema = z.object({
  username: z.string().trim().min(1).max(120),
  password: z.string().trim().min(1).max(200),
  dns: z.string().trim().min(4).max(300),
});

const serverSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(999).default(0),
  credentials: z.array(credentialSchema).min(1).max(6),
});

const accessUserSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9._-]+$/, "Use apenas letras, numeros, ponto, hifen ou underline"),
  password: z.string().min(6).max(72),
  max_connections: z.number().int().min(1).max(20),
  expires_at: z.string().datetime().nullable().optional(),
  display_name: z.string().trim().max(120).optional(),
  server_ids: z.array(z.string().uuid()).min(1),
});

async function assertOwner(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Acesso restrito ao dono do sistema");
}

/* ------------------------------ Servidores ------------------------------ */

export const listServers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: servers, error } = await supabaseAdmin
      .from("iptv_servers")
      .select("id, name, url, is_active, sort_order, created_at")
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    const { data: creds } = await supabaseAdmin
      .from("server_credentials")
      .select("id, server_id, username, password, dns, created_at")
      .order("created_at");
    return (servers ?? []).map((server) => ({
      ...server,
      credentials: (creds ?? []).filter((credential: any) => credential.server_id === server.id),
    }));
  });

export const saveServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => serverSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let serverId = data.id;
    if (serverId) {
      const { error } = await supabaseAdmin
        .from("iptv_servers")
        .update({
          name: data.name,
          url: data.credentials[0]!.dns,
          is_active: data.is_active,
          sort_order: data.sort_order,
        })
        .eq("id", serverId);
      if (error) throw error;
      await supabaseAdmin.from("server_credentials").delete().eq("server_id", serverId);
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("iptv_servers")
        .insert({
          name: data.name,
          url: data.credentials[0]!.dns,
          is_active: data.is_active,
          sort_order: data.sort_order,
          created_by: context.userId,
        })
        .select("id")
        .single();
      if (error) throw error;
      serverId = created.id;
    }

    const { error: credError } = await supabaseAdmin.from("server_credentials").insert(
      data.credentials.map((credential) => ({
        server_id: serverId!,
        username: credential.username,
        password: credential.password,
        dns: credential.dns,
      })),
    );
    if (credError) throw credError;
    return { id: serverId };
  });

export const deleteServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("iptv_servers").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const testServerConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => credentialSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { testCredentials } = await import("./xtream.server");
    return testCredentials(data);
  });

/* -------------------------------- Acessos ------------------------------- */

export const listAccessUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, max_connections, expires_at, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const [{ data: access }, { data: devices }] = await Promise.all([
      supabaseAdmin.from("user_server_access").select("user_id, server_id"),
      supabaseAdmin.from("device_sessions").select("user_id, device_id, last_seen"),
    ]);
    const cutoff = Date.now() - 5 * 60 * 1000;
    return (profiles ?? []).map((profile) => ({
      ...profile,
      server_ids: (access ?? [])
        .filter((row: any) => row.user_id === profile.id)
        .map((row: any) => row.server_id),
      online: (devices ?? []).filter(
        (row: any) => row.user_id === profile.id && new Date(row.last_seen).getTime() > cutoff,
      ).length,
    }));
  });

export const createAccessUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => accessUserSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: usernameToEmail(data.username),
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar acesso");
    const newUserId = created.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: newUserId,
      username: data.username,
      display_name: data.display_name ?? data.username,
      max_connections: data.max_connections,
      expires_at: data.expires_at ?? null,
      created_by: context.userId,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw profileError;
    }

    await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role: "user" });
    await supabaseAdmin
      .from("user_server_access")
      .insert(data.server_ids.map((serverId) => ({ user_id: newUserId, server_id: serverId })));

    return { id: newUserId };
  });

export const updateAccessUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        password: z.string().min(6).max(72).optional().or(z.literal("")),
        max_connections: z.number().int().min(1).max(20),
        expires_at: z.string().datetime().nullable().optional(),
        is_active: z.boolean(),
        display_name: z.string().trim().max(120).optional(),
        server_ids: z.array(z.string().uuid()).min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        max_connections: data.max_connections,
        expires_at: data.expires_at ?? null,
        is_active: data.is_active,
        display_name: data.display_name ?? null,
      })
      .eq("id", data.id);
    if (error) throw error;

    if (data.password) {
      const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
        password: data.password,
      });
      if (passError) throw passError;
    }

    await supabaseAdmin.from("user_server_access").delete().eq("user_id", data.id);
    await supabaseAdmin
      .from("user_server_access")
      .insert(data.server_ids.map((serverId) => ({ user_id: data.id, server_id: serverId })));

    if (!data.is_active) {
      await supabaseAdmin.from("device_sessions").delete().eq("user_id", data.id);
    }
    return { ok: true };
  });

export const deleteAccessUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw error;
    return { ok: true };
  });

export const kickDevices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("device_sessions").delete().eq("user_id", data.id);
    return { ok: true };
  });
