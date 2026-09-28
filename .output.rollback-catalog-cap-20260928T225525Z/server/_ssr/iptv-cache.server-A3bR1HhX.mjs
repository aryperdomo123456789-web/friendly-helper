import { n as __exportAll } from "../_runtime.mjs";
import { t as __exportAll$1 } from "./rolldown-runtime-D7D4PA-g.mjs";
import { t as clearLocalImageCache } from "./server-media-cache.server-DmVNVbpE.mjs";
import { createHash, randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { copyFile, mkdir, mkdtemp, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/iptv-cache.server-A3bR1HhX.js
var iptv_cache_server_A3bR1HhX_exports = /* @__PURE__ */ __exportAll({
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
var MAX_PLAYLIST_TEXT_BYTES = 32 * 1024 * 1024;
var MAX_XTREAM_RESPONSE_BYTES = 32 * 1024 * 1024;
var DEFAULT_MAX_RESPONSE_BYTES = MAX_PLAYLIST_TEXT_BYTES;
function formatMegabytes(bytes) {
	return `${Math.round(bytes / (1024 * 1024))} MiB`;
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
var DEFAULT_PLAYLIST_TIMEOUT_MS = 6e4;
var DEFAULT_PLAYLIST_MAX_ATTEMPTS = 3;
var DEFAULT_PLAYLIST_BACKOFF_MS = 750;
var STREAMING_PLAYLIST_MAX_BYTES = 128 * 1024 * 1024;
var MAX_CATALOG_STREAMS_PER_KIND = 4e3;
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
function createParserState() {
	return {
		catalog: createEmptyPlaylistCatalog(),
		categoryMaps: {
			live: /* @__PURE__ */ new Map(),
			movie: /* @__PURE__ */ new Map(),
			series: /* @__PURE__ */ new Map()
		},
		pendingEntry: null,
		itemCount: 0
	};
}
function consumePlaylistLine(state, rawLine) {
	const line = rawLine.trim();
	if (!line) return;
	if (line.startsWith("#EXTM3U") || line.startsWith("#EXTVLCOPT")) return;
	if (line.startsWith("#EXTINF")) {
		state.itemCount += 1;
		const commaIndex = line.lastIndexOf(",");
		const header = commaIndex >= 0 ? line.slice(0, commaIndex) : line;
		const displayName = commaIndex >= 0 ? line.slice(commaIndex + 1).trim() : "";
		state.pendingEntry = {
			meta: parseAttributes(header),
			displayName
		};
		return;
	}
	if (!state.pendingEntry || line.startsWith("#")) return;
	const kind = detectKindFromUrl(line);
	const groupName = sanitizeCategoryName(state.pendingEntry.meta["group-title"] ?? state.pendingEntry.meta["group_title"] ?? state.pendingEntry.meta["group"] ?? "");
	const categoryId = groupName;
	if (!state.categoryMaps[kind].has(categoryId)) {
		state.categoryMaps[kind].set(categoryId, categoryId);
		state.catalog[kind].categories.push({
			category_id: categoryId,
			category_name: groupName
		});
	}
	if (state.catalog[kind].streams.length >= MAX_CATALOG_STREAMS_PER_KIND) {
		state.pendingEntry = null;
		return;
	}
	state.catalog[kind].streams.push({
		id: detectId(kind, line),
		name: normalizeText(state.pendingEntry.meta["tvg-name"] ?? state.pendingEntry.meta["tvg_name"] ?? state.pendingEntry.displayName) || "Conteúdo",
		icon: normalizeText(state.pendingEntry.meta["tvg-logo"] ?? state.pendingEntry.meta["tvg_logo"] ?? state.pendingEntry.meta["logo"]) || null,
		ext: detectExt(line),
		rating: null,
		category_id: categoryId,
		kind
	});
	state.pendingEntry = null;
}
function finalizeCatalog(catalog) {
	for (const kind of Object.keys(catalog)) catalog[kind].streams = catalog[kind].streams.slice(0, 4e3);
	return catalog;
}
async function sleep(delayMs) {
	if (delayMs <= 0) return;
	await new Promise((resolve) => setTimeout(resolve, delayMs));
}
async function streamPlaylistToTempFile(response, maxBytes) {
	const contentLength = Number(response.headers.get("content-length"));
	if (Number.isFinite(contentLength) && contentLength > maxBytes) {
		await response.body?.cancel().catch(() => {});
		throw new Error(`Playlist M3U excede o limite de ${Math.round(maxBytes / 1024 / 1024)} MiB.`);
	}
	if (!response.body) throw new Error("Playlist M3U sem corpo de resposta.");
	const tempDir = await mkdtemp(join(tmpdir(), "mago-m3u-"));
	const filePath = join(tempDir, "playlist.m3u");
	const file = await open(filePath, "w");
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	const hash = createHash("sha256");
	const state = createParserState();
	let carry = "";
	let totalBytes = 0;
	const consumeText = (text, final = false) => {
		const parts = `${carry}${text}`.split(/\r?\n/);
		carry = final ? "" : parts.pop() ?? "";
		for (const line of parts) consumePlaylistLine(state, line);
		if (final && carry) consumePlaylistLine(state, carry);
	};
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			totalBytes += value.byteLength;
			if (totalBytes > maxBytes) {
				await reader.cancel().catch(() => {});
				throw new Error(`Playlist M3U excede o limite de ${Math.round(maxBytes / 1024 / 1024)} MiB.`);
			}
			hash.update(value);
			await file.write(value);
			consumeText(decoder.decode(value, { stream: true }));
		}
		consumeText(decoder.decode(), true);
		await file.close();
		return {
			filePath,
			playlistHash: hash.digest("hex"),
			itemCount: state.itemCount,
			catalog: finalizeCatalog(state.catalog)
		};
	} catch (error) {
		await file.close().catch(() => {});
		await rm(tempDir, {
			recursive: true,
			force: true
		}).catch(() => {});
		throw error;
	} finally {
		reader.releaseLock();
	}
}
async function fetchRemotePlaylistStreaming(creds, options = {}) {
	const timeoutMs = options.timeoutMs ?? DEFAULT_PLAYLIST_TIMEOUT_MS;
	const maxAttempts = Math.max(1, Math.min(options.maxAttempts ?? DEFAULT_PLAYLIST_MAX_ATTEMPTS, 4));
	const maxBytes = options.maxBytes ?? STREAMING_PLAYLIST_MAX_BYTES;
	const backoffBaseMs = Math.max(0, options.backoffBaseMs ?? DEFAULT_PLAYLIST_BACKOFF_MS);
	const outputs = ["ts", "m3u8"];
	let lastError;
	for (const output of outputs) {
		const sourceUrl = makePlaylistUrl(creds, output);
		for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), timeoutMs);
			try {
				const response = await fetch(sourceUrl, {
					signal: controller.signal,
					headers: {
						"User-Agent": "IPTV-System/1.0",
						Accept: "text/plain, */*"
					}
				});
				if (!response.ok) throw new Error(`Playlist respondeu ${response.status}`);
				const streamed = await streamPlaylistToTempFile(response, maxBytes);
				if (streamed.itemCount === 0 || !streamed.catalog.live.streams.length && !streamed.catalog.movie.streams.length && !streamed.catalog.series.streams.length) {
					await rm(join(streamed.filePath, ".."), {
						recursive: true,
						force: true
					}).catch(() => {});
					throw new Error("Resposta não parece uma playlist M3U válida.");
				}
				return {
					source_url: sourceUrl,
					playlist_hash: streamed.playlistHash,
					item_count: streamed.itemCount,
					fetched_at: (/* @__PURE__ */ new Date()).toISOString(),
					playlist_file_path: streamed.filePath,
					catalog: streamed.catalog
				};
			} catch (error) {
				lastError = error;
				if (attempt < maxAttempts) await sleep(backoffBaseMs * 2 ** (attempt - 1));
			} finally {
				clearTimeout(timer);
			}
		}
	}
	throw lastError instanceof Error ? /* @__PURE__ */ new Error(`Falha ao baixar M3U do servidor (${lastError.message}).`) : /* @__PURE__ */ new Error("Falha ao baixar M3U do servidor.");
}
function parsePlaylistCatalog(playlistText) {
	const state = createParserState();
	for (const rawLine of playlistText.split(/\r?\n/)) consumePlaylistLine(state, rawLine);
	return finalizeCatalog(state.catalog);
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
var STAGE_PROGRESS = {
	queued: 0,
	acquiring_lock: 10,
	fetching_m3u: 25,
	parsing_catalog: 40,
	fetching_catalog: 55,
	persisting_cache: 85,
	completed: 100,
	failed: null,
	cancelled: null
};
var LongOperationCancelledError = class extends Error {
	constructor(message = "Operação cancelada cooperativamente.") {
		super(message);
		this.name = "LongOperationCancelledError";
	}
};
function createLongOperationMetadata(operationRef, state, stage, startedAt, now = Date.now()) {
	return {
		operation_ref: operationRef,
		operation_state: state,
		operation_stage: stage,
		progress_percent: STAGE_PROGRESS[stage],
		elapsed_ms: Math.max(0, now - startedAt)
	};
}
var LOCAL_CACHE_ROOT = process.env["MAGO_SERVER_FILESYSTEM_CACHE_DIR"]?.trim() || process.env["SERVER_FILESYSTEM_CACHE_DIR"]?.trim() || join(process.cwd(), "storage");
var SERVERS_ROOT = join(LOCAL_CACHE_ROOT, "servers");
var LOCKS_ROOT = join(LOCAL_CACHE_ROOT, "locks");
var LEGACY_SERVERS_ROOT = join(join(process.cwd(), ".storage", "server-filesystem-cache"), "servers");
var configuredLockLeaseMs = Number(process.env["WORKER_LOCK_LEASE_MS"] ?? 48e4);
var LOCK_LEASE_MS = Number.isFinite(configuredLockLeaseMs) ? Math.min(Math.max(configuredLockLeaseMs, 300 * 1e3), 600 * 1e3) : 480 * 1e3;
var LOCK_HEARTBEAT_MS = Math.min(3e4, Math.floor(LOCK_LEASE_MS / 3));
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
async function tryReadDiskPlaylistAtPath(filePath) {
	try {
		if ((await stat(filePath)).size > 33554432 * 2) return null;
	} catch {
		return null;
	}
	const playlist = await readJsonFile(filePath);
	if (!playlist?.playlist_text?.trim()) return null;
	const fetchedAt = new Date(playlist.fetched_at).getTime();
	const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > 720 * 60 * 1e3;
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
var ServerFilesystemLockBusyError = class extends Error {
	code = "SERVER_FILESYSTEM_LOCK_BUSY";
	constructor(serverId) {
		super(`Outro refresh já está em andamento para o servidor ${serverId}.`);
		this.name = "ServerFilesystemLockBusyError";
	}
};
async function withServerFilesystemLock(serverId, task, observer = {}) {
	await mkdir(LOCKS_ROOT, { recursive: true });
	const lockPath = getLockPath(serverId);
	const startedAt = Date.now();
	if (await observer.isCancellationRequested?.()) throw new LongOperationCancelledError();
	try {
		const handle = await open(lockPath, "wx");
		const leaseExpiresAt = Date.now() + LOCK_LEASE_MS;
		const lockPayload = {
			server_id: serverId,
			pid: process.pid,
			started_at: (/* @__PURE__ */ new Date()).toISOString(),
			lease_expires_at: new Date(leaseExpiresAt).toISOString(),
			heartbeat_at: (/* @__PURE__ */ new Date()).toISOString()
		};
		try {
			await handle.writeFile(JSON.stringify(lockPayload));
		} finally {
			await handle.close();
		}
		observer.onAcquired?.(Date.now() - startedAt);
		const heartbeat = setInterval(() => {
			writeFile(lockPath, JSON.stringify({
				...lockPayload,
				heartbeat_at: (/* @__PURE__ */ new Date()).toISOString(),
				lease_expires_at: new Date(Date.now() + LOCK_LEASE_MS).toISOString()
			}), "utf8").catch(() => {});
		}, LOCK_HEARTBEAT_MS);
		heartbeat.unref?.();
		try {
			return await task();
		} finally {
			clearInterval(heartbeat);
			await rm(lockPath, { force: true }).catch(() => {});
		}
	} catch (error) {
		if (!error || typeof error !== "object" || !("code" in error)) throw error;
		if (error.code !== "EEXIST") throw error;
		observer.onContended?.();
		let stale = false;
		try {
			const stats = await stat(lockPath);
			const payload = await readJsonFile(lockPath);
			const leaseExpiresAt = payload?.lease_expires_at ? Date.parse(payload.lease_expires_at) : NaN;
			stale = Number.isFinite(leaseExpiresAt) ? leaseExpiresAt <= Date.now() : Date.now() - stats.mtimeMs > LOCK_LEASE_MS;
		} catch {
			stale = true;
		}
		if (stale) {
			await rm(lockPath, { force: true }).catch(() => {});
			observer.onStaleRemoved?.();
			throw new ServerFilesystemLockBusyError(serverId);
		}
		observer.onSkipped?.();
		throw new ServerFilesystemLockBusyError(serverId);
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
	return tryReadDiskPlaylistAtPath(join(getLegacyServerDir(serverId), "playlist.json"));
}
async function writeLocalServerPlaylist(serverId, snapshot) {
	await mkdir(getServerDir(serverId), { recursive: true });
	const textPath = getPlaylistTextPath(serverId);
	const jsonPath = getPlaylistJsonPath(serverId);
	if (snapshot.playlist_file_path) {
		const tempTextPath = `${textPath}.${process.pid}.${Date.now()}.tmp`;
		await copyFile(snapshot.playlist_file_path, tempTextPath);
		await rename(tempTextPath, textPath);
		await writeAtomicJson(jsonPath, {
			...snapshot,
			playlist_text: void 0,
			playlist_file_path: void 0,
			catalog: void 0
		});
		return;
	}
	await writeAtomicJson(jsonPath, snapshot);
	if (snapshot.playlist_text) await writeAtomicText(textPath, snapshot.playlist_text);
}
var counters = {
	ticks_started: 0,
	ticks_completed: 0,
	tasks_started: 0,
	tasks_completed: 0,
	tasks_failed: 0,
	refresh_cycles_started: 0,
	refresh_cycles_completed: 0,
	refresh_cycles_failed: 0,
	refresh_servers_started: 0,
	refresh_servers_completed: 0,
	refresh_servers_failed: 0,
	refresh_fallbacks: 0,
	refresh_coalesced: 0,
	locks_acquired: 0,
	locks_contended: 0,
	locks_stale_removed: 0,
	locks_timed_out: 0,
	memory_alerts: 0
};
function getWorkerEnv(name) {
	return globalThis.process?.env?.[name];
}
var serviceName = getWorkerEnv("SERVICE_NAME")?.trim() || "app";
var SENSITIVE_KEY_PATTERN = /(authorization|cookie|credential|password|passwd|playlist_text|secret|token)/i;
var MAX_STRING_LENGTH = 2e3;
var MAX_ERROR_LENGTH = 4e3;
function redactString(value, maxLength = MAX_STRING_LENGTH) {
	return value.replace(/([?&](?:username|password|token|secret|key|authorization)=)[^&\s]+/gi, "$1<redacted>").slice(0, maxLength);
}
function sanitizeValue(key, value, depth = 0) {
	if (SENSITIVE_KEY_PATTERN.test(key)) return "<redacted>";
	if (depth > 3) return "<truncated>";
	if (value instanceof Error) return {
		name: value.name,
		message: redactString(value.message || value.name, MAX_ERROR_LENGTH),
		stack: value.stack ? redactString(value.stack, MAX_ERROR_LENGTH) : void 0,
		cause: value.cause ? sanitizeValue("cause", value.cause, depth + 1) : void 0
	};
	if (typeof value === "string") return redactString(value);
	if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
	if (typeof value === "undefined") return void 0;
	if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeValue(key, item, depth + 1));
	if (typeof value === "object") {
		const result = {};
		for (const [childKey, childValue] of Object.entries(value)) {
			const sanitized = sanitizeValue(childKey, childValue, depth + 1);
			if (sanitized !== void 0) result[childKey] = sanitized;
		}
		return result;
	}
	return String(value);
}
function sanitizeFields(fields) {
	return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, sanitizeValue(key, value)]).filter(([, value]) => value !== void 0));
}
function increment(counter) {
	counters[counter] += 1;
}
function nowIso() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
function createObservationId() {
	return randomUUID();
}
function hashObservationId(value) {
	return createHash("sha256").update(value).digest("hex").slice(0, 16);
}
function workerLog(level, event, fields = {}) {
	const entry = {
		timestamp: nowIso(),
		level,
		service: serviceName,
		event,
		pid: process.pid,
		...sanitizeFields(fields)
	};
	const serialized = JSON.stringify(entry);
	if (level === "error") console.error(serialized);
	else if (level === "warn") console.warn(serialized);
	else console.log(serialized);
}
function recordRefreshServerStarted() {
	increment("refresh_servers_started");
}
function recordRefreshServerCompleted() {
	increment("refresh_servers_completed");
	nowIso();
}
function recordRefreshServerFailed() {
	increment("refresh_servers_failed");
}
function recordRefreshFallback() {
	increment("refresh_fallbacks");
}
function recordRefreshCoalesced() {
	increment("refresh_coalesced");
}
function recordLockAcquired() {
	increment("locks_acquired");
}
function recordLockContended() {
	increment("locks_contended");
}
function recordLockStaleRemoved() {
	increment("locks_stale_removed");
}
function recordLockTimedOut() {
	increment("locks_timed_out");
}
var CACHE_TTL_MS = 720 * 60 * 1e3;
var CACHE_WRITE_BATCH_SIZE = 500;
var refreshInFlight = /* @__PURE__ */ new Map();
function normalizeItems(rows) {
	return Array.isArray(rows) ? rows : [];
}
function cacheKey(...parts) {
	return parts.filter(Boolean).join(":");
}
function logRefreshOperationState(refreshRef, serverRef, state, stage, startedAt, fields = {}) {
	workerLog("info", "refresh_operation_state", {
		...createLongOperationMetadata(hashObservationId(refreshRef), state, stage, startedAt),
		server_ref: serverRef,
		...fields
	});
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
	const dnsPool = normalizeItems(creds).map((row) => row.dns).filter((dns) => Boolean(dns));
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
async function writeServerCacheBatch(rows) {
	for (let offset = 0; offset < rows.length; offset += CACHE_WRITE_BATCH_SIZE) {
		const chunk = rows.slice(offset, offset + CACHE_WRITE_BATCH_SIZE);
		if (!chunk[0]?.server_id) continue;
		await Promise.all(chunk.map((row) => writeLocalServerCache(row.server_id, row.cache_key, row.payload, row.fetched_at)));
		const { error } = await (await getSupabaseAdmin()).from("iptv_server_cache").upsert(chunk, { onConflict: "server_id,cache_key" });
		if (error && !isMissingTableError(error)) throw error;
	}
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
	if (!snapshot.playlist_text) return;
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
	await writeServerCacheBatch(Object.keys(catalog).flatMap((kind) => [{
		server_id: serverId,
		cache_key: serverCatalogCacheKey(kind, "categories"),
		payload: catalog[kind].categories,
		fetched_at: (/* @__PURE__ */ new Date()).toISOString()
	}, {
		server_id: serverId,
		cache_key: serverCatalogCacheKey(kind, "streams"),
		payload: catalog[kind].streams.map(({ kind: _kind, ...stream }) => stream),
		fetched_at: (/* @__PURE__ */ new Date()).toISOString()
	}]));
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
async function executeServerCatalogRefresh(serverId, refreshRef, options = {}, hooks = {}) {
	const serverRef = hashObservationId(serverId);
	const refreshStartedAt = Date.now();
	const progress = async (state, stage, details = {}) => {
		logRefreshOperationState(refreshRef, serverRef, state, stage, refreshStartedAt, details);
		await hooks.onProgress?.(state, stage, details);
	};
	const assertNotCancelled = async () => {
		if (await hooks.isCancellationRequested?.()) throw new LongOperationCancelledError();
	};
	recordRefreshServerStarted();
	await progress("running", "acquiring_lock");
	workerLog("info", "refresh_server_started", {
		refresh_ref: hashObservationId(refreshRef),
		server_ref: serverRef
	});
	const lockObserver = {
		onAcquired: (waitMs) => {
			recordLockAcquired();
			workerLog("debug", "refresh_lock_acquired", {
				refresh_ref: hashObservationId(refreshRef),
				server_ref: serverRef,
				wait_ms: waitMs
			});
		},
		onContended: () => {
			recordLockContended();
			workerLog("warn", "refresh_lock_contended", {
				refresh_ref: hashObservationId(refreshRef),
				server_ref: serverRef
			});
		},
		onStaleRemoved: () => {
			recordLockStaleRemoved();
			workerLog("warn", "refresh_lock_stale_removed", {
				refresh_ref: hashObservationId(refreshRef),
				server_ref: serverRef
			});
		},
		onTimedOut: (waitMs) => {
			recordLockTimedOut();
			workerLog("error", "refresh_lock_timeout", {
				refresh_ref: hashObservationId(refreshRef),
				server_ref: serverRef,
				wait_ms: waitMs
			});
		},
		onSkipped: () => {
			recordRefreshCoalesced();
			workerLog("info", "refresh_lock_skipped", {
				refresh_ref: hashObservationId(refreshRef),
				server_ref: serverRef
			});
		}
	};
	if (hooks.isCancellationRequested) lockObserver.isCancellationRequested = hooks.isCancellationRequested;
	let streamingPlaylistFilePath = null;
	const job = withServerFilesystemLock(serverId, async () => {
		await assertNotCancelled();
		const { credential } = await loadServerCredential(serverId);
		if (!credential) throw new Error("Servidor sem credenciais cadastradas.");
		let catalog = null;
		let playlistSnapshot = null;
		let source = null;
		await progress("running", "fetching_m3u");
		try {
			await assertNotCancelled();
			playlistSnapshot = await fetchRemotePlaylistStreaming(credential);
			streamingPlaylistFilePath = playlistSnapshot.playlist_file_path ?? null;
			await assertNotCancelled();
			await progress("running", "parsing_catalog");
			catalog = playlistSnapshot.catalog ?? null;
			if (!Object.keys(catalog).some((kind) => catalog[kind].streams.length > 0)) {
				catalog = null;
				recordRefreshFallback();
				workerLog("warn", "refresh_m3u_empty_fallback", {
					refresh_ref: hashObservationId(refreshRef),
					server_ref: serverRef,
					item_count: playlistSnapshot.item_count
				});
			} else {
				source = "m3u";
				workerLog("info", "refresh_source_selected", {
					refresh_ref: hashObservationId(refreshRef),
					server_ref: serverRef,
					source,
					item_count: playlistSnapshot.item_count
				});
			}
		} catch (error) {
			if (error instanceof LongOperationCancelledError) throw error;
			recordRefreshFallback();
			workerLog("warn", "refresh_m3u_failed_fallback", {
				refresh_ref: hashObservationId(refreshRef),
				server_ref: serverRef,
				error
			});
		}
		if (!catalog) {
			const kinds = [
				"live",
				"movie",
				"series"
			];
			catalog = createEmptyPlaylistCatalog();
			for (const kind of kinds) {
				await assertNotCancelled();
				await progress("running", "fetching_catalog", { kind });
				catalog[kind] = await fetchCatalogKind(credential, kind);
			}
			source = "xtream";
			workerLog("info", "refresh_source_selected", {
				refresh_ref: hashObservationId(refreshRef),
				server_ref: serverRef,
				source
			});
		}
		await assertNotCancelled();
		await progress("running", "persisting_cache");
		if (options.clearLocalBeforeFetch) await Promise.allSettled([
			clearLocalServerCache(serverId),
			clearLocalServerPlaylist(serverId),
			clearLocalImageCache(serverId)
		]);
		if (playlistSnapshot) await writeServerPlaylistCache(serverId, playlistSnapshot);
		await writeCatalogRows(serverId, catalog);
		const result = {
			kinds: Object.keys(catalog).reduce((acc, kind) => {
				acc[kind] = {
					categories: catalog[kind].categories.length,
					streams: catalog[kind].streams.length
				};
				return acc;
			}, {}),
			source: source ?? "xtream"
		};
		recordRefreshServerCompleted();
		await progress("succeeded", "completed", {
			source: result.source,
			kinds: result.kinds
		});
		workerLog("info", "refresh_server_completed", {
			refresh_ref: hashObservationId(refreshRef),
			server_ref: serverRef,
			source: result.source,
			kinds: result.kinds,
			duration_ms: Date.now() - refreshStartedAt
		});
		return result;
	}, lockObserver);
	try {
		return await job;
	} catch (error) {
		if (error instanceof ServerFilesystemLockBusyError) {
			await progress("cancelled", "cancelled", { reason: "lock_busy_skip" }).catch((progressError) => workerLog("error", "refresh_operation_snapshot_failed", { error: progressError }));
			workerLog("info", "refresh_server_skipped_lock_busy", {
				refresh_ref: hashObservationId(refreshRef),
				server_ref: serverRef
			});
			return {
				kinds: {
					live: {
						categories: 0,
						streams: 0
					},
					movie: {
						categories: 0,
						streams: 0
					},
					series: {
						categories: 0,
						streams: 0
					}
				},
				source: "xtream",
				skipped: true
			};
		}
		const cancelled = error instanceof LongOperationCancelledError;
		if (!cancelled) recordRefreshServerFailed();
		await progress(cancelled ? "cancelled" : "failed", cancelled ? "cancelled" : "failed", { reason: cancelled ? "cooperative_cancel" : "execution_error" }).catch((progressError) => workerLog("error", "refresh_operation_snapshot_failed", { error: progressError }));
		workerLog(cancelled ? "info" : "error", cancelled ? "refresh_server_cancelled" : "refresh_server_failed", {
			refresh_ref: hashObservationId(refreshRef),
			server_ref: serverRef,
			error
		});
		throw cancelled ? error : normalizeRefreshServerError(error);
	} finally {
		if (streamingPlaylistFilePath) {
			await rm(streamingPlaylistFilePath, { force: true }).catch(() => {});
			await rm(streamingPlaylistFilePath.replace(/\/[^/]+$/, ""), {
				recursive: true,
				force: true
			}).catch(() => {});
		}
	}
}
async function refreshServerCatalogCache(serverId, options = {}) {
	const refreshRef = hashObservationId(createObservationId());
	const ongoing = refreshInFlight.get(serverId);
	if (ongoing) {
		recordRefreshCoalesced();
		workerLog("info", "refresh_server_coalesced", {
			refresh_ref: hashObservationId(refreshRef),
			server_ref: hashObservationId(serverId)
		});
		return ongoing;
	}
	const job = executeServerCatalogRefresh(serverId, refreshRef, options);
	refreshInFlight.set(serverId, job);
	try {
		return await job;
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
export { readServerCache as a, serverCatalogCacheKey as c, parsePlaylistCatalog as i, writeServerCache as l, clearServerPlaylistCache as n, readServerPlaylistCache as o, iptv_cache_server_A3bR1HhX_exports as r, refreshServerCatalogCache as s, clearServerCache as t };
