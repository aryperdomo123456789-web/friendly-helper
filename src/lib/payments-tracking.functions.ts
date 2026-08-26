/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type PaymentRecordInput = {
  user_id: string;
  plan_id: string;
  provider?: string;
  provider_payment_id?: string | null;
  provider_preference_id?: string | null;
  external_reference?: string | null;
  status: string;
  amount: number;
  currency?: string;
  webhook_payload?: Record<string, unknown> | null;
  webhook_received_at?: string | null;
  approved_at?: string | null;
  last_error?: string | null;
};

type PaymentEventInput = {
  payment_id: string;
  event_type: string;
  payload?: Record<string, unknown> | null;
};

type AuditLogInput = {
  actor_user_id?: string | null;
  target_user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
  source?: string;
  request_id?: string | null;
};

async function bestEffort<T>(label: string, run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    console.error(label, error);
    return null;
  }
}

export async function upsertPaymentRecord(input: PaymentRecordInput) {
  const db = supabaseAdmin as any;
  const payload = {
    user_id: input.user_id,
    plan_id: input.plan_id,
    provider: input.provider ?? "mercadopago",
    provider_payment_id: input.provider_payment_id ?? null,
    provider_preference_id: input.provider_preference_id ?? null,
    external_reference: input.external_reference ?? null,
    status: input.status,
    amount: input.amount,
    currency: input.currency ?? "BRL",
    webhook_payload: input.webhook_payload ?? {},
    webhook_received_at: input.webhook_received_at ?? null,
    approved_at: input.approved_at ?? null,
    last_error: input.last_error ?? null,
  };

  const existingByPaymentId = input.provider_payment_id
    ? await db
        .from("payments")
        .select("id")
        .eq("provider_payment_id", input.provider_payment_id)
        .maybeSingle()
    : { data: null, error: null };
  if (existingByPaymentId.error) throw existingByPaymentId.error;

  const existingByPreferenceId =
    !existingByPaymentId.data && input.provider_preference_id
      ? await db
          .from("payments")
          .select("id")
          .eq("provider_preference_id", input.provider_preference_id)
          .maybeSingle()
      : { data: null, error: null };
  if (existingByPreferenceId.error) throw existingByPreferenceId.error;

  const existingByReference =
    !existingByPaymentId.data && !existingByPreferenceId.data && input.external_reference
      ? await db
          .from("payments")
          .select("id")
          .eq("external_reference", input.external_reference)
          .eq("user_id", input.user_id)
          .eq("plan_id", input.plan_id)
          .maybeSingle()
      : { data: null, error: null };
  if (existingByReference.error) throw existingByReference.error;

  const existingId =
    existingByPaymentId.data?.id ??
    existingByPreferenceId.data?.id ??
    existingByReference.data?.id ??
    null;

  if (existingId) {
    const { data, error } = await db
      .from("payments")
      .update(payload)
      .eq("id", existingId)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await db.from("payments").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function recordPaymentEvent(input: PaymentEventInput) {
  return bestEffort("Falha ao registrar evento de pagamento", async () => {
    const { data, error } = await (supabaseAdmin as any)
      .from("payment_events")
      .insert({
        payment_id: input.payment_id,
        event_type: input.event_type,
        payload: input.payload ?? {},
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  });
}

export async function recordAuditLog(input: AuditLogInput) {
  return bestEffort("Falha ao registrar auditoria", async () => {
    const { data, error } = await (supabaseAdmin as any)
      .from("audit_logs")
      .insert({
        actor_user_id: input.actor_user_id ?? null,
        target_user_id: input.target_user_id ?? null,
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id ?? null,
        details: input.details ?? {},
        source: input.source ?? "server",
        request_id: input.request_id ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  });
}

export async function claimApprovedPayment(input: PaymentRecordInput) {
  if (!input.provider_payment_id) {
    throw new Error("Pagamento aprovado sem identificador do provedor.");
  }

  const { data, error } = await (supabaseAdmin as any).rpc("claim_payment_approval", {
    p_provider_payment_id: input.provider_payment_id,
    p_provider_preference_id: input.provider_preference_id ?? null,
    p_user_id: input.user_id,
    p_plan_id: input.plan_id,
    p_external_reference: input.external_reference ?? null,
    p_amount: input.amount,
    p_currency: input.currency ?? "BRL",
    p_webhook_payload: input.webhook_payload ?? {},
    p_webhook_received_at: input.webhook_received_at ?? null,
    p_approved_at: input.approved_at ?? null,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.payment_id) {
    throw new Error("A função de idempotência não retornou o pagamento.");
  }

  return {
    payment: { id: String(row.payment_id) },
    shouldApply: Boolean(row.should_apply),
  };
}
