import { r as createServerFn } from "./server-BKGO9b_w.mjs";
import { t as createServerRpc } from "./createServerRpc-Z1EuelMZ.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-CW0Oz35S.mjs";
import { t as ensureUserReferralCode } from "./referral-code-CKiYkjE0.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { n as recordAuditLog } from "./payments-tracking.functions-Bp-uxtDc.mjs";
import { t as resolveReferralSourceSlug } from "./referral-C4TN5CS0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/test-flow.functions-O-NXyXc2.js
var simulatePaymentSuccess_createServerFn_handler = createServerRpc({
	id: "99b9c86fe2af14a39edf0f32fb21884bf61aae520d8743896d7711ee942c5b1a",
	name: "simulatePaymentSuccess",
	filename: "src/lib/test-flow.functions.ts"
}, (opts) => simulatePaymentSuccess.__executeServer(opts));
var simulatePaymentSuccess = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	userId: stringType().uuid(),
	planId: stringType().uuid()
}).parse(input)).handler(simulatePaymentSuccess_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data: roles, error: rolesError } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).in("role", ["owner", "admin"]).limit(1);
	if (rolesError) throw new Error(rolesError.message);
	const isAdmin = (roles ?? []).length > 0;
	if (!isAdmin) throw new Error("Simulação de pagamento desabilitada em produção.");
	if (!isAdmin && data.userId !== context.userId) throw new Error("Você só pode simular o pagamento da própria conta.");
	const { data: userProfile } = await supabaseAdmin.from("profiles").select("referred_by_id, display_name, referral_source_slug").eq("id", data.userId).single();
	const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.userId);
	const { data: plan } = await supabaseAdmin.from("subscription_plans").select("*").eq("id", data.planId).single();
	if (!plan) throw new Error("Plano não encontrado.");
	const newExpiry = /* @__PURE__ */ new Date();
	const factor = plan.duration_unit === "minutes" ? 6e4 : plan.duration_unit === "hours" ? 36e5 : 864e5;
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
	if (userProfile?.referred_by_id) {
		let bonusDays = 0;
		const linkSlug = resolveReferralSourceSlug({
			referralSourceSlug: userProfile.referral_source_slug ?? null,
			testLinkSlug: authUser.user?.user_metadata?.test_link_slug ?? null,
			displayName: userProfile.display_name
		});
		if (linkSlug) {
			const { data: link } = await supabaseAdmin.from("test_links").select("bonus_days_monthly, bonus_days_quarterly").eq("slug", linkSlug).maybeSingle();
			if (link) bonusDays = (plan.duration_unit === "days" ? plan.duration_value : plan.duration_unit === "hours" ? plan.duration_value / 24 : plan.duration_value / 1440) > 30 ? link.bonus_days_quarterly ?? 30 : link.bonus_days_monthly ?? 15;
		}
		if (bonusDays > 0) {
			const { data: referrer } = await supabaseAdmin.from("profiles").select("expires_at").eq("id", userProfile.referred_by_id).single();
			if (referrer) {
				const currentRefExpiry = referrer.expires_at ? new Date(referrer.expires_at) : /* @__PURE__ */ new Date();
				const newRefExpiry = new Date((currentRefExpiry > /* @__PURE__ */ new Date() ? currentRefExpiry : /* @__PURE__ */ new Date()).getTime() + bonusDays * 24 * 60 * 60 * 1e3);
				await supabaseAdmin.from("profiles").update({ expires_at: newRefExpiry.toISOString() }).eq("id", userProfile.referred_by_id);
			}
		}
	}
	return { success: true };
});
//#endregion
export { simulatePaymentSuccess_createServerFn_handler };
