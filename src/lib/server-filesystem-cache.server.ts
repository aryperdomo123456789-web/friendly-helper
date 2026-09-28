import { createHash } from "node:crypto";
import { copyFile, mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { PlaylistSnapshot } from "./iptv-playlist.server";
import { MAX_PLAYLIST_TEXT_BYTES } from "./response-limit.server";
import { LongOperationCancelledError } from "./long-operation";

const LOCAL_CACHE_ROOT =
  process.env["MAGO_SERVER_FILESYSTEM_CACHE_DIR"]?.trim() ||
  process.env["SERVER_FILESYSTEM_CACHE_DIR"]?.trim() ||
  join(process.cwd(), "storage");
const SERVERS_ROOT = join(LOCAL_CACHE_ROOT, "servers");
const LOCKS_ROOT = join(LOCAL_CACHE_ROOT, "locks");
const LEGACY_CACHE_ROOT = join(process.cwd(), ".storage", "server-filesystem-cache");
const LEGACY_SERVERS_ROOT = join(LEGACY_CACHE_ROOT, "servers");
const configuredLockLeaseMs = Number(process.env["WORKER_LOCK_LEASE_MS"] ?? 480_000);
const LOCK_LEASE_MS = Number.isFinite(configuredLockLeaseMs)
  ? Math.min(Math.max(configuredLockLeaseMs, 5 * 60 * 1000), 10 * 60 * 1000)
  : 8 * 60 * 1000;
const LOCK_HEARTBEAT_MS = Math.min(30_000, Math.floor(LOCK_LEASE_MS / 3));

type CachedRow<T> = {
  payload: T;
  fetched_at: string;
};

type DiskCacheEntry<T> = CachedRow<T> & {
  cache_key: string;
  server_id: string;
};

function normalizePathSegment(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "");
}

function cacheFileName(cacheKey: string) {
  const readable = normalizePathSegment(cacheKey).slice(0, 64) || "cache";
  const digest = createHash("sha1").update(cacheKey).digest("hex").slice(0, 12);
  return `${readable}.${digest}.json`;
}

function getServerDir(serverId: string) {
  return join(SERVERS_ROOT, serverId);
}

function getLegacyServerDir(serverId: string) {
  return join(LEGACY_SERVERS_ROOT, serverId);
}

function getCatalogDir(serverId: string) {
  return join(getServerDir(serverId), "catalog");
}

function getPlaylistJsonPath(serverId: string) {
  return join(getServerDir(serverId), "playlist.json");
}

function getPlaylistTextPath(serverId: string) {
  return join(getServerDir(serverId), "playlist.m3u");
}

function getCacheEntryPath(serverId: string, cacheKey: string) {
  return join(getCatalogDir(serverId), cacheFileName(cacheKey));
}

function getLockPath(serverId: string) {
  return join(LOCKS_ROOT, `${serverId}.lock`);
}

async function ensureParentDir(filePath: string) {
  await mkdir(dirname(filePath), { recursive: true });
}

async function writeAtomicText(filePath: string, contents: string) {
  await ensureParentDir(filePath);
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmpPath, contents, "utf8");
  await rename(tmpPath, filePath);
}

