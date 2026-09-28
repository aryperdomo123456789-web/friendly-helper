import { n as supabaseAdmin } from "./client.server-BlnvGJA3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payments-tracking.functions-CDwZfuaS.js
async function bestEffort(label, run) {
	try {
		return await run();
	} catch (error) {
		console.error(label, error);
		return null;
	}
}
async function upsertPaymentRecord(input) {
	const db = supabaseAdmin;
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
		last_error: input.last_error ?? null
	};
	const existingByPaymentId = input.provider_payment_id ? await db.from("payments").select("id").eq("provider_payment_id", input.provider_payment_id).maybeSingle() : {
		data: null,
		error: null
	};
	if (existingByPaymentId.error) throw existingByPaymentId.error;
	const existingByPreferenceId = !existingByPaymentId.data && input.provider_preference_id ? await db.from("payments").select("id").eq("provider_preference_id", input.provider_preference_id).maybeSingle() : {
		data: null,
		error: null
	};
	if (existingByPreferenceId.error) throw existingByPreferenceId.error;
	const existingByReference = !existingByPaymentId.data && !existingByPreferenceId.data && input.external_reference ? await db.from("payments").select("id").eq("external_reference", input.external_reference).eq("user_id", input.user_id).eq("plan_id", input.plan_id).maybeSingle() : {
		data: null,
		error: null
	};
	if (existingByReference.error) throw existingByReference.error;
	const existingId = existingByPaymentId.data?.id ?? existingByPreferenceId.data?.id ?? existingByReference.data?.id ?? null;
	if (existingId) {
		const { data, error } = await db.from("payments").update(payload).eq("id", existingId).select("*").single();
		if (error) throw error;
		return data;
	}
	const { data, error } = await db.from("payments").insert(payload).select("*").single();
	if (error) throw error;
	return data;
}
async function recordPaymentEvent(input) {
	return bestEffort("Falha ao registrar evento de pagamento", async () => {
		const { data, error } = await supabaseAdmin.from("payment_events").insert({
			payment_id: input.payment_id,
			event_type: input.event_type,
			payload: input.payload ?? {}
		}).select("*").single();
		if (error) throw error;
		return data;
	});
}
async function recordAuditLog(input) {
	return bestEffort("Falha ao registrar auditoria", async () => {
		const { data, error } = await supabaseAdmin.from("audit_logs").insert({
			actor_user_id: input.actor_user_id ?? null,
			target_user_id: input.target_user_id ?? null,
			action: input.action,
			entity_type: input.entity_type,
			entity_id: input.entity_id ?? null,
			details: input.details ?? {},
			source: input.source ?? "server",
			request_id: input.request_id ?? null
		}).select("*").single();
		if (error) throw error;
		return data;
	});
}
//#endregion
export { recordPaymentEvent as n, upsertPaymentRecord as r, recordAuditLog as t };
