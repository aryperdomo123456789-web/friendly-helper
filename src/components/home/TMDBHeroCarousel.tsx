import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { APP_CONFIG_QUERY_KEY, getAppConfig } from "@/lib/config.functions";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Star, Play, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { proxyMediaUrl } from "@/lib/media-url";

interface TMDBContent {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: "movie" | "tv";
}

export function TMDBHeroCarousel() {
  const fetchConfig = useServerFn(getAppConfig);
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState<TMDBContent[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: config, error: configError } = useQuery({
    queryKey: APP_CONFIG_QUERY_KEY,
    queryFn: () => fetchConfig(),
    staleTime: 5 * 60_000,
    retry: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchTrending() {
      if (!config?.tmdb_api_key) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/all/day?api_key=${config.tmdb_api_key}&language=pt-BR`,
        );
        const data = await res.json();

        if (cancelled) return;

        if (data?.results) {
          const filtered = data.results
            .filter(
              (item: any) =>
                item.backdrop_path && (item.media_type === "movie" || item.media_type === "tv"),
            )
            .slice(0, 8);
          setItems(filtered);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("Erro ao buscar tendências TMDB:", err);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (config || configError) {
      void fetchTrending();
    }

    return () => {
      cancelled = true;
    };
  }, [config, configError]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items]);

  if (loading) {
    return (
      <div className="flex h-[350px] sm:h-[500px] w-full items-center justify-center rounded-2xl border border-border bg-card/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-[250px] sm:h-[320px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card/40 px-6 text-center">
        <Badge className="bg-primary/15 text-primary hover:bg-primary/15">TMDB</Badge>
        <h2 className="text-lg font-bold">Carrossel indisponível no momento</h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          Se a API do TMDB estiver sem resposta, esta área fica segura e não quebra a home.
        </p>
        <Button data-tv-focus type="button" size="sm" variant="outline" onClick={() => navigate({ to: "/filmes" })}>
          <Play className="mr-2 h-4 w-4" /> Ir para Filmes
        </Button>
      </div>
    );
  }

  const current = items[currentIndex];
  const year = (current.release_date || current.first_air_date || "").split("-")[0];
  const searchTerm = (current.title || current.name || "").trim();
  const targetRoute = current.media_type === "movie" ? "/filmes" : "/series";

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-border shadow-2xl bg-black h-[350px] sm:h-[500px] w-full">
      {items.map((item, idx) => (
        <div
          key={item.id}
          className={cn(
            "absolute inset-0 transition-all duration-1000 ease-in-out",
            idx === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105",
          )}
        >
          <div className="absolute inset-0">
            <img
              src={proxyMediaUrl(`https://image.tmdb.org/t/p/original${item.backdrop_path}`) ?? `https://image.tmdb.org/t/p/original${item.backdrop_path}`}
              alt={item.title || item.name || "Conteúdo TMDB"}
              className="h-full w-full object-cover object-top sm:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent hidden sm:block" />
          </div>

          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 sm:pb-16 max-w-3xl">
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary hover:bg-primary font-bold tracking-wider uppercase text-[10px]">
                  {item.media_type === "movie" ? "Filme" : "Série"}
                </Badge>
                {year && <span className="text-xs font-medium text-white/60">{year}</span>}
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs font-bold">{(item.vote_average ?? 0).toFixed(1)}</span>
                </div>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
                {item.title || item.name}
              </h2>

              <p className="text-sm sm:text-base text-white/70 line-clamp-2 sm:line-clamp-3 max-w-xl font-medium leading-relaxed drop-shadow">
                {item.overview}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button
                  data-tv-focus
                  type="button"
                  size="lg"
                  className="rounded-full font-bold px-8 h-12 shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                  onClick={() =>
                    navigate({
                      to: targetRoute,
                      search: searchTerm ? { q: searchTerm } : undefined,
                    })
                  }
                >
                  <Play className="mr-2 h-5 w-5 fill-current" /> ASSISTIR AGORA
                </Button>
                <Button
                  data-tv-focus
                  type="button"
                  variant="outline"
                  size="lg"
                  className="rounded-full bg-white/10 border-white/20 backdrop-blur-md text-white font-bold px-8 h-12 hover:bg-white/20"
                  onClick={() =>
                    navigate({
                      to: targetRoute,
                      search: searchTerm ? { q: searchTerm } : undefined,
                    })
                  }
                >
                  <Info className="mr-2 h-5 w-5" /> DETALHES
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {items.map((_, idx) => (
          <button
            key={idx}
            data-tv-focus
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/30 hover:bg-white/50",
            )}
            aria-label={`Ir para slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
