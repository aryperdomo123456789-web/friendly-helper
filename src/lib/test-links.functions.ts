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
  if (!data || data.length === 0) throw new Error("Acesso restrito à área administrativa.");
}

function shouldBypassDeviceTracking(link: any) {
  return Boolean(link?.allow_repeat_device || link?.owner_only || link?.slug === "dono-livre");
}

export const checkDeviceBlocked = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      fingerprint: z.string(),
      slug: z.string().min(1),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link } = await (supabaseAdmin as any)
      .from("test_links")
      .select("slug, owner_only, allow_repeat_device")
      .eq("slug", data.slug)
      .maybeSingle();

    if (shouldBypassDeviceTracking(link)) {
      return { blocked: false };
    }

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
    const creatorIds = [...new Set((data ?? []).map((l: any) => l.created_by_id).filter(Boolean))];
    let profileMap = new Map<string, any>();
    if (creatorIds.length) {
      const { data: profiles } = await (supabaseAdmin as any)
        .from("profiles")
        .select("id, username, display_name")
        .in("id", creatorIds);
      profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    }
    return (data ?? []).map((link: any) => ({
      ...link,
      profile: link.created_by_id ? profileMap.get(link.created_by_id) ?? null : null,
    }));

  });

export const listTestLinksPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { page: number; page_size: number }) =>
    z.object({
      page: z.number().int().min(1),
      page_size: z.number().int().min(1).max(100),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("test_links")
      .select("id", { count: "exact", head: true });
    if (countError) throw countError;

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / data.page_size));
    const page = Math.min(Math.max(data.page, 1), totalPages);
    const from = (page - 1) * data.page_size;
    const to = from + data.page_size - 1;

    const { data: rows, error } = await (supabaseAdmin as any)
      .from("test_links")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;

    const creatorIds = [...new Set((rows ?? []).map((l: any) => l.created_by_id).filter(Boolean))];
    let profileMap = new Map<string, any>();
    if (creatorIds.length) {
      const { data: profiles } = await (supabaseAdmin as any)
        .from("profiles")
        .select("id, username, display_name")
        .in("id", creatorIds);
      profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    }

    return {
      items: (rows ?? []).map((link: any) => ({
        ...link,
        profile: link.created_by_id ? profileMap.get(link.created_by_id) ?? null : null,
      })),
      total,
      page,
      page_size: data.page_size,
    };
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
      owner_only: z.boolean().default(false),
      allow_repeat_device: z.boolean().default(false),
      bonus_days_monthly: z.number().int().min(0).default(15),
      bonus_days_quarterly: z.number().int().min(0).default(30),
      description: z.string().optional().or(z.literal("")),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertOwner(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      slug: data.slug,
      duration_minutes: data.duration_minutes,
      max_connections: data.max_connections,
      is_active: data.is_active,
      owner_only: data.owner_only,
      allow_repeat_device: data.allow_repeat_device,
      bonus_days_monthly: data.bonus_days_monthly,
      bonus_days_quarterly: data.bonus_days_quarterly,
      description: data.description,
      created_by_id: context.userId,
    };
    if (data.id) {
      const { error } = await (supabaseAdmin as any)
        .from("test_links")
        .update(payload)
        .eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await (supabaseAdmin as any)
        .from("test_links")
        .insert(payload);
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
      fingerprint: z.string(),
      referral_code: z.string().nullable().optional()
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const request = getRequest();
    const origin = (() => {
      try {
        return new URL(request?.url ?? "https://stream.mago-bot.com").origin;
      } catch {
        const host = request?.headers.get("x-forwarded-host") || request?.headers.get("host") || "stream.mago-bot.com";
        const proto = request?.headers.get("x-forwarded-proto") || "https";
        return `${proto}://${host}`;
      }
    })();
    const ip = request?.headers.get("x-forwarded-for") || request?.headers.get("x-real-ip") || null;

    // Resolve referred_by if code provided
    let referredById = null;
    if (data.referral_code) {
      const { data: refUser } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("referral_code", data.referral_code)
        .maybeSingle();
      if (refUser) referredById = refUser.id;
    }
    
    // Validate link
    const { data: link, error: linkError } = await (supabaseAdmin as any)
      .from("test_links")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    
    if (linkError || !link) throw new Error("Link de teste inválido ou inativo.");

    if (!shouldBypassDeviceTracking(link)) {
      // Check if device fingerprint was already used
      const { data: existingDevice } = await (supabaseAdmin as any)
        .from("test_device_tracking")
        .select("id")
        .eq("fingerprint", data.fingerprint)
        .maybeSingle();

      if (existingDevice) {
        throw new Error("Você já gerou um teste grátis neste dispositivo. Para novos acessos, entre em contato com o suporte.");
      }

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
        throw new Error("Erro ao validar o dispositivo. Tente novamente.");
      }
    }


    const username = `teste_${Math.random().toString(36).substring(2, 8)}`;
    const password = Math.random().toString(36).substring(2, 10);
    const expiresAt = new Date(Date.now() + link.duration_minutes * 60 * 1000).toISOString();

    // Create user
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: usernameToEmail(username),
      password: password,
      email_confirm: true,
      user_metadata: {
        username,
        account_kind: "test",
        test_link_slug: link.slug,
        referral_source_slug: link.slug,
        referral_source_code: data.referral_code ?? null,
      },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar teste.");
    
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
      referral_code: null,
      referred_by_id: referredById,
      referral_source_slug: link.slug,
      referral_source_code: data.referral_code ?? null,
      referral_source_url: `${origin}/teste/${link.slug}?ref=${data.referral_code ?? ""}`,
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
