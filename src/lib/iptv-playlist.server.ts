import { createHash } from "node:crypto";
import { mkdtemp, open, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { normalizeDns, type XtreamCreds } from "./xtream.server.ts";
import { MAX_PLAYLIST_TEXT_BYTES, readResponseTextWithLimit } from "./response-limit.server.ts";
import { getCatalogStreamLimit, normalizeSeriesTitle, type CatalogKind } from "./catalog-limits.ts";
import { classifyM3UItem, normalizeM3UCategoryName } from "./m3u-classifier.server.ts";

type Kind = "live" | "movie" | "series";

export type PlaylistCategory = {
  category_id: string;
  category_name: string;
};

export type PlaylistStream = {
  id: string;
  name: string;
  icon: string | null;
  ext: string | null;
  rating: string | null;
  category_id: string | null;
  kind?: Kind;
};

export type PlaylistCatalog = Record<
  Kind,
  {
    categories: PlaylistCategory[];
    streams: PlaylistStream[];
  }
>;

export type PlaylistSnapshot = {
  source_url: string;
  playlist_text?: string;
  playlist_hash: string;
  item_count: number;
  fetched_at: string;
  /** Temporary file produced by the streaming worker and consumed atomically by the cache writer. */
  playlist_file_path?: string;
  /** Catalog parsed while the response was streamed, avoiding a second full-text pass. */
  catalog?: PlaylistCatalog;
};

export type StreamingPlaylistOptions = {
  timeoutMs?: number;
  maxAttempts?: number;
  maxBytes?: number;
  backoffBaseMs?: number;
};

const EMPTY_CATALOG: PlaylistCatalog = {
  live: { categories: [], streams: [] },
  movie: { categories: [], streams: [] },
  series: { categories: [], streams: [] },
};

const DEFAULT_PLAYLIST_TIMEOUT_MS = 60_000;
const DEFAULT_PLAYLIST_MAX_ATTEMPTS = 3;
const DEFAULT_PLAYLIST_BACKOFF_MS = 750;
const STREAMING_PLAYLIST_MAX_BYTES = (() => {
  const configured = Number(process.env.MAGO_STREAMING_PLAYLIST_MAX_BYTES);
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : 1024 * 1024 * 1024;
})();

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim();
}

function sanitizeCategoryName(value: string | null | undefined) {
  return normalizeM3UCategoryName(value);
}

function parseAttributes(line: string) {
  const attrs: Record<string, string> = {};
  const matches = line.matchAll(/([A-Za-z0-9_-]+)="([^"]*)"/g);
  for (const match of matches) {
    const key = match[1];
    const value = match[2];
    if (key && value !== undefined) attrs[key] = value;
  }
  return attrs;
}

function detectExt(urlLine: string): string | null {
  try {
    const url = new URL(urlLine);
    const pathname = url.pathname.split("/").pop() ?? "";
    const ext = pathname.includes(".") ? pathname.split(".").pop() : "";
    return ext ? ext.toLowerCase() : null;
  } catch {
    const cleaned = urlLine.split("?")[0] ?? "";
    const last = cleaned.split("/").pop() ?? "";
    const ext = last.includes(".") ? last.split(".").pop() : "";
    return ext ? ext.toLowerCase() : null;
  }
}

