import { randomBytes } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/referral-code-CKiYkjE0.js
function normalizeCodeCandidate(code) {
	return code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
}
function generateReferralCode(prefix = "REF") {
	return normalizeCodeCandidate(`${prefix}_${randomBytes(4).toString("hex").toUpperCase()}`);
}
async function generateUniqueReferralCode(supabaseAdmin, prefix = "REF") {
	for (let attempt = 0; attempt < 8; attempt += 1) {
		const candidate = generateReferralCode(prefix);
		const { data, error } = await supabaseAdmin.from("profiles").select("id").eq("referral_code", candidate).maybeSingle();
		if (error) throw error;
		if (!data) return candidate;
	}
	throw new Error("Não foi possível gerar um link de indicação único.");
}
function isReferralEligiblePlan(plan) {
	if (!plan) return false;
	const price = Number(plan.price ?? 0);
	const name = String(plan.name ?? "").trim().toLowerCase();
	if (!Number.isFinite(price) || price <= 0) return false;
	if (name.includes("teste")) return false;
	if (name.includes("trial")) return false;
	if (name.includes("free")) return false;
	if (name.includes("gratis")) return false;
	if (name.includes("grátis")) return false;
	return true;
}
async function ensureUserReferralCode(supabaseAdmin, userId, plan) {
	if (!isReferralEligiblePlan(plan)) return null;
	const { data: profile, error } = await supabaseAdmin.from("profiles").select("referral_code").eq("id", userId).maybeSingle();
	if (error) throw error;
	if (profile?.referral_code) return profile.referral_code;
	const referralCode = await generateUniqueReferralCode(supabaseAdmin);
	const { error: updateError } = await supabaseAdmin.from("profiles").update({ referral_code: referralCode }).eq("id", userId);
	if (updateError) throw updateError;
	return referralCode;
}
//#endregion
export { generateUniqueReferralCode as n, isReferralEligiblePlan as r, ensureUserReferralCode as t };
