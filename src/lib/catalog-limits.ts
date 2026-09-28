export type CatalogKind = "live" | "movie" | "series";

export const CATALOG_STREAM_LIMITS: Record<CatalogKind, number> = {
  live: 10_000,
  movie: 50_000,
  series: 16_000,
};

export function getCatalogStreamLimit(kind: CatalogKind) {
  return CATALOG_STREAM_LIMITS[kind];
}

/**
 * Removes the episode suffix used by common Xtream M3U exports so the M3U
 * fallback can expose one series entry while episode playback remains lazy
 * through get_series_info.
 */
export function normalizeSeriesTitle(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s*[-_.|:]?\s*s\s*\d{1,3}\s*e\s*\d{1,4}\b.*$/i, "")
    .replace(/\s*[-_.|:]?\s*(?:temporada|season)\s*\d{1,3}\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}
