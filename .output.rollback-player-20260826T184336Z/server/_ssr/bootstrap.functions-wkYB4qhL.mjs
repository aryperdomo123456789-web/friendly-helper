import { r as createServerFn } from "./server-CnWKKVmV.mjs";
import { t as createServerRpc } from "./createServerRpc-D5qr2Qmf.mjs";
import { n as generateUniqueReferralCode } from "./referral-code-CKiYkjE0.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bootstrap.functions-wkYB4qhL.js
var SYNTHETIC_EMAIL_DOMAIN = "iptv.local";
var ownerSetupStatus_createServerFn_handler = createServerRpc({
	id: "5b1df27da40ab0320ac71b12322f2317371daf8c5ac97de62423d7253ce31e3b",
	name: "ownerSetupStatus",
	filename: "src/lib/bootstrap.functions.ts"
}, (opts) => ownerSetupStatus.__executeServer(opts));
var ownerSetupStatus = createServerFn({ method: "GET" }).handler(ownerSetupStatus_createServerFn_handler, async () => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { count } = await supabaseAdmin.from("user_roles").select("id", {
		count: "exact",
		head: true
	}).eq("role", "owner");
	return { needsSetup: (count ?? 0) === 0 };
});
var createFirstOwner_createServerFn_handler = createServerRpc({
	id: "f7829d2b45ebb3e5212598d779e423bab989291c30b7ffef28c65f5915e14fb9",
	name: "createFirstOwner",
	filename: "src/lib/bootstrap.functions.ts"
}, (opts) => createFirstOwner.__executeServer(opts));
var createFirstOwner = createServerFn({ method: "POST" }).inputValidator((input) => objectType({
	username: stringType().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9._-]+$/),
	password: stringType().min(8).max(72)
}).parse(input)).handler(createFirstOwner_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { count } = await supabaseAdmin.from("user_roles").select("id", {
		count: "exact",
		head: true
	}).eq("role", "owner");
	if ((count ?? 0) > 0) throw new Error("O acesso administrativo já existe neste sistema.");
	const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
		email: `${data.username}@${SYNTHETIC_EMAIL_DOMAIN}`,
		password: data.password,
		email_confirm: true,
		user_metadata: {
			username: data.username,
			role: "owner"
		}
	});
	if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar acesso administrativo.");
	const ownReferralCode = await generateUniqueReferralCode(supabaseAdmin);
	const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
		user_id: created.user.id,
		role: "owner"
	});
	if (roleError) {
		await supabaseAdmin.auth.admin.deleteUser(created.user.id);
		throw roleError;
	}
	const { error: profileError } = await supabaseAdmin.from("profiles").insert({
		id: created.user.id,
		username: data.username,
		display_name: "Administrador",
		max_connections: 10,
		is_active: true,
		referral_code: ownReferralCode
	});
	if (profileError) {
		await supabaseAdmin.auth.admin.deleteUser(created.user.id);
		throw profileError;
	}
	return { ok: true };
});
//#endregion
export { createFirstOwner_createServerFn_handler, ownerSetupStatus_createServerFn_handler };
