export type PlaybackKind = "live" | "movie" | "series";

const LIVE_EXTENSIONS = new Set(["ts", "m3u8"]);
const MEDIA_EXTENSIONS = new Set(["mp4", "mkv", "avi", "webm", "mov"]);

export function normalizeStreamExtension(kind: PlaybackKind, extension: string): string {
  const requestedExt = extension.trim().toLowerCase().replace(/^\./, "");
  const allowedExtensions = kind === "live" ? LIVE_EXTENSIONS : MEDIA_EXTENSIONS;
  const fallbackExt = kind === "live" ? "m3u8" : "mp4";
  return allowedExtensions.has(requestedExt) ? requestedExt : fallbackExt;
}

export function getPlaybackExtensions(kind: PlaybackKind, extension?: string | null): string[] {
  const normalized = extension?.trim().toLowerCase().replace(/^\./, "") ?? "";
  if (kind !== "live") return [normalizeStreamExtension(kind, normalized)];
  if (normalized === "ts" || normalized === "m3u8") return [normalized];
  return ["m3u8", "ts"];
}
