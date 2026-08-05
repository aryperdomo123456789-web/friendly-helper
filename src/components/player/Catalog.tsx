import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getCategories,
  getStreams,
  getPlaybackUrl,
  getSeriesInfo,
} from "@/lib/player.functions";
import { usePlayerSession } from "@/lib/player-store";
import { getDeviceId } from "@/lib/device";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoPlayer } from "./VideoPlayer";
import { Loader2, PlayCircle, Search, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Kind = "live" | "movie" | "series";

const LABEL: Record<Kind, { title: string; empty: string }> = {
  live: { title: "TV ao Vivo", empty: "Nenhum canal nesta categoria" },
  movie: { title: "Filmes", empty: "Nenhum filme nesta categoria" },
  series: { title: "Series", empty: "Nenhuma serie nesta categoria" },
};

export function Catalog({ kind }: { kind: Kind }) {
  const { serverId, activeServer } = usePlayerSession();
  const fetchCategories = useServerFn(getCategories);
  const fetchStreams = useServerFn(getStreams);
  const fetchPlayback = useServerFn(getPlaybackUrl);
  const fetchSeries = useServerFn(getSeriesInfo);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [playing, setPlaying] = useState<{ url: string; name: string; icon: string | null } | null>(
    null,
  );
  const [seriesOpen, setSeriesOpen] = useState<{ id: string; name: string } | null>(null);

  const categories = useQuery({
    queryKey: ["categories", kind, serverId],
    queryFn: () => fetchCategories({ data: { server_id: serverId!, kind } }),
    enabled: Boolean(serverId),
    staleTime: 10 * 60_000,
  });

  const activeCategory = categoryId ?? categories.data?.[0]?.category_id ?? null;

  const streams = useQuery({
    queryKey: ["streams", kind, serverId, activeCategory],
    queryFn: () =>
      fetchStreams({
        data: { server_id: serverId!, kind, ...(activeCategory ? { category_id: activeCategory } : {}) },
      }),
    enabled: Boolean(serverId && activeCategory),
    staleTime: 5 * 60_000,
  });

  const seriesInfo = useQuery({
    queryKey: ["series-info", serverId, seriesOpen?.id],
    queryFn: () => fetchSeries({ data: { server_id: serverId!, series_id: seriesOpen!.id } }),
    enabled: Boolean(serverId && seriesOpen?.id),
  });

  const filtered = useMemo(() => {
    const list = streams.data ?? [];
    if (!term.trim()) return list;
    const needle = term.trim().toLowerCase();
    return list.filter((item) => item.name.toLowerCase().includes(needle));
  }, [streams.data, term]);

  const play = async (item: { id: string; name: string; icon: string | null; ext?: string | null }) => {
    try {
      const result = await fetchPlayback({
        data: {
          server_id: serverId!,
          kind: kind === "series" ? "series" : kind,
          stream_id: item.id,
          device_id: getDeviceId(),
          ...(item.ext ? { ext: item.ext } : {}),
        },
      });
      setPlaying({ url: result.url, name: item.name, icon: item.icon });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel abrir o conteudo");
    }
  };

  if (!serverId) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Nenhum servidor liberado para este acesso.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{LABEL[kind].title}</h1>
          <p className="text-sm text-muted-foreground">
            Servidor ativo: <span className="text-primary">{activeServer?.name ?? "-"}</span>
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Buscar..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="wp-scroll max-h-[70vh] space-y-1 overflow-y-auto rounded-xl border border-border bg-card p-2">
          {categories.isLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            (categories.data ?? []).map((category) => (
              <button
                key={category.category_id}
                type="button"
                onClick={() => setCategoryId(category.category_id)}
                className={cn(
                  "w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  activeCategory === category.category_id
                    ? "bg-primary/15 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {category.category_name}
              </button>
            ))
          )}
          {!categories.isLoading && (categories.data ?? []).length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">
              {categories.error ? "Falha ao consultar o servidor." : "Sem categorias."}
            </p>
          ) : null}
        </aside>

        <section>
          {streams.isLoading ? (
            <div className="flex justify-center p-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              {LABEL[kind].empty}
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-3",
                kind === "live"
                  ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
              )}
            >
              {filtered.slice(0, 300).map((item) => (
                <button
                  key={`${item.id}-${item.name}`}
                  type="button"
                  onClick={() =>
                    kind === "series"
                      ? setSeriesOpen({ id: item.id, name: item.name })
                      : void play(item)
                  }
                  className="group overflow-hidden rounded-xl border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div
                    className={cn(
                      "relative flex items-center justify-center overflow-hidden bg-secondary/40",
                      kind === "live" ? "aspect-video" : "aspect-[2/3]",
                    )}
                  >
                    {item.icon ? (
                      <img
                        src={item.icon}
                        alt={item.name}
                        loading="lazy"
                        className={cn(
                          "h-full w-full",
                          kind === "live" ? "object-contain p-4" : "object-cover",
                        )}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <Tv className="h-8 w-8 text-muted-foreground" />
                    )}
                    <PlayCircle className="absolute inset-0 m-auto h-10 w-10 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="line-clamp-2 px-2 py-2 text-xs font-medium">{item.name}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={Boolean(playing)} onOpenChange={(open) => !open && setPlaying(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-base">{playing?.name}</DialogTitle>
          </DialogHeader>
          {playing ? (
            <VideoPlayer url={playing.url} poster={playing.icon} title={playing.name} />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(seriesOpen)} onOpenChange={(open) => !open && setSeriesOpen(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{seriesOpen?.name}</DialogTitle>
          </DialogHeader>
          {seriesInfo.isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {seriesInfo.data?.info?.plot ? (
                <p className="text-sm text-muted-foreground">{seriesInfo.data.info.plot}</p>
              ) : null}
              {(seriesInfo.data?.seasons ?? []).map((season) => (
                <div key={season.season} className="space-y-2">
                  <p className="text-sm font-semibold text-primary">Temporada {season.season}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {season.episodes.map((episode) => (
                      <Button
                        key={episode.id}
                        variant="secondary"
                        className="justify-start"
                        onClick={() => {
                          setSeriesOpen(null);
                          void play({
                            id: episode.id,
                            name: episode.title,
                            icon: null,
                            ext: episode.ext,
                          });
                        }}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        <span className="truncate">
                          {episode.episode_num}. {episode.title}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