async function writeAtomicJson(filePath: string, payload: unknown) {
  await writeAtomicText(filePath, JSON.stringify(payload));
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

function isMeaningfulPayload(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  if (value && typeof value === "object")
    return Object.keys(value as Record<string, unknown>).length > 0;
  return value !== null && value !== undefined;
}

async function tryReadDiskCache<T>(serverId: string, cacheKey: string) {
  const diskEntry = await readJsonFile<DiskCacheEntry<T>>(getCacheEntryPath(serverId, cacheKey));
  if (!diskEntry || !isMeaningfulPayload(diskEntry.payload)) return null;

  const fetchedAt = new Date(diskEntry.fetched_at).getTime();
  const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > 12 * 60 * 60 * 1000;
  return { payload: diskEntry.payload, fetchedAt: diskEntry.fetched_at, stale };
}

async function tryReadDiskPlaylistAtPath(filePath: string) {
  try {
    const stats = await stat(filePath);
    if (stats.size > MAX_PLAYLIST_TEXT_BYTES * 2) return null;
  } catch {
    return null;
  }

  const playlist = await readJsonFile<PlaylistSnapshot>(filePath);
  if (!playlist?.playlist_text?.trim()) return null;

  const fetchedAt = new Date(playlist.fetched_at).getTime();
  const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > 12 * 60 * 60 * 1000;
  return { ...playlist, stale };
}

async function tryReadDiskPlaylist(serverId: string) {
  return tryReadDiskPlaylistAtPath(getPlaylistJsonPath(serverId));
}

async function cleanupServerDirectory(serverDir: string) {
  await rm(serverDir, { recursive: true, force: true });
}

export type ServerFilesystemLockObserver = {
  onContended?: () => void;
  onAcquired?: (waitMs: number) => void;
  onStaleRemoved?: () => void;
  onTimedOut?: (waitMs: number) => void;
  onSkipped?: () => void;
  isCancellationRequested?: () => Promise<boolean>;
};

export class ServerFilesystemLockBusyError extends Error {
  readonly code = "SERVER_FILESYSTEM_LOCK_BUSY";

  constructor(serverId: string) {
    super(`Outro refresh já está em andamento para o servidor ${serverId}.`);
    this.name = "ServerFilesystemLockBusyError";
  }
}

export async function withServerFilesystemLock<T>(
  serverId: string,
  task: () => Promise<T>,
  observer: ServerFilesystemLockObserver = {},
) {
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
      started_at: new Date().toISOString(),
      lease_expires_at: new Date(leaseExpiresAt).toISOString(),
      heartbeat_at: new Date().toISOString(),
    };
    try {
      await handle.writeFile(JSON.stringify(lockPayload));
    } finally {
      await handle.close();
    }

    observer.onAcquired?.(Date.now() - startedAt);
    const heartbeat = setInterval(() => {
      void writeFile(
        lockPath,
        JSON.stringify({
          ...lockPayload,
          heartbeat_at: new Date().toISOString(),
          lease_expires_at: new Date(Date.now() + LOCK_LEASE_MS).toISOString(),
        }),
        "utf8",
      ).catch(() => {});
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
    if ((error as { code?: string }).code !== "EEXIST") throw error;

    observer.onContended?.();
    let stale = false;
    try {
      const stats = await stat(lockPath);
      const payload = await readJsonFile<{ lease_expires_at?: string }>(lockPath);
      const leaseExpiresAt = payload?.lease_expires_at
        ? Date.parse(payload.lease_expires_at)
        : Number.NaN;
      stale = Number.isFinite(leaseExpiresAt)
        ? leaseExpiresAt <= Date.now()
        : Date.now() - stats.mtimeMs > LOCK_LEASE_MS;
    } catch {
      stale = true;
    }

    if (stale) {
      await rm(lockPath, { force: true }).catch(() => {});
      observer.onStaleRemoved?.();
      throw new ServerFilesystemLockBusyError(serverId);
    }

    observer.onSkipped?.();
    observer.onTimedOut?.(Date.now() - startedAt);
    throw new ServerFilesystemLockBusyError(serverId);
  }
}

export async function readLocalServerCache<T>(serverId: string, cacheKey: string) {
  const current = await tryReadDiskCache<T>(serverId, cacheKey);
  if (current) return current;

  const legacyEntry = await readJsonFile<DiskCacheEntry<T>>(
    join(getLegacyServerDir(serverId), "catalog", cacheFileName(cacheKey)),
  );
  if (!legacyEntry || !isMeaningfulPayload(legacyEntry.payload)) return null;

  const fetchedAt = new Date(legacyEntry.fetched_at).getTime();
  const stale = Number.isNaN(fetchedAt) ? true : Date.now() - fetchedAt > 12 * 60 * 60 * 1000;
  return { payload: legacyEntry.payload, fetchedAt: legacyEntry.fetched_at, stale };
}

export async function writeLocalServerCache<T>(
  serverId: string,
  cacheKey: string,
  payload: T,
  fetchedAt = new Date().toISOString(),
) {
  const diskEntry: DiskCacheEntry<T> = {
    server_id: serverId,
    cache_key: cacheKey,
    payload,
    fetched_at: fetchedAt,
  };

  await writeAtomicJson(getCacheEntryPath(serverId, cacheKey), diskEntry);
}

export async function clearLocalServerCache(serverId: string) {
  await Promise.all([
    cleanupServerDirectory(getServerDir(serverId)),
    cleanupServerDirectory(getLegacyServerDir(serverId)),
  ]);
}

export async function clearLocalServerPlaylist(serverId: string) {
  await Promise.all([
    rm(getPlaylistJsonPath(serverId), { force: true }).catch(() => {}),
    rm(getPlaylistTextPath(serverId), { force: true }).catch(() => {}),
    rm(join(getLegacyServerDir(serverId), "playlist.json"), { force: true }).catch(() => {}),
    rm(join(getLegacyServerDir(serverId), "playlist.m3u"), { force: true }).catch(() => {}),
  ]);
}

export async function readLocalServerPlaylist(serverId: string) {
  const current = await tryReadDiskPlaylist(serverId);
  if (current) return current;

  return tryReadDiskPlaylistAtPath(join(getLegacyServerDir(serverId), "playlist.json"));
}

export async function writeLocalServerPlaylist(serverId: string, snapshot: PlaylistSnapshot) {
  await mkdir(getServerDir(serverId), { recursive: true });
  const textPath = getPlaylistTextPath(serverId);
  const jsonPath = getPlaylistJsonPath(serverId);

  if (snapshot.playlist_file_path) {
    const tempTextPath = `${textPath}.${process.pid}.${Date.now()}.tmp`;
    await copyFile(snapshot.playlist_file_path, tempTextPath);
    await rename(tempTextPath, textPath);
    await writeAtomicJson(jsonPath, {
      ...snapshot,
      playlist_text: undefined,
      playlist_file_path: undefined,
      catalog: undefined,
    });
    return;
  }

  await writeAtomicJson(jsonPath, snapshot);
  if (snapshot.playlist_text) await writeAtomicText(textPath, snapshot.playlist_text);
}