function detectId(kind: Kind, urlLine: string): string {
  const patterns: Record<Kind, RegExp[]> = {
    live: [/\/live\/([^/?#]+)(?:[./?#]|$)/i, /\/channel\/([^/?#]+)(?:[./?#]|$)/i],
    movie: [/\/movie\/([^/?#]+)(?:[./?#]|$)/i],
    series: [/\/series\/([^/?#]+)(?:[./?#]|$)/i],
  };

  for (const pattern of patterns[kind]) {
    const match = urlLine.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  const cleaned = urlLine.split("?")[0] ?? "";
  const fallback = cleaned.split("/").pop() ?? "";
  return fallback.replace(/\.[^.]+$/, "") || cleaned;
}

function makePlaylistUrl(creds: XtreamCreds, output: "ts" | "m3u8" = "ts") {
  const url = new URL(creds.m3u_url || `${normalizeDns(creds.dns)}/get.php`);
  if (!url.searchParams.has("username")) url.searchParams.set("username", creds.username);
  if (!url.searchParams.has("password")) url.searchParams.set("password", creds.password);
  url.searchParams.set("type", "m3u_plus");
  url.searchParams.set("output", output);
  return url.toString();
}

function createParserState() {
  return {
    catalog: createEmptyPlaylistCatalog(),
    categoryMaps: {
      live: new Map<string, string>(),
      movie: new Map<string, string>(),
      series: new Map<string, string>(),
    } satisfies Record<Kind, Map<string, string>>,
    seriesMaps: new Map<string, string>(),
    pendingEntry: null as { meta: Record<string, string>; displayName: string } | null,
    itemCount: 0,
  };
}

type PlaylistParserState = ReturnType<typeof createParserState>;

function consumePlaylistLine(state: PlaylistParserState, rawLine: string) {
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
      displayName,
    };
    return;
  }

  if (!state.pendingEntry || line.startsWith("#")) return;

  const kind = classifyM3UItem({
    url: line,
    groupTitle:
      state.pendingEntry.meta["group-title"] ??
      state.pendingEntry.meta["group_title"] ??
      state.pendingEntry.meta["group"] ??
      "",
    displayName:
      state.pendingEntry.meta["tvg-name"] ??
      state.pendingEntry.meta["tvg_name"] ??
      state.pendingEntry.displayName,
  });
  const groupName = sanitizeCategoryName(
    state.pendingEntry.meta["group-title"] ??
      state.pendingEntry.meta["group_title"] ??
      state.pendingEntry.meta["group"] ??
      "",
  );
  const categoryId = groupName;

  if (!state.categoryMaps[kind].has(categoryId)) {
    state.categoryMaps[kind].set(categoryId, categoryId);
    state.catalog[kind].categories.push({
      category_id: categoryId,
      category_name: groupName,
    });
  }

  const streamLimit = getCatalogStreamLimit(kind as CatalogKind);
  if (state.catalog[kind].streams.length >= streamLimit) {
    state.pendingEntry = null;
    return;
  }

  const rawName =
    normalizeText(
      state.pendingEntry.meta["tvg-name"] ??
        state.pendingEntry.meta["tvg_name"] ??
        state.pendingEntry.displayName,
    ) || "Conteúdo";
  const seriesKey = kind === "series" ? normalizeSeriesTitle(rawName) || rawName : null;
  if (seriesKey && state.seriesMaps.has(seriesKey)) {
    state.pendingEntry = null;
    return;
  }
  if (seriesKey) state.seriesMaps.set(seriesKey, categoryId);
  const streamId =
    kind === "series"
      ? `m3u-series-${createHash("sha256")
          .update(seriesKey ?? rawName)
          .digest("hex")
          .slice(0, 24)}`
      : detectId(kind, line);

  state.catalog[kind].streams.push({
    id: streamId,
    name: rawName,
    icon:
      normalizeText(
        state.pendingEntry.meta["tvg-logo"] ??
          state.pendingEntry.meta["tvg_logo"] ??
          state.pendingEntry.meta["logo"],
      ) || null,
    ext: detectExt(line),
    rating: null,
    category_id: categoryId,
    kind,
  });

  state.pendingEntry = null;
}

function finalizeCatalog(catalog: PlaylistCatalog) {
  for (const kind of Object.keys(catalog) as Kind[]) {
    catalog[kind].streams = catalog[kind].streams.slice(0, getCatalogStreamLimit(kind));
  }
  return catalog;
}

async function sleep(delayMs: number) {
  if (delayMs <= 0) return;
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

async function fetchTextWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "IPTV-System/1.0",
        Accept: "text/plain, */*",
      },
    });
    if (!response.ok) throw new Error(`Playlist respondeu ${response.status}`);
    return await readResponseTextWithLimit(response, MAX_PLAYLIST_TEXT_BYTES, "Playlist M3U");
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRemotePlaylist(
  creds: XtreamCreds,
  timeoutMs = DEFAULT_PLAYLIST_TIMEOUT_MS,
) {
  const outputs: Array<"ts" | "m3u8"> = ["ts", "m3u8"];
  let lastError: unknown;

  for (const output of outputs) {
    const sourceUrl = makePlaylistUrl(creds, output);
    for (let attempt = 1; attempt <= DEFAULT_PLAYLIST_MAX_ATTEMPTS; attempt += 1) {
      try {
        const playlistText = await fetchTextWithTimeout(sourceUrl, timeoutMs);
        if (!playlistText.includes("#EXTM3U"))
          throw new Error("Resposta não parece uma playlist M3U válida.");
        return {
          source_url: sourceUrl,
          playlist_text: playlistText,
          playlist_hash: createHash("sha256").update(playlistText).digest("hex"),
          item_count: countPlaylistItems(playlistText),
          fetched_at: new Date().toISOString(),
        } satisfies PlaylistSnapshot;
      } catch (error) {
        lastError = error;
        if (attempt < DEFAULT_PLAYLIST_MAX_ATTEMPTS) {
          await sleep(DEFAULT_PLAYLIST_BACKOFF_MS * 2 ** (attempt - 1));
        }
      }
    }
  }

  throw lastError instanceof Error
    ? new Error(`Falha ao baixar M3U do servidor (${lastError.message}).`)
    : new Error("Falha ao baixar M3U do servidor.");
}

async function streamPlaylistToTempFile(
  response: Response,
  maxBytes: number,
): Promise<{
  filePath: string;
  playlistHash: string;
  itemCount: number;
  catalog: PlaylistCatalog;
}> {
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

  const consumeText = (text: string, final = false) => {
    const parts = `${carry}${text}`.split(/\r?\n/);
    carry = final ? "" : (parts.pop() ?? "");
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
        throw new Error(
          `Playlist M3U excede o limite de ${Math.round(maxBytes / 1024 / 1024)} MiB.`,
        );
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
      catalog: finalizeCatalog(state.catalog),
    };
  } catch (error) {
    await file.close().catch(() => {});
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}

export async function fetchRemotePlaylistStreaming(
  creds: XtreamCreds,
  options: StreamingPlaylistOptions = {},
): Promise<PlaylistSnapshot> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_PLAYLIST_TIMEOUT_MS;
  const maxAttempts = Math.max(
    1,
    Math.min(options.maxAttempts ?? DEFAULT_PLAYLIST_MAX_ATTEMPTS, 4),
  );
  const maxBytes = options.maxBytes ?? STREAMING_PLAYLIST_MAX_BYTES;
  const backoffBaseMs = Math.max(0, options.backoffBaseMs ?? DEFAULT_PLAYLIST_BACKOFF_MS);
  const outputs: Array<"ts" | "m3u8"> = ["ts", "m3u8"];
  let lastError: unknown;

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
            Accept: "text/plain, */*",
          },
        });
        if (!response.ok) throw new Error(`Playlist respondeu ${response.status}`);
        const streamed = await streamPlaylistToTempFile(response, maxBytes);
        if (
          streamed.itemCount === 0 ||
          (!streamed.catalog.live.streams.length &&
            !streamed.catalog.movie.streams.length &&
            !streamed.catalog.series.streams.length)
        ) {
          await rm(join(streamed.filePath, ".."), { recursive: true, force: true }).catch(() => {});
          throw new Error("Resposta não parece uma playlist M3U válida.");
        }
        return {
          source_url: sourceUrl,
          playlist_hash: streamed.playlistHash,
          item_count: streamed.itemCount,
          fetched_at: new Date().toISOString(),
          playlist_file_path: streamed.filePath,
          catalog: streamed.catalog,
        };
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) await sleep(backoffBaseMs * 2 ** (attempt - 1));
      } finally {
        clearTimeout(timer);
      }
    }
  }

  throw lastError instanceof Error
    ? new Error(`Falha ao baixar M3U do servidor (${lastError.message}).`)
    : new Error("Falha ao baixar M3U do servidor.");
}

