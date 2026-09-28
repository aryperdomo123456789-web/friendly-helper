import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureUserReferralCode, generateUniqueReferralCode, isReferralEligiblePlan } from "./referral-code";
import { clearServerCache, clearServerPlaylistCache, refreshServerCatalogCache } from "./iptv-cache.server";
import { clearLocalImageCache } from "./server-media-cache.server";

export const SYNTHETIC_EMAIL_DOMAIN = "iptv.local";

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

const credentialSchema = z.object({
  username: z.string().trim().max(120).default(""),
  password: z.string().trim().max(200).default(""),
  dns: z.string().trim().max(300).default(""),
});

const serverSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(999).default(0),
  credentials: z.array(credentialSchema).max(6).default([]),
  bulk_action: z.enum(["none", "add_to_all", "remove_from_all"]).optional().default("none"),
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
  plan_id: z.string().uuid().nullable().optional(),
});

const accessUsersPageSchema = z.object({
  search: z.string().trim().max(120).default(""),
  status: z.enum(["all", "active", "blocked", "expired", "online"]).default("all"),
  server_id: z.string().uuid().nullable().optional(),
  plan_id: z.string().uuid().nullable().optional(),
  referral: z.enum(["all", "direct", "referred"]).default("all"),
  sort_order: z.enum(["newest", "oldest", "expiry"]).default("newest"),
  page: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(1000).default(10),
});

const reorderServersSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

async function assertOwner(supabase: any, userId: string) {
  // Le direto a tabela de papeis (politica permite ler o proprio papel).
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Acesso restrito à área administrativa.");
}

async function assertNotOwnerAccount(supabase: any, userId: string) {
  const [{ data: roleRows, error: roleError }, { data: profile, error: profileError }] = await Promise.all([
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["owner"])
      .limit(1),
    supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (roleError) throw new Error(roleError.message);
  if (profileError) throw new Error(profileError.message);

  if ((roleRows ?? []).length > 0 || profile?.username === "magodono") {
    throw new Error("O usuário administrador (@magodono) não pode ser apagado.");
  }
}


/* ------------------------------ Servidores ------------------------------ */

export const listServers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: servers, error }, { data: credentials, error: credentialsError }] = await Promise.all([
      supabaseAdmin
        .from("iptv_servers")
        .select("id, name, url, is_active, sort_order, created_at")
        .order("sort_order")
        .order("created_at"),
      supabaseAdmin
        .from("server_credentials")
        .select("server_id, username, password, dns"),
    ]);
    if (error) throw error;
    if (credentialsError) throw credentialsError;

    const credentialByServerId = new Map(
      (credentials ?? []).map((credential) => [credential.server_id, credential]),
    );

    return (servers ?? []).map((server) => ({
      id: server.id,
      name: server.name,
      url: (server as any).url,
      is_active: server.is_active,
      sort_order: server.sort_order,
      created_at: server.created_at,
      credentials: credentialByServerId.has(server.id)
        ? [credentialByServerId.get(server.id)]
        : [],
    }));
  });

export const saveServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => serverSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const normalizedCredentials = (data.credentials ?? []).map((credential) => ({
      username: credential.username.trim(),
      password: credential.password.trim(),
      dns: credential.dns.trim(),
    }));
    const filledCredentials = normalizedCredentials.filter(
      (credential) => credential.username || credential.password || credential.dns,
    );
    if (!data.id && filledCredentials.length === 0) {
      throw new Error("Informe ao menos uma credencial para criar o servidor.");
    }

    const existingCredentialResult = data.id
      ? await supabaseAdmin
          .from("server_credentials")
          .select("username, password, dns")
          .eq("server_id", data.id)
          .maybeSingle()
      : null;
    if (existingCredentialResult?.error) {
      throw existingCredentialResult.error;
    }

    const existingCredential = existingCredentialResult?.data ?? null;
    const inputCredential = filledCredentials[0] ?? null;
    const resolvedCredential = {
      username: inputCredential?.username || existingCredential?.username || "",
      password: inputCredential?.password || existingCredential?.password || "",
      dns: inputCredential?.dns || existingCredential?.dns || "",
    };

    const hasInvalidCredential = !data.id
      ? !resolvedCredential.username || !resolvedCredential.password || !resolvedCredential.dns
      : Boolean(inputCredential) &&
        (!resolvedCredential.username || !resolvedCredential.password || !resolvedCredential.dns);
    if (hasInvalidCredential) {
      throw new Error("Preencha usuário, senha e DNS para cadastrar as credenciais do servidor.");
    }

    const nextDns = data.id
      ? resolvedCredential.dns || existingCredential?.dns || null
      : resolvedCredential.dns || null;

    let serverId = data.id;
    if (serverId) {
      const serverPayload: {
        name: string;
        is_active: boolean;
        sort_order: number;
        url?: string;
      } = {
        name: data.name,
        is_active: data.is_active,
        sort_order: data.sort_order,
      };
      if (nextDns) {
        serverPayload.url = nextDns;
      }
      const { error } = await supabaseAdmin
        .from("iptv_servers")
        .update(serverPayload)
        .eq("id", serverId);
      if (error) throw error;
    } else {
      const { data: created, error } = await supabaseAdmin
        .from("iptv_servers")
        .insert({
          name: data.name,
          url: nextDns!,
          is_active: data.is_active,
          sort_order: data.sort_order,
          created_by: context.userId,
        })
        .select("id")
        .single();
      if (error) throw error;
      serverId = created.id;
    }

    if (resolvedCredential.username || resolvedCredential.password || resolvedCredential.dns) {
      const { error: deleteError } = await supabaseAdmin
        .from("server_credentials")
        .delete()
        .eq("server_id", serverId);
      if (deleteError) throw deleteError;

      const { error: credError } = await supabaseAdmin.from("server_credentials").insert({
        server_id: serverId!,
        username: resolvedCredential.username,
        password: resolvedCredential.password,
        dns: resolvedCredential.dns,
      });
      if (credError) throw credError;
    }

    // Ações em massa para usuários
    if (data.bulk_action === "add_to_all") {
      const { data: allUsers } = await supabaseAdmin.from("profiles").select("id");
      if (allUsers && allUsers.length > 0) {
        // Obter acessos atuais para evitar duplicatas (chave única user_id, server_id)
        const userServerAccess = allUsers.map((u: any) => ({
          user_id: u.id,
          server_id: serverId!,
        }));
        await supabaseAdmin.from("user_server_access").upsert(userServerAccess, { onConflict: "user_id,server_id" });
      }
    } else if (data.bulk_action === "remove_from_all") {
      await supabaseAdmin.from("user_server_access").delete().eq("server_id", serverId);
    }

    void refreshServerCatalogCache(serverId!).catch((error) => {
      console.error("Falha ao recarregar o cache do servidor", error);
    });

    return { id: serverId };
  });

