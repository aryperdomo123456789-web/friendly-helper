/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAppConfig, updateAppConfig } from "./config.functions";
import { recordAuditLog, upsertPaymentRecord } from "./payments-tracking.functions";

export const getMercadoPagoConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const config = await getAppConfig();
    return {
      mp_access_token: (config as any).mp_access_token || "",
      mp_public_key: (config as any).mp_public_key || "",
      mp_webhook_secret: (config as any).mp_webhook_secret || "",
      mp_enabled: (config as any).mp_enabled || false,
    };
  });

export const updateMercadoPagoConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) =>
    z
      .object({
        mp_access_token: z.string(),
        mp_public_key: z.string(),
        mp_webhook_secret: z.string().optional().default(""),
        mp_enabled: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const config = await getAppConfig();
    await updateAppConfig({
      data: {
        ...config,
        ...data,
      },
    });
    return { success: true };
  });

export const createPaymentPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: any) =>
    z
      .object({
        planId: z.string().uuid(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const config = (await getAppConfig()) as any;
    const externalReference = JSON.stringify({ userId: context.userId, planId: data.planId });

    // MODO TESTE: Se não houver token, permite ativação direta para teste de bonificação
    if (!config.mp_access_token || !config.mp_enabled) {
      console.log("Modo de teste: simulando pagamento aprovado para validação do fluxo.");
      await recordAuditLog({
        actor_user_id: context.userId,
        target_user_id: context.userId,
        action: "payment.simulation.started",
        entity_type: "payment",
        entity_id: null,
        details: {
          planId: data.planId,
          provider: "internal-test-mode",
        },
        source: "system",
      });
      return { simulate_success: true, planId: data.planId };
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

    // Cria a preferência no Mercado Pago via API REST.
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.mp_access_token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": randomUUID(),
      },
      body: JSON.stringify({
        items: [
          {
            title: `Plano ${plan.name} - ${config.name || "Sistema IPTV"}`,
            unit_price: Number(plan.price),
            quantity: 1,
            currency_id: "BRL",
          },
        ],
        payer: {
          email: `${profile?.username}@iptv.local`,
        },
        external_reference: externalReference,
        back_urls: {
          success: `${config.base_url || "http://localhost:8080"}/inicio?payment=success`,
          failure: `${config.base_url || "http://localhost:8080"}/inicio?payment=failure`,
          pending: `${config.base_url || "http://localhost:8080"}/inicio?payment=pending`,
        },
        auto_return: "approved",
        notification_url: `${config.base_url || "http://localhost:8080"}/api/public/mercadopago-webhook`,
      }),
    });

    const preference = await response.json();
    if (!response.ok) {
      console.error("Erro do Mercado Pago:", preference);
      throw new Error("Erro ao criar a preferência de pagamento.");
    }

    const paymentRecord = await upsertPaymentRecord({
      user_id: context.userId,
      plan_id: plan.id,
      provider: "mercadopago",
      provider_preference_id: preference.id ?? null,
      external_reference: externalReference,
      status: "pending",
      amount: Number(plan.price),
      currency: "BRL",
    });

    await recordAuditLog({
      actor_user_id: context.userId,
      target_user_id: context.userId,
      action: "payment.preference.created",
      entity_type: "payment",
      entity_id: paymentRecord?.id ?? null,
      details: {
        planId: plan.id,
        amount: Number(plan.price),
        currency: "BRL",
        provider: "mercadopago",
        provider_preference_id: preference.id ?? null,
      },
      source: "mercadopago",
    });

    return { init_point: preference.sandbox_init_point || preference.init_point };
  });
