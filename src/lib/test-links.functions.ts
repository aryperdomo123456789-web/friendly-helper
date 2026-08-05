import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { usernameToEmail } from "./owner.functions";

async function assertOwner(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"]);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Acesso restrito ao dono do sistema");
}

export const checkDeviceBlocked = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ fingerprint: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await (supabaseAdmin as any)
      .from("test_device_tracking")
      .select("id")
      .eq("fingerprint", data.fingerprint)
      .maybeSingle();
    return { blocked: !!existing };
  });


export const listTestLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("test_links")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

export const saveTestLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => 
    z.object({
      id: z.string().uuid().optional(),
      slug: z.string().min(3),
      duration_minutes: z.number().int().min(1),
      max_connections: z.number().int().min(1),
      is_active: z.boolean(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await (supabaseAdmin as any)
        .from("test_links")
        .update(data)
        .eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await (supabaseAdmin as any)
        .from("test_links")
        .insert(data);
      if (error) throw error;
    }
    return { ok: true };
  });

export const deleteTestLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).from("test_links").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const createTestUser = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => 
    z.object({ 
      slug: z.string(),
      fingerprint: z.string()
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const request = getRequest();
    const ip = request?.headers.get("x-forwarded-for") || request?.headers.get("x-real-ip") || null;
    
    // Check if device fingerprint was already used
    const { data: existingDevice } = await (supabaseAdmin as any)
      .from("test_device_tracking")
      .select("id")
      .eq("fingerprint", data.fingerprint)
      .maybeSingle();

    if (existingDevice) {
      throw new Error("Você já gerou um teste grátis neste dispositivo. Para novos acessos, entre em contato com o suporte.");
    }

    // Validate link
    const { data: link, error: linkError } = await (supabaseAdmin as any)
      .from("test_links")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .single();
    
    if (linkError || !link) throw new Error("Link de teste inválido ou inativo");

    // Track this device BEFORE creating the user to avoid race conditions/multiple attempts
    const { error: trackError } = await (supabaseAdmin as any)
      .from("test_device_tracking")
      .insert({
        fingerprint: data.fingerprint,
        ip_address: ip
      });

    if (trackError) {
      // If it failed because of duplicate (unique constraint), throw friendly error
      if (trackError.code === '23505') {
        throw new Error("Este dispositivo já foi utilizado para gerar um teste.");
      }
      throw new Error("Erro ao validar dispositivo. Tente novamente.");
    }


    const username = `teste_${Math.random().toString(36).substring(2, 8)}`;
    const password = Math.random().toString(36).substring(2, 10);
    const expiresAt = new Date(Date.now() + link.duration_minutes * 60 * 1000).toISOString();

    // Create user
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: usernameToEmail(username),
      password: password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar teste");
    
    const newUserId = created.user.id;

    // Create profile
    const { data: testPlan } = await supabaseAdmin
      .from("subscription_plans")
      .select("id")
      .ilike("name", "%teste%")
      .limit(1)
      .single();

    await supabaseAdmin.from("profiles").insert({
      id: newUserId,
      username: username,
      display_name: `Teste (${link.slug})`,
      max_connections: link.max_connections,
      expires_at: expiresAt,
      is_active: true,
      plan_id: testPlan?.id || null,
    });

    await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role: "user" });

    // For now, let's give access to all active servers.
    const { data: servers } = await supabaseAdmin.from("iptv_servers").select("id").eq("is_active", true);
    if (servers && servers.length > 0) {
      await supabaseAdmin
        .from("user_server_access")
        .insert(servers.map(s => ({ user_id: newUserId, server_id: s.id })));
    }

    return { username, password, expiresAt };
  });
