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
            
            if (payment.status === 'approved') {
              const { userId, planId } = JSON.parse(payment.external_reference);
              
              // Get plan details
              const { data: plan } = await supabaseAdmin
                .from("subscription_plans")
                .select("*")
                .eq("id", planId)
                .single();

              if (plan) {
                const newExpiry = new Date();
                newExpiry.setDate(newExpiry.getDate() + plan.duration_days);

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
