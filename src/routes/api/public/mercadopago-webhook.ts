import { createFileRoute } from '@tanstack/react-router';

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
                .select("referred_by_id, display_name")
                .eq("id", userId)
                .single();

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

                console.log(`User ${userId} upgraded to plan ${plan.name} until ${newExpiry.toISOString()}`);

                // REFERRAL BONUS LOGIC
                if (userProfile?.referred_by_id) {
                  // Find if the user was created through a test link that has bonus config
                  // We check the profile's display name or we could track the original link slug in profile
                  // For now, let's find the active test links to see which one might have been used
                  // OR more simply, use the default bonus if not specified
                  
                  // Try to find the link that referred this user (assuming slug was in display_name like "Teste (slug)")
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
                      // Logic: plan >= 30 days = quarterly bonus, else monthly bonus
                      // Convert plan duration to days for comparison
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
                      // If expired, start from now, otherwise add to current
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
              } catch (parseErr) {
                console.error("Error parsing external_reference:", parseErr);
              }
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
