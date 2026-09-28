import { r as createServerFn } from "./server-CCRJVKEk.mjs";
import { t as createServerRpc } from "./createServerRpc-CiDVN6rK.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-Dermeex9.mjs";
import { a as numberType, n as booleanType, o as objectType, r as enumType, s as stringType, t as arrayType } from "../_libs/zod.mjs";
import { i as getAppConfig } from "./config.functions-CtWkoSvu.mjs";
import { a as parsePlaylistCatalog, l as serverCatalogCacheKey, o as readServerCache, r as getPlaybackExtensions, s as readServerPlaylistCache, u as writeServerCache } from "./iptv-cache.server-BOa6QiZJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/player.functions-Bv1rSSd3.js
var kindSchema = enumType([
	"live",
	"movie",
	"series"
]);
var streamCacheMap = {
	live: {
		categories: "get_live_categories",
		streams: "get_live_streams"
	},
	movie: {
		categories: "get_vod_categories",
		streams: "get_vod_streams"
	},
	series: {
		categories: "get_series_categories",
		streams: "get_series"
	}
};
async function claimDeviceSession(params) {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data, error } = await supabaseAdmin.rpc("claim_device_session", {
		p_user_id: params.userId,
		p_server_id: params.serverId,
		p_device_id: params.deviceId,
		p_user_agent: params.userAgent ?? null
	});
	if (error) throw new Error(`Falha ao reservar a conexão: ${error.message}`);
	const result = data?.[0] ?? null;
	if (!result) throw new Error("Falha ao reservar a conexão: resposta inválida.");
	if (result.allowed) return result;
	if (result.reason === "server_limit") {
		const capacity = result.server_limit ? ` (${result.server_active}/${result.server_limit})` : "";
		throw new Error(`Capacidade de conexões do servidor atingida${capacity}.`);
	}
	if (result.reason === "user_limit") throw new Error(`Limite de ${result.user_limit ?? 0} conexões simultâneas atingido neste acesso.`);
	throw new Error("Servidor indisponível para novas conexões.");
}
var RESOLVE_ACCESS_TTL_MS = 15e3;
var resolveAccessCache = /* @__PURE__ */ new Map();
var resolveAccessPending = /* @__PURE__ */ new Map();
function normalizeStreams(result) {
	return result.slice(0, 4e3).map((item) => ({
		id: String(item.stream_id ?? item.series_id ?? item.num ?? item.M_ID ?? item.m_id ?? ""),
		name: item.name,
		icon: item.stream_icon || item.cover || null,
		ext: item.container_extension ?? null,
		rating: item.rating ?? null,
		category_id: item.category_id ?? null
	})).filter((item) => Boolean(item.id) && Boolean(item.name));
}
function normalizeCategoryValue(value) {
	return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}
