import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateUniqueReferralCode } from "./referral-code";

export const SYNTHETIC_EMAIL_DOMAIN = "iptv.local";

export const ownerSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner");
  return { needsSetup: (count ?? 0) === 0 };
});

export const createFirstOwner = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        username: z
          .string()
          .trim()
          .toLowerCase()
          .min(3)
          .max(40)
          .regex(/^[a-z0-9._-]+$/),
        password: z.string().min(8).max(72),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner");
    if ((count ?? 0) > 0) throw new Error("O acesso dono ja existe neste sistema");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: `${data.username}@${SYNTHETIC_EMAIL_DOMAIN}`,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username, role: "owner" },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar acesso dono");
    const ownReferralCode = await generateUniqueReferralCode(supabaseAdmin);

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "owner" });
    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw roleError;
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      username: data.username,
      display_name: "Dono",
      max_connections: 10,
      is_active: true,
      referral_code: ownReferralCode,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw profileError;
    }
    return { ok: true };
  });
