import { createHmac, timingSafeEqual } from "node:crypto";

import { resolveReferralSourceSlug } from "@/lib/referral";
import { ensureUserReferralCode } from "@/lib/referral-code";
import {
  recordAuditLog,
  recordPaymentEvent,
  upsertPaymentRecord,
} from "@/lib/payments-tracking.functions";
import { isMainModule, startFetchService } from "@/lib/node-fetch-server.server";

type PaymentsServiceEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const paymentsService = {
  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return jsonResponse({ ok: true, service: "payments" });
    }

    if (url.pathname !== "/api/public/mercadopago-webhook") {
      return serviceResponse("Not found", { status: 404, contentType: "text/plain; charset=utf-8" });
    }

    if (request.method !== "POST") {
      return serviceResponse("Method not allowed", {
        status: 405,
        contentType: "text/plain; charset=utf-8",
        extraHeaders: { allow: "POST" },
      });
    }

    try {
      const body = await request.json();
      console.log("Webhook do Mercado Pago recebido:", body);

      const dataId = url.searchParams.get("data.id") ?? body?.data?.id ?? null;
      const requestId = request.headers.get("x-request-id");
      const signature = request.headers.get("x-signature");

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: configRow } = await supabaseAdmin.from("app_config").select("config").single();
      const config = configRow?.config as any;

      if (
        !validateMercadoPagoSignature({
          signature,
          requestId,
          dataId,
          secret: config?.mp_webhook_secret,
        })
      ) {
        console.error("Assinatura inválida do webhook do Mercado Pago");
        return serviceResponse("Não autorizado", {
          status: 401,
          contentType: "text/plain; charset=utf-8",
        });
      }

      if (!dataId) {
        return serviceResponse("ok", { status: 200, contentType: "text/plain; charset=utf-8" });
      }

      if (!config?.mp_access_token) {
        console.error("Token de acesso do Mercado Pago não configurado");
        return serviceResponse("Configuração ausente", {
          status: 500,
          contentType: "text/plain; charset=utf-8",
        });
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
            try {
              const paymentRecord = await upsertPaymentRecord({
                user_id: userId,
                plan_id: planId,
                provider: "mercadopago",
                provider_payment_id: String(payment.id ?? dataId),
                provider_preference_id: payment.preference_id ?? payment.preferenceId ?? null,
                external_reference: payment.external_reference,
                status: "approved",
                amount: Number(payment.transaction_amount ?? plan.price ?? 0),
                currency: String(payment.currency_id ?? "BRL"),
                webhook_payload: payment,
                webhook_received_at: paymentReceivedAt,
                approved_at: paymentReceivedAt,
              });

              if (paymentRecord?.id) {
                await recordPaymentEvent({
                  payment_id: paymentRecord.id,
                  event_type: "payment.approved",
                  payload: payment,
                });

                await recordAuditLog({
                  actor_user_id: userId,
                  target_user_id: userId,
                  action: "payment.approved",
                  entity_type: "payment",
                  entity_id: paymentRecord.id,
                  details: {
                    planId,
                    provider: "mercadopago",
                    provider_payment_id: String(payment.id ?? dataId),
                    provider_preference_id:
                      payment.preference_id ?? payment.preferenceId ?? null,
                    amount: Number(payment.transaction_amount ?? plan.price ?? 0),
                    currency: String(payment.currency_id ?? "BRL"),
                  },
                  source: "mercadopago",
                });
              }
            } catch (trackingError) {
              console.error("Falha ao registrar trilha do pagamento:", trackingError);
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
        } catch (error) {
          console.error("Erro ao processar pagamento aprovado:", error);
          await recordAuditLog({
            actor_user_id: null,
            target_user_id: null,
            action: "payment.approved.processing_failed",
            entity_type: "payment",
            entity_id: null,
            details: {
              external_reference: payment.external_reference ?? null,
              payment_id: payment.id ?? dataId,
            },
            source: "mercadopago",
          });
        }
      }

      return serviceResponse("ok", { status: 200, contentType: "text/plain; charset=utf-8" });
    } catch (error) {
      console.error("Erro no webhook do Mercado Pago:", error);
      return serviceResponse("Erro interno", {
        status: 500,
        contentType: "text/plain; charset=utf-8",
      });
    }
  },
} satisfies PaymentsServiceEntry;

if (isMainModule(import.meta.url)) {
  void startFetchService((request) => paymentsService.fetch(request), {
    serviceName: "payments",
  });
}

export default paymentsService;

function validateMercadoPagoSignature(params: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string | null | undefined;
}): boolean {
  const { signature, requestId, dataId, secret } = params;
  if (!secret) return true;
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

function jsonResponse(data: unknown, status = 200): Response {
  return serviceResponse(JSON.stringify(data), {
    status,
    contentType: "application/json; charset=utf-8",
  });
}

function serviceResponse(
  body: BodyInit | null,
  options: {
    status: number;
    contentType: string;
    extraHeaders?: Record<string, string>;
  },
): Response {
  const headers = new Headers({
    "content-type": options.contentType,
    "cache-control": "no-store, no-cache, must-revalidate, private",
    pragma: "no-cache",
    expires: "0",
    "x-served-by": "stream-mago-bot-payments",
    ...(options.extraHeaders ?? {}),
  });
  return new Response(body, { status: options.status, headers });
}
