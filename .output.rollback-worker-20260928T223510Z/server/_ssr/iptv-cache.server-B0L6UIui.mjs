import { n as __exportAll } from "../_runtime.mjs";
import { t as __exportAll$1 } from "./rolldown-runtime-D7D4PA-g.mjs";
import { t as clearLocalImageCache } from "./server-media-cache.server-DmVNVbpE.mjs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { createHash as createHash$1 } from "crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/iptv-cache.server-B0L6UIui.js
var iptv_cache_server_B0L6UIui_exports = /* @__PURE__ */ __exportAll({
	a: () => refreshServerCatalogCache,
	c: () => parsePlaylistCatalog,
	i: () => readServerPlaylistCache,
	l: () => xtream_server_exports,
	n: () => clearServerPlaylistCache,
	o: () => serverCatalogCacheKey,
	r: () => readServerCache,
	s: () => writeServerCache,
	t: () => clearServerCache
});
var xtream_server_exports = /* @__PURE__ */ __exportAll$1({
	buildPlayerApiUrl: () => buildPlayerApiUrl,
	buildStreamUrl: () => buildStreamUrl,
	normalizeDns: () => normalizeDns,
	testCredentials: () => testCredentials,
	xtreamCall: () => xtreamCall
});
function normalizeDns(dns) {
	let base = dns.trim().replace(/\/+$/, "");
	if (!/^https?:\/\//i.test(base)) base = `http://${base}`;
	return base;
}
function buildPlayerApiUrl(creds, params) {
	const url = new URL(`${normalizeDns(creds.dns)}/player_api.php`);
	url.searchParams.set("username", creds.username);
	url.searchParams.set("password", creds.password);
	for (const [key, value] of Object.entries(params)) if (value !== void 0 && value !== "") url.searchParams.set(key, value);
	return url.toString();
}
async function xtreamCallOnce(creds, params, timeoutMs) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(buildPlayerApiUrl(creds, params), {
			signal: controller.signal,
			headers: { "User-Agent": "IPTV-System/1.0" }
		});
		if (!response.ok) throw new Error(`Servidor respondeu ${response.status}`);
		const text = await response.text();
		try {
			return JSON.parse(text);
		} catch {
			throw new Error("Resposta inválida do servidor IPTV.");
		}
	} finally {
		clearTimeout(timer);
	}
}
async function xtreamCall(creds, params, timeoutMs = 1e4) {
	const candidates = Array.from(new Set([creds.dns, ...creds.dnsPool ?? []].filter(Boolean)));
	let lastError;
	for (const dns of candidates) try {
		return await xtreamCallOnce({
			...creds,
			dns
		}, params, timeoutMs);
	} catch (error) {
		lastError = error;
	}
	throw lastError instanceof Error ? /* @__PURE__ */ new Error(`Servidor IPTV indisponível (${lastError.message}). Verifique DNS, usuário e senha no painel.`) : /* @__PURE__ */ new Error("Servidor IPTV indisponível.");
}
function buildStreamUrl(creds, kind, streamId, ext = "m3u8") {
	const base = normalizeDns(creds.dns);
	const safeExt = kind === "live" ? "m3u8" : ext || "mp4";
	return `${base}/${kind}/${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}/${streamId}.${safeExt}`;
}
async function testCredentials(creds) {
	try {
		const info = (await xtreamCall(creds, {}, 12e3)).user_info;
		if (!info || info.auth !== 1) return {
			ok: false,
			message: "Usuário ou senha recusados pelo servidor."
		};
		return {
			ok: true,
			message: `Conectado (${info.status ?? "Active"})`,
			expDate: info.exp_date ?? null,
			maxConnections: info.max_connections ?? null
		};
	} catch (error) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : "Falha na conexão."
		};
	}
}
var EMPTY_CATALOG = {
	live: {
		categories: [],
		streams: []
	},
	movie: {
		categories: [],
		streams: []
	},
	series: {
		categories: [],
		streams: []
	}
};
function normalizeText(value) {
	return (value ?? "").trim();
}
function sanitizeCategoryName(value) {
	return normalizeText(value) || "Sem categoria";
}
function parseAttributes(line) {
	const attrs = {};
	const matches = line.matchAll(/([A-Za-z0-9_-]+)="([^"]*)"/g);
	for (const match of matches) {
		const key = match[1];
		const value = match[2];
		if (key && value !== void 0) attrs[key] = value;
	}
	return attrs;
}
function detectKindFromUrl(urlLine) {
	try {
		const path = new URL(urlLine).pathname.toLowerCase();
		if (path.includes("/movie/")) return "movie";
		if (path.includes("/series/")) return "series";
		return "live";
	} catch {
		const lower = urlLine.toLowerCase();
		if (lower.includes("/movie/")) return "movie";
		if (lower.includes("/series/")) return "series";
		return "live";
	}
}
function detectExt(urlLine) {
	try {
		const pathname = new URL(urlLine).pathname.split("/").pop() ?? "";
		const ext = pathname.includes(".") ? pathname.split(".").pop() : "";
		return ext ? ext.toLowerCase() : null;
	} catch {
		const last = (urlLine.split("?")[0] ?? "").split("/").pop() ?? "";
		const ext = last.includes(".") ? last.split(".").pop() : "";
		return ext ? ext.toLowerCase() : null;
	}
}
function detectId(kind, urlLine) {
	for (const pattern of {
		live: [/\/live\/([^/?#]+)(?:[./?#]|$)/i, /\/channel\/([^/?#]+)(?:[./?#]|$)/i],
		movie: [/\/movie\/([^/?#]+)(?:[./?#]|$)/i],
		series: [/\/series\/([^/?#]+)(?:[./?#]|$)/i]
	}[kind]) {
		const match = urlLine.match(pattern);
		if (match?.[1]) return decodeURIComponent(match[1]);
	}
	const cleaned = urlLine.split("?")[0] ?? "";
	return (cleaned.split("/").pop() ?? "").replace(/\.[^.]+$/, "") || cleaned;
}
function makePlaylistUrl(creds, output = "ts") {
	const url = new URL(`${normalizeDns(creds.dns)}/get.php`);
	url.searchParams.set("username", creds.username);
	url.searchParams.set("password", creds.password);
	url.searchParams.set("type", "m3u_plus");
	url.searchParams.set("output", output);
	return url.toString();
}
async function fetchTextWithTimeout(url, timeoutMs) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent": "IPTV-System/1.0",
				Accept: "text/plain, */*"
			}
		});
		if (!response.ok) throw new Error(`Playlist respondeu ${response.status}`);
		return await response.text();
	} finally {
		clearTimeout(timer);
	}
}
async function fetchRemotePlaylist(creds, timeoutMs = 3e4) {
	const outputs = ["ts", "m3u8"];
	let lastError;
	for (const output of outputs) {
		const sourceUrl = makePlaylistUrl(creds, output);
		try {
			const playlistText = await fetchTextWithTimeout(sourceUrl, timeoutMs);
			if (!playlistText.includes("#EXTM3U")) throw new Error("Resposta não parece uma playlist M3U válida.");
			return {
				source_url: sourceUrl,
				playlist_text: playlistText,
				playlist_hash: createHash$1("sha256").update(playlistText).digest("hex"),
				item_count: countPlaylistItems(playlistText),
				fetched_at: (/* @__PURE__ */ new Date()).toISOString()
			};
		} catch (error) {
			lastError = error;
		}
	}
	throw lastError instanceof Error ? /* @__PURE__ */ new Error(`Falha ao baixar M3U do servidor (${lastError.message}).`) : /* @__PURE__ */ new Error("Falha ao baixar M3U do servidor.");
}
function parsePlaylistCatalog(playlistText) {
	const catalog = {
		live: {
			categories: [],
			streams: []
		},
		movie: {
			categories: [],
			streams: []
		},
		series: {
			categories: [],
			streams: []
		}
	};
	const categoryMaps = {
		live: /* @__PURE__ */ new Map(),
		movie: /* @__PURE__ */ new Map(),
		series: /* @__PURE__ */ new Map()
	};
	const lines = playlistText.split(/\r?\n/);
	let pendingEntry = null;
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) continue;
		if (line.startsWith("#EXTM3U")) continue;
		if (line.startsWith("#EXTVLCOPT")) continue;
		if (line.startsWith("#EXTINF")) {
			const commaIndex = line.lastIndexOf(",");
			const header = commaIndex >= 0 ? line.slice(0, commaIndex) : line;
			const displayName = commaIndex >= 0 ? line.slice(commaIndex + 1).trim() : "";
			pendingEntry = {
				meta: parseAttributes(header),
				displayName: displayName || ""
			};
			continue;
		}
		if (!pendingEntry || line.startsWith("#")) continue;
		const kind = detectKindFromUrl(line);
		const groupName = sanitizeCategoryName(pendingEntry.meta["group-title"] ?? pendingEntry.meta["group_title"] ?? pendingEntry.meta["group"] ?? "");
		const categoryId = groupName;
		if (!categoryMaps[kind].has(categoryId)) {
			categoryMaps[kind].set(categoryId, categoryId);
			catalog[kind].categories.push({
				category_id: categoryId,
				category_name: groupName
			});
		}
		catalog[kind].streams.push({
			id: detectId(kind, line),
			name: normalizeText(pendingEntry.meta["tvg-name"] ?? pendingEntry.meta["tvg_name"] ?? pendingEntry.displayName) || "Conteúdo",
			icon: normalizeText(pendingEntry.meta["tvg-logo"] ?? pendingEntry.meta["tvg_logo"] ?? pendingEntry.meta["logo"]) || null,
			ext: detectExt(line),
			rating: null,
			category_id: categoryId,
			kind
		});
		pendingEntry = null;
	}
	for (const kind of Object.keys(catalog)) catalog[kind].streams = catalog[kind].streams.slice(0, 4e3);
	return catalog;
}
function countPlaylistItems(playlistText) {
	return playlistText.split(/\r?\n/).filter((line) => line.trim().startsWith("#EXTINF:")).length;
}
function createEmptyPlaylistCatalog() {
	return {
		live: {
			categories: [...EMPTY_CATALOG.live.categories],
			streams: [...EMPTY_CATALOG.live.streams]
		},
		movie: {
			categories: [...EMPTY_CATALOG.movie.categories],
			streams: [...EMPTY_CATALOG.movie.streams]
		},
		series: {
			categories: [...EMPTY_CATALOG.series.categories],
			streams: [...EMPTY_CATALOG.series.streams]
		}
	};
}
var LOCAL_CACHE_ROOT = process.env["MAGO_SERVER_FILESYSTEM_CACHE_DIR"]?.trim() || process.env["SERVER_FILESYSTEM_CACHE_DIR"]?.trim() || join(process.cwd(), "storage");
var SERVERS_ROOT = join(LOCAL_CACHE_ROOT, "servers");
var LOCKS_ROOT = join(LOCAL_CACHE_ROOT, "locks");
var LEGACY_SERVERS_ROOT = join(join(process.cwd(), ".storage", "server-filesystem-cache"), "servers");
var LOCK_TIMEOUT_MS = 3e4;
var LOCK_STALE_MS = 900 * 1e3;
function normalizePathSegment(value) {
	return value.replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "");
}
function cacheFileName(cacheKey) {
	return `${normalizePathSegment(cacheKey).slice(0, 64) || "cache"}.${createHash("sha1").update(cacheKey).digest("hex").slice(0, 12)}.json`;
}
function getServerDir(serverId) {
	return join(SERVERS_ROOT, serverId);
}
function getLegacyServerDir(serverId) {
	return join(LEGACY_SERVERS_ROOT, serverId);
}
function getCatalogDir(serverId) {
	return join(getServerDir(serverId), "catalog");
}
function getPlaylistJsonPath(serverId) {
	return join(getServerDir(serverId), "playlist.json");
}
function getPlaylistTextPath(serverId) {
	return join(getServerDir(serverId), "playlist.m3u");
}
function getCacheEntryPath(serverId, cacheKey) {
	return join(getCatalogDir(serverId), cacheFileName(cacheKey));
}
function getLockPath(serverId) {
	return join(LOCKS_ROOT, `${serverId}.lock`);
}
async function ensureParentDir(filePath) {
	await mkdir(dirname(filePath), { recursive: true });
}
async function writeAtomicText(filePath, contents) {
	await ensureParentDir(filePath);
	const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
	await writeFile(tmpPath, contents, "utf8");
	await rename(tmpPath, filePath);
}
async function writeAtomicJson(filePath, payload) {
	await writeAtomicText(filePath, JSON.stringify(payload));
}
async function readJsonFile(filePath) {
	try {
		const raw = await readFile(filePath, "utf8");
		if (!raw.trim()) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
function isMeaningfulPayload(value) {
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === "string") return value.trim().length > 0;
	if (value && typeof value === "object") return Object.keys(value).length > 0;
	return value !== null && value !== void 0;
}
async function tryReadDiskCache(serverId, cacheKey) {
	const diskEntry = await readJsonFile(getCacheEntryPath(serverId, cacheKey));
	if (!diskEntry || !isMeaningfulPayload(diskEntry.payload)) return null;
	const fetchedAt = new Date(diskEntry.fetched_at).getTime();
	const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > 720 * 60 * 1e3;
	return {
		payload: diskEntry.payload,
		fetchedAt: diskEntry.fetched_at,
		stale
	};
}
async function tryReadDiskPlaylist(serverId) {
	const playlist = await readJsonFile(getPlaylistJsonPath(serverId));
	if (!playlist?.playlist_text?.trim()) return null;
	const fetchedAt = new Date(playlist.fetched_at).getTime();
	const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > 720 * 60 * 1e3;
	return {
		...playlist,
		stale
	};
}
async function cleanupServerDirectory(serverDir) {
	await rm(serverDir, {
		recursive: true,
		force: true
	});
}
async function withServerFilesystemLock(serverId, task) {
	await mkdir(LOCKS_ROOT, { recursive: true });
	const lockPath = getLockPath(serverId);
	const startedAt = Date.now();
	while (true) try {
		const handle = await open(lockPath, "wx");
		try {
			await handle.writeFile(JSON.stringify({
				server_id: serverId,
				pid: process.pid,
				started_at: (/* @__PURE__ */ new Date()).toISOString()
			}));
		} finally {
			await handle.close();
		}
		try {
			return await task();
		} finally {
			await rm(lockPath, { force: true }).catch(() => {});
		}
	} catch (error) {
		if (!error || typeof error !== "object" || !("code" in error)) throw error;
		if (error.code !== "EEXIST") throw error;
		try {
			const stats = await stat(lockPath);
			if (Date.now() - stats.mtimeMs > LOCK_STALE_MS) {
				await rm(lockPath, { force: true }).catch(() => {});
				continue;
			}
		} catch {
			await rm(lockPath, { force: true }).catch(() => {});
			continue;
		}
		if (Date.now() - startedAt > LOCK_TIMEOUT_MS) throw new Error(`Outro refresh já está em andamento para o servidor ${serverId}.`);
		await new Promise((resolve) => setTimeout(resolve, 150));
	}
}
async function readLocalServerCache(serverId, cacheKey) {
	const current = await tryReadDiskCache(serverId, cacheKey);
	if (current) return current;
	const legacyEntry = await readJsonFile(join(getLegacyServerDir(serverId), "catalog", cacheFileName(cacheKey)));
	if (!legacyEntry || !isMeaningfulPayload(legacyEntry.payload)) return null;
	const fetchedAt = new Date(legacyEntry.fetched_at).getTime();
	const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > 720 * 60 * 1e3;
	return {
		payload: legacyEntry.payload,
		fetchedAt: legacyEntry.fetched_at,
		stale
	};
}
async function writeLocalServerCache(serverId, cacheKey, payload, fetchedAt = (/* @__PURE__ */ new Date()).toISOString()) {
	const diskEntry = {
		server_id: serverId,
		cache_key: cacheKey,
		payload,
		fetched_at: fetchedAt
	};
	await writeAtomicJson(getCacheEntryPath(serverId, cacheKey), diskEntry);
}
async function clearLocalServerCache(serverId) {
	await Promise.all([cleanupServerDirectory(getServerDir(serverId)), cleanupServerDirectory(getLegacyServerDir(serverId))]);
}
async function clearLocalServerPlaylist(serverId) {
	await Promise.all([
		rm(getPlaylistJsonPath(serverId), { force: true }).catch(() => {}),
		rm(getPlaylistTextPath(serverId), { force: true }).catch(() => {}),
		rm(join(getLegacyServerDir(serverId), "playlist.json"), { force: true }).catch(() => {}),
		rm(join(getLegacyServerDir(serverId), "playlist.m3u"), { force: true }).catch(() => {})
	]);
}
async function readLocalServerPlaylist(serverId) {
	const current = await tryReadDiskPlaylist(serverId);
	if (current) return current;
	const legacyPlaylist = await readJsonFile(join(getLegacyServerDir(serverId), "playlist.json"));
	if (!legacyPlaylist?.playlist_text?.trim()) return null;
	const fetchedAt = new Date(legacyPlaylist.fetched_at).getTime();
	const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > 720 * 60 * 1e3;
	return {
		...legacyPlaylist,
		stale
	};
}
async function writeLocalServerPlaylist(serverId, snapshot) {
	await mkdir(getServerDir(serverId), { recursive: true });
	await writeAtomicJson(getPlaylistJsonPath(serverId), snapshot);
	await writeAtomicText(getPlaylistTextPath(serverId), snapshot.playlist_text);
}
var CACHE_TTL_MS = 720 * 60 * 1e3;
var refreshInFlight = /* @__PURE__ */ new Map();
function normalizeItems(rows) {
	return Array.isArray(rows) ? rows : [];
}
function cacheKey(...parts) {
	return parts.filter(Boolean).join(":");
}
async function getSupabaseAdmin() {
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	return supabaseAdmin;
}
function isMissingTableError(error) {
	return !!error && typeof error === "object" && "code" in error && error.code === "PGRST205";
}
async function loadServerCredential(serverId) {
	const supabaseAdmin = await getSupabaseAdmin();
	const [{ data: server }, { data: creds }] = await Promise.all([supabaseAdmin.from("iptv_servers").select("id, name, is_active").eq("id", serverId).maybeSingle(), supabaseAdmin.from("server_credentials").select("username, password, dns").eq("server_id", serverId).order("created_at", { ascending: false }).limit(1)]);
	const credentialRow = normalizeItems(creds)[0];
	if (!server || !credentialRow) return {
		server: server ?? null,
		credential: null
	};
	const dnsPool = normalizeItems(creds).map((row) => row.dns).filter(Boolean);
	return {
		server,
		credential: {
			username: credentialRow.username,
			password: credentialRow.password,
			dns: credentialRow.dns,
			dnsPool
		}
	};
}
function serverCatalogCacheKey(kind, scope, id) {
	return cacheKey("catalog", kind, scope, id);
}
async function readServerCache(serverId, cacheKeyName) {
	const local = await readLocalServerCache(serverId, cacheKeyName);
	if (local) return local;
	const { data, error } = await (await getSupabaseAdmin()).from("iptv_server_cache").select("payload, fetched_at").eq("server_id", serverId).eq("cache_key", cacheKeyName).maybeSingle();
	if (error || !data) return null;
	const entry = data;
	const fetchedAt = new Date(entry.fetched_at).getTime();
	const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > CACHE_TTL_MS;
	return {
		payload: entry.payload,
		fetchedAt: entry.fetched_at,
		stale
	};
}
async function writeServerCache(serverId, cacheKeyName, payload) {
	try {
		await writeLocalServerCache(serverId, cacheKeyName, payload);
	} catch (error) {
		console.warn("Falha ao gravar cache local do servidor", {
			serverId,
			cacheKeyName,
			error
		});
	}
	const { error } = await (await getSupabaseAdmin()).from("iptv_server_cache").upsert({
		server_id: serverId,
		cache_key: cacheKeyName,
		payload,
		fetched_at: (/* @__PURE__ */ new Date()).toISOString()
	}, { onConflict: "server_id,cache_key" });
	if (error && !isMissingTableError(error)) throw error;
}
async function clearServerCache(serverId) {
	try {
		await clearLocalServerCache(serverId);
	} catch (error) {
		console.warn("Falha ao limpar cache local do servidor", {
			serverId,
			error
		});
	}
	const { error } = await (await getSupabaseAdmin()).from("iptv_server_cache").delete().eq("server_id", serverId);
	if (error && !isMissingTableError(error)) throw error;
}
async function clearServerPlaylistCache(serverId) {
	try {
		await clearLocalServerPlaylist(serverId);
	} catch (error) {
		console.warn("Falha ao limpar playlist local do servidor", {
			serverId,
			error
		});
	}
	const { error } = await (await getSupabaseAdmin()).from("iptv_server_m3u_cache").delete().eq("server_id", serverId);
	if (error && !isMissingTableError(error)) throw error;
}
async function readServerPlaylistCache(serverId) {
	const local = await readLocalServerPlaylist(serverId);
	if (local) return local;
	const { data, error } = await (await getSupabaseAdmin()).from("iptv_server_m3u_cache").select("server_id, source_url, playlist_text, playlist_hash, item_count, fetched_at").eq("server_id", serverId).maybeSingle();
	if (error || !data) return null;
	const row = data;
	const fetchedAt = new Date(row.fetched_at).getTime();
	const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > CACHE_TTL_MS;
	return {
		...row,
		stale
	};
}
async function writeServerPlaylistCache(serverId, snapshot) {
	try {
		await writeLocalServerPlaylist(serverId, snapshot);
	} catch (error) {
		console.warn("Falha ao gravar playlist local do servidor", {
			serverId,
			error
		});
	}
	const { error } = await (await getSupabaseAdmin()).from("iptv_server_m3u_cache").upsert({
		server_id: serverId,
		source_url: snapshot.source_url,
		playlist_text: snapshot.playlist_text,
		playlist_hash: snapshot.playlist_hash,
		item_count: snapshot.item_count,
		fetched_at: snapshot.fetched_at
	}, { onConflict: "server_id" });
	if (error && !isMissingTableError(error)) throw error;
}
async function writeCatalogRows(serverId, catalog) {
	const rows = Object.keys(catalog).flatMap((kind) => [{
		server_id: serverId,
		cache_key: serverCatalogCacheKey(kind, "categories"),
		payload: catalog[kind].categories,
		fetched_at: (/* @__PURE__ */ new Date()).toISOString()
	}, {
		server_id: serverId,
		cache_key: serverCatalogCacheKey(kind, "streams"),
		payload: catalog[kind].streams.map(({ kind: _kind, ...stream }) => stream),
		fetched_at: (/* @__PURE__ */ new Date()).toISOString()
	}]);
	await Promise.all(rows.map((row) => writeServerCache(serverId, row.cache_key, row.payload)));
}
async function fetchCatalogKind(credential, kind) {
	const actionMap = {
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
	const categories = await xtreamCall(credential, { action: actionMap[kind].categories });
	const streams = await xtreamCall(credential, { action: actionMap[kind].streams });
	return {
		categories: normalizeItems(categories).map((item) => ({
			category_id: item.category_id,
			category_name: item.category_name
		})),
		streams: normalizeItems(streams).slice(0, 4e3).map((item) => ({
			id: String(item.stream_id ?? item.series_id ?? item.M_ID ?? item.m_id ?? ""),
			name: item.name,
			icon: item.stream_icon || item.cover || null,
			ext: item.container_extension ?? null,
			rating: item.rating ?? null,
			category_id: item.category_id ?? null
		}))
	};
}
async function refreshServerCatalogCache(serverId, options = {}) {
	const ongoing = refreshInFlight.get(serverId);
	if (ongoing) return ongoing;
	const job = withServerFilesystemLock(serverId, async () => {
		const { credential } = await loadServerCredential(serverId);
		if (!credential) throw new Error("Servidor sem credenciais cadastradas.");
		let catalog = null;
		let playlistSnapshot = null;
		let source = null;
		try {
			playlistSnapshot = await fetchRemotePlaylist(credential);
			catalog = parsePlaylistCatalog(playlistSnapshot.playlist_text);
			if (!Object.keys(catalog).some((kind) => catalog[kind].streams.length > 0)) catalog = null;
			else source = "m3u";
		} catch (error) {
			console.warn("Playlist M3U indisponível, mantendo fallback Xtream", error);
		}
		if (!catalog) {
			const fresh = await Promise.all([
				"live",
				"movie",
				"series"
			].map(async (kind) => {
				return {
					kind,
					payload: await fetchCatalogKind(credential, kind)
				};
			}));
			catalog = createEmptyPlaylistCatalog();
			for (const item of fresh) catalog[item.kind] = item.payload;
			source = "xtream";
		}
		if (options.clearLocalBeforeFetch) await Promise.allSettled([
			clearLocalServerCache(serverId),
			clearLocalServerPlaylist(serverId),
			clearLocalImageCache(serverId)
		]);
		if (playlistSnapshot) await writeServerPlaylistCache(serverId, playlistSnapshot);
		await writeCatalogRows(serverId, catalog);
		return {
			kinds: Object.keys(catalog).reduce((acc, kind) => {
				acc[kind] = {
					categories: catalog[kind].categories.length,
					streams: catalog[kind].streams.length
				};
				return acc;
			}, {}),
			source: source ?? "xtream"
		};
	});
	refreshInFlight.set(serverId, job);
	try {
		return await job;
	} catch (error) {
		throw normalizeRefreshServerError(error);
	} finally {
		refreshInFlight.delete(serverId);
	}
}
function normalizeRefreshServerError(error) {
	const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
	if (/<!doctype html|^<html[\s>]|bad gateway|502/i.test(message)) return /* @__PURE__ */ new Error("Falha ao recarregar o cache do servidor. O servidor respondeu com erro 502 ou conteúdo inválido.");
	if (error instanceof Error) return error;
	return /* @__PURE__ */ new Error("Falha ao recarregar o cache do servidor.");
}
//#endregion
export { readServerCache as a, serverCatalogCacheKey as c, parsePlaylistCatalog as i, writeServerCache as l, clearServerPlaylistCache as n, readServerPlaylistCache as o, iptv_cache_server_B0L6UIui_exports as r, refreshServerCatalogCache as s, clearServerCache as t };
