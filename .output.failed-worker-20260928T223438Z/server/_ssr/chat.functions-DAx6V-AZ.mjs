import { c as createServerFn } from "./createServerFn-BsVP-4Ld.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-B5qtjxOb.mjs";
import { a as numberType, n as booleanType, o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
import { t as createSsrRpc } from "./createSsrRpc-D2E2B7L3.mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/chat.functions-DAx6V-AZ.js
var listSupportThreads = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("c22d15e56609f83f0041ff128a9b3bdd73f970690ec0fb08ed7ec77daeceebda"));
var listMySupportThreads = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("3fdbc83a6859908badbb9e1dd6d6294f2437dfa55921fd01fa02b9640aa2a643"));
var listSupportThreadsPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	page: numberType().int().min(1),
	page_size: numberType().int().min(1).max(100)
}).parse(data)).handler(createSsrRpc("cb7e37e21557ca5564b71596de67c5c4ffb152eff32bd00570d57eabc7720736"));
var getOrCreateThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({ userId: stringType().uuid() }).parse(data)).handler(createSsrRpc("97b35e74b107644a6e584316b1214fe8a1860c7362d04359f2358021651adc63"));
var markThreadRead = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	isOwner: booleanType()
}).parse(data)).handler(createSsrRpc("7404f455952cf380c26a31a984a2f239982e81c95f04f99d44793188f79e2dc6"));
var listSupportMessagesPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	page: numberType().int().min(1),
	page_size: numberType().int().min(1).max(100)
}).parse(data)).handler(createSsrRpc("7ee1b9559aaef38ddffa250e44e97b9b949a517e8d3ee7b7af17e1fcd086560f"));
var closeSupportThread = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	closedByRole: enumType(["owner", "client"]).optional()
}).parse(data)).handler(createSsrRpc("c9b67a24aa33f2bd4625ed74bc90396e3eef12d5b2b7973997479fdf9a29b25b"));
var respondToClosurePrompt = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	keepOpen: booleanType()
}).parse(data)).handler(createSsrRpc("b3068437fd06fb6cb87be643ea47546fd193a495cf9047e95b4605428fdf3c64"));
var submitSupportSatisfaction = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	score: numberType().int().min(1).max(5),
	note: stringType().max(1e3).nullable().optional()
}).parse(data)).handler(createSsrRpc("48fa8e077de41d67b283ac3a22136bb7dd9e62b0e2dd76b9c0c2f268860d07b6"));
var getSupportStats = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("8f9ec3654ae2ec5ece912cf1b3a15557b1095a0a46d6e4f2547446435eed3fa6"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({
	threadId: stringType().uuid(),
	content: stringType().min(1)
}).parse(data)).handler(createSsrRpc("b0d7e2b9fdcb7ea2db8fd4d09497b43e5ffbc0e45a3eacb35bd9ae94012d7297"));
var sendSupportMessage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => objectType({ content: stringType().min(1) }).parse(data)).handler(createSsrRpc("87dd3d6a88d43c8b10cd4262f79634b6906bddbc71b3b0c059866712d345612d"));
//#endregion
export { listSupportMessagesPage as a, markThreadRead as c, submitSupportSatisfaction as d, listMySupportThreads as i, respondToClosurePrompt as l, getOrCreateThread as n, listSupportThreads as o, getSupportStats as r, listSupportThreadsPage as s, closeSupportThread as t, sendSupportMessage as u };