export function parsePlaylistCatalog(playlistText: string): PlaylistCatalog {
  const state = createParserState();
  for (const rawLine of playlistText.split(/\r?\n/)) consumePlaylistLine(state, rawLine);
  return finalizeCatalog(state.catalog);
}

export function countPlaylistItems(playlistText: string) {
  return playlistText.split(/\r?\n/).filter((line) => line.trim().startsWith("#EXTINF:")).length;
}

export function createEmptyPlaylistCatalog(): PlaylistCatalog {
  return {
    live: {
      categories: [...EMPTY_CATALOG.live.categories],
      streams: [...EMPTY_CATALOG.live.streams],
    },
    movie: {
      categories: [...EMPTY_CATALOG.movie.categories],
      streams: [...EMPTY_CATALOG.movie.streams],
    },
    series: {
      categories: [...EMPTY_CATALOG.series.categories],
      streams: [...EMPTY_CATALOG.series.streams],
    },
  };
}

export const STREAMING_PLAYLIST_DEFAULTS = {
  timeoutMs: DEFAULT_PLAYLIST_TIMEOUT_MS,
  maxAttempts: DEFAULT_PLAYLIST_MAX_ATTEMPTS,
  maxBytes: STREAMING_PLAYLIST_MAX_BYTES,
  backoffBaseMs: DEFAULT_PLAYLIST_BACKOFF_MS,
} as const;