function isCategoryScoped(items, categoryId) {
	if (!items.length) return false;
	const target = normalizeCategoryValue(categoryId);
	if (!target) return false;
	const categories = new Set(items.map((item) => normalizeCategoryValue(item.category_id)).filter(Boolean));
	return categories.size === 1 && categories.has(target);
}
async function resolveAccess(userId, serverId) {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const cacheKey = `${userId}:${serverId}`;
	const cached = resolveAccessCache.get(cacheKey);
	if (cached && cached.expiresAt > Date.now()) return cached.value;
	const pending = resolveAccessPending.get(cacheKey);
	if (pending) return pending;
	const promise = (async () => {
		const [{ data: profile }, { data: roles }] = await Promise.all([supabaseAdmin.from("profiles").select("id, username, max_connections, expires_at, is_active").eq("id", userId).maybeSingle(), supabaseAdmin.from("user_roles").select("role").eq("user_id", userId)]);
		const isOwner = !profile || !!roles?.some((r) => r.role === "owner" || r.role === "admin");
		if (profile && !isOwner) {
			if (!profile.is_active) throw new Error("Acesso desativado. Fale com o suporte.");
			if (profile.expires_at && new Date(profile.expires_at).getTime() < Date.now()) throw new Error("Acesso expirado. Renove com o suporte.");
			const { count } = await supabaseAdmin.from("user_server_access").select("id", {
				count: "exact",
				head: true
			}).eq("user_id", userId).eq("server_id", serverId);
			if (!count) throw new Error("Servidor não liberado para este acesso.");
		}
		const { data: server } = await supabaseAdmin.from("iptv_servers").select("id, name, is_active").eq("id", serverId).maybeSingle();
		if (!server || !server.is_active) throw new Error("Servidor indisponível.");
		const { data: creds } = await supabaseAdmin.from("server_credentials").select("username, password, dns").eq("server_id", serverId).order("created_at", { ascending: false }).limit(1);
		const first = creds?.[0];
		if (!first) throw new Error("Servidor sem credenciais cadastradas.");
		const value = {
			credential: {
				...first,
				dnsPool: (creds ?? []).map((c) => c.dns).filter(Boolean)
			},
			server: {
				id: server.id,
				name: server.name,
				is_active: server.is_active
			},
			isOwner
		};
		resolveAccessCache.set(cacheKey, {
			expiresAt: Date.now() + RESOLVE_ACCESS_TTL_MS,
			value
		});
		return value;
	})();
	resolveAccessPending.set(cacheKey, promise);
	try {
		return await promise;
	} finally {
		resolveAccessPending.delete(cacheKey);
	}
}
var getMySession_createServerFn_handler = createServerRpc({
	id: "5a53425a6ba5d82e0ac710ee869aad565c0b77d108d48554a5c4862cfb2188a3",
	name: "getMySession",
	filename: "src/lib/player.functions.ts"
}, (opts) => getMySession.__executeServer(opts));
var getMySession = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getMySession_createServerFn_handler, async ({ context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const [{ data: profile }, { data: roles }] = await Promise.all([supabaseAdmin.from("profiles").select("id, username, display_name, max_connections, expires_at, is_active").eq("id", context.userId).maybeSingle(), supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId)]);
	const roleList = (roles ?? []).map((row) => row.role);
	const isOwner = roleList.includes("owner") || roleList.includes("admin");
	let serverQuery = supabaseAdmin.from("iptv_servers").select("id, name, sort_order").eq("is_active", true).order("sort_order").order("name");
	if (!isOwner) {
		const { data: access } = await supabaseAdmin.from("user_server_access").select("server_id").eq("user_id", context.userId);
		const ids = (access ?? []).map((row) => row.server_id);
		if (ids.length === 0) return {
			profile,
			isOwner,
			servers: []
		};
		serverQuery = serverQuery.in("id", ids);
	}
	const { data: servers } = await serverQuery;
	const expired = !isOwner && profile?.expires_at && new Date(profile.expires_at).getTime() < Date.now();
	return {
		authUserId: context.userId,
		profile,
		isOwner,
		servers: servers ?? [],
		expired: Boolean(expired)
	};
});
var heartbeat_createServerFn_handler = createServerRpc({
	id: "c8c06c4df7f8510b1a195c326e631cac62865c644cf931170cd03edc2906db61",
	name: "heartbeat",
	filename: "src/lib/player.functions.ts"
}, (opts) => heartbeat.__executeServer(opts));
var heartbeat = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	device_id: stringType().min(6).max(80),
	server_id: stringType().uuid().optional(),
	user_agent: stringType().max(300).optional()
}).parse(input)).handler(heartbeat_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data: profile } = await supabaseAdmin.from("profiles").select("max_connections, is_active, expires_at").eq("id", context.userId).maybeSingle();
	if (!profile) return {
		ok: true,
		limit: null
	};
	if (!profile.is_active) throw new Error("Acesso desativado.");
	const expired = profile.expires_at && new Date(profile.expires_at).getTime() < Date.now();
	if (data.server_id) {
		const claim = await claimDeviceSession({
			userId: context.userId,
			serverId: data.server_id,
			deviceId: data.device_id,
			...data.user_agent ? { userAgent: data.user_agent } : {}
		});
		return {
			ok: true,
			limit: claim.user_limit ?? profile.max_connections,
			expired: Boolean(expired),
			server_limit: claim.server_limit,
			server_active: claim.server_active
		};
	}
	const cutoff = (/* @__PURE__ */ new Date(Date.now() - 18e4)).toISOString();
	await supabaseAdmin.from("device_sessions").delete().eq("user_id", context.userId).lt("last_seen", cutoff);
	const { data: active } = await supabaseAdmin.from("device_sessions").select("device_id").eq("user_id", context.userId);
	if (!(active ?? []).some((row) => row.device_id === data.device_id) && (active ?? []).length >= profile.max_connections) throw new Error(`Limite de ${profile.max_connections} conexões simultâneas atingido neste acesso.`);
	await supabaseAdmin.from("device_sessions").upsert({
		user_id: context.userId,
		device_id: data.device_id,
		user_agent: data.user_agent ?? null,
		last_seen: (/* @__PURE__ */ new Date()).toISOString()
	}, { onConflict: "user_id,device_id" });
	return {
		ok: true,
		limit: profile.max_connections,
		expired: Boolean(expired)
	};
});
async function hydrateCatalogFromPlaylist(serverId, kind, categoryId) {
	const playlist = await readServerPlaylistCache(serverId);
	if (!playlist?.playlist_text) return null;
	const catalog = parsePlaylistCatalog(playlist.playlist_text);
	const payload = categoryId ? {
		categories: catalog[kind].categories,
		streams: catalog[kind].streams.filter((item) => item.category_id === categoryId)
	} : catalog[kind];
	if (!payload.categories.length && !payload.streams.length) return null;
	const categoryCacheKey = serverCatalogCacheKey(kind, "categories");
	const streamCacheKey = serverCatalogCacheKey(kind, "streams", categoryId ?? "all");
	await writeServerCache(serverId, categoryCacheKey, payload.categories);
	await writeServerCache(serverId, streamCacheKey, payload.streams.map(({ kind: _kind, ...stream }) => stream));
	return payload;
}
var getCategories_createServerFn_handler = createServerRpc({
	id: "d82c3ab9ec8654d231beac14dd06390dd642a872832beac86a8132d19579dc0a",
	name: "getCategories",
	filename: "src/lib/player.functions.ts"
}, (opts) => getCategories.__executeServer(opts));
var getCategories = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	server_id: stringType().uuid(),
	kind: kindSchema
}).parse(input)).handler(getCategories_createServerFn_handler, async ({ data, context }) => {
	const { credential } = await resolveAccess(context.userId, data.server_id);
	const cacheKey = serverCatalogCacheKey(data.kind, "categories");
	const cached = await readServerCache(data.server_id, cacheKey);
	if (cached && !cached.stale) {
		const payload = Array.isArray(cached.payload) ? cached.payload : [];
		if (payload.length > 0) return payload;
	}
	const { xtreamCall } = await import("./iptv-cache.server-BOa6QiZJ.mjs").then((n) => n.i).then((n) => n.l);
	try {
		const result = await xtreamCall(credential, { action: streamCacheMap[data.kind].categories });
		const normalized = Array.isArray(result) ? result : [];
		await writeServerCache(data.server_id, cacheKey, normalized);
		return normalized;
	} catch (error) {
		const playlistFallback = await hydrateCatalogFromPlaylist(data.server_id, data.kind);
		if (playlistFallback) return playlistFallback.categories;
		if (cached) return Array.isArray(cached.payload) ? cached.payload : [];
		throw error;
	}
});
var getStreams_createServerFn_handler = createServerRpc({
	id: "945be02e67fd60812ba2b235b8f30973eb6dcd8102d40489c51182124371f38f",
	name: "getStreams",
	filename: "src/lib/player.functions.ts"
}, (opts) => getStreams.__executeServer(opts));
var getStreams = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	server_id: stringType().uuid(),
	kind: kindSchema,
	category_id: stringType().optional()
}).parse(input)).handler(getStreams_createServerFn_handler, async ({ data, context }) => {
	const { credential } = await resolveAccess(context.userId, data.server_id);
	const cacheKey = serverCatalogCacheKey(data.kind, "streams", data.category_id ?? "all");
	const cached = await readServerCache(data.server_id, cacheKey);
	if (cached && !cached.stale) {
		const list = Array.isArray(cached.payload) ? cached.payload : [];
		if (!data.category_id) {
			if (list.length > 0) return list;
		} else if (isCategoryScoped(list, data.category_id)) {
			const filtered = list.filter((item) => item.category_id === data.category_id);
			if (filtered.length > 0) return filtered;
		}
	}
	if (data.category_id) {
		const playlistFallback = await hydrateCatalogFromPlaylist(data.server_id, data.kind, data.category_id);
		if (playlistFallback) return playlistFallback.streams.map(({ kind: _kind, ...stream }) => stream);
	}
	const { xtreamCall } = await import("./iptv-cache.server-BOa6QiZJ.mjs").then((n) => n.i).then((n) => n.l);
	try {
		const result = await xtreamCall(credential, {
			action: streamCacheMap[data.kind].streams,
			...data.category_id ? { category_id: data.category_id } : {}
		});
		const normalized = Array.isArray(result) ? normalizeStreams(result) : [];
		if (normalized.length > 0) {
			if (data.category_id && !isCategoryScoped(normalized, data.category_id)) {
				const playlistFallback = await hydrateCatalogFromPlaylist(data.server_id, data.kind, data.category_id);
				if (playlistFallback) return playlistFallback.streams.map(({ kind: _kind, ...stream }) => stream);
			}
			await writeServerCache(data.server_id, cacheKey, normalized);
			return normalized;
		}
		if (data.category_id) {
			const fullResult = await xtreamCall(credential, { action: streamCacheMap[data.kind].streams });
			const filtered = (Array.isArray(fullResult) ? normalizeStreams(fullResult) : []).filter((item) => item.category_id === data.category_id);
			if (filtered.length > 0) {
				await writeServerCache(data.server_id, cacheKey, filtered);
				return filtered;
			}
		}
		await writeServerCache(data.server_id, cacheKey, normalized);
		return normalized;
	} catch (error) {
		const playlistFallback = await hydrateCatalogFromPlaylist(data.server_id, data.kind, data.category_id);
		if (playlistFallback) return playlistFallback.streams.map(({ kind: _kind, ...stream }) => stream);
		if (cached) return Array.isArray(cached.payload) ? cached.payload : [];
		throw error;
	}
});
var getSeriesInfo_createServerFn_handler = createServerRpc({
	id: "77368e364414fb6e2e4cdad0ffba3517781940312416ece93b74646e3202b1a0",
	name: "getSeriesInfo",
	filename: "src/lib/player.functions.ts"
}, (opts) => getSeriesInfo.__executeServer(opts));
var getSeriesInfo = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	server_id: stringType().uuid(),
	series_id: stringType().max(30)
}).parse(input)).handler(getSeriesInfo_createServerFn_handler, async ({ data, context }) => {
	const { credential } = await resolveAccess(context.userId, data.server_id);
	const cacheKey = serverCatalogCacheKey("series", "series-info", data.series_id);
	const cached = await readServerCache(data.server_id, cacheKey);
	if (cached) return cached.payload;
	const { xtreamCall } = await import("./iptv-cache.server-BOa6QiZJ.mjs").then((n) => n.i).then((n) => n.l);
	const result = await xtreamCall(credential, {
		action: "get_series_info",
		series_id: data.series_id
	});
	const episodesBySeason = result?.episodes && typeof result.episodes === "object" ? result.episodes : {};
	const payload = {
		info: result?.info ?? {},
		seasons: Object.entries(episodesBySeason).map(([season, episodes]) => ({
			season,
			episodes: (episodes ?? []).map((episode) => ({
				id: String(episode.id),
				title: episode.title,
				episode_num: episode.episode_num,
				ext: episode.container_extension ?? "mp4"
			}))
		}))
	};
	await writeServerCache(data.server_id, cacheKey, payload);
	return payload;
});
var getVodInfo_createServerFn_handler = createServerRpc({
	id: "1dfa9b483c7acfd93cf98f103bb06dece02d62b88a16bc47de0cc433bee56a64",
	name: "getVodInfo",
	filename: "src/lib/player.functions.ts"
}, (opts) => getVodInfo.__executeServer(opts));
var getVodInfo = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	server_id: stringType().uuid(),
	vod_id: stringType().max(30)
}).parse(input)).handler(getVodInfo_createServerFn_handler, async ({ data, context }) => {
	const { credential } = await resolveAccess(context.userId, data.server_id);
	const cacheKey = serverCatalogCacheKey("movie", "vod-info", data.vod_id);
	const cached = await readServerCache(data.server_id, cacheKey);
	if (cached) return cached.payload;
	const { xtreamCall } = await import("./iptv-cache.server-BOa6QiZJ.mjs").then((n) => n.i).then((n) => n.l);
	const result = await xtreamCall(credential, {
		action: "get_vod_info",
		vod_id: data.vod_id
	});
	const payload = {
		info: result.info ?? {},
		name: result.movie_data?.name ?? "",
		ext: result.movie_data?.container_extension ?? "mp4"
	};
	await writeServerCache(data.server_id, cacheKey, payload);
	return payload;
});
var getPlaybackUrl_createServerFn_handler = createServerRpc({
	id: "70ffaa3d751d473eac85cd9381466e6caad603f4f18bcef23d1a7ee7cf6472ef",
	name: "getPlaybackUrl",
	filename: "src/lib/player.functions.ts"
}, (opts) => getPlaybackUrl.__executeServer(opts));
var getPlaybackUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	server_id: stringType().uuid(),
	kind: kindSchema,
	stream_id: stringType().max(30),
	ext: stringType().max(10).optional(),
	device_id: stringType().min(6).max(80)
}).parse(input)).handler(getPlaybackUrl_createServerFn_handler, async ({ data, context }) => {
	const { credential } = await resolveAccess(context.userId, data.server_id);
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const { data: profile } = await supabaseAdmin.from("profiles").select("max_connections").eq("id", context.userId).maybeSingle();
	if (profile) await claimDeviceSession({
		userId: context.userId,
		serverId: data.server_id,
		deviceId: data.device_id
	});
	const { buildStreamUrl } = await import("./iptv-cache.server-BOa6QiZJ.mjs").then((n) => n.i).then((n) => n.l);
	const { signStreamUrl } = await import("./stream-proxy.server-ByScHUwZ.mjs").then((n) => n.n);
	const playbackExtensions = getPlaybackExtensions(data.kind, data.ext);
	const playbackTtlSeconds = 86400;
	const playbackUrls = await Promise.all(playbackExtensions.map(async (extension) => {
		const direct = buildStreamUrl(credential, data.kind, data.stream_id, extension);
		const proxied = await signStreamUrl(direct, {
			subject: context.userId,
			reference: data.server_id,
			ttlSeconds: playbackTtlSeconds
		});
		const isHls = /\.m3u8(?:$|[?#])/i.test(direct);
		const forceHls = data.kind === "live" && !/\.ts(?:$|[?#])/i.test(direct);
		return isHls || forceHls ? `${proxied}&hls=1` : proxied;
	}));
	return {
		url: playbackUrls[0],
		...playbackUrls.length > 1 ? { fallback_urls: playbackUrls.slice(1) } : {}
	};
});
var playbackTelemetryEventSchema = objectType({
	name: enumType([
		"startup_requested",
		"manifest_loaded",
		"first_frame",
		"playing",
		"buffer_start",
		"buffer_end",
		"fatal_error",
		"recover_attempt",
		"recover_success",
		"format_fallback",
		"ended",
		"destroyed"
	]),
	at_ms: numberType().int().min(0).max(864e5),
	duration_ms: numberType().int().min(0).max(864e5).optional(),
	buffer_seconds: numberType().min(0).max(86400).optional(),
	latency_ms: numberType().int().min(0).max(864e5).optional(),
	bitrate: numberType().int().min(0).max(1e9).optional(),
	level: numberType().int().min(0).max(1e4).optional(),
	fatal: booleanType().optional(),
	error_code: stringType().max(64).optional(),
	recovery_attempt: numberType().int().min(0).max(20).optional(),
	reason: stringType().max(80).optional()
});
var playbackTelemetrySchema = objectType({
	session_id: stringType().min(8).max(100),
	server_id: stringType().uuid(),
	kind: kindSchema,
	engine: enumType(["native", "hls.js"]),
	events: arrayType(playbackTelemetryEventSchema).min(1).max(20)
});
async function hashPlaybackRef(value) {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return Array.from(new Uint8Array(digest)).slice(0, 8).map((part) => part.toString(16).padStart(2, "0")).join("");
}
var recordPlaybackTelemetry_createServerFn_handler = createServerRpc({
	id: "ec0c68a61060665029659181c0f67bade2acd7c8528b80442ae6e0b07fd4501f",
	name: "recordPlaybackTelemetry",
	filename: "src/lib/player.functions.ts"
}, (opts) => recordPlaybackTelemetry.__executeServer(opts));
var recordPlaybackTelemetry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => playbackTelemetrySchema.parse(input)).handler(recordPlaybackTelemetry_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	const [{ data: profile }, { data: roles }, { data: server }] = await Promise.all([
		supabaseAdmin.from("profiles").select("id, is_active, expires_at").eq("id", context.userId).maybeSingle(),
		supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId),
		supabaseAdmin.from("iptv_servers").select("id, is_active").eq("id", data.server_id).maybeSingle()
	]);
	const isOwner = !!roles?.some((row) => row.role === "owner" || row.role === "admin");
	if (!server?.is_active) throw new Error("Servidor indisponível.");
	if (profile && !isOwner) {
		if (!profile.is_active) throw new Error("Acesso desativado.");
		if (profile.expires_at && new Date(profile.expires_at).getTime() < Date.now()) throw new Error("Acesso expirado.");
		const { count } = await supabaseAdmin.from("user_server_access").select("id", {
			count: "exact",
			head: true
		}).eq("user_id", context.userId).eq("server_id", data.server_id);
		if (!count) throw new Error("Servidor não liberado para este acesso.");
	}
	const [userRef, serverRef] = await Promise.all([hashPlaybackRef(context.userId), hashPlaybackRef(data.server_id)]);
	console.info(JSON.stringify({
		event: "playback_qoe",
		service: "main",
		user_ref: userRef,
		server_ref: serverRef,
		session_ref: data.session_id.slice(0, 16),
		kind: data.kind,
		engine: data.engine,
		events: data.events,
		recorded_at: (/* @__PURE__ */ new Date()).toISOString()
	}));
	return { ok: true };
});
var getChannelEPG_createServerFn_handler = createServerRpc({
	id: "97658b6b3749775b6e85afb0093cc36628da2b8a3baabd1183f79423fb938106",
	name: "getChannelEPG",
	filename: "src/lib/player.functions.ts"
}, (opts) => getChannelEPG.__executeServer(opts));
var getChannelEPG = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	server_id: stringType().uuid(),
	stream_id: stringType().max(30)
}).parse(input)).handler(getChannelEPG_createServerFn_handler, async ({ data, context }) => {
	const { credential } = await resolveAccess(context.userId, data.server_id);
	const cacheKey = serverCatalogCacheKey("live", "epg", data.stream_id);
	const cached = await readServerCache(data.server_id, cacheKey);
	if (cached && !cached.stale) return cached.payload;
	const { xtreamCall } = await import("./iptv-cache.server-BOa6QiZJ.mjs").then((n) => n.i).then((n) => n.l);
	const result = await xtreamCall(credential, {
		action: "get_short_epg",
		stream_id: data.stream_id
	});
	const decode = (str) => {
		try {
			if (!str) return "";
			const decoded = atob(str);
			return decodeURIComponent(escape(decoded));
		} catch (e) {
			return str;
		}
	};
	if (result && "epg_listings" in result && Array.isArray(result.epg_listings) && result.epg_listings.length > 0) {
		const payload = result.epg_listings.map((item) => ({
			title: decode(item.title),
			description: decode(item.description),
			start: item.start,
			end: item.end,
			start_timestamp: item.start_timestamp,
			stop_timestamp: item.stop_timestamp
		}));
		await writeServerCache(data.server_id, cacheKey, payload);
		return payload;
	}
	if ((await getAppConfig()).epg_xmltv_url) try {
		const streams = await xtreamCall(credential, {
			action: "get_live_streams",
			stream_id: data.stream_id
		});
		const channelName = (Array.isArray(streams) ? streams.find((s) => String(s.stream_id) === data.stream_id) : null)?.name || "";
		if (channelName) console.log(`Buscando EPG inteligente para: ${channelName}`);
	} catch (e) {
		console.error("Erro no EPG inteligente:", e);
	}
	const payload = [];
	await writeServerCache(data.server_id, cacheKey, payload);
	return payload;
});
async function fetchTMDB(apiKey, type, query, year) {
	try {
		const searchUrl = `https://api.themoviedb.org/3/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=pt-BR${year ? `&year=${year}` : ""}`;
		const searchData = await (await fetch(searchUrl)).json();
		if (searchData.results && searchData.results.length > 0) {
			const detailUrl = `https://api.themoviedb.org/3/${type}/${searchData.results[0].id}?api_key=${apiKey}&language=pt-BR&append_to_response=images,credits`;
			return await (await fetch(detailUrl)).json();
		}
	} catch (e) {
		console.error("Erro ao consultar o TMDB:", e);
	}
	return null;
}
var getEnrichedMetadata_createServerFn_handler = createServerRpc({
	id: "c89e4dbcaec1b5d84f8636baedc089b19d1e8225ee105a82858295f82887e3a2",
	name: "getEnrichedMetadata",
	filename: "src/lib/player.functions.ts"
}, (opts) => getEnrichedMetadata.__executeServer(opts));
var getEnrichedMetadata = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	kind: enumType(["movie", "series"]),
	name: stringType(),
	year: stringType().optional()
}).parse(input)).handler(getEnrichedMetadata_createServerFn_handler, async ({ data }) => {
	const config = await getAppConfig();
	if (!config.tmdb_api_key) return null;
	const tmdbType = data.kind === "movie" ? "movie" : "tv";
	const cleanName = data.name.replace(/\[.*?\]|\(.*?\)/g, "").replace(/(1080p|720p|4k|uhd|hdtv|x264|hevc|dual|dublado|legendado)/gi, "").trim();
	let meta = await fetchTMDB(config.tmdb_api_key, tmdbType, cleanName, data.year);
	if (!meta && cleanName.split(" ").length > 2) {
		const shorterName = cleanName.split(" ").slice(0, -1).join(" ");
		meta = await fetchTMDB(config.tmdb_api_key, tmdbType, shorterName, data.year);
	}
	return meta;
});
//#endregion
export { getCategories_createServerFn_handler, getChannelEPG_createServerFn_handler, getEnrichedMetadata_createServerFn_handler, getMySession_createServerFn_handler, getPlaybackUrl_createServerFn_handler, getSeriesInfo_createServerFn_handler, getStreams_createServerFn_handler, getVodInfo_createServerFn_handler, heartbeat_createServerFn_handler, recordPlaybackTelemetry_createServerFn_handler };
