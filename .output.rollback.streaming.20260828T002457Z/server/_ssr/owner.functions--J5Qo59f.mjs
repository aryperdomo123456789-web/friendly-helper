import { r as createServerFn } from "./server-DyTiXMq0.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-CkS34ZPZ.mjs";
import { a as numberType, i as literalType, n as booleanType, o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { t as createSsrRpc } from "./createSsrRpc-BOQNjuhu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/owner.functions--J5Qo59f.js
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
	name: stringType().trim().max(120).optional(),
	is_active: booleanType().default(true),
	connection_capacity: numberType().int().min(1).max(1e6).nullable().optional(),
	sort_order: numberType().int().min(0).max(999).default(0),
	owner_note: stringType().trim().max(2e3).optional(),
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
var adminAuditPageSchema = objectType({
	page: numberType().int().min(1).default(1),
	page_size: numberType().int().min(1).max(50).default(10)
});
var listServers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("0df55653e2d27074f970a44a5bbdfaae59fecf1c87c1bae75e8b95a92df720b3"));
var saveServer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => serverSchema.parse(input)).handler(createSsrRpc("c4bda250d4b3a233bbb81695d0dcfffdfe9d3f448e6f179a89977b374e538770"));
var reorderServers = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => reorderServersSchema.parse(input)).handler(createSsrRpc("27a6abcd45356c8f8285a8eb0ecc33bba00812db137d59685ddd55191701c910"));
var deleteServer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("3101c3b3ff332f66249a68c88382b7467adddc9ffe1656c7aeab33132d9bf410"));
var refreshServerCache = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	clear_local_before_fetch: booleanType().default(false)
}).parse(input)).handler(createSsrRpc("9498df06f48e8c94d623c84f6c767d8adaa80b65490768fd65afb7a8ccd26a1e"));
var refreshOperationRefSchema = objectType({ operation_ref: stringType().uuid() });
var getRefreshOperationStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => refreshOperationRefSchema.parse(input)).handler(createSsrRpc("3850fb85ee03044d9541d68c78dbf32950bb13397162b52482c1257de6a15163"));
var cancelRefreshOperation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => refreshOperationRefSchema.parse(input)).handler(createSsrRpc("ca872cdb1e56937dbe74eeccfa081c602986d4dcf991d1f88569fcc4b2f9e221"));
var testServerConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => credentialSchema.parse(input)).handler(createSsrRpc("c596562e79700110a0dab6fff8debc3eb4fd6dd0bfbe7a5410d7eb525a19b73a"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("2da5776c4735c9bae60b44d0adc5abb626634413b3593a084d7509a9147e835b"));
var listAccessUsersPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => accessUsersPageSchema.parse(input)).handler(createSsrRpc("123e0527c663a76ff620379bbdf7633eb4e70c9700c499c2251802c4da5edd03"));
var listAdminAuditLogsPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => adminAuditPageSchema.parse(input)).handler(createSsrRpc("460bdb83b286b8c2a06ac6e6478fa389f9f45b6fe968b3d765e736d7aa2e3f23"));
var createAccessUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => accessUserSchema.parse(input)).handler(createSsrRpc("fb5e5aa15199bfd068081a9a68c67ab3fd99b72b548429fb038a9a890453c50b"));
var updateAccessUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid(),
	password: stringType().min(6).max(72).optional().or(literalType("")),
	max_connections: numberType().int().min(1).max(20),
	expires_at: stringType().datetime().nullable().optional(),
	is_active: booleanType(),
	display_name: stringType().trim().max(120).optional(),
	server_ids: arrayType(stringType().uuid()).min(1),
	plan_id: stringType().uuid().nullable().optional()
}).parse(input)).handler(createSsrRpc("e0ba6f1b2a47e92c2a7637b30f65827b34091552d9af29d347b14918123d676c"));
var deleteAccessUser = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("eab747be8d9163d579946c102b113bc3e9a0fffe16e332b0f9263d6a5e4dc209"));
var kickDevices = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("e55691324690c87b5306b63507fc16e400119d9bc1307ff1ba736b941f659ed7"));
//#endregion
export { getRefreshOperationStatus as a, listAdminAuditLogsPage as c, reorderServers as d, saveServer as f, usernameToEmail as h, deleteServer as i, listServers as l, updateAccessUser as m, createAccessUser as n, kickDevices as o, testServerConnection as p, deleteAccessUser as r, listAccessUsersPage as s, cancelRefreshOperation as t, refreshServerCache as u };
