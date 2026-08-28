import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { recordPlaybackTelemetry } from "@/lib/player.functions";
import { createPlaybackSessionId, createPlaybackTelemetry } from "@/lib/player-telemetry";
import {
  normalizePlayerQualityOptions,
  qualityChangeDetails,
  type PlayerQualityOption,
} from "@/lib/player-quality";
import { createHlsPlayerConfig } from "@/lib/hls-player-config";
import { createAutoHealingController } from "@/lib/player-auto-healing";

type Props = {
  url: string;
  fallbackUrls?: string[];
  serverId: string;
  poster?: string | null;
  title?: string;
  kind?: "live" | "movie" | "series";
};

function getBufferedSeconds(video: HTMLVideoElement): number | undefined {
  if (!Number.isFinite(video.currentTime) || video.buffered.length === 0) return undefined;
  for (let index = 0; index < video.buffered.length; index += 1) {
    const start = video.buffered.start(index);
    const end = video.buffered.end(index);
    if (video.currentTime >= start && video.currentTime <= end) {
      return Math.max(0, Math.min(86_400, end - video.currentTime));
    }
  }
  return undefined;
}

function getLiveLatency(video: HTMLVideoElement): number | undefined {
  if (!Number.isFinite(video.currentTime)) return undefined;
  const seekable = video.seekable;
  if (seekable.length === 0) return undefined;
  const liveEdge = seekable.end(seekable.length - 1);
  return Math.max(0, Math.round((liveEdge - video.currentTime) * 1000));
}

function getPlaybackQualityDetails(video: HTMLVideoElement): {
  dropped_frames?: number;
  decoded_frames?: number;
} {
  if (typeof video.getVideoPlaybackQuality !== "function") return {};
  const quality = video.getVideoPlaybackQuality();
  return {
    dropped_frames: quality.droppedVideoFrames,
    decoded_frames: quality.totalVideoFrames,
  };
}

