import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  useDeferredValue,
  startTransition,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getCategories,
  getStreams,
  getPlaybackUrl,
  getSeriesInfo,
  getChannelEPG,
  getEnrichedMetadata
} from "@/lib/player.functions";
import { usePlayerSession } from "@/lib/player-store";
import { getDeviceId } from "@/lib/device";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VideoPlayer } from "./VideoPlayer";
import { AlertTriangle, ChevronLeft, Film, Info, Loader2, MonitorPlay, PlayCircle, Search, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentEmptyState } from "@/components/ui/content-empty-state";
import { toast } from "sonner";
import { proxyMediaUrl } from "@/lib/media-url";


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
    title: "Séries",
    list: "Séries",
    empty: "Nenhuma série nesta categoria",
    search: "Pesquisar série...",
  },
};

function MarqueeText({
  text,
  active,
  className = "",
  multiline = false,
}: {
  text: string;
  active?: boolean;
  className?: string;
  multiline?: boolean;
}) {
  return (
    <span
      className={cn(
        "block overflow-hidden",
        multiline ? "line-clamp-2 break-words leading-snug" : "truncate whitespace-nowrap",
        className,
      )}
      title={text}
    >
      {text}
    </span>
  );
}

type CatalogStreamItem = {
  id: string;
  name: string;
  icon: string | null;
  ext: string | null;
  rating: string | null;
  category_id: string | null;
};

type CatalogCategory = {
  category_id: string;
  category_name: string;
};

type CatalogEpisode = {
  id: string;
  title: string;
  episode_num: number;
  ext: string;
};

function useImagePrefetch(sources: Array<string | null | undefined>, resetKey: string) {
  const prefetchedSources = useRef(new Set<string>());

  useEffect(() => {
    prefetchedSources.current.clear();
  }, [resetKey]);

  useEffect(() => {
    const uniqueSources = Array.from(
      new Set(
        sources
          .filter((source): source is string => Boolean(source))
          .map((source) => source.trim())
          .filter(Boolean),
      ),
    ).filter((source) => !prefetchedSources.current.has(source));

    if (uniqueSources.length === 0) return;

    let cancelled = false;
    const schedule =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback.bind(window)
        : (callback: () => void) => window.setTimeout(callback, 0);
    const cancel =
      typeof window !== "undefined" && "cancelIdleCallback" in window
        ? window.cancelIdleCallback.bind(window)
        : window.clearTimeout.bind(window);

    const handle = schedule(() => {
      if (cancelled) return;
      for (const source of uniqueSources.slice(0, 4)) {
        const image = new Image();
        image.decoding = "async";
        image.src = source;
        prefetchedSources.current.add(source);
      }
    });

    return () => {
      cancelled = true;
      cancel(handle);
    };
  }, [sources, resetKey]);
}