export const reorderServers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reorderServersSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { data: result, error } = await (context.supabase as any).rpc("admin_reorder_iptv_servers", {
      p_ordered_ids: data.ids,
    });

    if (error) throw error;
    return result;
  });

export const deleteServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("iptv_servers").delete().eq("id", data.id);
    if (error) throw error;
    await Promise.allSettled([
      clearServerCache(data.id),
      clearServerPlaylistCache(data.id),
      clearLocalImageCache(data.id),
    ]);
    return { ok: true };
  });

export const refreshServerCache = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        clear_local_before_fetch: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const result = await refreshServerCatalogCache(data.id, {
      clearLocalBeforeFetch: data.clear_local_before_fetch,
    });
    return { ok: true, ...result };
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
      .select("id, username, display_name, max_connections, expires_at, is_active, created_at, plan_id, referred_by_id, plan:subscription_plans(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const [{ data: access }, { data: devices }] = await Promise.all([
      supabaseAdmin.from("user_server_access").select("user_id, server_id"),
      supabaseAdmin.from("device_sessions").select("user_id, device_id, last_seen"),
    ]);
    const nameById = new Map((profiles ?? []).map((p: any) => [p.id, p.username]));
    const cutoff = Date.now() - 3 * 60 * 1000;
    return (profiles ?? []).map((profile: any) => ({
      ...profile,
      referred_by: profile.referred_by_id
        ? { username: nameById.get(profile.referred_by_id) ?? null }
        : null,
      server_ids: (access ?? [])
        .filter((row: any) => row.user_id === profile.id)
        .map((row: any) => row.server_id),
      online: (devices ?? []).filter(
        (row: any) => row.user_id === profile.id && new Date(row.last_seen).getTime() > cutoff,
      ).length,
    }));

  });

export const listAccessUsersPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => accessUsersPageSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { data: result, error } = await (context.supabase as any).rpc("admin_list_access_users", {
      p_search: data.search,
      p_status: data.status,
      p_server_id: data.server_id ?? null,
      p_plan_id: data.plan_id ?? null,
      p_referral: data.referral,
      p_sort_order: data.sort_order,
      p_page: data.page,
      p_page_size: data.page_size,
    });

    if (error) throw error;
    return result as {
      items: any[];
      total: number;
      status_counts: {
        all: number;
        active: number;
        blocked: number;
        expired: number;
        online: number;
      };
      page: number;
      page_size: number;
    };
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
    if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar acesso.");
    const newUserId = created.user.id;

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: newUserId,
      username: data.username,
      display_name: data.display_name ?? data.username,
      max_connections: data.max_connections,
      expires_at: data.expires_at ?? null,
      plan_id: data.plan_id ?? null,
      created_by: context.userId,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw profileError;
    }

    if (!data.plan_id) {
      const ownReferralCode = await generateUniqueReferralCode(supabaseAdmin);
      const { error: referralError } = await supabaseAdmin
        .from("profiles")
        .update({ referral_code: ownReferralCode })
        .eq("id", newUserId);
      if (referralError) throw referralError;
    } else {
      const { data: plan } = await supabaseAdmin
        .from("subscription_plans")
        .select("id, name, price")
        .eq("id", data.plan_id)
        .maybeSingle();
      if (isReferralEligiblePlan(plan)) {
        await ensureUserReferralCode(supabaseAdmin, newUserId, plan);
      }
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
        plan_id: z.string().uuid().nullable().optional(),
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
        plan_id: data.plan_id ?? null,
      })
      .eq("id", data.id);
    if (error) throw error;

    if (data.plan_id) {
      const { data: plan } = await supabaseAdmin
        .from("subscription_plans")
        .select("id, name, price")
        .eq("id", data.plan_id)
        .maybeSingle();
      if (isReferralEligiblePlan(plan)) {
        await ensureUserReferralCode(supabaseAdmin, data.id, plan);
      } else {
        await supabaseAdmin.from("profiles").update({ referral_code: null }).eq("id", data.id);
      }
    }

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
    await assertNotOwnerAccount(supabaseAdmin, data.id);
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
