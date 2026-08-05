
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAppConfig, updateAppConfig } from "./config.functions";

export const getMercadoPagoConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const config = await getAppConfig();
    return {
      mp_access_token: (config as any).mp_access_token || "",
      mp_public_key: (config as any).mp_public_key || "",
      mp_enabled: (config as any).mp_enabled || false,
    };
  });

export const updateMercadoPagoConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => 
    z.object({
      mp_access_token: z.string(),
      mp_public_key: z.string(),
      mp_enabled: z.boolean(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const config = await getAppConfig();
    await updateAppConfig({
      data: {
        ...config,
        ...data
      }
    });
    return { success: true };
  });

export const createPaymentPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) => 
    z.object({
      planId: z.string().uuid(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const config = await getAppConfig() as any;
    
    if (!config.mp_access_token || !config.mp_enabled) {
      throw new Error("Pagamento via Mercado Pago não está configurado ou ativo.");
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .eq("id", data.planId)
      .single();

    if (planError || !plan) throw new Error("Plano não encontrado.");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("id", context.userId)
      .single();

    // Create Mercado Pago Preference
    // Note: In a real app, we would use the Mercado Pago SDK here.
    // Since we are in a serverless worker, we use the REST API.
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.mp_access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `Plano ${plan.name} - WEBPLAYER`,
            unit_price: Number(plan.price),
            quantity: 1,
            currency_id: "BRL",
          }
        ],
        payer: {
          email: `${profile?.username}@iptv.local`,
        },
        external_reference: JSON.stringify({ userId: context.userId, planId: plan.id }),
        back_urls: {
          success: `${config.base_url || 'http://localhost:8080'}/inicio?payment=success`,
          failure: `${config.base_url || 'http://localhost:8080'}/inicio?payment=failure`,
          pending: `${config.base_url || 'http://localhost:8080'}/inicio?payment=pending`,
        },
        auto_return: "approved",
        notification_url: `${config.base_url || 'http://localhost:8080'}/api/public/mercadopago-webhook`,
      }),
    });

    const preference = await response.json();
    if (!response.ok) {
      console.error("MP Error:", preference);
      throw new Error("Erro ao criar preferência de pagamento.");
    }

    return { init_point: preference.init_point };
  });
