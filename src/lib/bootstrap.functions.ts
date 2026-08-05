import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "owner" });
    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw roleError;
    }
    return { ok: true };
  });
