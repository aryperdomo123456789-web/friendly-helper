import { r as createServerFn } from "./server-RH7bo_Nk.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BuoucNO5.mjs";
import { a as numberType, o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
import { t as createSsrRpc } from "./createSsrRpc-C3-bG1mR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/plans.functions-B2CZFeD4.js
var getPlans = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("49d8a6541eea958f3e11c872947b3750133c16465f3b663cf35cf11f816ef144"));
var getPlansPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({
	page: numberType().int().min(1),
	page_size: numberType().int().min(1).max(100)
}).parse(input)).handler(createSsrRpc("affe13aa46872666a380fba9a413c18315f41a205f445d5941dfee3cfed4e270"));
var savePlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({
	id: stringType().optional(),
	name: stringType(),
	price: numberType(),
	duration_value: numberType(),
	duration_unit: enumType([
		"days",
		"hours",
		"minutes"
	]),
	max_connections: numberType()
}).parse(input)).handler(createSsrRpc("f23810eab4916b6d6009102fcfad885da3155a9fa89da169d7250eecd5e19bba"));
var deletePlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({ id: stringType() }).parse(input)).handler(createSsrRpc("0557eba23eeafe80ed80072a2098f3394176e960bfb8557c189abd87e974050e"));
//#endregion
export { savePlan as i, getPlans as n, getPlansPage as r, deletePlan as t };
