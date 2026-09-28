import { r as createServerFn } from "./server-CCRJVKEk.mjs";
import { t as createServerRpc } from "./createServerRpc-CiDVN6rK.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Dermeex9.mjs";
import { n as booleanType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { a as updateAppConfig } from "./config.functions-CtWkoSvu.mjs";
import { i as upsertPaymentRecord, n as recordAuditLog } from "./payments-tracking.functions-Bp-uxtDc.mjs";
import { randomUUID } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/payments.functions-BCjumKwS.js
var getMercadoPagoConfig_createServerFn_handler = createServerRpc({
	id: "6b379f933b455e6937dc7302f0c0165be3fdfbdd84b6ee5bf8898ac9b9da969e",
	name: "getMercadoPagoConfig",
	filename: "src/lib/payments.functions.ts"
}, (opts) => getMercadoPagoConfig.__executeServer(opts));
var getMercadoPagoConfig = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getMercadoPagoConfig_createServerFn_handler, async ({ context }) => {
	const { assertConfigAdmin, loadAppConfig } = await import("./config.server-BH4Tqa9g.mjs");
	await assertConfigAdmin(context.supabase, context.userId);
	const config = await loadAppConfig();
	return {
		mp_access_token: config.mp_access_token || "",
		mp_public_key: config.mp_public_key || "",
		mp_webhook_secret: config.mp_webhook_secret || "",
		mp_enabled: config.mp_enabled || false
	};
});
var updateMercadoPagoConfig_createServerFn_handler = createServerRpc({
	id: "b9c72bfe2cc11d479ea4f26ef559a94081e0a4b5c1eabffba49f766a79dece37",
	name: "updateMercadoPagoConfig",
	filename: "src/lib/payments.functions.ts"
}, (opts) => updateMercadoPagoConfig.__executeServer(opts));
var updateMercadoPagoConfig = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({
	mp_access_token: stringType(),
	mp_public_key: stringType(),
	mp_webhook_secret: stringType().optional().default(""),
	mp_enabled: booleanType()
}).parse(input)).handler(updateMercadoPagoConfig_createServerFn_handler, async ({ data, context }) => {
	const { assertConfigAdmin, loadAppConfig } = await import("./config.server-BH4Tqa9g.mjs");
	await assertConfigAdmin(context.supabase, context.userId);
	const config = await loadAppConfig();
	await updateAppConfig({ data: {
		...config,
		...data
	} });
	return { success: true };
});
var createPaymentPreference_createServerFn_handler = createServerRpc({
	id: "c536a5a4eaedae980fda275d038d94edefe663993e8ab12a52ef883029c7686c",
	name: "createPaymentPreference",
	filename: "src/lib/payments.functions.ts"
}, (opts) => createPaymentPreference.__executeServer(opts));
var createPaymentPreference = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({ planId: stringType().uuid() }).parse(input)).handler(createPaymentPreference_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { loadAppConfig } = await import("./config.server-BH4Tqa9g.mjs");
	const config = await loadAppConfig();
	const externalReference = JSON.stringify({
		userId: context.userId,
		planId: data.planId
	});
	if (!config.mp_access_token || !config.mp_enabled) {
		let isAdmin = false;
		const { data: roles, error: rolesError } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).in("role", ["owner", "admin"]).limit(1);
		if (rolesError) throw new Error(rolesError.message);
		isAdmin = (roles ?? []).length > 0;
		if (!isAdmin) throw new Error("Pagamentos indisponíveis: o Mercado Pago não está configurado.");
		console.log("Modo de teste: simulando pagamento aprovado para validação do fluxo.");
		await recordAuditLog({
			actor_user_id: context.userId,
			target_user_id: context.userId,
			action: "payment.simulation.started",
			entity_type: "payment",
			entity_id: null,
			details: {
				planId: data.planId,
				provider: "internal-test-mode"
			},
			source: "system"
		});
		return {
			simulate_success: true,
			planId: data.planId
		};
	}
	const { data: plan, error: planError } = await supabaseAdmin.from("subscription_plans").select("*").eq("id", data.planId).single();
	if (planError || !plan) throw new Error("Plano não encontrado.");
	const { data: profile } = await supabaseAdmin.from("profiles").select("username").eq("id", context.userId).single();
	const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${config.mp_access_token}`,
			"Content-Type": "application/json",
			"X-Idempotency-Key": randomUUID()
		},
		body: JSON.stringify({
			items: [{
				title: `Plano ${plan.name} - ${config.name || "Sistema IPTV"}`,
				unit_price: Number(plan.price),
				quantity: 1,
				currency_id: "BRL"
			}],
			payer: { email: `${profile?.username}@iptv.local` },
			external_reference: externalReference,
			back_urls: {
				success: `${config.base_url || "http://localhost:8080"}/inicio?payment=success`,
				failure: `${config.base_url || "http://localhost:8080"}/inicio?payment=failure`,
				pending: `${config.base_url || "http://localhost:8080"}/inicio?payment=pending`
			},
			auto_return: "approved",
			notification_url: `${config.base_url || "http://localhost:8080"}/api/public/mercadopago-webhook`
		})
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
		currency: "BRL"
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
			provider_preference_id: preference.id ?? null
		},
		source: "mercadopago"
	});
	return { init_point: preference.sandbox_init_point || preference.init_point };
});
//#endregion
export { createPaymentPreference_createServerFn_handler, getMercadoPagoConfig_createServerFn_handler, updateMercadoPagoConfig_createServerFn_handler };
