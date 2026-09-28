import { o as getRequest, r as createServerFn } from "./server-BdIe17xm.mjs";
import { t as createServerRpc } from "./createServerRpc-CjH6qgGU.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DjZmo9v7.mjs";
import { a as numberType, i as literalType, n as booleanType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { p as usernameToEmail } from "./owner.functions-_ZDgpaUK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/test-links.functions-mtBh4KVj.js
async function assertOwner(supabase, userId) {
	const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).in("role", ["owner", "admin"]);
	if (error) throw new Error(error.message);
	if (!data || data.length === 0) throw new Error("Acesso restrito à área administrativa.");
}
function shouldBypassDeviceTracking(link) {
	return Boolean(link?.allow_repeat_device || link?.owner_only || link?.slug === "dono-livre");
}
var checkDeviceBlocked_createServerFn_handler = createServerRpc({
	id: "f94c5062750447c8b15f30f6570af04435932d0d5f4efa480b9d588cfe306e6f",
	name: "checkDeviceBlocked",
	filename: "src/lib/test-links.functions.ts"
}, (opts) => checkDeviceBlocked.__executeServer(opts));
var checkDeviceBlocked = createServerFn({ method: "POST" }).inputValidator((input) => objectType({
	fingerprint: stringType(),
	slug: stringType().min(1)
}).parse(input)).handler(checkDeviceBlocked_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data: link } = await supabaseAdmin.from("test_links").select("slug, owner_only, allow_repeat_device").eq("slug", data.slug).maybeSingle();
	if (shouldBypassDeviceTracking(link)) return { blocked: false };
	const { data: existing } = await supabaseAdmin.from("test_device_tracking").select("id").eq("fingerprint", data.fingerprint).maybeSingle();
	return { blocked: !!existing };
});
var listTestLinks_createServerFn_handler = createServerRpc({
	id: "45aada6ded07ac5475d96a3392b2b0e2c78a7b093d2176ad3cc8441b374768cf",
	name: "listTestLinks",
	filename: "src/lib/test-links.functions.ts"
}, (opts) => listTestLinks.__executeServer(opts));
var listTestLinks = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listTestLinks_createServerFn_handler, async ({ context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data, error } = await supabaseAdmin.from("test_links").select("*").order("created_at", { ascending: false });
	if (error) throw error;
	const creatorIds = [...new Set((data ?? []).map((l) => l.created_by_id).filter(Boolean))];
	let profileMap = /* @__PURE__ */ new Map();
	if (creatorIds.length) {
		const { data: profiles } = await supabaseAdmin.from("profiles").select("id, username, display_name").in("id", creatorIds);
		profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
	}
	return (data ?? []).map((link) => ({
		...link,
		profile: link.created_by_id ? profileMap.get(link.created_by_id) ?? null : null
	}));
});
var listTestLinksPage_createServerFn_handler = createServerRpc({
	id: "0c0ee742b0c7014702d425e4387f1a2246eb11b609c8599e348737f523320de7",
	name: "listTestLinksPage",
	filename: "src/lib/test-links.functions.ts"
}, (opts) => listTestLinksPage.__executeServer(opts));
var listTestLinksPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({
	page: numberType().int().min(1),
	page_size: numberType().int().min(1).max(100)
}).parse(input)).handler(listTestLinksPage_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { count, error: countError } = await supabaseAdmin.from("test_links").select("id", {
		count: "exact",
		head: true
	});
	if (countError) throw countError;
	const total = count ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / data.page_size));
	const page = Math.min(Math.max(data.page, 1), totalPages);
	const from = (page - 1) * data.page_size;
	const to = from + data.page_size - 1;
	const { data: rows, error } = await supabaseAdmin.from("test_links").select("*").order("created_at", { ascending: false }).range(from, to);
	if (error) throw error;
	const creatorIds = [...new Set((rows ?? []).map((l) => l.created_by_id).filter(Boolean))];
	let profileMap = /* @__PURE__ */ new Map();
	if (creatorIds.length) {
		const { data: profiles } = await supabaseAdmin.from("profiles").select("id, username, display_name").in("id", creatorIds);
		profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
	}
	return {
		items: (rows ?? []).map((link) => ({
			...link,
			profile: link.created_by_id ? profileMap.get(link.created_by_id) ?? null : null
		})),
		total,
		page,
		page_size: data.page_size
	};
});
var saveTestLink_createServerFn_handler = createServerRpc({
	id: "438ff3736a4945e58121f91695f6aec4ba8a783b6a6d4df83c125ec6c60d8cdb",
	name: "saveTestLink",
	filename: "src/lib/test-links.functions.ts"
}, (opts) => saveTestLink.__executeServer(opts));
var saveTestLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid().optional(),
	slug: stringType().min(3),
	duration_minutes: numberType().int().min(1),
	max_connections: numberType().int().min(1),
	is_active: booleanType(),
	owner_only: booleanType().default(false),
	allow_repeat_device: booleanType().default(false),
	bonus_days_monthly: numberType().int().min(0).default(15),
	bonus_days_quarterly: numberType().int().min(0).default(30),
	description: stringType().optional().or(literalType(""))
}).parse(input)).handler(saveTestLink_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const payload = {
		slug: data.slug,
		duration_minutes: data.duration_minutes,
		max_connections: data.max_connections,
		is_active: data.is_active,
		owner_only: data.owner_only,
		allow_repeat_device: data.allow_repeat_device,
		bonus_days_monthly: data.bonus_days_monthly,
		bonus_days_quarterly: data.bonus_days_quarterly,
		description: data.description,
		created_by_id: context.userId
	};
	if (data.id) {
		const { error } = await supabaseAdmin.from("test_links").update(payload).eq("id", data.id);
		if (error) throw error;
	} else {
		const { error } = await supabaseAdmin.from("test_links").insert(payload);
		if (error) throw error;
	}
	return { ok: true };
});
var deleteTestLink_createServerFn_handler = createServerRpc({
	id: "b22cab00db581279574cb639893d2bf934896c79ffcc37a003e6edc9b5fc82d7",
	name: "deleteTestLink",
	filename: "src/lib/test-links.functions.ts"
}, (opts) => deleteTestLink.__executeServer(opts));
var deleteTestLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(deleteTestLink_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { error } = await supabaseAdmin.from("test_links").delete().eq("id", data.id);
	if (error) throw error;
	return { ok: true };
});
var createTestUser_createServerFn_handler = createServerRpc({
	id: "e056343c43757919d3c8ea2820c1687458d0dd801bc0b92ca0e6b6ccc3134eeb",
	name: "createTestUser",
	filename: "src/lib/test-links.functions.ts"
}, (opts) => createTestUser.__executeServer(opts));
var createTestUser = createServerFn({ method: "POST" }).inputValidator((input) => objectType({
	slug: stringType(),
	fingerprint: stringType(),
	referral_code: stringType().nullable().optional()
}).parse(input)).handler(createTestUser_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const request = getRequest();
	const origin = (() => {
		try {
			return new URL(request?.url ?? "https://stream.mago-bot.com").origin;
		} catch {
			const host = request?.headers.get("x-forwarded-host") || request?.headers.get("host") || "stream.mago-bot.com";
			return `${request?.headers.get("x-forwarded-proto") || "https"}://${host}`;
		}
	})();
	const ip = request?.headers.get("x-forwarded-for") || request?.headers.get("x-real-ip") || null;
	let referredById = null;
	if (data.referral_code) {
		const { data: refUser } = await supabaseAdmin.from("profiles").select("id").eq("referral_code", data.referral_code).maybeSingle();
		if (refUser) referredById = refUser.id;
	}
	const { data: link, error: linkError } = await supabaseAdmin.from("test_links").select("*").eq("slug", data.slug).eq("is_active", true).maybeSingle();
	if (linkError || !link) throw new Error("Link de teste inválido ou inativo.");
	if (!shouldBypassDeviceTracking(link)) {
		const { data: existingDevice } = await supabaseAdmin.from("test_device_tracking").select("id").eq("fingerprint", data.fingerprint).maybeSingle();
		if (existingDevice) throw new Error("Você já gerou um teste grátis neste dispositivo. Para novos acessos, entre em contato com o suporte.");
		const { error: trackError } = await supabaseAdmin.from("test_device_tracking").insert({
			fingerprint: data.fingerprint,
			ip_address: ip
		});
		if (trackError) {
			if (trackError.code === "23505") throw new Error("Este dispositivo já foi utilizado para gerar um teste.");
			throw new Error("Erro ao validar o dispositivo. Tente novamente.");
		}
	}
	const username = `teste_${Math.random().toString(36).substring(2, 8)}`;
	const password = Math.random().toString(36).substring(2, 10);
	const expiresAt = new Date(Date.now() + link.duration_minutes * 60 * 1e3).toISOString();
	const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
		email: usernameToEmail(username),
		password,
		email_confirm: true,
		user_metadata: {
			username,
			account_kind: "test",
			test_link_slug: link.slug,
			referral_source_slug: link.slug,
			referral_source_code: data.referral_code ?? null
		}
	});
	if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar teste.");
	const newUserId = created.user.id;
	const { data: testPlan } = await supabaseAdmin.from("subscription_plans").select("id").ilike("name", "%teste%").limit(1).single();
	await supabaseAdmin.from("profiles").insert({
		id: newUserId,
		username,
		display_name: `Teste (${link.slug})`,
		max_connections: link.max_connections,
		expires_at: expiresAt,
		is_active: true,
		plan_id: testPlan?.id || null,
		referral_code: null,
		referred_by_id: referredById,
		referral_source_slug: link.slug,
		referral_source_code: data.referral_code ?? null,
		referral_source_url: `${origin}/teste/${link.slug}?ref=${data.referral_code ?? ""}`
	});
	await supabaseAdmin.from("user_roles").insert({
		user_id: newUserId,
		role: "user"
	});
	const { data: servers } = await supabaseAdmin.from("iptv_servers").select("id").eq("is_active", true);
	if (servers && servers.length > 0) await supabaseAdmin.from("user_server_access").insert(servers.map((s) => ({
		user_id: newUserId,
		server_id: s.id
	})));
	return {
		username,
		password,
		expiresAt
	};
});
//#endregion
export { checkDeviceBlocked_createServerFn_handler, createTestUser_createServerFn_handler, deleteTestLink_createServerFn_handler, listTestLinksPage_createServerFn_handler, listTestLinks_createServerFn_handler, saveTestLink_createServerFn_handler };
