import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  url: string;
  poster?: string | null;
  title?: string;
  kind?: "live" | "movie" | "series";
};

export function VideoPlayer({ url, poster, title, kind }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;
    let destroyed = false;
    let hls: import("hls.js").default | null = null;
    const ready = () => setLoading(false);
    const buffer = () => {
      if (!destroyed) setLoading(true);
    };
    const onError = () => {
      if (!destroyed) setError("Fluxo indisponivel neste momento.");
    };
    const startPlayback = async (allowMutedFallback = false) => {
      try {
        await video.play();
      } catch {
        if (allowMutedFallback && !video.muted) {
          video.muted = true;
          try {
            await video.play();
          } catch {
            // Mantemos o erro silencioso para não quebrar o fluxo visual.
          }
        }
      }
    };

    setError(null);
    setLoading(true);
    video.setAttribute("playsinline", "");

    const isHls = url.includes(".m3u8") || url.includes("hls=1");
    const nativeHls = video.canPlayType("application/vnd.apple.mpegurl") !== "";

    async function start() {
      if (isHls && !nativeHls) {
        const mod = await import("hls.js");
        const Hls = mod.default;
        if (destroyed) return;
        if (Hls.isSupported()) {
          let recoveries = 0;
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
            fragLoadingTimeOut: 60000,
            manifestLoadingTimeOut: 60000,
          });
          hls.loadSource(url);
          hls.attachMedia(video!);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            ready();
            void startPlayback(kind === "live");
          });
          hls.on(Hls.Events.LEVEL_LOADED, ready);
          hls.on(Hls.Events.ERROR, (_event, data) => {
            console.error("[player] hls", data.type, data.details, data.fatal);
            if (!data.fatal) return;
            if (recoveries < 5 && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              recoveries += 1;
              hls?.recoverMediaError();
              setTimeout(() => hls?.startLoad(), 250);
              return;
            }
            if (recoveries < 5 && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              recoveries += 1;
              hls?.startLoad();
              return;
            }
            const code = (data.response as { code?: number } | undefined)?.code;
            setError(
              code === 404 || code === 502
                ? "Canal indisponível no servidor no momento (fora do ar ou com limite de conexões em uso)."
                : "Não foi possível iniciar o canal. Tente outro canal ou servidor.",
            );
          });
          video.addEventListener("canplay", ready);
          video.addEventListener("playing", ready);
          video.addEventListener("loadeddata", ready);
          video.addEventListener("waiting", buffer);
          video.addEventListener("stalled", buffer);
          video.addEventListener("error", onError);
          void startPlayback(kind === "live");
          return;
        }
      }
      video!.src = url;
      video!.load();
      void startPlayback(kind === "live");
      video.addEventListener("canplay", ready);
      video.addEventListener("playing", ready);
      video.addEventListener("loadeddata", ready);
      video.addEventListener("waiting", buffer);
      video.addEventListener("stalled", buffer);
      video.addEventListener("error", onError);
    }

    void start();

    return () => {
      destroyed = true;
      video.removeEventListener("canplay", ready);
      video.removeEventListener("playing", ready);
      video.removeEventListener("loadeddata", ready);
      video.removeEventListener("waiting", buffer);
      video.removeEventListener("stalled", buffer);
      video.removeEventListener("error", onError);
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [url]);

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
        className="h-full w-full"
        onPlaying={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onLoadedData={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
        onStalled={() => setLoading(true)}
        onError={() => setError("Fluxo indisponivel neste momento.")}
      >
        <track kind="captions" />
      </video>
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
