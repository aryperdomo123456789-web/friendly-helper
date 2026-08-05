import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const simulatePaymentSuccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => 
    z.object({
      userId: z.string().uuid(),
      planId: z.string().uuid(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Buscar perfil para ver indicação
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("referred_by_id, display_name")
      .eq("id", data.userId)
      .single();

    const { data: plan } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", data.planId)
      .single();

    if (!plan) throw new Error("Plano não encontrado");

    const newExpiry = new Date();
    const factor = plan.duration_unit === 'minutes' ? 60 * 1000 : plan.duration_unit === 'hours' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const msToAdd = plan.duration_value * factor;
    newExpiry.setTime(newExpiry.getTime() + msToAdd);

    await supabaseAdmin
      .from("profiles")
      .update({
        plan_id: data.planId,
        max_connections: plan.max_connections,
        expires_at: newExpiry.toISOString(),
        is_active: true
      })
      .eq("id", data.userId);

    // Lógica de Bônus (Copiada do Webhook para o Teste Prático)
    if (userProfile?.referred_by_id) {
      let bonusDays = 0;
      const linkMatch = userProfile.display_name?.match(/\(([^)]+)\)/);
      const linkSlug = linkMatch ? linkMatch[1] : null;

      if (linkSlug) {
        const { data: link } = await supabaseAdmin
          .from("test_links")
          .select("bonus_days_monthly, bonus_days_quarterly")
          .eq("slug", linkSlug)
          .maybeSingle();
        
        if (link) {
          const planDays = plan.duration_unit === 'days' ? plan.duration_value : (plan.duration_unit === 'hours' ? plan.duration_value / 24 : plan.duration_value / 1440);
          bonusDays = planDays > 30 ? (link.bonus_days_quarterly ?? 30) : (link.bonus_days_monthly ?? 15);
        }
      }

      if (bonusDays > 0) {
        const { data: referrer } = await supabaseAdmin
          .from("profiles")
          .select("expires_at")
          .eq("id", userProfile.referred_by_id)
          .single();
        
        if (referrer) {
          const currentRefExpiry = referrer.expires_at ? new Date(referrer.expires_at) : new Date();
          const baseDate = currentRefExpiry > new Date() ? currentRefExpiry : new Date();
          const newRefExpiry = new Date(baseDate.getTime() + bonusDays * 24 * 60 * 60 * 1000);
          
          await supabaseAdmin
            .from("profiles")
            .update({ expires_at: newRefExpiry.toISOString() })
            .eq("id", userProfile.referred_by_id);
        }
      }
    }

    return { success: true };
  });
