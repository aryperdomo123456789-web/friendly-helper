import { c as createServerFn } from "./createServerFn-BJ2lovJL.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-C527WGIA.mjs";
import { a as numberType, i as literalType, n as booleanType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as createSsrRpc } from "./createSsrRpc-BlKNKHu1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/test-links.functions-BTBx9557.js
var checkDeviceBlocked = createServerFn({ method: "POST" }).inputValidator((input) => objectType({
	fingerprint: stringType().trim().min(8).max(200),
	slug: stringType().min(1)
}).parse(input)).handler(createSsrRpc("f94c5062750447c8b15f30f6570af04435932d0d5f4efa480b9d588cfe306e6f"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("45aada6ded07ac5475d96a3392b2b0e2c78a7b093d2176ad3cc8441b374768cf"));
var listTestLinksPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({
	page: numberType().int().min(1),
	page_size: numberType().int().min(1).max(100)
}).parse(input)).handler(createSsrRpc("0c0ee742b0c7014702d425e4387f1a2246eb11b609c8599e348737f523320de7"));
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
}).parse(input)).handler(createSsrRpc("438ff3736a4945e58121f91695f6aec4ba8a783b6a6d4df83c125ec6c60d8cdb"));
var deleteTestLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("b22cab00db581279574cb639893d2bf934896c79ffcc37a003e6edc9b5fc82d7"));
var createTestUser = createServerFn({ method: "POST" }).inputValidator((input) => objectType({
	slug: stringType(),
	fingerprint: stringType().trim().min(8).max(200),
	referral_code: stringType().nullable().optional()
}).parse(input)).handler(createSsrRpc("e056343c43757919d3c8ea2820c1687458d0dd801bc0b92ca0e6b6ccc3134eeb"));
//#endregion
export { saveTestLink as a, listTestLinksPage as i, createTestUser as n, deleteTestLink as r, checkDeviceBlocked as t };
