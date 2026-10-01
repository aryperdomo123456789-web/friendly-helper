export type M3UMediaKind = "live" | "movie" | "series";

export type M3UClassificationInput = {
  url: string;
  groupTitle?: string | null;
  displayName?: string | null;
};

const MOVIE_GROUP_RE = /(?:^|\b)(?:FILMES?|MOVIES?|LANCAMENTOS?|CINEMA|VOD|FILMES\s*4K)(?:\b|$)/i;
const SERIES_GROUP_RE = /(?:^|\b)(?:SER(?:I|Í)ES?|NOVELAS?|ANIMES?|TEMPORADAS?)(?:\b|$)/i;
const MOVIE_PATH_RE = /\/(?:movie|vod)(?:\/|$)/i;
const SERIES_PATH_RE = /\/(?:series?|tvshows?)(?:\/|$)/i;
const EPISODE_RE = /\b(?:S\d{1,3}\s*E\d{1,4}|T\d{1,3}\s*(?:E|EP)\s*\d{1,4})\b/i;
const MOVIE_EXTENSION_RE = /\.(?:mp4|mkv|avi|mov|m4v|wmv)(?:$|[?#])/i;
const LIVE_EXTENSION_RE = /\.(?:ts|m3u8)(?:$|[?#])/i;

function normalizeComparable(value: string | null | undefined) {
  return (value ?? "").normalize("NFKC").trim();
}

/** Classifies one M3U item using provider route, taxonomy, extension and title. */
export function classifyM3UItem(input: M3UClassificationInput): M3UMediaKind {
  const url = normalizeComparable(input.url);
  const groupTitle = normalizeComparable(input.groupTitle);
  const displayName = normalizeComparable(input.displayName);

  if (SERIES_PATH_RE.test(url) || SERIES_GROUP_RE.test(groupTitle) || EPISODE_RE.test(displayName)) {
    return "series";
  }
  if (MOVIE_PATH_RE.test(url) || MOVIE_GROUP_RE.test(groupTitle) || MOVIE_EXTENSION_RE.test(url)) {
    return "movie";
  }
  if (LIVE_EXTENSION_RE.test(url) || /\/live\/(?:[^/]+\/){1,3}/i.test(url)) {
    return "live";
  }
  return "live";
}

function stripEmoji(value: string) {
  return value.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, " ");
}

/** Normalizes provider group-title noise while preserving a stable category label. */
export function normalizeM3UCategoryName(value: string | null | undefined) {
  let category = stripEmoji(normalizeComparable(value))
    .replace(/^\s*(?:\[\s*BR\s*\]|\|\s*BR\s*\||BR\s*[-:|])\s*/i, "")
    .replace(/^\s*CANAL\s*[-:|]\s*/i, "")
    .replace(/[()[\]]/g, " ")
    .replace(/\b(?:FHD|UHD|4K)\b/gi, " ")
    .replace(/[|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!category) return "Geral";

  category = category
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)([\p{L}\p{N}])/gu, (_, prefix: string, char: string) => `${prefix}${char.toLocaleUpperCase("pt-BR")}`);

  return category || "Geral";
}
