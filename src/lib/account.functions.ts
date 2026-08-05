import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const SYNTHETIC_EMAIL_DOMAIN = "iptv.local";

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile }, { data: roles }, { data: plans }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("username, display_name, max_connections, expires_at, is_active, referral_code, referred_by_id, plan_id, plan:subscription_plans(*)")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .in("role", ["owner", "admin"]),
      context.supabase
        .from("subscription_plans")
        .select("*")
        .order("price", { ascending: true }),
    ]);

    return {
      userId: context.userId,
      username: profile?.username ?? "",
      display_name: profile?.display_name ?? "",
      max_connections: profile?.max_connections ?? 1,
      expires_at: profile?.expires_at ?? null,
      plan: profile?.plan ?? null,
      availablePlans: plans ?? [],
      isOwner: (roles ?? []).length > 0,
      referral_code: profile?.referral_code ?? null,
      referred_by_id: profile?.referred_by_id ?? null,
    };
  });


export const updateMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        username: z
          .string()
          .trim()
          .toLowerCase()
          .min(3)
          .max(40)
          .regex(/^[a-z0-9._-]+$/, "Use apenas letras, numeros, ponto, hifen ou underline"),
        display_name: z.string().trim().max(120).optional(),
        current_password: z.string().min(1).max(72),
        new_password: z.string().min(6).max(72).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: current } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const currentEmail = current.user?.email;
    if (!currentEmail) throw new Error("Conta nao encontrada");

    // Confirma a senha atual antes de qualquer alteracao sensivel.
    const { createClient } = await import("@supabase/supabase-js");
    const check = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error: signInError } = await check.auth.signInWithPassword({
      email: currentEmail,
      password: data.current_password,
    });
    if (signInError) throw new Error("Senha atual incorreta");

    const nextEmail = `${data.username}@${SYNTHETIC_EMAIL_DOMAIN}`;
    const payload: { email?: string; password?: string; user_metadata: { username: string } } = {
      user_metadata: { username: data.username },
    };
    if (nextEmail !== currentEmail) payload.email = nextEmail;
    if (data.new_password) payload.password = data.new_password;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, payload);
    if (error) throw new Error(error.message);

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: context.userId,
        username: data.username,
        display_name: data.display_name || data.username,
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    return { ok: true, username: data.username };
  });
