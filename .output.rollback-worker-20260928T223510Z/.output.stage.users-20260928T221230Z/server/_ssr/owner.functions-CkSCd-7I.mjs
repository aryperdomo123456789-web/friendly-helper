import { c as createServerFn } from "./createServerFn-BJ2lovJL.mjs";
import { t as createServerRpc } from "./createServerRpc-BJa3uYoB.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-C527WGIA.mjs";
import { n as generateUniqueReferralCode, r as isReferralEligiblePlan, t as ensureUserReferralCode } from "./referral-code-CKiYkjE0.mjs";
import { a as numberType, i as literalType, n as booleanType, o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { t as clearLocalImageCache } from "./server-media-cache.server-DmVNVbpE.mjs";
import { n as clearServerPlaylistCache, s as refreshServerCatalogCache, t as clearServerCache } from "./iptv-cache.server-B0L6UIui.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/owner.functions-CkSCd-7I.js
var SYNTHETIC_EMAIL_DOMAIN = "iptv.local";
function usernameToEmail(username) {
	return `${username.trim().toLowerCase()}@${SYNTHETIC_EMAIL_DOMAIN}`;
}
var credentialSchema = objectType({
	username: stringType().trim().max(120).default(""),
	password: stringType().trim().max(200).default(""),
	dns: stringType().trim().max(300).default("")
});
var serverSchema = objectType({
	id: stringType().uuid().optional(),
	name: stringType().trim().min(1).max(120),
	is_active: booleanType().default(true),
	sort_order: numberType().int().min(0).max(999).default(0),
	credentials: arrayType(credentialSchema).max(6).default([]),
	bulk_action: enumType([
		"none",
		"add_to_all",
		"remove_from_all"
	]).optional().default("none")
});
var accessUserSchema = objectType({
	username: stringType().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9._-]+$/, "Use apenas letras, numeros, ponto, hifen ou underline"),
	password: stringType().min(6).max(72),
	max_connections: numberType().int().min(1).max(20),
	expires_at: stringType().datetime().nullable().optional(),
	display_name: stringType().trim().max(120).optional(),
	server_ids: arrayType(stringType().uuid()).min(1),
	plan_id: stringType().uuid().nullable().optional()
});
var accessUsersPageSchema = objectType({
	search: stringType().trim().max(120).default(""),
	status: enumType([
		"all",
		"active",
		"blocked",
		"expired",
		"online"
	]).default("all"),
	server_id: stringType().uuid().nullable().optional(),
	plan_id: stringType().uuid().nullable().optional(),
	referral: enumType([
		"all",
		"direct",
		"referred"
	]).default("all"),
	sort_order: enumType([
		"newest",
		"oldest",
		"expiry"
	]).default("newest"),
	page: numberType().int().min(1).default(1),
	page_size: numberType().int().min(1).max(1e3).default(10)
});
var reorderServersSchema = objectType({ ids: arrayType(stringType().uuid()).min(1) });
async function assertOwner(supabase, userId) {
	const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).in("role", ["owner", "admin"]);
	if (error) throw new Error(error.message);
	if (!data || data.length === 0) throw new Error("Acesso restrito à área administrativa.");
}
async function assertNotOwnerAccount(supabase, userId) {
	const [{ data: roleRows, error: roleError }, { data: profile, error: profileError }] = await Promise.all([supabase.from("user_roles").select("role").eq("user_id", userId).in("role", ["owner", "admin"]).limit(1), supabase.from("profiles").select("username").eq("id", userId).maybeSingle()]);
	if (roleError) throw new Error(roleError.message);
	if (profileError) throw new Error(profileError.message);
	if ((roleRows ?? []).length > 0 || profile?.username === "magodono") throw new Error("O usuário owner/admin (@magodono) não pode ser apagado.");
}
async function clearUserRelationsForDeletion(supabaseAdmin, ids) {
	const cleanupError = (await Promise.all([
		supabaseAdmin.from("profiles").update({ referred_by_id: null }).in("referred_by_id", ids),
		supabaseAdmin.from("profiles").update({ created_by: null }).in("created_by", ids),
		supabaseAdmin.from("iptv_servers").update({ created_by: null }).in("created_by", ids),
		supabaseAdmin.from("test_links").update({ created_by_id: null }).in("created_by_id", ids),
		supabaseAdmin.from("device_sessions").delete().in("user_id", ids),
		supabaseAdmin.from("user_server_access").delete().in("user_id", ids),
		supabaseAdmin.from("user_roles").delete().in("user_id", ids),
		supabaseAdmin.from("notifications").delete().in("user_id", ids),
		supabaseAdmin.from("audit_logs").update({ actor_user_id: null }).in("actor_user_id", ids),
		supabaseAdmin.from("audit_logs").update({ target_user_id: null }).in("target_user_id", ids),
		supabaseAdmin.from("support_messages").update({ sender_id: null }).in("sender_id", ids),
		supabaseAdmin.from("support_threads").update({
			assigned_to_user_id: null,
			closed_by_user_id: null
		}).or(`assigned_to_user_id.in.(${ids.join(",")}),closed_by_user_id.in.(${ids.join(",")})`),
		supabaseAdmin.from("support_threads").delete().in("user_id", ids)
	])).find((result) => result.error)?.error;
	if (cleanupError) throw cleanupError;
}
async function deleteProfilesForDeletion(supabaseAdmin, ids) {
	const { error } = await supabaseAdmin.from("profiles").delete().in("id", ids);
	if (error) throw error;
}
var listServers_createServerFn_handler = createServerRpc({
	id: "0df55653e2d27074f970a44a5bbdfaae59fecf1c87c1bae75e8b95a92df720b3",
	name: "listServers",
	filename: "src/lib/owner.functions.ts"
}, (opts) => listServers.__executeServer(opts));
var listServers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listServers_createServerFn_handler, async ({ context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const [{ data: servers, error }, { data: credentials, error: credentialsError }] = await Promise.all([supabaseAdmin.from("iptv_servers").select("id, name, url, is_active, sort_order, created_at").order("sort_order").order("created_at"), supabaseAdmin.from("server_credentials").select("server_id, username, password, dns")]);
	if (error) throw error;
	if (credentialsError) throw credentialsError;
	const credentialByServerId = new Map((credentials ?? []).map((credential) => [credential.server_id, credential]));
	return (servers ?? []).map((server) => ({
		id: server.id,
		name: server.name,
		url: server.url,
		is_active: server.is_active,
		sort_order: server.sort_order,
		created_at: server.created_at,
		credentials: credentialByServerId.has(server.id) ? [credentialByServerId.get(server.id)] : []
	}));
});
var saveServer_createServerFn_handler = createServerRpc({
	id: "c4bda250d4b3a233bbb81695d0dcfffdfe9d3f448e6f179a89977b374e538770",
	name: "saveServer",
	filename: "src/lib/owner.functions.ts"
}, (opts) => saveServer.__executeServer(opts));
var saveServer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => serverSchema.parse(input)).handler(saveServer_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const filledCredentials = (data.credentials ?? []).map((credential) => ({
		username: credential.username.trim(),
		password: credential.password.trim(),
		dns: credential.dns.trim()
	})).filter((credential) => credential.username || credential.password || credential.dns);
	if (!data.id && filledCredentials.length === 0) throw new Error("Informe ao menos uma credencial para criar o servidor.");
	const existingCredentialResult = data.id ? await supabaseAdmin.from("server_credentials").select("username, password, dns").eq("server_id", data.id).maybeSingle() : null;
	if (existingCredentialResult?.error) throw existingCredentialResult.error;
	const existingCredential = existingCredentialResult?.data ?? null;
	const inputCredential = filledCredentials[0] ?? null;
	const resolvedCredential = {
		username: inputCredential?.username || existingCredential?.username || "",
		password: inputCredential?.password || existingCredential?.password || "",
		dns: inputCredential?.dns || existingCredential?.dns || ""
	};
	if (!data.id ? !resolvedCredential.username || !resolvedCredential.password || !resolvedCredential.dns : Boolean(inputCredential) && (!resolvedCredential.username || !resolvedCredential.password || !resolvedCredential.dns)) throw new Error("Preencha usuário, senha e DNS para cadastrar as credenciais do servidor.");
	const nextDns = data.id ? resolvedCredential.dns || existingCredential?.dns || null : resolvedCredential.dns || null;
	let serverId = data.id;
	if (serverId) {
		const serverPayload = {
			name: data.name,
			is_active: data.is_active,
			sort_order: data.sort_order
		};
		if (nextDns) serverPayload.url = nextDns;
		const { error } = await supabaseAdmin.from("iptv_servers").update(serverPayload).eq("id", serverId);
		if (error) throw error;
	} else {
		const { data: created, error } = await supabaseAdmin.from("iptv_servers").insert({
			name: data.name,
			url: nextDns,
			is_active: data.is_active,
			sort_order: data.sort_order,
			created_by: context.userId
		}).select("id").single();
		if (error) throw error;
		serverId = created.id;
	}
	if (resolvedCredential.username || resolvedCredential.password || resolvedCredential.dns) {
		const { error: deleteError } = await supabaseAdmin.from("server_credentials").delete().eq("server_id", serverId);
		if (deleteError) throw deleteError;
		const { error: credError } = await supabaseAdmin.from("server_credentials").insert({
			server_id: serverId,
			username: resolvedCredential.username,
			password: resolvedCredential.password,
			dns: resolvedCredential.dns
		});
		if (credError) throw credError;
	}
	if (data.bulk_action === "add_to_all") {
		const { data: allUsers } = await supabaseAdmin.from("profiles").select("id");
		if (allUsers && allUsers.length > 0) {
			const userServerAccess = allUsers.map((u) => ({
				user_id: u.id,
				server_id: serverId
			}));
			await supabaseAdmin.from("user_server_access").upsert(userServerAccess, { onConflict: "user_id,server_id" });
		}
	} else if (data.bulk_action === "remove_from_all") await supabaseAdmin.from("user_server_access").delete().eq("server_id", serverId);
	refreshServerCatalogCache(serverId).catch((error) => {
		console.error("Falha ao recarregar o cache do servidor", error);
	});
	return { id: serverId };
});
var reorderServers_createServerFn_handler = createServerRpc({
	id: "27a6abcd45356c8f8285a8eb0ecc33bba00812db137d59685ddd55191701c910",
	name: "reorderServers",
	filename: "src/lib/owner.functions.ts"
}, (opts) => reorderServers.__executeServer(opts));
var reorderServers = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => reorderServersSchema.parse(input)).handler(reorderServers_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { data: result, error } = await context.supabase.rpc("admin_reorder_iptv_servers", { p_ordered_ids: data.ids });
	if (error) throw error;
	return result;
});
var deleteServer_createServerFn_handler = createServerRpc({
	id: "3101c3b3ff332f66249a68c88382b7467adddc9ffe1656c7aeab33132d9bf410",
	name: "deleteServer",
	filename: "src/lib/owner.functions.ts"
}, (opts) => deleteServer.__executeServer(opts));
var deleteServer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(deleteServer_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { error } = await supabaseAdmin.from("iptv_servers").delete().eq("id", data.id);
	if (error) throw error;
	await Promise.allSettled([
		clearServerCache(data.id),
		clearServerPlaylistCache(data.id),
		clearLocalImageCache(data.id)
	]);
	return { ok: true };
});
var refreshServerCache_createServerFn_handler = createServerRpc({
	id: "9498df06f48e8c94d623c84f6c767d8adaa80b65490768fd65afb7a8ccd26a1e",
	name: "refreshServerCache",
	filename: "src/lib/owner.functions.ts"
}, (opts) => refreshServerCache.__executeServer(opts));
var refreshServerCache = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	clear_local_before_fetch: booleanType().default(false)
}).parse(input)).handler(refreshServerCache_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	return {
		ok: true,
		...await refreshServerCatalogCache(data.id, { clearLocalBeforeFetch: data.clear_local_before_fetch })
	};
});
var testServerConnection_createServerFn_handler = createServerRpc({
	id: "c596562e79700110a0dab6fff8debc3eb4fd6dd0bfbe7a5410d7eb525a19b73a",
	name: "testServerConnection",
	filename: "src/lib/owner.functions.ts"
}, (opts) => testServerConnection.__executeServer(opts));
var testServerConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => credentialSchema.parse(input)).handler(testServerConnection_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { testCredentials } = await import("./iptv-cache.server-B0L6UIui.mjs").then((n) => n.r).then((n) => n.l);
	return testCredentials(data);
});
var listAccessUsers_createServerFn_handler = createServerRpc({
	id: "2da5776c4735c9bae60b44d0adc5abb626634413b3593a084d7509a9147e835b",
	name: "listAccessUsers",
	filename: "src/lib/owner.functions.ts"
}, (opts) => listAccessUsers.__executeServer(opts));
var listAccessUsers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listAccessUsers_createServerFn_handler, async ({ context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data: profiles, error } = await supabaseAdmin.from("profiles").select("id, username, display_name, max_connections, expires_at, is_active, created_at, plan_id, referred_by_id, plan:subscription_plans(*)").order("created_at", { ascending: false });
	if (error) throw error;
	const [{ data: access }, { data: devices }] = await Promise.all([supabaseAdmin.from("user_server_access").select("user_id, server_id"), supabaseAdmin.from("device_sessions").select("user_id, device_id, last_seen")]);
	const nameById = new Map((profiles ?? []).map((p) => [p.id, p.username]));
	const cutoff = Date.now() - 180 * 1e3;
	return (profiles ?? []).map((profile) => ({
		...profile,
		referred_by: profile.referred_by_id ? { username: nameById.get(profile.referred_by_id) ?? null } : null,
		server_ids: (access ?? []).filter((row) => row.user_id === profile.id).map((row) => row.server_id),
		online: (devices ?? []).filter((row) => row.user_id === profile.id && new Date(row.last_seen).getTime() > cutoff).length
	}));
});
var listAccessUsersPage_createServerFn_handler = createServerRpc({
	id: "123e0527c663a76ff620379bbdf7633eb4e70c9700c499c2251802c4da5edd03",
	name: "listAccessUsersPage",
	filename: "src/lib/owner.functions.ts"
}, (opts) => listAccessUsersPage.__executeServer(opts));
var listAccessUsersPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => accessUsersPageSchema.parse(input)).handler(listAccessUsersPage_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { data: result, error } = await context.supabase.rpc("admin_list_access_users", {
		p_search: data.search,
		p_status: data.status,
		p_server_id: data.server_id ?? null,
		p_plan_id: data.plan_id ?? null,
		p_referral: data.referral,
		p_sort_order: data.sort_order,
		p_page: data.page,
		p_page_size: data.page_size
	});
	if (error) throw error;
	return result;
});
var createAccessUser_createServerFn_handler = createServerRpc({
	id: "fb5e5aa15199bfd068081a9a68c67ab3fd99b72b548429fb038a9a890453c50b",
	name: "createAccessUser",
	filename: "src/lib/owner.functions.ts"
}, (opts) => createAccessUser.__executeServer(opts));
var createAccessUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => accessUserSchema.parse(input)).handler(createAccessUser_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
		email: usernameToEmail(data.username),
		password: data.password,
		email_confirm: true,
		user_metadata: { username: data.username }
	});
	if (error || !created.user) throw new Error(error?.message ?? "Falha ao criar acesso.");
	const newUserId = created.user.id;
	const { error: profileError } = await supabaseAdmin.from("profiles").insert({
		id: newUserId,
		username: data.username,
		display_name: data.display_name ?? data.username,
		max_connections: data.max_connections,
		expires_at: data.expires_at ?? null,
		plan_id: data.plan_id ?? null,
		created_by: context.userId
	});
	if (profileError) {
		await supabaseAdmin.auth.admin.deleteUser(newUserId);
		throw profileError;
	}
	if (!data.plan_id) {
		const ownReferralCode = await generateUniqueReferralCode(supabaseAdmin);
		const { error: referralError } = await supabaseAdmin.from("profiles").update({ referral_code: ownReferralCode }).eq("id", newUserId);
		if (referralError) throw referralError;
	} else {
		const { data: plan } = await supabaseAdmin.from("subscription_plans").select("id, name, price").eq("id", data.plan_id).maybeSingle();
		if (isReferralEligiblePlan(plan)) await ensureUserReferralCode(supabaseAdmin, newUserId, plan);
	}
	await supabaseAdmin.from("user_roles").insert({
		user_id: newUserId,
		role: "user"
	});
	await supabaseAdmin.from("user_server_access").insert(data.server_ids.map((serverId) => ({
		user_id: newUserId,
		server_id: serverId
	})));
	return { id: newUserId };
});
var updateAccessUser_createServerFn_handler = createServerRpc({
	id: "e0ba6f1b2a47e92c2a7637b30f65827b34091552d9af29d347b14918123d676c",
	name: "updateAccessUser",
	filename: "src/lib/owner.functions.ts"
}, (opts) => updateAccessUser.__executeServer(opts));
var updateAccessUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	password: stringType().min(6).max(72).optional().or(literalType("")),
	max_connections: numberType().int().min(1).max(20),
	expires_at: stringType().datetime().nullable().optional(),
	is_active: booleanType(),
	display_name: stringType().trim().max(120).optional(),
	server_ids: arrayType(stringType().uuid()).min(1),
	plan_id: stringType().uuid().nullable().optional()
}).parse(input)).handler(updateAccessUser_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { error } = await supabaseAdmin.from("profiles").update({
		max_connections: data.max_connections,
		expires_at: data.expires_at ?? null,
		is_active: data.is_active,
		display_name: data.display_name ?? null,
		plan_id: data.plan_id ?? null
	}).eq("id", data.id);
	if (error) throw error;
	if (data.plan_id) {
		const { data: plan } = await supabaseAdmin.from("subscription_plans").select("id, name, price").eq("id", data.plan_id).maybeSingle();
		if (isReferralEligiblePlan(plan)) await ensureUserReferralCode(supabaseAdmin, data.id, plan);
		else await supabaseAdmin.from("profiles").update({ referral_code: null }).eq("id", data.id);
	}
	if (data.password) {
		const { error: passError } = await supabaseAdmin.auth.admin.updateUserById(data.id, { password: data.password });
		if (passError) throw passError;
	}
	await supabaseAdmin.from("user_server_access").delete().eq("user_id", data.id);
	await supabaseAdmin.from("user_server_access").insert(data.server_ids.map((serverId) => ({
		user_id: data.id,
		server_id: serverId
	})));
	if (!data.is_active) await supabaseAdmin.from("device_sessions").delete().eq("user_id", data.id);
	return { ok: true };
});
var deleteAccessUser_createServerFn_handler = createServerRpc({
	id: "eab747be8d9163d579946c102b113bc3e9a0fffe16e332b0f9263d6a5e4dc209",
	name: "deleteAccessUser",
	filename: "src/lib/owner.functions.ts"
}, (opts) => deleteAccessUser.__executeServer(opts));
var deleteAccessUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(deleteAccessUser_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	await assertNotOwnerAccount(supabaseAdmin, data.id);
	await clearUserRelationsForDeletion(supabaseAdmin, [data.id]);
	const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
	if (error) throw error;
	await deleteProfilesForDeletion(supabaseAdmin, [data.id]);
	return { ok: true };
});
var deleteAccessUsersSchema = objectType({ ids: arrayType(stringType().uuid()).min(1).max(1e3) });
var deleteAccessUsers_createServerFn_handler = createServerRpc({
	id: "565abfff18d84d024f705fb156b85f71dc12f4992c25f14f1b93f4f847ac71b2",
	name: "deleteAccessUsers",
	filename: "src/lib/owner.functions.ts"
}, (opts) => deleteAccessUsers.__executeServer(opts));
var deleteAccessUsers = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => deleteAccessUsersSchema.parse(input)).handler(deleteAccessUsers_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const ids = [...new Set(data.ids)];
	if (ids.includes(context.userId)) throw new Error("A conta administrativa atual não pode ser excluída.");
	console.info("[admin-users] bulk_delete_start", { count: ids.length });
	const [protectedProfilesResult, protectedRolesResult] = await Promise.all([supabaseAdmin.from("profiles").select("id, username").in("id", ids), supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids).in("role", ["owner", "admin"])]);
	if (protectedProfilesResult.error) throw protectedProfilesResult.error;
	if (protectedRolesResult.error) throw protectedRolesResult.error;
	if ((protectedProfilesResult.data ?? []).some((profile) => profile.username === "magodono") || (protectedRolesResult.data ?? []).length > 0) throw new Error("A conta administrativa/dono não pode ser excluída.");
	await clearUserRelationsForDeletion(supabaseAdmin, ids);
	console.info("[admin-users] bulk_delete_cleanup_complete", { count: ids.length });
	const batchSize = 5;
	for (let offset = 0; offset < ids.length; offset += batchSize) {
		const deleteError = (await Promise.all(ids.slice(offset, offset + batchSize).map((id) => supabaseAdmin.auth.admin.deleteUser(id)))).find((result) => result.error)?.error;
		if (deleteError) throw deleteError;
	}
	await deleteProfilesForDeletion(supabaseAdmin, ids);
	console.info("[admin-users] bulk_delete_complete", { count: ids.length });
	return {
		ok: true,
		deleted: ids.length
	};
});
var kickDevices_createServerFn_handler = createServerRpc({
	id: "e55691324690c87b5306b63507fc16e400119d9bc1307ff1ba736b941f659ed7",
	name: "kickDevices",
	filename: "src/lib/owner.functions.ts"
}, (opts) => kickDevices.__executeServer(opts));
var kickDevices = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(kickDevices_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	await supabaseAdmin.from("device_sessions").delete().eq("user_id", data.id);
	return { ok: true };
});
//#endregion
export { createAccessUser_createServerFn_handler, deleteAccessUser_createServerFn_handler, deleteAccessUsers_createServerFn_handler, deleteServer_createServerFn_handler, kickDevices_createServerFn_handler, listAccessUsersPage_createServerFn_handler, listAccessUsers_createServerFn_handler, listServers_createServerFn_handler, refreshServerCache_createServerFn_handler, reorderServers_createServerFn_handler, saveServer_createServerFn_handler, testServerConnection_createServerFn_handler, updateAccessUser_createServerFn_handler };
