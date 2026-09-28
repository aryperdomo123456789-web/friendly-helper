import { n as __exportAll } from "../_runtime.mjs";
import { c as __exportAll$1 } from "./server-D02VSSfW.mjs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/iptv-cache.server-BM0GfnyO.js
var iptv_cache_server_BM0GfnyO_exports = /* @__PURE__ */ __exportAll({
	a: () => serverCatalogCacheKey,
	c: () => getPlaybackExtensions,
	i: () => readServerPlaylistCache,
	n: () => clearServerPlaylistCache,
	o: () => writeServerCache,
	r: () => readServerCache,
	s: () => xtream_server_exports,
	t: () => clearServerCache
});
var MAX_PLAYLIST_TEXT_BYTES = 33554432;
var MAX_XTREAM_RESPONSE_BYTES = 33554432;
var DEFAULT_MAX_RESPONSE_BYTES = MAX_PLAYLIST_TEXT_BYTES;
function formatMegabytes(bytes) {
	return `${Math.round(bytes / 1048576)} MiB`;
}
function tooLargeError(label, maxBytes) {
	return /* @__PURE__ */ new Error(`${label} excede o limite de ${formatMegabytes(maxBytes)}.`);
}
async function readResponseTextWithLimit(response, maxBytes = DEFAULT_MAX_RESPONSE_BYTES, label = "Resposta") {
	const contentLengthHeader = response.headers.get("content-length");
	const contentLength = contentLengthHeader ? Number(contentLengthHeader) : NaN;
	if (Number.isFinite(contentLength) && contentLength > maxBytes) {
		await response.body?.cancel().catch(() => {});
		throw tooLargeError(label, maxBytes);
	}
	if (!response.body) {
		const text = await response.text();
		if (Buffer.byteLength(text, "utf8") > maxBytes) throw tooLargeError(label, maxBytes);
		return text;
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	const chunks = [];
	let totalBytes = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			totalBytes += value.byteLength;
			if (totalBytes > maxBytes) {
				await reader.cancel().catch(() => {});
				throw tooLargeError(label, maxBytes);
			}
			chunks.push(decoder.decode(value, { stream: true }));
		}
		chunks.push(decoder.decode());
		return chunks.join("");
	} finally {
		reader.releaseLock();
	}
}
var LIVE_EXTENSIONS = /* @__PURE__ */ new Set(["ts", "m3u8"]);
var MEDIA_EXTENSIONS = /* @__PURE__ */ new Set([
	"mp4",
	"mkv",
	"avi",
	"webm",
	"mov"
]);
function normalizeStreamExtension(kind, extension) {
	const requestedExt = extension.trim().toLowerCase().replace(/^\./, "");
	const allowedExtensions = kind === "live" ? LIVE_EXTENSIONS : MEDIA_EXTENSIONS;
	const fallbackExt = kind === "live" ? "m3u8" : "mp4";
	return allowedExtensions.has(requestedExt) ? requestedExt : fallbackExt;
}
function getPlaybackExtensions(kind, extension) {
	const normalized = extension?.trim().toLowerCase().replace(/^\./, "") ?? "";
	if (kind !== "live") return [normalizeStreamExtension(kind, normalized)];
	if (normalized === "ts" || normalized === "m3u8") return [normalized];
	return ["m3u8", "ts"];
}
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
		const text = await readResponseTextWithLimit(response, MAX_XTREAM_RESPONSE_BYTES, "Resposta Xtream");
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
	const safeExt = normalizeStreamExtension(kind, ext);
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
var LOCAL_CACHE_ROOT = process.env["MAGO_SERVER_FILESYSTEM_CACHE_DIR"]?.trim() || process.env["SERVER_FILESYSTEM_CACHE_DIR"]?.trim() || join(process.cwd(), "storage");
var SERVERS_ROOT = join(LOCAL_CACHE_ROOT, "servers");
join(LOCAL_CACHE_ROOT, "locks");
var LEGACY_CACHE_ROOT = join(process.cwd(), ".storage", "server-filesystem-cache");
var LEGACY_SERVERS_ROOT = join(LEGACY_CACHE_ROOT, "servers");
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
	const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > 432e5;
	return {
		payload: diskEntry.payload,
		fetchedAt: diskEntry.fetched_at,
		stale
	};
}
async function tryReadDiskPlaylistAtPath(filePath) {
	try {
		if ((await stat(filePath)).size > 67108864) return null;
	} catch {
		return null;
	}
	const playlist = await readJsonFile(filePath);
	if (!playlist?.playlist_text?.trim()) return null;
	const fetchedAt = new Date(playlist.fetched_at).getTime();
	const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > 432e5;
	return {
		...playlist,
		stale
	};
}
async function tryReadDiskPlaylist(serverId) {
	return tryReadDiskPlaylistAtPath(getPlaylistJsonPath(serverId));
}
async function cleanupServerDirectory(serverDir) {
	await rm(serverDir, {
		recursive: true,
		force: true
	});
}
async function readLocalServerCache(serverId, cacheKey) {
	const current = await tryReadDiskCache(serverId, cacheKey);
	if (current) return current;
	const legacyEntry = await readJsonFile(join(getLegacyServerDir(serverId), "catalog", cacheFileName(cacheKey)));
	if (!legacyEntry || !isMeaningfulPayload(legacyEntry.payload)) return null;
	const fetchedAt = new Date(legacyEntry.fetched_at).getTime();
	const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > 432e5;
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
	return tryReadDiskPlaylistAtPath(join(getLegacyServerDir(serverId), "playlist.json"));
}
var CACHE_TTL_MS = 432e5;
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
//#endregion
export { readServerCache as a, writeServerCache as c, iptv_cache_server_BM0GfnyO_exports as i, clearServerPlaylistCache as n, readServerPlaylistCache as o, getPlaybackExtensions as r, serverCatalogCacheKey as s, clearServerCache as t };
