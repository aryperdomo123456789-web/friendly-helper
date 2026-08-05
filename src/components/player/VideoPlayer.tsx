import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  url: string;
  poster?: string | null;
  title?: string;
};

export function VideoPlayer({ url, poster, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;
    let destroyed = false;
    let hls: import("hls.js").default | null = null;

    setError(null);
    setLoading(true);

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
            lowLatencyMode: true,
            enableWorker: true,
            manifestLoadingMaxRetry: 15,
            levelLoadingMaxRetry: 15,
            fragLoadingMaxRetry: 25,
            fragLoadingTimeOut: 60000,
            manifestLoadingTimeOut: 60000,
          });
          hls.loadSource(url);
          hls.attachMedia(video!);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            void video!.play().catch(() => undefined);
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            console.error("[player] hls", data.type, data.details, data.fatal);
            if (!data.fatal) return;
            if (recoveries < 3 && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              recoveries += 1;
              hls?.recoverMediaError();
              return;
            }
            if (recoveries < 3 && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              recoveries += 1;
              hls?.startLoad();
              return;
            }
            const code = (data.response as { code?: number } | undefined)?.code;
            setError(
              code === 404 || code === 502
                ? "Canal indisponivel no servidor agora (fora do ar ou limite de conexoes em uso)."
                : "Nao foi possivel iniciar o canal. Tente outro canal ou servidor.",
            );
          });
          return;
        }
      }
      video!.src = url;
      void video!.play().catch(() => undefined);
    }

    void start();

    return () => {
      destroyed = true;
      hls?.destroy();
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
        playsInline
        className="h-full w-full"
        onPlaying={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
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
