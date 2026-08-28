import type { HlsConfig, LoaderConfig, RetryConfig } from "hls.js";

export type HlsContentKind = "live" | "movie" | "series";

const retryConfig = (
  maxNumRetry: number,
  retryDelayMs: number,
  maxRetryDelayMs: number,
): RetryConfig => ({
  maxNumRetry,
  retryDelayMs,
  maxRetryDelayMs,
  backoff: "exponential",
});

const loaderPolicy = (maxNumRetry: number, maxLoadTimeMs: number): LoaderConfig => ({
  maxTimeToFirstByteMs: 10_000,
  maxLoadTimeMs,
  timeoutRetry: retryConfig(2, 500, 4_000),
  errorRetry: retryConfig(maxNumRetry, 750, 8_000),
});

/**
 * HLS policy intentionally trades a little initial buffer for faster startup and
 * bounded memory. Live and VOD use different windows, while both keep native
 * retries finite so a dead origin cannot trigger an infinite reconnect loop.
 */
export function createHlsPlayerConfig(kind: HlsContentKind): Partial<HlsConfig> {
  const isLive = kind === "live";
  const fragPolicy = loaderPolicy(isLive ? 5 : 4, isLive ? 45_000 : 60_000);
  const playlistPolicy = loaderPolicy(isLive ? 4 : 3, 30_000);

  return {
    lowLatencyMode: isLive,
    enableWorker: true,
    capLevelToPlayerSize: true,
    capLevelOnFPSDrop: true,
    backBufferLength: isLive ? 30 : 90,
    maxBufferLength: isLive ? 20 : 45,
    maxMaxBufferLength: isLive ? 60 : 180,
    maxBufferSize: isLive ? 48 * 1024 * 1024 : 96 * 1024 * 1024,
    maxBufferHole: 0.5,
    maxStarvationDelay: isLive ? 3 : 4,
    maxLoadingDelay: isLive ? 3 : 4,
    fragLoadPolicy: { default: fragPolicy },
    playlistLoadPolicy: { default: playlistPolicy },
    manifestLoadPolicy: { default: playlistPolicy },
    ...(isLive
      ? {
          initialLiveManifestSize: 2,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 8,
          liveBackBufferLength: 30,
        }
      : {}),
  };
}
