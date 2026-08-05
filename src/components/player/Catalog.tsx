import { useEffect, useMemo, useState } from "react";
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
import { VideoPlayer } from "./VideoPlayer";
import { ChevronLeft, Loader2, PlayCircle, Search, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Kind = "live" | "movie" | "series";

const LABEL: Record<Kind, { title: string; list: string; empty: string; search: string }> = {
  live: {
    title: "TV ao Vivo",
    list: "Canais",
    empty: "Nenhum canal nesta categoria",
    search: "Pesquisar canal...",
  },
  movie: {
    title: "Filmes",
    list: "Filmes",
    empty: "Nenhum filme nesta categoria",
    search: "Pesquisar filme...",
  },
  series: {
    title: "Series",
    list: "Series",
    empty: "Nenhuma serie nesta categoria",
    search: "Pesquisar serie...",
  },
};

export function Catalog({ kind }: { kind: Kind }) {
  const { serverId, activeServer } = usePlayerSession();
  const fetchCategories = useServerFn(getCategories);
  const fetchStreams = useServerFn(getStreams);
  const fetchPlayback = useServerFn(getPlaybackUrl);
  const fetchSeries = useServerFn(getSeriesInfo);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [catTerm, setCatTerm] = useState("");
  const [term, setTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [playing, setPlaying] = useState<{ url: string; name: string; icon: string | null } | null>(
    null,
  );
  const [openSeries, setOpenSeries] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setCategoryId(null);
    setTerm("");
    setCatTerm("");
    setPlaying(null);
    setOpenSeries(null);
  }, [kind, serverId]);

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
        data: {
          server_id: serverId!,
          kind,
          ...(activeCategory ? { category_id: activeCategory } : {}),
        },
      }),
    enabled: Boolean(serverId && activeCategory),
    staleTime: 5 * 60_000,
  });

  const seriesInfo = useQuery({
    queryKey: ["series-info", serverId, openSeries?.id],
    queryFn: () => fetchSeries({ data: { server_id: serverId!, series_id: openSeries!.id } }),
    enabled: Boolean(serverId && openSeries?.id),
  });

  const visibleCategories = useMemo(() => {
    const list = categories.data ?? [];
    if (!catTerm.trim()) return list;
    const needle = catTerm.trim().toLowerCase();
    return list.filter((item) => item.category_name.toLowerCase().includes(needle));
  }, [categories.data, catTerm]);

  const filtered = useMemo(() => {
    const list = streams.data ?? [];
    if (!term.trim()) return list;
    const needle = term.trim().toLowerCase();
    return list.filter((item) => item.name.toLowerCase().includes(needle));
  }, [streams.data, term]);

  const play = async (item: {
    id: string;
    name: string;
    icon: string | null;
    ext?: string | null;
  }) => {
    setLoadingId(item.id);
    try {
      const result = await fetchPlayback({
        data: {
          server_id: serverId!,
          kind,
          stream_id: item.id,
          device_id: getDeviceId(),
          ...(item.ext ? { ext: item.ext } : {}),
        },
      });
      setPlaying({ url: result.url, name: item.name, icon: item.icon });
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        document.getElementById("wp-player-area")?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel abrir o conteudo");
    } finally {
      setLoadingId(null);
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
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold sm:text-2xl">{LABEL[kind].title}</h1>
          <p className="truncate text-sm text-muted-foreground">
            Servidor ativo: <span className="text-primary">{activeServer?.name ?? "-"}</span>
          </p>
        </div>
      </div>

      {/* Layout do legado: categorias | lista | player sempre na tela */}
      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1.15fr)]">
        <aside className="flex flex-col rounded-xl border border-border bg-card p-2">
          <p className="px-2 pb-2 text-sm font-semibold">Categorias</p>
          <div className="relative px-1 pb-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={catTerm}
              onChange={(event) => setCatTerm(event.target.value)}
              placeholder="Pesquisar categoria..."
              className="h-9 pl-9"
            />
          </div>
          <div className="wp-scroll max-h-[26vh] space-y-1 overflow-y-auto lg:max-h-[62vh]">
            {categories.isLoading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              visibleCategories.map((category) => (
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
            {!categories.isLoading && visibleCategories.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">
                {categories.error ? "Falha ao consultar o servidor." : "Sem categorias."}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="flex flex-col rounded-xl border border-border bg-card p-2">
          {openSeries ? (
            <>
              <div className="flex items-center gap-2 px-1 pb-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setOpenSeries(null)}
                  aria-label="Voltar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <p className="truncate text-sm font-semibold">{openSeries.name}</p>
              </div>
              <div className="wp-scroll max-h-[62vh] space-y-3 overflow-y-auto px-1">
                {seriesInfo.isLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {seriesInfo.data?.info?.plot ? (
                      <p className="text-xs text-muted-foreground">{seriesInfo.data.info.plot}</p>
                    ) : null}
                    {(seriesInfo.data?.seasons ?? []).map((season) => (
                      <div key={season.season} className="space-y-1">
                        <p className="text-xs font-semibold text-primary">
                          Temporada {season.season}
                        </p>
                        {season.episodes.map((episode) => (
                          <Button
                            key={episode.id}
                            variant="secondary"
                            className="w-full justify-start"
                            onClick={() =>
                              void play({
                                id: episode.id,
                                name: `${openSeries.name} - ${episode.episode_num}. ${episode.title}`,
                                icon: null,
                                ext: episode.ext,
                              })
                            }
                          >
                            {loadingId === episode.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <PlayCircle className="mr-2 h-4 w-4" />
                            )}
                            <span className="truncate">
                              {episode.episode_num}. {episode.title}
                            </span>
                          </Button>
                        ))}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="px-2 pb-2 text-sm font-semibold">{LABEL[kind].list}</p>
              <div className="relative px-1 pb-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder={LABEL[kind].search}
                  className="h-9 pl-9"
                />
              </div>
              <div className="wp-scroll max-h-[36vh] overflow-y-auto px-1 lg:max-h-[62vh]">
                {streams.isLoading ? (
                  <div className="flex justify-center p-16">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    {LABEL[kind].empty}
                  </p>
                ) : (
                  <div
                    className={cn(
                      "grid gap-2",
                      kind === "live" ? "grid-cols-2 xl:grid-cols-3" : "grid-cols-2 xl:grid-cols-3",
                    )}
                  >
                    {filtered.slice(0, 400).map((item) => (
                      <button
                        key={`${item.id}-${item.name}`}
                        type="button"
                        onClick={() =>
                          kind === "series"
                            ? setOpenSeries({ id: item.id, name: item.name })
                            : void play(item)
                        }
                        className="group overflow-hidden rounded-xl border border-border bg-secondary/20 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"
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
                                kind === "live" ? "object-contain p-3" : "object-cover",
                              )}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Tv className="h-8 w-8 text-muted-foreground" />
                          )}
                          {loadingId === item.id ? (
                            <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-primary" />
                          ) : (
                            <PlayCircle className="absolute inset-0 m-auto h-9 w-9 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                          )}
                        </div>
                        <p className="line-clamp-2 px-2 py-2 text-xs font-medium">{item.name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <section id="wp-player-area" className="lg:sticky lg:top-4 lg:self-start">
          {playing ? (
            <div className="space-y-2">
              <VideoPlayer url={playing.url} poster={playing.icon} title={playing.name} />
              <p className="truncate text-sm font-semibold">{playing.name}</p>
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card text-center">
              <PlayCircle className="h-10 w-10 text-primary/50" />
              <p className="text-sm font-semibold">
                {kind === "live" ? "Selecione um canal" : "Selecione um conteudo"}
              </p>
              <p className="px-6 text-xs text-muted-foreground">
                O player abre aqui do lado, igual ao WebPlayer original.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
