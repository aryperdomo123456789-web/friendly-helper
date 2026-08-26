import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const LOCAL_MEDIA_CACHE_ROOT =
  process.env["MAGO_SERVER_FILESYSTEM_CACHE_DIR"]?.trim() ||
  process.env["SERVER_FILESYSTEM_CACHE_DIR"]?.trim() ||
  join(process.cwd(), "storage");
const MEDIA_ROOT = join(LOCAL_MEDIA_CACHE_ROOT, "shared");
const SERVERS_ROOT = join(LOCAL_MEDIA_CACHE_ROOT, "servers");
const LEGACY_MEDIA_ROOT = join(process.cwd(), ".storage", "server-filesystem-cache", "media");
const LOCK_STALE_MS = 15 * 60 * 1000;

type ImageCacheEntry = {
  cache_key: string;
  server_id: string | null;
  source_url: string;
  content_type: string;
  fetched_at: string;
  bytes: number;
};

function normalizePathSegment(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "");
}

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function getMediaScope(serverId?: string | null) {
  return serverId?.trim()
    ? join(SERVERS_ROOT, serverId.trim(), "media")
    : join(MEDIA_ROOT, "media");
}

function getLegacyMediaScope(serverId?: string | null) {
  return serverId?.trim() ? join(LEGACY_MEDIA_ROOT, "servers", serverId.trim()) : join(LEGACY_MEDIA_ROOT, "shared");
}

function getCacheKey(sourceUrl: string) {
  return hashKey(sourceUrl);
}

function getImageBasePath(sourceUrl: string, serverId?: string | null) {
  const scope = getMediaScope(serverId);
  const hash = getCacheKey(sourceUrl);
  const readable = normalizePathSegment(sourceUrl).slice(0, 32) || "image";
  return join(scope, "images", `${readable}.${hash}`);
}

function getLegacyImageBasePath(sourceUrl: string, serverId?: string | null) {
  const scope = getLegacyMediaScope(serverId);
  const hash = getCacheKey(sourceUrl);
  const readable = normalizePathSegment(sourceUrl).slice(0, 32) || "image";
  return join(scope, "images", `${readable}.${hash}`);
}

function getMetaPath(sourceUrl: string, serverId?: string | null) {
  return `${getImageBasePath(sourceUrl, serverId)}.json`;
}

function getBodyPath(sourceUrl: string, serverId?: string | null) {
  return `${getImageBasePath(sourceUrl, serverId)}.bin`;
}

async function ensureParentDir(filePath: string) {
  await mkdir(dirname(filePath), { recursive: true });
}

async function writeAtomicFile(filePath: string, buffer: Buffer | string) {
  await ensureParentDir(filePath);
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmpPath, buffer);
  await rename(tmpPath, filePath);
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readBinaryFile(filePath: string): Promise<Buffer | null> {
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export async function readLocalImageCache(sourceUrl: string, serverId?: string | null) {
  const currentMeta = await readJsonFile<ImageCacheEntry>(getMetaPath(sourceUrl, serverId));
  if (currentMeta) {
    const body = await readBinaryFile(getBodyPath(sourceUrl, serverId));
    if (!body || body.length === 0) return null;

    const fetchedAt = new Date(currentMeta.fetched_at).getTime();
    const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > LOCK_STALE_MS * 4;
    return { meta: currentMeta, body, stale };
  }

  const legacyMetaPath = `${getLegacyImageBasePath(sourceUrl, serverId)}.json`;
  const legacyBodyPath = `${getLegacyImageBasePath(sourceUrl, serverId)}.bin`;
  const legacyMeta = await readJsonFile<ImageCacheEntry>(legacyMetaPath);
  if (!legacyMeta) return null;

  const body = await readBinaryFile(legacyBodyPath);
  if (!body || body.length === 0) return null;

  const fetchedAt = new Date(legacyMeta.fetched_at).getTime();
  const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > LOCK_STALE_MS * 4;
  return { meta: legacyMeta, body, stale };
}

export async function writeLocalImageCache(
  sourceUrl: string,
  serverId: string | null | undefined,
  contentType: string,
  body: Buffer,
) {
  const meta: ImageCacheEntry = {
    cache_key: getCacheKey(sourceUrl),
    server_id: serverId?.trim() ? serverId.trim() : null,
    source_url: sourceUrl,
    content_type: contentType,
    fetched_at: new Date().toISOString(),
    bytes: body.length,
  };

  await writeAtomicFile(getBodyPath(sourceUrl, serverId), body);
  await writeAtomicFile(getMetaPath(sourceUrl, serverId), JSON.stringify(meta));
}

export async function clearLocalImageCache(serverId?: string | null) {
  await Promise.all([
    rm(getMediaScope(serverId), { recursive: true, force: true }),
    rm(getLegacyMediaScope(serverId), { recursive: true, force: true }),
  ]);
}
