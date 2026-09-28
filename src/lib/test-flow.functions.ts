import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureUserReferralCode } from "./referral-code";
import { recordAuditLog } from "./payments-tracking.functions";

export const simulatePaymentSuccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        planId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Buscar perfil para ver indicação
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("referred_by_id, display_name, referral_source_slug")
      .eq("id", data.userId)
      .single();

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.userId);

    const { data: plan } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", data.planId)
      .single();

    if (!plan) throw new Error("Plano não encontrado.");

    const newExpiry = new Date();
    const factor =
      plan.duration_unit === "minutes"
        ? 60 * 1000
        : plan.duration_unit === "hours"
          ? 60 * 60 * 1000
          : 24 * 60 * 60 * 1000;
    const msToAdd = plan.duration_value * factor;
    newExpiry.setTime(newExpiry.getTime() + msToAdd);

    await supabaseAdmin
      .from("profiles")
      .update({
        plan_id: data.planId,
        max_connections: plan.max_connections,
        expires_at: newExpiry.toISOString(),
        is_active: true,
      })
      .eq("id", data.userId);

    await ensureUserReferralCode(supabaseAdmin, data.userId, plan);

    await recordAuditLog({
      actor_user_id: data.userId,
      target_user_id: data.userId,
      action: "payment.simulated.applied",
      entity_type: "payment",
      entity_id: null,
      details: {
        planId: data.planId,
        provider: "internal-test-mode",
      },
      source: "system",
    });

    // O modo de simulação não representa um pagamento real e não concede bônus.
    // O bônus legítimo é aplicado apenas pelo webhook, com idempotência por payment_id.

    return { success: true };
  });
