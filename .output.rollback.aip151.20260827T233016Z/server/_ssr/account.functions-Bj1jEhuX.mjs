import { r as createServerFn } from "./server-CebzV2f4.mjs";
import { t as createServerRpc } from "./createServerRpc-3tKZmNXY.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BisTKCWa.mjs";
import { n as generateUniqueReferralCode, r as isReferralEligiblePlan, t as ensureUserReferralCode } from "./referral-code-CKiYkjE0.mjs";
import { i as literalType, o as objectType, s as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account.functions-Bj1jEhuX.js
var SYNTHETIC_EMAIL_DOMAIN = "iptv.local";
var getMyAccount_createServerFn_handler = createServerRpc({
	id: "5066297d56e7d337c91702997c269ac30924387d613a1b2d901701e9e5bf61e4",
	name: "getMyAccount",
	filename: "src/lib/account.functions.ts"
}, (opts) => getMyAccount.__executeServer(opts));
var getMyAccount = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getMyAccount_createServerFn_handler, async ({ context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const [{ data: profile }, { data: roles }, { data: plans }] = await Promise.all([
		supabaseAdmin.from("profiles").select("username, display_name, max_connections, expires_at, is_active, referral_code, referred_by_id, referral_source_slug, referral_source_code, referral_source_url, plan_id, plan:subscription_plans(*)").eq("id", context.userId).maybeSingle(),
		context.supabase.from("user_roles").select("role").eq("user_id", context.userId).in("role", ["owner", "admin"]),
		context.supabase.from("subscription_plans").select("*").order("price", { ascending: true })
	]);
	const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(context.userId);
	const isTestAccount = Boolean(authUser.user?.user_metadata?.account_kind === "test" || authUser.user?.user_metadata?.test_link_slug || profile?.referral_source_slug || profile?.referral_source_code);
	const hasEligiblePlan = isReferralEligiblePlan(profile?.plan ?? null);
	const shouldHideReferral = isTestAccount && !hasEligiblePlan;
	if (profile && hasEligiblePlan) {
		const referralCode = await ensureUserReferralCode(supabaseAdmin, context.userId, profile?.plan ?? null);
		if (referralCode) profile.referral_code = referralCode;
	} else if (profile && shouldHideReferral) {
		if (profile.referral_code) {
			const { error: clearReferralError } = await supabaseAdmin.from("profiles").update({ referral_code: null }).eq("id", context.userId);
			if (!clearReferralError) profile.referral_code = null;
		}
	} else if (profile && !profile.referral_code) {
		const referralCode = await generateUniqueReferralCode(supabaseAdmin);
		const { error: referralUpdateError } = await supabaseAdmin.from("profiles").update({ referral_code: referralCode }).eq("id", context.userId);
		if (!referralUpdateError) profile.referral_code = referralCode;
	}
	const { data: testLinks } = await supabaseAdmin.from("test_links").select("*").eq("is_active", true);
	const publicTestLinks = (testLinks ?? []).filter((link) => !link.owner_only);
	const ownerTestLinks = (testLinks ?? []).filter((link) => link.owner_only);
	return {
		userId: context.userId,
		username: profile?.username ?? "",
		display_name: profile?.display_name ?? "",
		max_connections: profile?.max_connections ?? 1,
		expires_at: profile?.expires_at ?? null,
		plan: profile?.plan ?? null,
		availablePlans: plans ?? [],
		isOwner: (roles ?? []).length > 0,
		referral_code: shouldHideReferral ? null : profile?.referral_code ?? null,
		referred_by_id: profile?.referred_by_id ?? null,
		referral_source_slug: profile?.referral_source_slug ?? null,
		referral_source_code: profile?.referral_source_code ?? null,
		referral_source_url: profile?.referral_source_url ?? null,
		testLinks: publicTestLinks,
		ownerTestLinks
	};
});
var updateMyAccount_createServerFn_handler = createServerRpc({
	id: "6befa777ce5321d7bd83d12f6110229d28c5f24fae2fab7dfe08b6aa5f3c4391",
	name: "updateMyAccount",
	filename: "src/lib/account.functions.ts"
}, (opts) => updateMyAccount.__executeServer(opts));
var updateMyAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	username: stringType().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9._-]+$/, "Use apenas letras, números, ponto, hífen ou underline"),
	display_name: stringType().trim().max(120).optional(),
	current_password: stringType().min(1).max(72),
	new_password: stringType().min(6).max(72).optional().or(literalType(""))
}).parse(input)).handler(updateMyAccount_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data: current } = await supabaseAdmin.auth.admin.getUserById(context.userId);
	const currentEmail = current.user?.email;
	if (!currentEmail) throw new Error("Conta não encontrada.");
	const { createClient } = await import("../_libs/supabase__supabase-js.mjs").then((n) => n.n);
	const { error: signInError } = await createClient(process.env["SUPABASE_URL"], process.env["SUPABASE_PUBLISHABLE_KEY"], { auth: {
		persistSession: false,
		autoRefreshToken: false
	} }).auth.signInWithPassword({
		email: currentEmail,
		password: data.current_password
	});
	if (signInError) throw new Error("Senha atual incorreta.");
	const nextEmail = `${data.username}@${SYNTHETIC_EMAIL_DOMAIN}`;
	const payload = { user_metadata: { username: data.username } };
	if (nextEmail !== currentEmail) payload.email = nextEmail;
	if (data.new_password) payload.password = data.new_password;
	const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, payload);
	if (error) throw new Error(error.message);
	const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
		id: context.userId,
		username: data.username,
		display_name: data.display_name || data.username
	}, { onConflict: "id" });
	if (profileError) throw profileError;
	return {
		ok: true,
		username: data.username
	};
});
//#endregion
export { getMyAccount_createServerFn_handler, updateMyAccount_createServerFn_handler };
