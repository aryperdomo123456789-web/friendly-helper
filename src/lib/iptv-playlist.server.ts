import { createHash } from "crypto";
import { normalizeDns, type XtreamCreds } from "./xtream.server";
import { MAX_PLAYLIST_TEXT_BYTES, readResponseTextWithLimit } from "./response-limit.server";

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
  playlist_text: string;
  playlist_hash: string;
  item_count: number;
  fetched_at: string;
};

const EMPTY_CATALOG: PlaylistCatalog = {
  live: { categories: [], streams: [] },
  movie: { categories: [], streams: [] },
  series: { categories: [], streams: [] },
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim();
}

function sanitizeCategoryName(value: string | null | undefined) {
  return normalizeText(value) || "Sem categoria";
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

function detectKindFromUrl(urlLine: string): Kind {
  try {
    const url = new URL(urlLine);
    const path = url.pathname.toLowerCase();
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
  const url = new URL(`${normalizeDns(creds.dns)}/get.php`);
  url.searchParams.set("username", creds.username);
  url.searchParams.set("password", creds.password);
  url.searchParams.set("type", "m3u_plus");
  url.searchParams.set("output", output);
  return url.toString();
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
    if (!response.ok) {
      throw new Error(`Playlist respondeu ${response.status}`);
    }
    return await readResponseTextWithLimit(response, MAX_PLAYLIST_TEXT_BYTES, "Playlist M3U");
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRemotePlaylist(creds: XtreamCreds, timeoutMs = 30000) {
  const outputs: Array<"ts" | "m3u8"> = ["ts", "m3u8"];
  let lastError: unknown;

  for (const output of outputs) {
    const sourceUrl = makePlaylistUrl(creds, output);
    try {
      const playlistText = await fetchTextWithTimeout(sourceUrl, timeoutMs);
      if (!playlistText.includes("#EXTM3U")) {
        throw new Error("Resposta não parece uma playlist M3U válida.");
      }
      return {
        source_url: sourceUrl,
        playlist_text: playlistText,
        playlist_hash: createHash("sha256").update(playlistText).digest("hex"),
        item_count: countPlaylistItems(playlistText),
        fetched_at: new Date().toISOString(),
      } satisfies PlaylistSnapshot;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? new Error(`Falha ao baixar M3U do servidor (${lastError.message}).`)
    : new Error("Falha ao baixar M3U do servidor.");
}

export function parsePlaylistCatalog(playlistText: string): PlaylistCatalog {
  const catalog: PlaylistCatalog = {
    live: { categories: [], streams: [] },
    movie: { categories: [], streams: [] },
    series: { categories: [], streams: [] },
  };

  const categoryMaps: Record<Kind, Map<string, string>> = {
    live: new Map(),
    movie: new Map(),
    series: new Map(),
  };

  const lines = playlistText.split(/\r?\n/);
  let pendingEntry: {
    meta: Record<string, string>;
    displayName: string;
  } | null = null;

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
        displayName: displayName || "",
      };
      continue;
    }

    if (!pendingEntry || line.startsWith("#")) continue;

    // Regra principal de separação:
    // - /movie/  -> filme
    // - /series/ -> série
    // - qualquer outro caso cai como live, incluindo /live/ e .ts
    const kind = detectKindFromUrl(line);
    const groupName = sanitizeCategoryName(
      pendingEntry.meta["group-title"] ??
        pendingEntry.meta["group_title"] ??
        pendingEntry.meta["group"] ??
        "",
    );
    const categoryId = groupName;

    if (!categoryMaps[kind].has(categoryId)) {
      categoryMaps[kind].set(categoryId, categoryId);
      catalog[kind].categories.push({
        category_id: categoryId,
        category_name: groupName,
      });
    }

    catalog[kind].streams.push({
      id: detectId(kind, line),
      name:
        normalizeText(
          pendingEntry.meta["tvg-name"] ??
            pendingEntry.meta["tvg_name"] ??
            pendingEntry.displayName,
        ) || "Conteúdo",
      icon:
        normalizeText(
          pendingEntry.meta["tvg-logo"] ??
            pendingEntry.meta["tvg_logo"] ??
            pendingEntry.meta["logo"],
        ) || null,
      ext: detectExt(line),
      rating: null,
      category_id: categoryId,
      kind,
    });

    pendingEntry = null;
  }

  for (const kind of Object.keys(catalog) as Kind[]) {
    catalog[kind].streams = catalog[kind].streams.slice(0, 4000);
  }

  return catalog;
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
