import { r as createServerFn } from "./server-BdIe17xm.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DjZmo9v7.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createSsrRpc } from "./createSsrRpc-DLePcdeQ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications.functions-cVFmb20u.js
var getNotifications = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("c0aad9f33018b8faf6632300a6819e56cab5d97dccf9d8d06ce4d7db41fcaec8"));
var markNotificationRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((id) => stringType().uuid().parse(id)).handler(createSsrRpc("385e76cdf807dd53711b6f969d894db85cf9b0ca7a6373bb34c6352adedccb64"));
var sendMassNotification = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	title: stringType().min(1).max(120),
	content: stringType().min(1).max(1e3)
}).parse(data)).handler(createSsrRpc("452c25b1acaeeed2eeb0d9cac6290ff00b77872f8ae12771d6ed289dd75fd438"));
//#endregion
export { markNotificationRead as n, sendMassNotification as r, getNotifications as t };
