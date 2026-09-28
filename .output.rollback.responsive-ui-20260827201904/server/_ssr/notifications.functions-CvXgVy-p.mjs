import { r as createServerFn } from "./server-BmxkSN0b.mjs";
import { t as createServerRpc } from "./createServerRpc-Cc1iyOPh.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-iTZN7M01.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications.functions-CvXgVy-p.js
async function assertOwner(supabase, userId) {
	const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).in("role", ["owner", "admin"]);
	if (error) throw new Error(error.message);
	if (!data || data.length === 0) throw new Error("Acesso restrito à área administrativa.");
}
var getNotifications_createServerFn_handler = createServerRpc({
	id: "c0aad9f33018b8faf6632300a6819e56cab5d97dccf9d8d06ce4d7db41fcaec8",
	name: "getNotifications",
	filename: "src/lib/notifications.functions.ts"
}, (opts) => getNotifications.__executeServer(opts));
var getNotifications = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getNotifications_createServerFn_handler, async ({ context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data, error } = await supabaseAdmin.from("notifications").select("*").eq("user_id", context.userId).order("created_at", { ascending: false });
	if (error) throw error;
	return data || [];
});
var markNotificationRead_createServerFn_handler = createServerRpc({
	id: "385e76cdf807dd53711b6f969d894db85cf9b0ca7a6373bb34c6352adedccb64",
	name: "markNotificationRead",
	filename: "src/lib/notifications.functions.ts"
}, (opts) => markNotificationRead.__executeServer(opts));
var markNotificationRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((id) => stringType().uuid().parse(id)).handler(markNotificationRead_createServerFn_handler, async ({ data: id, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { error } = await supabaseAdmin.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", context.userId);
	if (error) throw error;
	return { success: true };
});
var sendMassNotification_createServerFn_handler = createServerRpc({
	id: "452c25b1acaeeed2eeb0d9cac6290ff00b77872f8ae12771d6ed289dd75fd438",
	name: "sendMassNotification",
	filename: "src/lib/notifications.functions.ts"
}, (opts) => sendMassNotification.__executeServer(opts));
var sendMassNotification = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	title: stringType().min(1).max(120),
	content: stringType().min(1).max(1e3)
}).parse(data)).handler(sendMassNotification_createServerFn_handler, async ({ data, context }) => {
	await assertOwner(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data: profiles } = await supabaseAdmin.from("profiles").select("id").eq("is_active", true);
	if (!profiles || profiles.length === 0) return { count: 0 };
	const notifications = profiles.map((p) => ({
		user_id: p.id,
		title: data.title,
		content: data.content,
		type: "mass"
	}));
	const { error } = await supabaseAdmin.from("notifications").insert(notifications);
	if (error) throw error;
	return { count: profiles.length };
});
//#endregion
export { getNotifications_createServerFn_handler, markNotificationRead_createServerFn_handler, sendMassNotification_createServerFn_handler };
