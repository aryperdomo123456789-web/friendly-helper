import { c as createServerFn } from "./createServerFn-BsVP-4Ld.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-B5qtjxOb.mjs";
import { o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
import { t as createSsrRpc } from "./createSsrRpc-D2E2B7L3.mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/player.functions-RwbkViHM.js
var kindSchema = enumType([
	"live",
	"movie",
	"series"
]);
var getMySession = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("5a53425a6ba5d82e0ac710ee869aad565c0b77d108d48554a5c4862cfb2188a3"));
var heartbeat = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	device_id: stringType().min(6).max(80),
	user_agent: stringType().max(300).optional()
}).parse(input)).handler(createSsrRpc("c8c06c4df7f8510b1a195c326e631cac62865c644cf931170cd03edc2906db61"));
var getCategories = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	server_id: stringType().uuid(),
	kind: kindSchema
}).parse(input)).handler(createSsrRpc("d82c3ab9ec8654d231beac14dd06390dd642a872832beac86a8132d19579dc0a"));
var getStreams = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	server_id: stringType().uuid(),
	kind: kindSchema,
	category_id: stringType().optional()
}).parse(input)).handler(createSsrRpc("945be02e67fd60812ba2b235b8f30973eb6dcd8102d40489c51182124371f38f"));
var getSeriesInfo = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	server_id: stringType().uuid(),
	series_id: stringType().max(30)
}).parse(input)).handler(createSsrRpc("77368e364414fb6e2e4cdad0ffba3517781940312416ece93b74646e3202b1a0"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	server_id: stringType().uuid(),
	vod_id: stringType().max(30)
}).parse(input)).handler(createSsrRpc("1dfa9b483c7acfd93cf98f103bb06dece02d62b88a16bc47de0cc433bee56a64"));
var getPlaybackUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	server_id: stringType().uuid(),
	kind: kindSchema,
	stream_id: stringType().max(30),
	ext: stringType().max(10).optional(),
	device_id: stringType().min(6).max(80)
}).parse(input)).handler(createSsrRpc("70ffaa3d751d473eac85cd9381466e6caad603f4f18bcef23d1a7ee7cf6472ef"));
var getChannelEPG = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	server_id: stringType().uuid(),
	stream_id: stringType().max(30)
}).parse(input)).handler(createSsrRpc("97658b6b3749775b6e85afb0093cc36628da2b8a3baabd1183f79423fb938106"));
var getEnrichedMetadata = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	kind: enumType(["movie", "series"]),
	name: stringType(),
	year: stringType().optional()
}).parse(input)).handler(createSsrRpc("c89e4dbcaec1b5d84f8636baedc089b19d1e8225ee105a82858295f82887e3a2"));
//#endregion
export { getPlaybackUrl as a, heartbeat as c, getMySession as i, getChannelEPG as n, getSeriesInfo as o, getEnrichedMetadata as r, getStreams as s, getCategories as t };
