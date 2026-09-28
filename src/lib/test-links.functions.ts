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

function isOwnerExclusiveLink(link: any) {
  return Boolean(link?.owner_only || link?.slug === "dono-livre");
}

function getClientIp(request: Request | undefined): string | null {
  if (!request) return null;

  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for")?.split(",")[0],
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value || value.length > 128) continue;
    if (/^[0-9a-f:.]+$/i.test(value)) return value;
  }

  return null;
}

export const checkDeviceBlocked = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        fingerprint: z.string().trim().min(8).max(200),
        slug: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link } = await (supabaseAdmin as any)
      .from("test_links")
      .select("slug, owner_only, allow_repeat_device")
      .eq("slug", data.slug)
      .maybeSingle();

    if (isOwnerExclusiveLink(link)) {
      return { blocked: false };
    }

    const request = getRequest();
    const ip = getClientIp(request);
    const { data: existing } = await (supabaseAdmin as any)
      .from("test_device_tracking")
      .select("id")
      .eq("fingerprint", data.fingerprint)
      .maybeSingle();
    if (existing) return { blocked: true, reason: "fingerprint" };

    if (ip) {
      const { data: existingIp } = await (supabaseAdmin as any)
        .from("test_device_tracking")
        .select("id")
        .eq("ip_address", ip)
        .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
        .maybeSingle();
      if (existingIp) return { blocked: true, reason: "ip" };
    }

    return { blocked: false };
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
      profile: link.created_by_id ? (profileMap.get(link.created_by_id) ?? null) : null,
    }));
  });

export const listTestLinksPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { page: number; page_size: number }) =>
    z
      .object({
        page: z.number().int().min(1),
        page_size: z.number().int().min(1).max(100),
      })
      .parse(input),
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
        profile: link.created_by_id ? (profileMap.get(link.created_by_id) ?? null) : null,
      })),
      total,
      page,
      page_size: data.page_size,
    };
  });

export const saveTestLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
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
      })
      .parse(input),
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
      const { error } = await (supabaseAdmin as any).from("test_links").insert(payload);
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
    z
      .object({
        slug: z.string(),
        fingerprint: z.string().trim().min(8).max(200),
        referral_code: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const request = getRequest();
    const origin = (() => {
      try {
        return new URL(request?.url ?? "https://stream.mago-bot.com").origin;
      } catch {
        const host =
          request?.headers.get("x-forwarded-host") ||
          request?.headers.get("host") ||
          "stream.mago-bot.com";
        const proto = request?.headers.get("x-forwarded-proto") || "https";
        return `${proto}://${host}`;
      }
    })();
    const ip = getClientIp(request);

    // Validate link
    const { data: link, error: linkError } = await (supabaseAdmin as any)
      .from("test_links")
      .select("*")
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();

    if (linkError || !link) throw new Error("Link de teste inválido ou inativo.");

    const ownerExclusive = isOwnerExclusiveLink(link);
    let referredById: string | null = null;
    let effectiveReferralCode: string | null = null;

    if (data.referral_code) {
      const normalizedReferralCode = data.referral_code.trim().toUpperCase();
      const { data: refUser } = await supabaseAdmin
        .from("profiles")
        .select("id, is_active, expires_at, plan_id")
        .ilike("referral_code", normalizedReferralCode)
        .maybeSingle();

      if (
        refUser?.is_active &&
        (!refUser.expires_at || new Date(refUser.expires_at).getTime() > Date.now())
      ) {
        const { data: refRoles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", refUser.id)
          .in("role", ["owner", "admin"]);
        if (!refRoles?.length || ownerExclusive) {
          referredById = refUser.id;
          effectiveReferralCode = normalizedReferralCode;
        }
      }
    }

    if (!ownerExclusive) {
      const { data: claim, error: claimError } = await (supabaseAdmin as any).rpc(
        "claim_public_test_slot",
        {
          p_fingerprint: data.fingerprint,
          p_ip_address: ip,
          p_rate_window_seconds: 900,
          p_max_requests: 3,
        },
      );

      if (claimError) {
        console.error("Falha ao validar limite antifraude do teste:", claimError);
        throw new Error("Não foi possível validar este teste agora. Tente novamente.");
      }

      if (!claim?.allowed) {
        const reason = claim?.reason;
        if (reason === "rate")
          throw new Error("Muitas tentativas recentes. Aguarde alguns minutos e tente novamente.");
        if (reason === "ip")
          throw new Error(
            "Este acesso já gerou um teste recentemente. Para novos acessos, contate o suporte.",
          );
        throw new Error(
          "Você já gerou um teste grátis neste dispositivo. Para novos acessos, contate o suporte.",
        );
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
        referral_source_code: effectiveReferralCode,
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
      referral_source_code: effectiveReferralCode,
      referral_source_url: effectiveReferralCode
        ? `${origin}/teste/${link.slug}?ref=${effectiveReferralCode}`
        : `${origin}/teste/${link.slug}`,
    });

    await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role: "user" });

    // For now, let's give access to all active servers.
    const { data: servers } = await supabaseAdmin
      .from("iptv_servers")
      .select("id")
      .eq("is_active", true);
    if (servers && servers.length > 0) {
      await supabaseAdmin
        .from("user_server_access")
        .insert(servers.map((s) => ({ user_id: newUserId, server_id: s.id })));
    }

    return { username, password, expiresAt };
  });
