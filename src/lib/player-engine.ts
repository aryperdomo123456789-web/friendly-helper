export type PlayerEngine = "native" | "hls.js";

export type PlayerEngineCapabilities = {
  nativeHls: boolean;
  mediaSourceSupported: boolean;
  isAppleMobile: boolean;
  isSafari: boolean;
};

export function selectPlayerEngine(capabilities: PlayerEngineCapabilities): PlayerEngine {
  const mustKeepNative =
    capabilities.nativeHls && (capabilities.isAppleMobile || capabilities.isSafari);

  if (capabilities.mediaSourceSupported && !mustKeepNative) return "hls.js";
  return "native";
}

export function detectPlayerEngine(video: Pick<HTMLVideoElement, "canPlayType">): PlayerEngine {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const nativeHls =
    video.canPlayType("application/vnd.apple.mpegurl") !== "" ||
    video.canPlayType("application/x-mpegURL") !== "";
  const mediaSourceSupported =
    typeof MediaSource !== "undefined" &&
    typeof MediaSource.isTypeSupported === "function" &&
    MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
  const isAppleMobile = /iPad|iPhone|iPod/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome|CriOS|Android/i.test(userAgent);

  return selectPlayerEngine({ nativeHls, mediaSourceSupported, isAppleMobile, isSafari });
}