const CatalogCategoryButton = memo(function CatalogCategoryButton({
  category,
  active,
  onSelect,
  onHover,
}: {
  category: CatalogCategory;
  active: boolean;
  onSelect: (categoryId: string) => void;
  onHover: (categoryId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(category.category_id)}
      onMouseEnter={() => onHover(category.category_id)}
      onFocus={() => onHover(category.category_id)}
      className={cn(
        "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "group",
        active
          ? "bg-primary/20 font-bold text-primary shadow-sm shadow-primary/10"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <MarqueeText text={category.category_name} active={active} className="pr-2" />
    </button>
  );
});

const CatalogGridCard = memo(function CatalogGridCard({
  item,
  kind,
  serverId,
  active,
  loading,
  priority,
  onActivate,
  onHover,
}: {
  item: CatalogStreamItem;
  kind: Kind;
  serverId: string;
  active: boolean;
  loading: boolean;
  priority: boolean;
  onActivate: (item: CatalogStreamItem) => void;
  onHover?: (item: CatalogStreamItem) => void;
}) {
  const imageUrl = proxyMediaUrl(item.icon, serverId);

  return (
    <button
      type="button"
      onMouseEnter={() => onHover?.(item)}
      onFocus={() => onHover?.(item)}
      onClick={() => onActivate(item)}
      tabIndex={0}
      data-tv-focus
      aria-label={item.name}
      className={cn(
        "group overflow-hidden rounded-xl border border-border bg-secondary/20 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active && "border-primary/60 shadow-lg shadow-primary/10",
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden bg-secondary/40",
          kind === "live" ? "aspect-video" : "aspect-[2/3]",
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className={cn("h-full w-full", kind === "live" ? "object-contain p-3" : "object-cover")}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <Tv className="h-8 w-8 text-muted-foreground" />
        )}
        {loading ? (
          <Loader2 className="absolute inset-0 m-auto h-8 w-8 animate-spin text-primary" />
        ) : (
          <PlayCircle className="absolute inset-0 m-auto h-9 w-9 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
      <div className="min-h-[4.25rem] px-3 py-3 text-sm font-semibold">
        <MarqueeText
          text={item.name}
          active={active}
          multiline
          className="min-h-[2.5rem] text-sm leading-snug"
        />
      </div>
    </button>
  );
});

const CatalogEpisodeButton = memo(function CatalogEpisodeButton({
  episode,
  loading,
  onActivate,
}: {
  episode: CatalogEpisode;
  loading: boolean;
  onActivate: (episode: CatalogEpisode) => void;
}) {
  return (
    <Button
      variant="secondary"
      className="w-full justify-start"
      onClick={() => onActivate(episode)}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
      <span className="truncate">
        {episode.episode_num}. {episode.title}
      </span>
    </Button>
  );
});

export function Catalog({
  kind,
  initialSearch = "",
  hideHeader = false,
}: {
  kind: Kind;
  initialSearch?: string;
  hideHeader?: boolean;
}) {
  const { serverId, activeServer, blocked, profile } = usePlayerSession();
  const queryClient = useQueryClient();
  const deviceId = getDeviceId();
  const fetchCategories = useServerFn(getCategories);
  const fetchStreams = useServerFn(getStreams);
  const fetchPlayback = useServerFn(getPlaybackUrl);
  const fetchSeries = useServerFn(getSeriesInfo);
  const fetchEPG = useServerFn(getChannelEPG);
  const fetchTMDB = useServerFn(getEnrichedMetadata);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [catTerm, setCatTerm] = useState("");
  const [term, setTerm] = useState(initialSearch);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [playing, setPlaying] = useState<{
    id: string;
    url: string;
    fallbackUrls: string[];
    name: string;
    icon: string | null;
  } | null>(null);
  const [openSeries, setOpenSeries] = useState<{ id: string; name: string } | null>(null);
  const [pageSize, setPageSize] = useState<Record<Kind, 12 | 24 | 48>>({
    live: 24,
    movie: 24,
    series: 24,
  });
  const [currentPage, setCurrentPage] = useState<Record<Kind, number>>({
    live: 1,
    movie: 1,
    series: 1,
  });
  const [episodePageSize, setEpisodePageSize] = useState<Record<string, 6 | 12 | 24>>({});
  const [episodePage, setEpisodePage] = useState<Record<string, number>>({});
  const deferredCatTerm = useDeferredValue(catTerm);
  const deferredTerm = useDeferredValue(term);
  const playbackCacheKey = useCallback(
    (item: { id: string; ext?: string | null }) => [
      "playback-url",
      serverId,
      kind,
      item.id,
      item.ext ?? "",
      deviceId,
    ],
    [serverId, kind, deviceId],
  );
  const playbackQueryFn = useCallback(
    (item: { id: string; ext?: string | null; name: string; icon: string | null }) =>
      () =>
        fetchPlayback({
          data: {
            server_id: serverId!,
            kind,
            stream_id: item.id,
            device_id: deviceId,
            ...(item.ext ? { ext: item.ext } : {}),
          },
        }),
    [fetchPlayback, serverId, kind, deviceId],
  );

  const play = useCallback(async (item: {
    id: string;
    name: string;
    icon: string | null;
    ext?: string | null;
  }) => {
    setLoadingId(item.id);
    try {
      const result = await queryClient.fetchQuery({
        queryKey: playbackCacheKey(item),
        queryFn: playbackQueryFn(item),
        staleTime: 24 * 60 * 60 * 1000,
      });
      setPlaying({
        id: item.id,
        url: result.url,
        fallbackUrls: result.fallback_urls ?? [],
        name: item.name,
        icon: item.icon,
      });
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        // Comportamento mobile: scroll imediato para o player
        window.scrollTo({ top: 0, behavior: "smooth" });
        const playerArea = document.getElementById("wp-player-area");
        if (playerArea) {
          playerArea.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes("Limite") || msg.includes("simultanea")) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-bold">Acesso em uso!</span>
            <span>{msg}</span>
            <span className="text-[10px] opacity-80 italic">Sugestão: faça logout em outros dispositivos ou fale com o suporte para aumentar seu limite.</span>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(msg || "Não foi possível abrir o conteúdo");
      }
    } finally {

      setLoadingId(null);
    }
  }, [queryClient, playbackCacheKey, playbackQueryFn]);


  const prefetchCategoryStreams = useCallback((targetCategoryId: string) => {
    if (!serverId || !targetCategoryId) return;
    void queryClient.prefetchQuery({
      queryKey: ["streams", kind, serverId, targetCategoryId],
      queryFn: () =>
        fetchStreams({
          data: {
            server_id: serverId,
            kind,
            category_id: targetCategoryId,
          },
        }),
      staleTime: 5 * 60_000,
    });
  }, [queryClient, serverId, kind, fetchStreams]);

  const prefetchSeriesInfo = useCallback((series: { id: string; name: string }) => {
    if (!serverId || kind !== "series") return;
    void queryClient.prefetchQuery({
      queryKey: ["series-info", serverId, series.id],
      queryFn: () => fetchSeries({ data: { server_id: serverId, series_id: series.id } }),
      staleTime: 10 * 60_000,
    });
  }, [queryClient, serverId, kind, fetchSeries]);

  const activateCatalogItem = useCallback((item: { id: string; name: string; icon: string | null; ext?: string | null }) => {
    if (kind === "series") {
      setOpenSeries({ id: item.id, name: item.name });
      return;
    }
    void play(item);
  }, [kind, play]);


  const activateEpisode = useCallback((episode: CatalogEpisode) => {
    if (!openSeries) return;
    void play({
      id: episode.id,
      name: `${openSeries.name} - ${episode.episode_num}. ${episode.title}`,
      icon: null,
      ext: episode.ext,
    });
  }, [openSeries, play]);

  const selectCategory = useCallback((categoryId: string) => {
    startTransition(() => {
      setCategoryId(categoryId);
      setCurrentPage((pages) => ({ ...pages, [kind]: 1 }));
    });
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      const listArea = document.getElementById("wp-items-area");
      if (listArea) listArea.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [kind]);


  useEffect(() => {
    setCategoryId(null);
    setCatTerm("");
    setTerm(initialSearch);
    setPlaying(null);
    setOpenSeries(null);
    setCurrentPage((pages) => ({ ...pages, [kind]: 1 }));
    setEpisodePage({});
  }, [kind, serverId, initialSearch, queryClient]);

  useEffect(() => {
    setTerm(initialSearch);
  }, [initialSearch]);


  const categories = useQuery({
    queryKey: ["categories", kind, serverId],
    queryFn: () => fetchCategories({ data: { server_id: serverId!, kind } }),
    enabled: Boolean(serverId),
    retry: 1,
    staleTime: 10 * 60_000,
    placeholderData: (previous) => previous,
  });

  const searchAll = Boolean(initialSearch.trim());
  const activeCategory = searchAll ? null : categoryId ?? categories.data?.[0]?.category_id ?? null;

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
    enabled: Boolean(serverId) && (kind === "live" ? Boolean(activeCategory) : true),
    retry: 1,
    staleTime: 5 * 60_000,
    placeholderData: (previous) => previous,
  });

  const seriesInfo = useQuery({
    queryKey: ["series-info", serverId, openSeries?.id],
    queryFn: () => fetchSeries({ data: { server_id: serverId!, series_id: openSeries!.id } }),
    enabled: Boolean(serverId && openSeries?.id),
    retry: 1,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (!openSeries?.id) return;
    setEpisodePage((pages) => ({ ...pages, [openSeries.id]: 1 }));
  }, [openSeries?.id]);

  const visibleCategories = useMemo(() => {
    const list = categories.data ?? [];
    if (!deferredCatTerm.trim()) return list;
    const needle = deferredCatTerm.trim().toLowerCase();
    return list.filter((item) => item.category_name.toLowerCase().includes(needle));
  }, [categories.data, deferredCatTerm]);

  useEffect(() => {
    if (!serverId || categories.isLoading || categories.isError) return;
    const warmTargets = visibleCategories.slice(0, 2);
    for (const category of warmTargets) {
      if (category.category_id === activeCategory) continue;
      prefetchCategoryStreams(category.category_id);
    }
  }, [serverId, categories.isLoading, categories.isError, visibleCategories, activeCategory, prefetchCategoryStreams]);

  const filtered = useMemo(() => {
    const list = streams.data ?? [];
    if (!deferredTerm.trim()) return list;
    const needle = deferredTerm.trim().toLowerCase();
    return list.filter((item) => item.name.toLowerCase().includes(needle));
  }, [streams.data, deferredTerm]);

  const currentEpisodeGroups = useMemo(() => {
    const seasons = seriesInfo.data?.seasons ?? [];
    return seasons.map((season) => {
      const size = episodePageSize[season.season] ?? 12;
      const total = season.episodes.length;
      const totalPagesForSeason = Math.max(1, Math.ceil(total / size));
      const safeSeasonPage = Math.min(episodePage[season.season] ?? 1, totalPagesForSeason);
      const start = total === 0 ? 0 : (safeSeasonPage - 1) * size + 1;
      const end = Math.min(safeSeasonPage * size, total);
      const pages = (() => {
        const windowSize = 5;
        if (totalPagesForSeason <= windowSize) {
          return Array.from({ length: totalPagesForSeason }, (_, index) => index + 1);
        }
        const startPage = Math.max(1, Math.min(safeSeasonPage - 2, totalPagesForSeason - (windowSize - 1)));
        const endPage = Math.min(totalPagesForSeason, startPage + windowSize - 1);
        return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
      })();

      return {
        season,
        size,
        total,
        totalPagesForSeason,
        safeSeasonPage,
        start,
        end,
        pages,
        items: season.episodes.slice((safeSeasonPage - 1) * size, safeSeasonPage * size),
      };
    });
  }, [episodePage, episodePageSize, seriesInfo.data?.seasons]);

  useEffect(() => {
    setCurrentPage((pages) => ({ ...pages, [kind]: 1 }));
  }, [kind, activeCategory, term, activeServer?.id]);

  const totalItems = filtered.length;
  const activePageSize = pageSize[kind];
  const totalPages = Math.max(1, Math.ceil(totalItems / activePageSize));
  const safePage = Math.min(currentPage[kind], totalPages);
  const pageStart = totalItems === 0 ? 0 : (safePage - 1) * activePageSize + 1;
  const pageEnd = Math.min(safePage * activePageSize, totalItems);
  const paginatedItems = useMemo(
    () => filtered.slice((safePage - 1) * activePageSize, safePage * activePageSize),
    [filtered, safePage, activePageSize],
  );
  const pageImageSources = useMemo(
    () => paginatedItems.slice(0, 4).map((item) => proxyMediaUrl(item.icon, serverId)),
    [paginatedItems, serverId],
  );
  const paginationPages = useMemo(() => {
    const windowSize = 5;
    if (totalPages <= windowSize) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, Math.min(safePage - 2, totalPages - (windowSize - 1)));
    const end = Math.min(totalPages, start + windowSize - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safePage, totalPages]);

  useEffect(() => {
    if (currentPage[kind] > totalPages) {
      setCurrentPage((pages) => ({ ...pages, [kind]: totalPages }));
    }
  }, [currentPage, kind, totalPages]);

  useImagePrefetch(pageImageSources, `${serverId ?? "no-server"}:${kind}`);



  if (!serverId) {
    return (
      <ContentEmptyState
        icon={Tv}
        title="Nenhum portal disponível"
        description="Este acesso ainda não possui um portal liberado. Quando o acesso for atualizado, recarregue esta área ou fale com o suporte."
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden">
      {blocked && (
        <div className="animate-in fade-in slide-in-from-top-4 rounded-xl border border-destructive/50 bg-destructive/10 p-4 mb-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-bold text-destructive">Conexão bloqueada</p>
              <p className="text-xs text-destructive/80 leading-relaxed">
                {blocked}. Se voce esta tentando conectar em um novo dispositivo, certifique-se de ter encerrado a sessao nos outros.
              </p>
              <div className="pt-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[10px] border-destructive/30 hover:bg-destructive/20 text-destructive"
                  onClick={() => window.location.href = "/conta"}
                >
                  Ver Planos / Suporte
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hideHeader ? (
        <div className="flex flex-none flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold sm:text-2xl">
              {LABEL[kind].title}
            </h1>
          </div>
        </div>
      ) : null}


      {/* Layout do legado: categorias | lista | player sempre na tela */}
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(380px,42%)] xl:grid-cols-[280px_minmax(0,1fr)_minmax(420px,480px)] 2xl:grid-cols-[300px_minmax(0,1fr)_minmax(460px,540px)]">
        <aside className="flex h-full min-h-0 min-w-0 max-h-64 flex-col rounded-xl border border-border bg-card p-2 lg:col-span-2 xl:col-span-1 xl:max-h-none">
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
          <div className="wp-scroll flex-1 min-h-0 space-y-1 overflow-y-auto">
            {categories.isLoading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : categories.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                Não foi possível carregar as categorias.
              </div>
            ) : (
              visibleCategories.map((category) => (
                <CatalogCategoryButton
                  key={category.category_id}
                  category={category}
                  active={activeCategory === category.category_id}
                  onSelect={selectCategory}
                  onHover={prefetchCategoryStreams}
                />
              ))
            )}
            {!categories.isLoading && visibleCategories.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">
                {categories.error ? "Falha ao consultar o servidor." : "Sem categorias."}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-border bg-card p-2">
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
                <p className="truncate text-sm font-bold uppercase tracking-tight">{openSeries.name}</p>
              </div>
              <div className="wp-scroll flex-1 min-h-0 space-y-3 overflow-y-auto px-1 pb-4">

                {seriesInfo.isLoading && !seriesInfo.data ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : seriesInfo.isError ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    Não foi possível carregar os episódios desta série.
                    <div className="pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-destructive/30 text-destructive hover:bg-destructive/20"
                        onClick={() => void seriesInfo.refetch()}
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {seriesInfo.data?.info?.plot ? (
                      <p className="text-xs text-muted-foreground">{seriesInfo.data.info.plot}</p>
                    ) : null}
                    {seriesInfo.isFetching && seriesInfo.data ? (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-primary">
                        Atualizando temporadas e episódios...
                      </div>
                    ) : null}
                    {currentEpisodeGroups.map(({ season, size, total, totalPagesForSeason, safeSeasonPage, start, end, pages, items }) => (
                      <div key={season.season} className="space-y-2 rounded-xl border border-border/60 bg-secondary/10 p-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-primary">
                            Temporada {season.season}
                          </p>
                          <div className="text-[10px] text-muted-foreground">
                            Mostrando <span className="font-bold text-primary">{start}</span> a{" "}
                            <span className="font-bold text-primary">{end}</span> de{" "}
                            <span className="font-bold">{total}</span> episódios
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-[140px]">
                            <Select
                              value={String(size)}
                              onValueChange={(value) =>
                                startTransition(() => {
                                  setEpisodePageSize((sizes) => ({
                                    ...sizes,
                                    [season.season]: Number(value) as 6 | 12 | 24,
                                  }));
                                  setEpisodePage((pagesMap) => ({
                                    ...pagesMap,
                                    [season.season]: 1,
                                  }));
                                })
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="12" />
                              </SelectTrigger>
                              <SelectContent>
                                {[6, 12, 24].map((value) => (
                                  <SelectItem key={value} value={String(value)}>
                                    {value} por página
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {totalPagesForSeason > 1 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-[10px]"
                                onClick={() =>
                                  startTransition(() =>
                                    setEpisodePage((pagesMap) => ({ ...pagesMap, [season.season]: 1 })),
                                  )
                                }
                                disabled={safeSeasonPage === 1}
                              >
                                Primeira
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-[10px]"
                                onClick={() =>
                                  startTransition(() =>
                                    setEpisodePage((pagesMap) => ({
                                      ...pagesMap,
                                      [season.season]: Math.max(1, (pagesMap[season.season] ?? 1) - 1),
                                    })),
                                  )
                                }
                                disabled={safeSeasonPage === 1}
                              >
                                Anterior
                              </Button>
                              {pages.map((page) => (
                                <Button
                                  key={page}
                                  type="button"
                                  size="sm"
                                  variant={page === safeSeasonPage ? "default" : "outline"}
                                  className="h-8 min-w-8 px-2.5 text-[10px]"
                                  onClick={() =>
                                    startTransition(() =>
                                      setEpisodePage((pagesMap) => ({ ...pagesMap, [season.season]: page })),
                                    )
                                  }
                                >
                                  {page}
                                </Button>
                              ))}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-[10px]"
                                onClick={() =>
                                  startTransition(() =>
                                    setEpisodePage((pagesMap) => ({
                                      ...pagesMap,
                                      [season.season]: Math.min(
                                        totalPagesForSeason,
                                        (pagesMap[season.season] ?? 1) + 1,
                                      ),
                                    })),
                                  )
                                }
                                disabled={safeSeasonPage === totalPagesForSeason}
                              >
                                Próxima
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-[10px]"
                                onClick={() =>
                                  startTransition(() =>
                                    setEpisodePage((pagesMap) => ({
                                      ...pagesMap,
                                      [season.season]: totalPagesForSeason,
                                    })),
                                  )
                                }
                                disabled={safeSeasonPage === totalPagesForSeason}
                              >
                                Última
                              </Button>
                            </div>
                          ) : null}
                        </div>
                        <div className="space-y-1">
                          {items.map((episode) => (
                            <CatalogEpisodeButton
                              key={episode.id}
                              episode={episode}
                              loading={loadingId === episode.id}
                              onActivate={activateEpisode}
                            />
                          ))}
                        </div>
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
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2">
                <div className="text-xs text-muted-foreground">
                  Mostrando <span className="font-bold text-primary">{pageStart}</span> a{" "}
                  <span className="font-bold text-primary">{pageEnd}</span> de{" "}
                  <span className="font-bold">{totalItems}</span> itens
                </div>
                <div className="w-[150px]">
                    <Select
                    value={String(activePageSize)}
                    onValueChange={(value) =>
                      startTransition(() => {
                        setPageSize((pages) => ({ ...pages, [kind]: Number(value) as 12 | 24 | 48 }));
                        setCurrentPage((pages) => ({ ...pages, [kind]: 1 }));
                      })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="24" />
                    </SelectTrigger>
                    <SelectContent>
                      {[12, 24, 48].map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value} por página
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div id="wp-items-area" className="wp-scroll flex-1 min-h-0 overflow-y-auto px-1 pb-4">
                {streams.isLoading && !streams.data ? (
                  <div className="flex justify-center p-16">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : streams.isError && !streams.data?.length ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    Não foi possível carregar os conteúdos deste servidor no momento.
                    <div className="pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-destructive/30 text-destructive hover:bg-destructive/20"
                        onClick={() => void streams.refetch()}
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                ) : filtered.length === 0 ? (
                  <ContentEmptyState
                    icon={kind === "live" ? Tv : kind === "movie" ? Film : MonitorPlay}
                    title={LABEL[kind].empty}
                    description={
                      deferredTerm.trim()
                        ? "Nenhum resultado corresponde à busca atual. Tente outro termo ou limpe o filtro."
                        : "Ainda não há itens disponíveis nesta categoria para este portal."
                    }
                    className="min-h-44 border-border/60 bg-secondary/10"
                  />
                ) : (
                  <div className="space-y-2">
                    {streams.isFetching ? (
                      <div className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-[11px] text-primary">
                        Atualizando catálogo...
                      </div>
                    ) : null}
                    <div
                      className={cn(
                        "grid gap-2 transition-opacity duration-150",
                        kind === "live"
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3",
                        streams.isFetching && streams.data?.length ? "opacity-80" : "opacity-100",
                      )}
                    >
                      {paginatedItems.map((item, index) => {
                        const isActiveItem = kind !== "series" && playing?.id === item.id;

                        return (
                            <CatalogGridCard
                              key={`${item.id}-${item.name}`}
                              item={item}
                              kind={kind}
                              serverId={serverId}
                              active={isActiveItem}
                              loading={loadingId === item.id}
                              priority={index < 4}
                              onActivate={activateCatalogItem}
                              {...(kind === "series" ? { onHover: prefetchSeriesInfo } : {})}
                            />
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
              {totalPages > 1 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-1 pt-3">
                  <div className="text-xs text-muted-foreground">
                    Página <span className="font-semibold text-foreground">{safePage}</span> de{" "}
                    <span className="font-semibold text-foreground">{totalPages}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => startTransition(() => setCurrentPage((pages) => ({ ...pages, [kind]: 1 })))}
                      disabled={safePage === 1}
                    >
                      Primeira
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() =>
                        startTransition(() =>
                          setCurrentPage((pages) => ({
                            ...pages,
                            [kind]: Math.max(1, pages[kind] - 1),
                          })),
                        )
                      }
                      disabled={safePage === 1}
                    >
                      Anterior
                    </Button>

                    {paginationPages.map((page) => (
                      <Button
                        key={page}
                        type="button"
                        size="sm"
                        variant={page === safePage ? "default" : "outline"}
                        className="h-8 min-w-9 px-3 text-xs"
                        onClick={() => startTransition(() => setCurrentPage((pages) => ({ ...pages, [kind]: page })))}
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() =>
                        startTransition(() =>
                          setCurrentPage((pages) => ({
                            ...pages,
                            [kind]: Math.min(totalPages, pages[kind] + 1),
                          })),
                        )
                      }
                      disabled={safePage === totalPages}
                    >
                      Próxima
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => startTransition(() => setCurrentPage((pages) => ({ ...pages, [kind]: totalPages })))}
                      disabled={safePage === totalPages}
                    >
                      Última
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>

        <section id="wp-player-area" className="lg:sticky lg:top-4 lg:self-start lg:w-full lg:max-w-[480px] xl:max-w-[520px] lg:justify-self-end">
          {playing ? (
            <div className="space-y-2">
              <VideoPlayer
                url={playing.url}
                fallbackUrls={playing.fallbackUrls}
                serverId={serverId}
                poster={proxyMediaUrl(playing.icon, serverId) ?? playing.icon}
                title={playing.name}
                kind={kind}
              />
              <p className="truncate text-sm font-semibold">{playing.name}</p>
              
              {/* EPG / Metadata Area */}
              <PlayerInfo 
                streamId={playing.id}
                kind={kind} 
                name={playing.name} 
                fetchEPG={fetchEPG} 
                fetchTMDB={fetchTMDB}
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card text-center">
              <PlayCircle className="h-10 w-10 text-primary/50" />
              <p className="text-sm font-semibold">
                {kind === "live" ? "Selecione um canal" : "Selecione um conteúdo"}
              </p>
              <p className="px-6 text-xs text-muted-foreground">
                O player abre aqui ao lado, com navegação integrada.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PlayerInfo({ 
  streamId, 
  kind, 
  name, 
  fetchEPG, 
  fetchTMDB 
}: { 
  streamId: string; 
  kind: Kind; 
  name: string;
  fetchEPG: any;
  fetchTMDB: any;
}) {
  const { serverId } = usePlayerSession();
  
  const epg = useQuery({
    queryKey: ["epg", serverId, streamId],
    queryFn: () => fetchEPG({ data: { server_id: serverId!, stream_id: streamId } }),
    enabled: kind === "live" && !!serverId && !!streamId,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });

  const tmdb = useQuery({
    queryKey: ["tmdb", name, kind],
    queryFn: () => fetchTMDB({ data: { kind: kind as "movie" | "series", name } }),
    enabled: (kind === "movie" || kind === "series") && !!name,
    staleTime: 24 * 60 * 60 * 1000,
    placeholderData: (previous) => previous,
  });

  if (kind === "live") {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-3 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Info className="h-3 w-3" /> Programação EPG
        </h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto wp-scroll pr-1">
          {epg.isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : (epg.data ?? []).length > 0 ? (
            epg.data.slice(0, 5).map((prog: any, i: number) => (
              <div key={i} className={cn("text-[11px] border-l-2 pl-2 py-0.5", i === 0 ? "border-primary bg-primary/5" : "border-muted")}>
                <div className="flex justify-between font-bold">
                  <span>{prog.title}</span>
                  <span className="text-[10px] text-muted-foreground">{prog.start.split(' ')[1]}</span>
                </div>
                {prog.description && <p className="text-muted-foreground line-clamp-2 mt-0.5">{prog.description}</p>}
              </div>
            ))
          ) : (
            <p className="text-[10px] text-muted-foreground text-center py-2 italic">Sem guia de programação disponível para este canal.</p>
          )}
        </div>
      </div>
    );
  }

  if (tmdb.data) {
    const data = tmdb.data;
    const rating = data.vote_average ? Math.round(data.vote_average * 10) / 10 : null;
    const posterUrl = data.poster_path
      ? proxyMediaUrl(`https://image.tmdb.org/t/p/w300${data.poster_path}`)
      : null;

    
    return (
      <div className="rounded-xl border border-border bg-card/50 p-3 space-y-3">
        <div className="flex gap-3">
          {posterUrl && (
            <img 
              src={posterUrl} 
              className="w-20 sm:w-24 rounded-lg shadow-2xl border border-primary/20 ring-1 ring-white/10"
              alt="Poster TMDB"
              loading="lazy"
            />
          )}
          <div className="flex-1 space-y-1">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-bold leading-tight">{data.title || data.name}</h3>
              {rating && (
                <span className="bg-yellow-500/20 text-yellow-500 text-[10px] px-1.5 py-0.5 rounded font-black">
                  ⭐ {rating}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {data.release_date?.split('-')[0] || data.first_air_date?.split('-')[0]} • {data.genres?.map((g: any) => g.name).join(', ')}
            </p>
            <p className="text-[11px] text-muted-foreground line-clamp-4 leading-relaxed mt-1">
              {data.overview || "Sem sinopse disponível."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
