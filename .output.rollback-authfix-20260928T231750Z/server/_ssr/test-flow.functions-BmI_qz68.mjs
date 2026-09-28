import { c as createServerFn } from "./createServerFn-BsVP-4Ld.mjs";
import { t as createServerRpc } from "./createServerRpc-CwdEcA_1.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-B5qtjxOb.mjs";
import { t as ensureUserReferralCode } from "./referral-code-CKiYkjE0.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as recordAuditLog } from "./payments-tracking.functions-CDwZfuaS.mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/test-flow.functions-BmI_qz68.js
var simulatePaymentSuccess_createServerFn_handler = createServerRpc({
	id: "99b9c86fe2af14a39edf0f32fb21884bf61aae520d8743896d7711ee942c5b1a",
	name: "simulatePaymentSuccess",
	filename: "src/lib/test-flow.functions.ts"
}, (opts) => simulatePaymentSuccess.__executeServer(opts));
var simulatePaymentSuccess = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userId: stringType().uuid(),
	planId: stringType().uuid()
}).parse(input)).handler(simulatePaymentSuccess_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data: userProfile } = await supabaseAdmin.from("profiles").select("referred_by_id, display_name, referral_source_slug").eq("id", data.userId).single();
	const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.userId);
	const { data: plan } = await supabaseAdmin.from("subscription_plans").select("*").eq("id", data.planId).single();
	if (!plan) throw new Error("Plano não encontrado.");
	const newExpiry = /* @__PURE__ */ new Date();
	const factor = plan.duration_unit === "minutes" ? 60 * 1e3 : plan.duration_unit === "hours" ? 3600 * 1e3 : 1440 * 60 * 1e3;
	const msToAdd = plan.duration_value * factor;
	newExpiry.setTime(newExpiry.getTime() + msToAdd);
	await supabaseAdmin.from("profiles").update({
		plan_id: data.planId,
		max_connections: plan.max_connections,
		expires_at: newExpiry.toISOString(),
		is_active: true
	}).eq("id", data.userId);
	await ensureUserReferralCode(supabaseAdmin, data.userId, plan);
	await recordAuditLog({
		actor_user_id: data.userId,
		target_user_id: data.userId,
		action: "payment.simulated.applied",
		entity_type: "payment",
		entity_id: null,
		details: {
			planId: data.planId,
			provider: "internal-test-mode"
		},
		source: "system"
	});
	return { success: true };
});
//#endregion
export { simulatePaymentSuccess_createServerFn_handler };
