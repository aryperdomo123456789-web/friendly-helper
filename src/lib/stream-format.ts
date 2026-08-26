export type PlaybackKind = "live" | "movie" | "series";

export function normalizeStreamExtension(kind: PlaybackKind, extension: string): string {
  const requestedExt = extension.trim().toLowerCase().replace(/^\./, "");
  const allowedExtensions =
    kind === "live" ? new Set(["ts", "m3u8"]) : new Set(["mp4", "mkv", "avi", "webm", "mov"]);
  const fallbackExt = kind === "live" ? "m3u8" : "mp4";
  return allowedExtensions.has(requestedExt) ? requestedExt : fallbackExt;
}
