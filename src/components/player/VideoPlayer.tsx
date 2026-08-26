import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { recordPlaybackTelemetry } from "@/lib/player.functions";
import { createPlaybackSessionId, createPlaybackTelemetry } from "@/lib/player-telemetry";

type Props = {
  url: string;
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

export function VideoPlayer({ url, serverId, poster, title, kind = "movie" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sendTelemetry = useServerFn(recordPlaybackTelemetry);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url || !serverId) return;

    let destroyed = false;
    let hls: import("hls.js").default | null = null;
    let recoveryTimer: ReturnType<typeof setTimeout> | null = null;
    let recoveryAttempts = 0;
    let hasStartedPlaying = false;
    let hasReportedPlaying = false;
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
      } = {};
      const bufferSeconds = getBufferedSeconds(video);
      const latencyMs = kind === "live" ? getLiveLatency(video) : undefined;
      if (bufferSeconds !== undefined) details.buffer_seconds = bufferSeconds;
      if (latencyMs !== undefined) details.latency_ms = latencyMs;
      return details;
    };

    const ready = () => {
      if (!destroyed) setLoading(false);
    };

    const onFirstFrame = () => {
      if (destroyed) return;
      telemetry.markFirstFrame(currentDetails());
      ready();
    };

    const onPlaying = () => {
      if (destroyed) return;
      hasStartedPlaying = true;
      telemetry.markBufferEnd(currentDetails());
      if (!hasReportedPlaying) {
        hasReportedPlaying = true;
        telemetry.record("playing", currentDetails());
      }
      if (recoveryAttempts > 0) {
        telemetry.record("recover_success", {
          ...currentDetails(),
          recovery_attempt: recoveryAttempts,
        });
      }
      ready();
    };

    const onBufferStart = () => {
      if (destroyed) return;
      if (hasStartedPlaying) telemetry.markBufferStart(currentDetails());
      setLoading(true);
    };

    const onBufferEnd = () => {
      if (destroyed) return;
      telemetry.markBufferEnd(currentDetails());
      ready();
    };

    const onEnded = () => {
      telemetry.record("ended", { reason: "media_ended", ...currentDetails() });
      void telemetry.flush();
    };

    const onNativeError = () => {
      if (destroyed) return;
      telemetry.record("fatal_error", {
        error_code: "native_media_error",
        fatal: true,
        reason: "native_playback_error",
        ...currentDetails(),
      });
      setError("Fluxo indisponível neste momento.");
    };

    const startPlayback = async (allowMutedFallback = false) => {
      try {
        await video.play();
      } catch {
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

    const start = async () => {
      telemetry.record("startup_requested");
      const isHls = url.includes(".m3u8") || url.includes("hls=1");
      const nativeHls = video.canPlayType("application/vnd.apple.mpegurl") !== "";

      if (isHls && !nativeHls) {
        const mod = await import("hls.js");
        const Hls = mod.default;
        if (destroyed) return;
        if (Hls.isSupported()) {
          hls = new Hls({
            lowLatencyMode: false,
            enableWorker: true,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 120,
            maxBufferHole: 0.5,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 8,
            manifestLoadingMaxRetry: 15,
            levelLoadingMaxRetry: 15,
            fragLoadingMaxRetry: 25,
            fragLoadingTimeOut: 60_000,
            manifestLoadingTimeOut: 60_000,
          });
          hls.attachMedia(video);
          hls.loadSource(url);
          hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
            const manifestDetails = currentDetails();
            const levelCount = Array.isArray(data.levels) ? data.levels.length : undefined;
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
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal) return;
            const errorCode = `${data.type}:${data.details}`;
            telemetry.record("fatal_error", {
              error_code: errorCode,
              fatal: true,
              reason: errorCode,
              ...currentDetails(),
            });

            if (recoveryAttempts >= 2) {
              const code = (data.response as { code?: number } | undefined)?.code;
              setError(
                code === 404 || code === 502
                  ? "Canal indisponível no servidor no momento. Tente outro canal ou portal."
                  : "Não foi possível iniciar o canal. Tente novamente ou escolha outro portal.",
              );
              return;
            }

            if (
              data.type === Hls.ErrorTypes.MEDIA_ERROR ||
              data.type === Hls.ErrorTypes.NETWORK_ERROR
            ) {
              recoveryAttempts += 1;
              telemetry.record("recover_attempt", {
                recovery_attempt: recoveryAttempts,
                error_code: errorCode,
              });
              if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls?.recoverMediaError();
              recoveryTimer = setTimeout(() => {
                if (!destroyed) hls?.startLoad();
              }, 250 * recoveryAttempts);
            }
          });
          return;
        }
      }

      video.src = url;
      video.load();
      void startPlayback(kind === "live");
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
      telemetry.record("fatal_error", {
        error_code: "player_initialization_error",
        fatal: true,
        reason: "engine_initialization_failed",
      });
      setError("Não foi possível preparar a reprodução neste navegador.");
    });

    return () => {
      destroyed = true;
      if (recoveryTimer) clearTimeout(recoveryTimer);
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
  }, [kind, sendTelemetry, serverId, url]);

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
        onError={() => setError("Fluxo indisponível neste momento.")}
      />
      {loading && !error ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
          {title ? <p className="text-xs text-muted-foreground">{title}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
