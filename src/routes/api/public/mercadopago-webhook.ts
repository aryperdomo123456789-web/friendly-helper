/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { resolveReferralSourceSlug } from "@/lib/referral";
import { ensureUserReferralCode } from "@/lib/referral-code";
import { proxyToInternalService } from "@/lib/internal-service-proxy.server";
import {
  claimApprovedPayment,
  recordAuditLog,
  recordPaymentEvent,
} from "@/lib/payments-tracking.functions";

function validateMercadoPagoSignature(params: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string | null | undefined;
}): boolean {
  const { signature, requestId, dataId, secret } = params;
  if (!secret) return false;
  if (!signature) return false;

  const parts = new Map(
    signature
      .split(",")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, value] as const),
  );
  const ts = parts.get("ts");
  const expected = parts.get("v1");
  if (!ts || !expected) return false;

  const manifest = [
    dataId ? `id:${dataId};` : "",
    requestId ? `request-id:${requestId};` : "",
    `ts:${ts};`,
  ].join("");

  const computed = createHmac("sha256", secret).update(manifest).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const computedBuf = Buffer.from(computed, "hex");
  if (expectedBuf.length !== computedBuf.length) return false;
  return timingSafeEqual(expectedBuf, computedBuf);
}

export const Route = createFileRoute("/api/public/mercadopago-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const paymentsServiceUrl = process.env["PAYMENTS_SERVICE_URL"];
        if (paymentsServiceUrl) {
          try {
            return await proxyToInternalService(request, paymentsServiceUrl);
          } catch (error) {
            console.error(
              "Falha ao encaminhar o webhook de pagamentos para o servico dedicado",
              error,
            );
          }
        }

        try {
          const body = await request.json();

          const url = new URL(request.url);
          const dataId = url.searchParams.get("data.id") ?? body?.data?.id ?? null;
          const requestId = request.headers.get("x-request-id");
          const signature = request.headers.get("x-signature");

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: configRow } = await supabaseAdmin
            .from("app_config")
            .select("config")
            .single();
          const config = configRow?.config as any;

          const webhookSecret =
            typeof config?.mp_webhook_secret === "string" ? config.mp_webhook_secret.trim() : "";
          if (!webhookSecret) {
            console.error("Segredo do webhook do Mercado Pago não configurado");
            return new Response("Webhook não configurado", { status: 503 });
          }

          if (
            !validateMercadoPagoSignature({
              signature,
              requestId,
              dataId,
              secret: webhookSecret,
            })
          ) {
            console.error("Assinatura inválida do webhook do Mercado Pago");
            return new Response("Não autorizado", { status: 401 });
          }

          if (!dataId) {
            return new Response("ok", { status: 200 });
          }

          if (!config?.mp_access_token) {
            console.error("Token de acesso do Mercado Pago não configurado");
            return new Response("Configuração ausente", { status: 500 });
          }

          const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
            headers: { Authorization: `Bearer ${config.mp_access_token}` },
          });

          if (!mpRes.ok) throw new Error("Falha ao consultar o pagamento no Mercado Pago.");

          const payment = await mpRes.json();

          if (payment.status === "approved" && payment.external_reference) {
            try {
              const { userId, planId } = JSON.parse(payment.external_reference);
              if (!userId || !planId) throw new Error("Dados inválidos em external_reference.");

              const { data: userProfile } = (await supabaseAdmin
                .from("profiles")
                .select("referred_by_id, display_name, referral_source_slug")
                .eq("id", userId)
                .single()) as any;
              const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

              const { data: plan } = (await supabaseAdmin
                .from("subscription_plans")
                .select("*")
                .eq("id", planId)
                .single()) as any;

              if (plan) {
                const newExpiry = new Date();
                const factor =
                  plan.duration_unit === "minutes"
                    ? 60 * 1000
                    : plan.duration_unit === "hours"
                      ? 60 * 60 * 1000
                      : 24 * 60 * 60 * 1000;
                const msToAdd = plan.duration_value * factor;
                newExpiry.setTime(newExpiry.getTime() + msToAdd);

                const paymentReceivedAt = new Date().toISOString();
                const paymentId = String(payment.id ?? dataId);
                const claim = await claimApprovedPayment({
                  user_id: userId,
                  plan_id: planId,
                  provider: "mercadopago",
                  provider_payment_id: paymentId,
                  provider_preference_id: payment.preference_id ?? payment.preferenceId ?? null,
                  external_reference: payment.external_reference,
                  status: "approved",
                  amount: Number(payment.transaction_amount ?? plan.price ?? 0),
                  currency: String(payment.currency_id ?? "BRL"),
                  webhook_payload: payment,
                  webhook_received_at: paymentReceivedAt,
                  approved_at: paymentReceivedAt,
                });

                await recordPaymentEvent({
                  payment_id: claim.payment.id,
                  event_type: claim.shouldApply ? "payment.approved" : "payment.approved.duplicate",
                  payload: {
                    provider_payment_id: paymentId,
                    provider: "mercadopago",
                  },
                });

                await recordAuditLog({
                  actor_user_id: userId,
                  target_user_id: userId,
                  action: claim.shouldApply ? "payment.approved" : "payment.approved.duplicate",
                  entity_type: "payment",
                  entity_id: claim.payment.id,
                  details: {
                    planId,
                    provider: "mercadopago",
                    provider_payment_id: paymentId,
                    provider_preference_id: payment.preference_id ?? payment.preferenceId ?? null,
                    amount: Number(payment.transaction_amount ?? plan.price ?? 0),
                    currency: String(payment.currency_id ?? "BRL"),
                  },
                  source: "mercadopago",
                });

                if (!claim.shouldApply) {
                  return new Response("ok", { status: 200 });
                }

                await supabaseAdmin
                  .from("profiles")
                  .update({
                    plan_id: planId,
                    max_connections: plan.max_connections,
                    expires_at: newExpiry.toISOString(),
                    is_active: true,
                  })
                  .eq("id", userId);

                await ensureUserReferralCode(supabaseAdmin, userId, plan);

                if (userProfile?.referred_by_id) {
                  let bonusDays = 0;
                  const linkSlug = resolveReferralSourceSlug({
                    referralSourceSlug: userProfile.referral_source_slug ?? null,
                    testLinkSlug: authUser.user?.user_metadata?.["test_link_slug"] ?? null,
                    displayName: userProfile.display_name,
                  });

                  if (linkSlug) {
                    const { data: link } = (await supabaseAdmin
                      .from("test_links")
                      .select("bonus_days_monthly, bonus_days_quarterly")
                      .eq("slug", linkSlug)
                      .maybeSingle()) as any;

                    if (link) {
                      const planDays =
                        plan.duration_unit === "days"
                          ? plan.duration_value
                          : plan.duration_unit === "hours"
                            ? plan.duration_value / 24
                            : plan.duration_value / 1440;
                      bonusDays =
                        planDays > 30
                          ? (link.bonus_days_quarterly ?? 30)
                          : (link.bonus_days_monthly ?? 15);
                    }
                  }

                  if (bonusDays > 0) {
                    const { data: referrer } = (await supabaseAdmin
                      .from("profiles")
                      .select("expires_at")
                      .eq("id", userProfile.referred_by_id)
                      .single()) as any;

                    if (referrer) {
                      const currentRefExpiry = referrer.expires_at
                        ? new Date(referrer.expires_at)
                        : new Date();
                      const baseDate =
                        currentRefExpiry > new Date() ? currentRefExpiry : new Date();
                      const newRefExpiry = new Date(
                        baseDate.getTime() + bonusDays * 24 * 60 * 60 * 1000,
                      );

                      await supabaseAdmin
                        .from("profiles")
                        .update({ expires_at: newRefExpiry.toISOString() })
                        .eq("id", userProfile.referred_by_id);
                    }
                  }
                }

                try {
                  const message = `Pagamento aprovado para o plano ${plan.name}. Seu acesso foi renovado com sucesso.`;
                  const { data: thread } = await (supabaseAdmin as any)
                    .from("support_threads")
                    .upsert(
                      {
                        user_id: userId,
                        last_message: message,
                        last_message_at: paymentReceivedAt,
                      },
                      { onConflict: "user_id" },
                    )
                    .select("id")
                    .single();

                  if (thread?.id) {
                    await (supabaseAdmin as any).from("support_messages").insert({
                      thread_id: thread.id,
                      sender_id: null,
                      content: message,
                      message_type: "payment_receipt",
                    });
                  }
                } catch (threadError) {
                  console.error("Falha ao registrar comprovante no chat:", threadError);
                }
              }
            } catch (parseErr) {
              console.error("Erro ao processar pagamento aprovado:", parseErr);
            }
          }

          return new Response("ok", { status: 200 });
        } catch (err: any) {
          console.error("Erro ao processar o webhook:", err);
          return new Response(err.message, { status: 500 });
        }
      },
    },
  },
});