export function VideoPlayer({
  url,
  fallbackUrls = [],
  serverId,
  poster,
  title,
  kind = "movie",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sendTelemetry = useServerFn(recordPlaybackTelemetry);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);
  const [qualityOptions, setQualityOptions] = useState<PlayerQualityOption[]>([]);
  const [selectedQuality, setSelectedQuality] = useState("-1");
  const qualityChangeRef = useRef<(index: number) => boolean>(() => false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url || !serverId) return;

    let destroyed = false;
    let hls: import("hls.js").default | null = null;
    let recoveryTimer: ReturnType<typeof setTimeout> | null = null;
    let stallTimer: ReturnType<typeof setTimeout> | null = null;
    let startupTimer: ReturnType<typeof setTimeout> | null = null;
    let qualityTimer: ReturnType<typeof setInterval> | null = null;
    let recoveryAttempts = 0;
    const maxRecoveryAttempts = kind === "live" ? 5 : 4;
    const healing = createAutoHealingController({
      maxRecoveryAttempts,
      upstreamCount: 1 + fallbackUrls.length,
      switchAfterFailures: 3,
    });
    let hasStartedPlaying = false;
    let fallbackIndex = 0;
    let hasNativeError = false;
    let hasReportedPlaying = false;
    let qualityOptionsLocal: PlayerQualityOption[] = [];
    const sessionId = createPlaybackSessionId();

    const engine = video.canPlayType("application/vnd.apple.mpegurl") !== "" ? "native" : "hls.js";
    const telemetry = createPlaybackTelemetry({
      sessionId,
      serverId,
      kind,
      engine,
      send: async (batch) => {
        await sendTelemetry({ data: batch });
      },
    });

    const currentDetails = () => {
      const details: {
        buffer_seconds?: number;
        latency_ms?: number;
        level?: number;
        bitrate?: number;
        dropped_frames?: number;
        decoded_frames?: number;
      } = {};
      const bufferSeconds = getBufferedSeconds(video);
      const latencyMs = kind === "live" ? getLiveLatency(video) : undefined;
      if (bufferSeconds !== undefined) details.buffer_seconds = bufferSeconds;
      if (latencyMs !== undefined) details.latency_ms = latencyMs;
      Object.assign(details, getPlaybackQualityDetails(video));
      return details;
    };

    const clearStartupTimer = () => {
      if (startupTimer) clearTimeout(startupTimer);
      startupTimer = null;
    };

    const ready = () => {
      if (!destroyed) setLoading(false);
    };

    const onFirstFrame = () => {
      if (destroyed) return;
      clearStartupTimer();
      telemetry.markFirstFrame(currentDetails());
      ready();
    };

    const onPlaying = () => {
      if (destroyed) return;
      clearStartupTimer();
      const healingBeforePlaying = healing.snapshot();
      if (stallTimer) clearTimeout(stallTimer);
      if (recoveryTimer) clearTimeout(recoveryTimer);
      stallTimer = null;
      recoveryTimer = null;
      hasStartedPlaying = true;
      telemetry.markBufferEnd(currentDetails());
      healing.observeHealthy();
      if (!hasReportedPlaying) {
        hasReportedPlaying = true;
        telemetry.record("playing", currentDetails());
      }
      if (recoveryAttempts > 0 || healingBeforePlaying.state !== "healthy") {
        telemetry.record("recover_success", {
          ...currentDetails(),
          recovery_attempt: Math.max(recoveryAttempts, healingBeforePlaying.recoveryCount),
          reason: healingBeforePlaying.state,
        });
        recoveryAttempts = 0;
      }
      ready();
    };

    const onBufferStart = () => {
      if (destroyed) return;
      if (hasStartedPlaying) {
        telemetry.markBufferStart(currentDetails());
        if (!stallTimer) {
          stallTimer = setTimeout(() => {
            stallTimer = null;
            void scheduleRecovery("buffer_stall");
          }, 2_500);
        }
      }
      setLoading(true);
    };

    const onBufferEnd = () => {
      if (destroyed) return;
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = null;
      telemetry.markBufferEnd(currentDetails());
      ready();
    };

    const onEnded = () => {
      telemetry.record("ended", { reason: "media_ended", ...currentDetails() });
      void telemetry.flush();
    };

    const applyQualityChange = (index: number) => {
      if (destroyed || !hls || qualityOptionsLocal.length === 0) return false;
      const details = qualityChangeDetails(qualityOptionsLocal, index);
      if (details.reason === "invalid_quality_selection") return false;
      hls.currentLevel = index;
      telemetry.record("quality_change", details);
      return true;
    };

    qualityChangeRef.current = applyQualityChange;

    const startPlayback = async (allowMutedFallback = false) => {
      try {
        await video.play();
      } catch {
        if (hasNativeError || video.error) return;
        telemetry.record("fatal_error", {
          error_code: "autoplay_blocked",
          fatal: false,
          reason: "browser_requires_user_gesture",
        });
        if (allowMutedFallback && !video.muted) {
          video.muted = true;
          try {
            await video.play();
          } catch {
            // O usuário ainda pode iniciar pelo controle nativo de reprodução.
          }
        }
      }
    };

    let tryNextFallback = (_reason: string) => false;

    const scheduleRecovery = (reason: string, status?: number): boolean => {
      if (destroyed || !hls || recoveryTimer) return false;
      const decision = healing.observeFailure({ reason, ...(status ? { status } : {}) });

      if (decision.action === "switch_upstream") {
        const switched = tryNextFallback(`auto_healing:${decision.reason}`);
        if (switched) {
          healing.markUpstreamSwitch();
          return true;
        }
      }

      if (decision.action === "recover") {
        recoveryAttempts = decision.recoveryCount;
        const delayMs = Math.min(12_000, 500 * 2 ** (recoveryAttempts - 1));
        telemetry.record("recover_attempt", {
          recovery_attempt: recoveryAttempts,
          reason: `silent_backoff:${decision.reason}`,
        });
        recoveryTimer = setTimeout(() => {
          recoveryTimer = null;
          if (destroyed || !hls) return;
          if (reason.includes("media")) hls.recoverMediaError();
          else hls.startLoad();
        }, delayMs);
        return true;
      }

      return tryNextFallback(`auto_healing_failed:${decision.reason}`);
    };

    const startSource = async (sourceUrl: string) => {
      clearStartupTimer();
      startupTimer = setTimeout(() => {
        if (destroyed || hasStartedPlaying) return;
        telemetry.record("fatal_error", {
          error_code: "startup_timeout",
          fatal: true,
          reason: "first_frame_timeout",
          ...currentDetails(),
        });
        setLoading(false);
        if (tryNextFallback("startup_timeout")) return;
        setError("O canal demorou para iniciar. Tente novamente ou escolha outro portal.");
      }, 20_000);

      const isHls = sourceUrl.includes(".m3u8") || sourceUrl.includes("hls=1");
      const nativeHls = video.canPlayType("application/vnd.apple.mpegurl") !== "";

      if (isHls && !nativeHls) {
        const mod = await import("hls.js");
        const Hls = mod.default;
        if (destroyed) return;
        if (Hls.isSupported()) {
          hls = new Hls(createHlsPlayerConfig(kind));
          hls.attachMedia(video);
          hls.loadSource(sourceUrl);
          hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
            const manifestDetails = currentDetails();
            const levels = Array.isArray(data.levels) ? data.levels : [];
            qualityOptionsLocal = normalizePlayerQualityOptions(levels);
            if (!destroyed) {
              setQualityOptions(qualityOptionsLocal);
              setSelectedQuality("-1");
            }
            const levelCount = levels.length;
            if (levelCount !== undefined) manifestDetails.level = levelCount;
            telemetry.record("manifest_loaded", manifestDetails);
            ready();
            void startPlayback(kind === "live");
          });
          hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
            const details = data.details as { live?: boolean; latency?: number } | undefined;
            const levelDetails = currentDetails();
            if (details?.latency !== undefined) levelDetails.latency_ms = details.latency * 1000;
            telemetry.record("manifest_loaded", levelDetails);
            ready();
          });
          hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
            const level = Number(data.level);
            const qualityDetails = currentDetails();
            if (Number.isInteger(level) && level >= 0) {
              qualityDetails.level = level;
              const bitrate = hls?.levels?.[level]?.bitrate;
              if (typeof bitrate === "number") qualityDetails.bitrate = bitrate;
            }
            telemetry.record("quality_sample", qualityDetails);
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            const errorCode = `${data.type}:${data.details}`;
            telemetry.record("fatal_error", {
              error_code: errorCode,
              fatal: true,
              reason: errorCode,
              ...currentDetails(),
            });

            if (
              data.type === Hls.ErrorTypes.MEDIA_ERROR ||
              data.type === Hls.ErrorTypes.NETWORK_ERROR
            ) {
              const responseCode = Number((data.response as { code?: number } | undefined)?.code);
              if (
                scheduleRecovery(
                  errorCode,
                  Number.isFinite(responseCode) ? responseCode : undefined,
                )
              )
                return;
            }

            if (tryNextFallback("hls_fatal_error")) return;
            const code = (data.response as { code?: number } | undefined)?.code;
            setError(
              code === 404 || code === 502
                ? "Canal indisponível no servidor no momento. Tente outro canal ou portal."
                : "Não foi possível iniciar o canal. Tente novamente ou escolha outro portal.",
            );
          });
          return;
        }
      }

      video.src = sourceUrl;
      video.load();
      void startPlayback(kind === "live");
    };

    tryNextFallback = (reason: string) => {
      if (destroyed || hasStartedPlaying || fallbackIndex >= fallbackUrls.length) return false;
      const fallbackUrl = fallbackUrls[fallbackIndex];
      if (!fallbackUrl) return false;
      fallbackIndex += 1;
      recoveryAttempts = 0;
      hasNativeError = false;
      qualityOptionsLocal = [];
      setQualityOptions([]);
      setSelectedQuality("-1");
      clearStartupTimer();
      telemetry.record("format_fallback", {
        recovery_attempt: fallbackIndex,
        reason,
      });
      setError(null);
      setLoading(true);
      if (recoveryTimer) clearTimeout(recoveryTimer);
      recoveryTimer = null;
      hls?.destroy();
      hls = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
      void startSource(fallbackUrl).catch(() => {
        if (destroyed) return;
        setLoading(false);
        setError("Não foi possível preparar o formato alternativo.");
      });
      return true;
    };

    const onNativeError = () => {
      if (destroyed) return;
      clearStartupTimer();
      hasNativeError = true;
      telemetry.record("fatal_error", {
        error_code: "native_media_error",
        fatal: true,
        reason: "native_playback_error",
        ...currentDetails(),
      });
      setLoading(false);
      if (tryNextFallback("native_media_error")) return;
      setError("Fluxo indisponível neste momento.");
    };

    const start = async () => {
      telemetry.record("startup_requested");
      await startSource(url);
    };

    setError(null);
    setLoading(true);
    video.setAttribute("playsinline", "");
    video.addEventListener("loadeddata", onFirstFrame);
    video.addEventListener("canplay", ready);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onBufferStart);
    video.addEventListener("stalled", onBufferStart);
    video.addEventListener("canplay", onBufferEnd);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onNativeError);

    void start().catch(() => {
      if (destroyed) return;
      clearStartupTimer();
      telemetry.record("fatal_error", {
        error_code: "player_initialization_error",
        fatal: true,
        reason: "engine_initialization_failed",
      });
      setError("Não foi possível preparar a reprodução neste navegador.");
    });

    qualityTimer = setInterval(() => {
      if (destroyed || !hasStartedPlaying) return;
      const qualityDetails = getPlaybackQualityDetails(video);
      if (
        qualityDetails.dropped_frames !== undefined ||
        qualityDetails.decoded_frames !== undefined
      ) {
        telemetry.record("quality_sample", qualityDetails);
      }
    }, 10_000);

    return () => {
      destroyed = true;
      qualityChangeRef.current = () => false;
      qualityOptionsLocal = [];
      if (qualityTimer) clearInterval(qualityTimer);
      if (recoveryTimer) clearTimeout(recoveryTimer);
      if (stallTimer) clearTimeout(stallTimer);
      clearStartupTimer();
      video.removeEventListener("loadeddata", onFirstFrame);
      video.removeEventListener("canplay", ready);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onBufferStart);
      video.removeEventListener("stalled", onBufferStart);
      video.removeEventListener("canplay", onBufferEnd);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onNativeError);
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
      void telemetry.destroy("component_unmount");
    };
  }, [fallbackUrls, kind, retryNonce, sendTelemetry, serverId, url]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-2xl">
      <video
        ref={videoRef}
        poster={poster ?? undefined}
        controls
        autoPlay
        playsInline
        preload="metadata"
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        aria-label={title ?? "Reprodutor de vídeo"}
        className="h-full w-full"
        onPlaying={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onLoadedData={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
        onStalled={() => setLoading(true)}
      />
      {qualityOptions.length > 1 ? (
        <div className="absolute right-3 top-3 rounded-md bg-black/70 px-2 py-1.5 text-white shadow-lg">
          <label
            className="mr-2 text-[10px] font-semibold uppercase tracking-wider"
            htmlFor="player-quality-select"
          >
            Qualidade
          </label>
          <select
            id="player-quality-select"
            aria-label="Qualidade de vídeo"
            className="rounded border border-white/30 bg-black/60 px-1.5 py-1 text-xs text-white outline-none focus:ring-2 focus:ring-primary"
            value={selectedQuality}
            onChange={(event) => {
              const value = event.target.value;
              const index = Number(value);
              if (Number.isInteger(index) && qualityChangeRef.current(index)) {
                setSelectedQuality(value);
              }
            }}
          >
            <option value="-1">Automática</option>
            {qualityOptions.map((option) => (
              <option key={option.index} value={option.index}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {loading && !error ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
          {title ? <p className="text-xs text-muted-foreground">{title}</p> : null}
          <button
            type="button"
            className="mt-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
            onClick={() => setRetryNonce((value) => value + 1)}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}
    </div>
  );
}
