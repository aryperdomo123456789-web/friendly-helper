import { r as createServerFn } from "./server-DRqQh07e.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-DiK98CB2.mjs";
import { n as booleanType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createSsrRpc } from "./createSsrRpc-BFhkhFn3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payments.functions-DTKlH7MI.js
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("6b379f933b455e6937dc7302f0c0165be3fdfbdd84b6ee5bf8898ac9b9da969e"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({
	mp_access_token: stringType(),
	mp_public_key: stringType(),
	mp_webhook_secret: stringType().optional().default(""),
	mp_enabled: booleanType()
}).parse(input)).handler(createSsrRpc("b9c72bfe2cc11d479ea4f26ef559a94081e0a4b5c1eabffba49f766a79dece37"));
var createPaymentPreference = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({ planId: stringType().uuid() }).parse(input)).handler(createSsrRpc("c536a5a4eaedae980fda275d038d94edefe663993e8ab12a52ef883029c7686c"));
//#endregion
export { createPaymentPreference as t };
