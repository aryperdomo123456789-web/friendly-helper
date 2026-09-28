import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
//#region ../../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/server-media-cache.server-DmVNVbpE.js
var LOCAL_MEDIA_CACHE_ROOT = process.env["MAGO_SERVER_FILESYSTEM_CACHE_DIR"]?.trim() || process.env["SERVER_FILESYSTEM_CACHE_DIR"]?.trim() || join(process.cwd(), "storage");
var MEDIA_ROOT = join(LOCAL_MEDIA_CACHE_ROOT, "shared");
var SERVERS_ROOT = join(LOCAL_MEDIA_CACHE_ROOT, "servers");
var LEGACY_MEDIA_ROOT = join(process.cwd(), ".storage", "server-filesystem-cache", "media");
var LOCK_STALE_MS = 900 * 1e3;
function normalizePathSegment(value) {
	return value.replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "");
}
function hashKey(value) {
	return createHash("sha256").update(value).digest("hex");
}
function getMediaScope(serverId) {
	return serverId?.trim() ? join(SERVERS_ROOT, serverId.trim(), "media") : join(MEDIA_ROOT, "media");
}
function getLegacyMediaScope(serverId) {
	return serverId?.trim() ? join(LEGACY_MEDIA_ROOT, "servers", serverId.trim()) : join(LEGACY_MEDIA_ROOT, "shared");
}
function getCacheKey(sourceUrl) {
	return hashKey(sourceUrl);
}
function getImageBasePath(sourceUrl, serverId) {
	const scope = getMediaScope(serverId);
	const hash = getCacheKey(sourceUrl);
	return join(scope, "images", `${normalizePathSegment(sourceUrl).slice(0, 32) || "image"}.${hash}`);
}
function getLegacyImageBasePath(sourceUrl, serverId) {
	const scope = getLegacyMediaScope(serverId);
	const hash = getCacheKey(sourceUrl);
	return join(scope, "images", `${normalizePathSegment(sourceUrl).slice(0, 32) || "image"}.${hash}`);
}
function getMetaPath(sourceUrl, serverId) {
	return `${getImageBasePath(sourceUrl, serverId)}.json`;
}
function getBodyPath(sourceUrl, serverId) {
	return `${getImageBasePath(sourceUrl, serverId)}.bin`;
}
async function ensureParentDir(filePath) {
	await mkdir(dirname(filePath), { recursive: true });
}
async function writeAtomicFile(filePath, buffer) {
	await ensureParentDir(filePath);
	const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
	await writeFile(tmpPath, buffer);
	await rename(tmpPath, filePath);
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
async function readBinaryFile(filePath) {
	try {
		return await readFile(filePath);
	} catch {
		return null;
	}
}
async function readLocalImageCache(sourceUrl, serverId) {
	const currentMeta = await readJsonFile(getMetaPath(sourceUrl, serverId));
	if (currentMeta) {
		const body = await readBinaryFile(getBodyPath(sourceUrl, serverId));
		if (!body || body.length === 0) return null;
		const fetchedAt = new Date(currentMeta.fetched_at).getTime();
		return {
			meta: currentMeta,
			body,
			stale: Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > LOCK_STALE_MS * 4
		};
	}
	const legacyMetaPath = `${getLegacyImageBasePath(sourceUrl, serverId)}.json`;
	const legacyBodyPath = `${getLegacyImageBasePath(sourceUrl, serverId)}.bin`;
	const legacyMeta = await readJsonFile(legacyMetaPath);
	if (!legacyMeta) return null;
	const body = await readBinaryFile(legacyBodyPath);
	if (!body || body.length === 0) return null;
	const fetchedAt = new Date(legacyMeta.fetched_at).getTime();
	return {
		meta: legacyMeta,
		body,
		stale: Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > LOCK_STALE_MS * 4
	};
}
async function writeLocalImageCache(sourceUrl, serverId, contentType, body) {
	const meta = {
		cache_key: getCacheKey(sourceUrl),
		server_id: serverId?.trim() ? serverId.trim() : null,
		source_url: sourceUrl,
		content_type: contentType,
		fetched_at: (/* @__PURE__ */ new Date()).toISOString(),
		bytes: body.length
	};
	await writeAtomicFile(getBodyPath(sourceUrl, serverId), body);
	await writeAtomicFile(getMetaPath(sourceUrl, serverId), JSON.stringify(meta));
}
async function clearLocalImageCache(serverId) {
	await Promise.all([rm(getMediaScope(serverId), {
		recursive: true,
		force: true
	}), rm(getLegacyMediaScope(serverId), {
		recursive: true,
		force: true
	})]);
}
//#endregion
export { readLocalImageCache as n, writeLocalImageCache as r, clearLocalImageCache as t };
