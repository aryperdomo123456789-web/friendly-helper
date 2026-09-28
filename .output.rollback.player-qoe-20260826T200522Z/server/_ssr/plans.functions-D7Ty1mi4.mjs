import { r as createServerFn } from "./server-Bps3DQUn.mjs";
import { t as createServerRpc } from "./createServerRpc-CYsbt8Qc.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-1oRefi0g.mjs";
import { a as numberType, o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/plans.functions-D7Ty1mi4.js
var getPlans_createServerFn_handler = createServerRpc({
	id: "49d8a6541eea958f3e11c872947b3750133c16465f3b663cf35cf11f816ef144",
	name: "getPlans",
	filename: "src/lib/plans.functions.ts"
}, (opts) => getPlans.__executeServer(opts));
var getPlans = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getPlans_createServerFn_handler, async ({ context }) => {
	const { data, error } = await context.supabase.from("subscription_plans").select("*").order("price", { ascending: true });
	if (error) throw error;
	return data;
});
var getPlansPage_createServerFn_handler = createServerRpc({
	id: "affe13aa46872666a380fba9a413c18315f41a205f445d5941dfee3cfed4e270",
	name: "getPlansPage",
	filename: "src/lib/plans.functions.ts"
}, (opts) => getPlansPage.__executeServer(opts));
var getPlansPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({
	page: numberType().int().min(1),
	page_size: numberType().int().min(1).max(100)
}).parse(input)).handler(getPlansPage_createServerFn_handler, async ({ data, context }) => {
	const { count, error: countError } = await context.supabase.from("subscription_plans").select("id", {
		count: "exact",
		head: true
	});
	if (countError) throw countError;
	const total = count ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / data.page_size));
	const page = Math.min(Math.max(data.page, 1), totalPages);
	const from = (page - 1) * data.page_size;
	const to = from + data.page_size - 1;
	const { data: rows, error } = await context.supabase.from("subscription_plans").select("*").order("price", { ascending: true }).range(from, to);
	if (error) throw error;
	return {
		items: rows,
		total,
		page,
		page_size: data.page_size
	};
});
var savePlan_createServerFn_handler = createServerRpc({
	id: "f23810eab4916b6d6009102fcfad885da3155a9fa89da169d7250eecd5e19bba",
	name: "savePlan",
	filename: "src/lib/plans.functions.ts"
}, (opts) => savePlan.__executeServer(opts));
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
}).parse(input)).handler(savePlan_createServerFn_handler, async ({ data: input, context }) => {
	const { id, ...data } = input;
	let duration_days = data.duration_value;
	if (data.duration_unit === "hours") duration_days = Math.ceil(data.duration_value / 24);
	else if (data.duration_unit === "minutes") duration_days = Math.ceil(data.duration_value / 1440);
	const dbData = {
		...data,
		duration_days
	};
	if (id) {
		const { error } = await context.supabase.from("subscription_plans").update(dbData).eq("id", id);
		if (error) throw error;
	} else {
		const { error } = await context.supabase.from("subscription_plans").insert(dbData);
		if (error) throw error;
	}
	return { success: true };
});
var deletePlan_createServerFn_handler = createServerRpc({
	id: "0557eba23eeafe80ed80072a2098f3394176e960bfb8557c189abd87e974050e",
	name: "deletePlan",
	filename: "src/lib/plans.functions.ts"
}, (opts) => deletePlan.__executeServer(opts));
var deletePlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({ id: stringType() }).parse(input)).handler(deletePlan_createServerFn_handler, async ({ data: input, context }) => {
	const { error } = await context.supabase.from("subscription_plans").delete().eq("id", input.id);
	if (error) throw error;
	return { success: true };
});
//#endregion
export { deletePlan_createServerFn_handler, getPlansPage_createServerFn_handler, getPlans_createServerFn_handler, savePlan_createServerFn_handler };
