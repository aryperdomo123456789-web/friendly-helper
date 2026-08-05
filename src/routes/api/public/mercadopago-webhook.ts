import { createFileRoute } from '@tanstack/react-router';
import { resolveReferralSourceSlug } from "@/lib/referral";
import { ensureUserReferralCode } from "@/lib/referral-code";

export const Route = createFileRoute('/api/public/mercadopago-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          console.log("Mercado Pago Webhook received:", body);

          // The type 'payment' is what we care about
          if (body.type === 'payment' && body.data?.id) {
            const paymentId = body.data.id;
            
            // Get app config to get access token
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data: configRow } = await supabaseAdmin.from("app_config").select("config").single();
            const config = configRow?.config as any;

            if (!config?.mp_access_token) {
              console.error("MP access token not configured");
              return new Response("Config missing", { status: 500 });
            }

            // Fetch payment details from MP
            const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
              headers: { "Authorization": `Bearer ${config.mp_access_token}` }
            });
            
            if (!mpRes.ok) throw new Error("Failed to fetch payment from MP");
            
            const payment = await mpRes.json();
            
            if (payment.status === 'approved' && payment.external_reference) {
              try {
                const { userId, planId } = JSON.parse(payment.external_reference);
                if (!userId || !planId) throw new Error("Invalid external_reference data");
                
                // Get user profile to check referral
                const { data: userProfile } = await supabaseAdmin
                  .from("profiles")
                  .select("referred_by_id, display_name, referral_source_slug")
                  .eq("id", userId)
                  .single();
                const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

                // Get plan details
                const { data: plan } = await supabaseAdmin
                  .from("subscription_plans")
                  .select("*")
                  .eq("id", planId)
                  .single();

                if (plan) {
                  const newExpiry = new Date();
                  const factor = plan.duration_unit === 'minutes' ? 60 * 1000 : plan.duration_unit === 'hours' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
                  const msToAdd = plan.duration_value * factor;
                  newExpiry.setTime(newExpiry.getTime() + msToAdd);

                  // Update user profile
                  await supabaseAdmin
                    .from("profiles")
                    .update({
                      plan_id: planId,
                      max_connections: plan.max_connections,
                      expires_at: newExpiry.toISOString(),
                      is_active: true
                    })
                    .eq("id", userId);

                  await ensureUserReferralCode(supabaseAdmin, userId, plan);

                  console.log(`User ${userId} upgraded to plan ${plan.name} until ${newExpiry.toISOString()}`);

                  // REFERRAL BONUS LOGIC
                  if (userProfile?.referred_by_id) {
                    let bonusDays = 0;
                    const linkSlug = resolveReferralSourceSlug({
                      referralSourceSlug: userProfile.referral_source_slug ?? null,
                      testLinkSlug: authUser.user?.user_metadata?.test_link_slug ?? null,
                      displayName: userProfile.display_name,
                    });

                    if (linkSlug) {
                      const { data: link } = await supabaseAdmin
                        .from("test_links")
                        .select("bonus_days_monthly, bonus_days_quarterly")
                        .eq("slug", linkSlug)
                        .maybeSingle();
                      
                      if (link) {
                        const planDays = plan.duration_unit === 'days' ? plan.duration_value : (plan.duration_unit === 'hours' ? plan.duration_value / 24 : plan.duration_value / 1440);
                        
                        if (planDays > 30) {
                          bonusDays = link.bonus_days_quarterly ?? 30;
                        } else {
                          bonusDays = link.bonus_days_monthly ?? 15;
                        }
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
                        
                        console.log(`Referrer ${userProfile.referred_by_id} awarded ${bonusDays} bonus days for referral ${userId}`);
                      }
                    }
                  }
                }
              } catch (parseErr) {
                console.error("Error processing approved payment:", parseErr);
              }
            }
          }

          return new Response("ok", { status: 200 });
        } catch (err: any) {
          console.error("Webhook processing error:", err);
          return new Response(err.message, { status: 500 });
        }
      }
    }
  }
});
