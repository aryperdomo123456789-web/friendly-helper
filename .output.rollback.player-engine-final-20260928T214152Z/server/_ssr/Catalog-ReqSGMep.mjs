import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { n as useServerFn, t as cn } from "./utils-CxKEs9cN.mjs";
import { a as getPlaybackUrl, n as getChannelEPG, o as getSeriesInfo, r as getEnrichedMetadata, s as getStreams, t as getCategories } from "./player.functions-C7ieQNmO.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { n as getDeviceId, r as usePlayerSession } from "./player-store-Cf6yFwLI.mjs";
import { t as Input } from "./input-C0DgRZ7s.mjs";
import { t as Button } from "./button-CgrLLZKA.mjs";
import { A as LoaderCircle, F as Info, J as CirclePlay, Z as ChevronLeft, c as Tv, l as TriangleAlert, y as Search } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-FovpXyZ6.mjs";
import { t as proxyMediaUrl } from "./media-url-DOzr6FHi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Catalog-ReqSGMep.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VideoPlayer({ url, poster, title, kind }) {
	const videoRef = (0, import_react.useRef)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const video = videoRef.current;
		if (!video || !url) return;
		let destroyed = false;
		let hls = null;
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
					} catch {}
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
				const Hls = (await import("../_libs/hls.js.mjs").then((n) => n.t)).default;
				if (destroyed) return;
				if (Hls.isSupported()) {
					let recoveries = 0;
					let lastStallRecoveryAt = 0;
					const recoverFromStall = () => {
						if (destroyed || !hls) return;
						const now = Date.now();
						if (now - lastStallRecoveryAt < 1500) return;
						lastStallRecoveryAt = now;
						if (video.buffered.length > 0) {
							const end = video.buffered.end(video.buffered.length - 1);
							if (end - video.currentTime < .35) video.currentTime = Math.max(video.currentTime, end - .15);
						}
						hls.startLoad();
						startPlayback(kind === "live");
					};
					hls = new Hls({
						lowLatencyMode: false,
						enableWorker: true,
						progressive: false,
						backBufferLength: 30,
						maxBufferLength: 45,
						maxMaxBufferLength: 120,
						maxBufferSize: 60 * 1e3 * 1e3,
						maxBufferHole: .5,
						liveSyncDurationCount: 4,
						liveMaxLatencyDurationCount: 10,
						maxFragLookUpTolerance: .2,
						nudgeOffset: .1,
						nudgeMaxRetry: 5,
						capLevelToPlayerSize: true,
						capLevelOnFPSDrop: false,
						maxLiveSyncPlaybackRate: 1,
						manifestLoadingMaxRetry: 15,
						levelLoadingMaxRetry: 15,
						fragLoadingMaxRetry: 25,
						fragLoadingTimeOut: 6e4,
						manifestLoadingTimeOut: 6e4
					});
					hls.loadSource(url);
					hls.attachMedia(video);
					hls.on(Hls.Events.MANIFEST_PARSED, () => {
						ready();
						startPlayback(kind === "live");
					});
					hls.on(Hls.Events.LEVEL_LOADED, ready);
					hls.on(Hls.Events.ERROR, (_event, data) => {
						console.error("[player] hls", data.type, data.details, data.fatal);
						if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR || data.details === Hls.ErrorDetails.BUFFER_NUDGE_ON_STALL) {
							recoverFromStall();
							return;
						}
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
						const code = data.response?.code;
						setError(code === 404 || code === 502 ? "Canal indisponível no servidor no momento (fora do ar ou com limite de conexões em uso)." : "Não foi possível iniciar o canal. Tente outro canal ou servidor.");
					});
					video.addEventListener("canplay", ready);
					video.addEventListener("playing", ready);
					video.addEventListener("loadeddata", ready);
					video.addEventListener("waiting", buffer);
					video.addEventListener("stalled", buffer);
					video.addEventListener("error", onError);
					startPlayback(kind === "live");
					return;
				}
			}
			video.src = url;
			video.load();
			startPlayback(kind === "live");
			video.addEventListener("canplay", ready);
			video.addEventListener("playing", ready);
			video.addEventListener("loadeddata", ready);
			video.addEventListener("waiting", buffer);
			video.addEventListener("stalled", buffer);
			video.addEventListener("error", onError);
		}
		start();
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-2xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: videoRef,
				poster: poster ?? void 0,
				controls: true,
				autoPlay: true,
				playsInline: true,
				preload: "auto",
				controlsList: "nodownload noplaybackrate noremoteplayback",
				disablePictureInPicture: true,
				className: "h-full w-full",
				onPlaying: () => setLoading(false),
				onCanPlay: () => setLoading(false),
				onLoadedData: () => setLoading(false),
				onWaiting: () => setLoading(true),
				onStalled: () => setLoading(true),
				onError: () => setError("Fluxo indisponivel neste momento."),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("track", { kind: "captions" })
			}),
			loading && !error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
			}) : null,
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium text-destructive",
					children: error
				}), title ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: title
				}) : null]
			}) : null
		]
	});
}
var LABEL = {
	live: {
		title: "TV ao Vivo",
		list: "Canais",
		empty: "Nenhum canal nesta categoria",
		search: "Pesquisar canal..."
	},
	movie: {
		title: "Filmes",
		list: "Filmes",
		empty: "Nenhum filme nesta categoria",
		search: "Pesquisar filme..."
	},
	series: {
		title: "Séries",
		list: "Séries",
		empty: "Nenhuma série nesta categoria",
		search: "Pesquisar série..."
	}
};
function MarqueeText({ text, active, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("block overflow-hidden whitespace-nowrap text-ellipsis", className),
		title: text,
		children: text
	});
}
function useImagePrefetch(sources, resetKey) {
	const prefetchedSources = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	(0, import_react.useEffect)(() => {
		prefetchedSources.current.clear();
	}, [resetKey]);
	(0, import_react.useEffect)(() => {
		const uniqueSources = Array.from(new Set(sources.filter((source) => Boolean(source)).map((source) => source.trim()).filter(Boolean))).filter((source) => !prefetchedSources.current.has(source));
		if (uniqueSources.length === 0) return;
		let cancelled = false;
		const schedule = typeof window !== "undefined" && "requestIdleCallback" in window ? window.requestIdleCallback.bind(window) : (callback) => window.setTimeout(callback, 0);
		const cancel = typeof window !== "undefined" && "cancelIdleCallback" in window ? window.cancelIdleCallback.bind(window) : window.clearTimeout.bind(window);
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
var CatalogCategoryButton = (0, import_react.memo)(function CatalogCategoryButton({ category, active, onSelect, onHover }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => onSelect(category.category_id),
		onMouseEnter: () => onHover(category.category_id),
		onFocus: () => onHover(category.category_id),
		className: cn("w-full rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background", "group", active ? "bg-primary/20 font-bold text-primary shadow-sm shadow-primary/10" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarqueeText, {
			text: category.category_name,
			active,
			className: "pr-2"
		})
	});
});
var CatalogGridCard = (0, import_react.memo)(function CatalogGridCard({ item, kind, serverId, active, loading, priority, onPrefetch, onActivate, onHover }) {
	const imageUrl = proxyMediaUrl(item.icon, serverId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onMouseEnter: () => onPrefetch(item),
		onMouseEnterCapture: () => onHover?.(item),
		onFocus: () => onPrefetch(item),
		onFocusCapture: () => onHover?.(item),
		onTouchStart: () => onPrefetch(item),
		onClick: () => onActivate(item),
		tabIndex: 0,
		"data-tv-focus": true,
		"aria-label": item.name,
		className: cn("group overflow-hidden rounded-xl border border-border bg-secondary/20 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background", active && "border-primary/60 shadow-lg shadow-primary/10"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("relative flex items-center justify-center overflow-hidden bg-secondary/40", kind === "live" ? "aspect-video" : "aspect-[2/3]"),
			children: [
				imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: imageUrl,
					alt: item.name,
					loading: priority ? "eager" : "lazy",
					fetchPriority: priority ? "high" : "auto",
					decoding: "async",
					className: cn("h-full w-full", kind === "live" ? "object-contain p-3" : "object-cover"),
					onError: (event) => {
						event.currentTarget.style.display = "none";
					}
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tv, { className: "h-8 w-8 text-muted-foreground" }),
				loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "absolute inset-0 m-auto h-8 w-8 animate-spin text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "absolute inset-0 m-auto h-9 w-9 text-primary opacity-0 transition-opacity group-hover:opacity-100" }),
				active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground shadow-lg",
					children: "Reproduzindo"
				}) : null
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-2 py-2 text-xs font-medium",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarqueeText, {
				text: item.name,
				active,
				className: "line-clamp-2"
			})
		})]
	});
});
var CatalogEpisodeButton = (0, import_react.memo)(function CatalogEpisodeButton({ episode, loading, onPrefetch, onActivate }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "secondary",
		className: "w-full justify-start",
		onMouseEnter: () => onPrefetch(episode),
		onFocus: () => onPrefetch(episode),
		onClick: () => onActivate(episode),
		children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "mr-2 h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "truncate",
			children: [
				episode.episode_num,
				". ",
				episode.title
			]
		})]
	});
});
function Catalog({ kind, initialSearch = "", hideHeader = false }) {
	const { serverId, activeServer, blocked, profile } = usePlayerSession();
	const queryClient = useQueryClient();
	const deviceId = getDeviceId();
	const fetchCategories = useServerFn(getCategories);
	const fetchStreams = useServerFn(getStreams);
	const fetchPlayback = useServerFn(getPlaybackUrl);
	const fetchSeries = useServerFn(getSeriesInfo);
	const fetchEPG = useServerFn(getChannelEPG);
	const fetchTMDB = useServerFn(getEnrichedMetadata);
	const [categoryId, setCategoryId] = (0, import_react.useState)(null);
	const [catTerm, setCatTerm] = (0, import_react.useState)("");
	const [term, setTerm] = (0, import_react.useState)(initialSearch);
	const [loadingId, setLoadingId] = (0, import_react.useState)(null);
	const [playing, setPlaying] = (0, import_react.useState)(null);
	const [openSeries, setOpenSeries] = (0, import_react.useState)(null);
	const [pageSize, setPageSize] = (0, import_react.useState)({
		live: 24,
		movie: 24,
		series: 24
	});
	const [currentPage, setCurrentPage] = (0, import_react.useState)({
		live: 1,
		movie: 1,
		series: 1
	});
	const [episodePageSize, setEpisodePageSize] = (0, import_react.useState)({});
	const [episodePage, setEpisodePage] = (0, import_react.useState)({});
	const categoryScrollRef = (0, import_react.useRef)(null);
	const categoryScrollTopRef = (0, import_react.useRef)(0);
	const deferredCatTerm = (0, import_react.useDeferredValue)(catTerm);
	const deferredTerm = (0, import_react.useDeferredValue)(term);
	const playbackCacheKey = (0, import_react.useCallback)((item) => [
		"playback-url",
		serverId,
		kind,
		item.id,
		item.ext ?? "",
		deviceId
	], [
		serverId,
		kind,
		deviceId
	]);
	const playbackQueryFn = (0, import_react.useCallback)((item) => () => fetchPlayback({ data: {
		server_id: serverId,
		kind,
		stream_id: item.id,
		device_id: deviceId,
		...item.ext ? { ext: item.ext } : {}
	} }), [
		fetchPlayback,
		serverId,
		kind,
		deviceId
	]);
	const play = (0, import_react.useCallback)(async (item) => {
		setLoadingId(item.id);
		try {
			const result = await queryClient.fetchQuery({
				queryKey: playbackCacheKey(item),
				queryFn: playbackQueryFn(item),
				staleTime: 1440 * 60 * 1e3
			});
			setPlaying({
				id: item.id,
				url: result.url,
				name: item.name,
				icon: item.icon
			});
			if (typeof window !== "undefined" && window.innerWidth < 1024) {
				window.scrollTo({
					top: 0,
					behavior: "smooth"
				});
				const playerArea = document.getElementById("wp-player-area");
				if (playerArea) playerArea.scrollIntoView({
					behavior: "smooth",
					block: "start"
				});
			}
		} catch (error) {
			const msg = error.message || "";
			if (msg.includes("Limite") || msg.includes("simultanea")) toast.error(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold",
						children: "Acesso em uso!"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: msg }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] opacity-80 italic",
						children: "Sugestão: faça logout em outros dispositivos ou fale com o suporte para aumentar seu limite."
					})
				]
			}), { duration: 6e3 });
			else toast.error(msg || "Não foi possível abrir o conteúdo");
		} finally {
			setLoadingId(null);
		}
	}, [
		queryClient,
		playbackCacheKey,
		playbackQueryFn
	]);
	const prefetchPlayback = (0, import_react.useCallback)((item) => {
		if (!serverId) return;
		queryClient.prefetchQuery({
			queryKey: playbackCacheKey(item),
			queryFn: playbackQueryFn(item),
			staleTime: 1440 * 60 * 1e3
		});
	}, [
		queryClient,
		serverId,
		playbackCacheKey,
		playbackQueryFn
	]);
	const prefetchCategoryStreams = (0, import_react.useCallback)((targetCategoryId) => {
		if (!serverId || !targetCategoryId) return;
		queryClient.prefetchQuery({
			queryKey: [
				"streams",
				kind,
				serverId,
				targetCategoryId
			],
			queryFn: () => fetchStreams({ data: {
				server_id: serverId,
				kind,
				category_id: targetCategoryId
			} }),
			staleTime: 5 * 6e4
		});
	}, [
		queryClient,
		serverId,
		kind,
		fetchStreams
	]);
	const prefetchSeriesInfo = (0, import_react.useCallback)((series) => {
		if (!serverId || kind !== "series") return;
		queryClient.prefetchQuery({
			queryKey: [
				"series-info",
				serverId,
				series.id
			],
			queryFn: () => fetchSeries({ data: {
				server_id: serverId,
				series_id: series.id
			} }),
			staleTime: 10 * 6e4
		});
	}, [
		queryClient,
		serverId,
		kind,
		fetchSeries
	]);
	const activateCatalogItem = (0, import_react.useCallback)((item) => {
		if (kind === "series") {
			setOpenSeries({
				id: item.id,
				name: item.name
			});
			return;
		}
		play(item);
	}, [kind, play]);
	const prefetchEpisodePlayback = (0, import_react.useCallback)((episode) => {
		const seriesName = openSeries?.name ?? "";
		prefetchPlayback({
			id: episode.id,
			name: `${seriesName} - ${episode.episode_num}. ${episode.title}`,
			icon: null,
			ext: episode.ext
		});
	}, [openSeries?.name, prefetchPlayback]);
	const activateEpisode = (0, import_react.useCallback)((episode) => {
		if (!openSeries) return;
		play({
			id: episode.id,
			name: `${openSeries.name} - ${episode.episode_num}. ${episode.title}`,
			icon: null,
			ext: episode.ext
		});
	}, [openSeries, play]);
	const selectCategory = (0, import_react.useCallback)((categoryId) => {
		categoryScrollTopRef.current = categoryScrollRef.current?.scrollTop ?? 0;
		(0, import_react.startTransition)(() => {
			setCategoryId(categoryId);
			setCurrentPage((pages) => ({
				...pages,
				[kind]: 1
			}));
		});
		if (typeof window !== "undefined" && window.innerWidth < 1024) {
			const listArea = document.getElementById("wp-items-area");
			if (listArea) listArea.scrollIntoView({
				behavior: "smooth",
				block: "start"
			});
		}
	}, [kind]);
	(0, import_react.useEffect)(() => {
		setCategoryId(null);
		setCatTerm("");
		setTerm(initialSearch);
		setPlaying(null);
		setOpenSeries(null);
		setCurrentPage((pages) => ({
			...pages,
			[kind]: 1
		}));
		setEpisodePage({});
	}, [
		kind,
		serverId,
		initialSearch,
		queryClient
	]);
	(0, import_react.useEffect)(() => {
		setTerm(initialSearch);
	}, [initialSearch]);
	const categories = useQuery({
		queryKey: [
			"categories",
			kind,
			serverId
		],
		queryFn: () => fetchCategories({ data: {
			server_id: serverId,
			kind
		} }),
		enabled: Boolean(serverId),
		retry: 1,
		staleTime: 10 * 6e4,
		placeholderData: (previous) => previous
	});
	const searchAll = Boolean(initialSearch.trim());
	const activeCategory = searchAll ? null : categoryId;
	const showCategories = !searchAll && !categoryId && !openSeries;
	(0, import_react.useEffect)(() => {
		if (showCategories && categoryScrollRef.current) categoryScrollRef.current.scrollTop = categoryScrollTopRef.current;
	}, [showCategories]);
	const streams = useQuery({
		queryKey: [
			"streams",
			kind,
			serverId,
			activeCategory
		],
		queryFn: () => fetchStreams({ data: {
			server_id: serverId,
			kind,
			...activeCategory ? { category_id: activeCategory } : {}
		} }),
		enabled: Boolean(serverId) && (Boolean(activeCategory) || searchAll),
		retry: 1,
		staleTime: 5 * 6e4,
		placeholderData: (previous) => previous
	});
	const seriesInfo = useQuery({
		queryKey: [
			"series-info",
			serverId,
			openSeries?.id
		],
		queryFn: () => fetchSeries({ data: {
			server_id: serverId,
			series_id: openSeries.id
		} }),
		enabled: Boolean(serverId && openSeries?.id),
		retry: 1,
		placeholderData: (previous) => previous
	});
	(0, import_react.useEffect)(() => {
		if (!openSeries?.id) return;
		setEpisodePage((pages) => ({
			...pages,
			[openSeries.id]: 1
		}));
	}, [openSeries?.id]);
	const visibleCategories = (0, import_react.useMemo)(() => {
		const list = categories.data ?? [];
		if (!deferredCatTerm.trim()) return list;
		const needle = deferredCatTerm.trim().toLowerCase();
		return list.filter((item) => item.category_name.toLowerCase().includes(needle));
	}, [categories.data, deferredCatTerm]);
	(0, import_react.useEffect)(() => {
		if (!serverId || categories.isLoading || categories.isError) return;
		const warmTargets = visibleCategories.slice(0, 2);
		for (const category of warmTargets) {
			if (category.category_id === activeCategory) continue;
			prefetchCategoryStreams(category.category_id);
		}
	}, [
		serverId,
		categories.isLoading,
		categories.isError,
		visibleCategories,
		activeCategory,
		prefetchCategoryStreams
	]);
	const filtered = (0, import_react.useMemo)(() => {
		const list = streams.data ?? [];
		if (!deferredTerm.trim()) return list;
		const needle = deferredTerm.trim().toLowerCase();
		return list.filter((item) => item.name.toLowerCase().includes(needle));
	}, [streams.data, deferredTerm]);
	const currentEpisodeGroups = (0, import_react.useMemo)(() => {
		return (seriesInfo.data?.seasons ?? []).map((season) => {
			const size = episodePageSize[season.season] ?? 12;
			const total = season.episodes.length;
			const totalPagesForSeason = Math.max(1, Math.ceil(total / size));
			const safeSeasonPage = Math.min(episodePage[season.season] ?? 1, totalPagesForSeason);
			return {
				season,
				size,
				total,
				totalPagesForSeason,
				safeSeasonPage,
				start: total === 0 ? 0 : (safeSeasonPage - 1) * size + 1,
				end: Math.min(safeSeasonPage * size, total),
				pages: (() => {
					const windowSize = 5;
					if (totalPagesForSeason <= windowSize) return Array.from({ length: totalPagesForSeason }, (_, index) => index + 1);
					const startPage = Math.max(1, Math.min(safeSeasonPage - 2, totalPagesForSeason - (windowSize - 1)));
					const endPage = Math.min(totalPagesForSeason, startPage + windowSize - 1);
					return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
				})(),
				items: season.episodes.slice((safeSeasonPage - 1) * size, safeSeasonPage * size)
			};
		});
	}, [
		episodePage,
		episodePageSize,
		seriesInfo.data?.seasons
	]);
	(0, import_react.useEffect)(() => {
		setCurrentPage((pages) => ({
			...pages,
			[kind]: 1
		}));
	}, [
		kind,
		activeCategory,
		term,
		activeServer?.id
	]);
	const totalItems = filtered.length;
	const activePageSize = pageSize[kind];
	const totalPages = Math.max(1, Math.ceil(totalItems / activePageSize));
	const safePage = Math.min(currentPage[kind], totalPages);
	const pageStart = totalItems === 0 ? 0 : (safePage - 1) * activePageSize + 1;
	const pageEnd = Math.min(safePage * activePageSize, totalItems);
	const paginatedItems = (0, import_react.useMemo)(() => filtered.slice((safePage - 1) * activePageSize, safePage * activePageSize), [
		filtered,
		safePage,
		activePageSize
	]);
	const warmPlaybackItems = (0, import_react.useMemo)(() => paginatedItems.slice(0, kind === "live" ? 3 : 4), [kind, paginatedItems]);
	const pageImageSources = (0, import_react.useMemo)(() => paginatedItems.slice(0, 4).map((item) => proxyMediaUrl(item.icon, serverId)), [paginatedItems, serverId]);
	const paginationPages = (0, import_react.useMemo)(() => {
		const windowSize = 5;
		if (totalPages <= windowSize) return Array.from({ length: totalPages }, (_, index) => index + 1);
		const start = Math.max(1, Math.min(safePage - 2, totalPages - (windowSize - 1)));
		const end = Math.min(totalPages, start + windowSize - 1);
		return Array.from({ length: end - start + 1 }, (_, index) => start + index);
	}, [safePage, totalPages]);
	(0, import_react.useEffect)(() => {
		if (currentPage[kind] > totalPages) setCurrentPage((pages) => ({
			...pages,
			[kind]: totalPages
		}));
	}, [
		currentPage,
		kind,
		totalPages
	]);
	useImagePrefetch(pageImageSources, `${serverId ?? "no-server"}:${kind}`);
	(0, import_react.useEffect)(() => {
		if (!serverId || openSeries || streams.isLoading || streams.isError) return;
		if (!warmPlaybackItems.length) return;
		for (const item of warmPlaybackItems) if (kind === "series") prefetchSeriesInfo({
			id: item.id,
			name: item.name
		});
		else prefetchPlayback(item);
	}, [
		serverId,
		kind,
		openSeries,
		streams.isLoading,
		streams.isError,
		warmPlaybackItems,
		prefetchPlayback,
		prefetchSeriesInfo
	]);
	const visibleEpisodes = (0, import_react.useMemo)(() => openSeries ? currentEpisodeGroups.flatMap(({ items }) => items).slice(0, 4) : [], [currentEpisodeGroups, openSeries]);
	(0, import_react.useEffect)(() => {
		if (!openSeries || !serverId || seriesInfo.isLoading || seriesInfo.isError) return;
		if (!visibleEpisodes.length) return;
		for (const episode of visibleEpisodes) prefetchEpisodePlayback(episode);
	}, [
		openSeries,
		serverId,
		seriesInfo.isLoading,
		seriesInfo.isError,
		visibleEpisodes,
		prefetchEpisodePlayback
	]);
	if (!serverId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground",
		children: "Nenhum servidor liberado para este acesso."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-auto min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden lg:h-full",
		children: [
			blocked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "animate-in fade-in slide-in-from-top-4 rounded-xl border border-destructive/50 bg-destructive/10 p-4 mb-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-5 w-5 text-destructive shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 space-y-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-bold text-destructive",
								children: "Conexão bloqueada"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-destructive/80 leading-relaxed",
								children: [blocked, ". Se voce esta tentando conectar em um novo dispositivo, certifique-se de ter encerrado a sessao nos outros."]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pt-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									className: "h-7 text-[10px] border-destructive/30 hover:bg-destructive/20 text-destructive",
									onClick: () => window.location.href = "/conta",
									children: "Ver Planos / Suporte"
								})
							})
						]
					})]
				})
			}),
			!hideHeader ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-none flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-w-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "truncate text-xl font-bold sm:text-2xl",
						children: LABEL[kind].title
					})
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid flex-none min-h-0 min-w-0 gap-4 lg:flex-1 lg:grid-cols-[minmax(300px,38%)_minmax(0,1fr)]",
				children: [
					showCategories ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "order-2 flex h-auto min-h-0 min-w-0 flex-col rounded-xl border border-border bg-card p-3 lg:order-none lg:h-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "px-2 pb-2 text-sm font-semibold",
								children: "Categorias"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative px-1 pb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: catTerm,
									onChange: (event) => setCatTerm(event.target.value),
									placeholder: "Pesquisar categoria...",
									className: "h-9 pl-9"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								ref: categoryScrollRef,
								className: "wp-scroll flex-1 min-h-0 space-y-1 overflow-y-auto",
								children: [categories.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex justify-center p-6",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-5 w-5 animate-spin text-primary" })
								}) : categories.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive",
									children: "Não foi possível carregar as categorias."
								}) : visibleCategories.map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatalogCategoryButton, {
									category,
									active: activeCategory === category.category_id,
									onSelect: selectCategory,
									onHover: prefetchCategoryStreams
								}, category.category_id)), !categories.isLoading && visibleCategories.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "p-4 text-xs text-muted-foreground",
									children: categories.error ? "Falha ao consultar o servidor." : "Sem categorias."
								}) : null]
							})
						]
					}) : null,
					!showCategories ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "order-2 flex h-auto min-h-0 min-w-0 flex-col rounded-xl border border-border bg-card p-3 lg:order-none lg:h-full",
						children: openSeries ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 px-1 pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "icon",
								variant: "secondary",
								className: "h-8 w-8 shrink-0",
								onClick: () => setOpenSeries(null),
								"aria-label": "Voltar",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-bold uppercase tracking-tight",
								children: openSeries.name
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "wp-scroll flex-1 min-h-0 space-y-3 overflow-y-auto px-1 pb-4",
							children: seriesInfo.isLoading && !seriesInfo.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex justify-center p-8",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" })
							}) : seriesInfo.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive",
								children: ["Não foi possível carregar os episódios desta série.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "pt-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "sm",
										className: "h-8 border-destructive/30 text-destructive hover:bg-destructive/20",
										onClick: () => void seriesInfo.refetch(),
										children: "Tentar novamente"
									})
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								seriesInfo.data?.info?.plot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: seriesInfo.data.info.plot
								}) : null,
								seriesInfo.isFetching && seriesInfo.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-primary",
									children: "Atualizando temporadas e episódios..."
								}) : null,
								currentEpisodeGroups.map(({ season, size, total, totalPagesForSeason, safeSeasonPage, start, end, pages, items }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 rounded-xl border border-border/60 bg-secondary/10 p-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap items-center justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs font-semibold text-primary",
												children: ["Temporada ", season.season]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-[10px] text-muted-foreground",
												children: [
													"Mostrando ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-primary",
														children: start
													}),
													" a",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-primary",
														children: end
													}),
													" de",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold",
														children: total
													}),
													" episódios"
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-[140px]",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: String(size),
													onValueChange: (value) => (0, import_react.startTransition)(() => {
														setEpisodePageSize((sizes) => ({
															...sizes,
															[season.season]: Number(value)
														}));
														setEpisodePage((pagesMap) => ({
															...pagesMap,
															[season.season]: 1
														}));
													}),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
														className: "h-8",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "12" })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
														6,
														12,
														24
													].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
														value: String(value),
														children: [value, " por página"]
													}, value)) })]
												})
											}), totalPagesForSeason > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center gap-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														size: "sm",
														variant: "outline",
														className: "h-11 px-2.5 text-[10px] sm:h-8",
														onClick: () => (0, import_react.startTransition)(() => setEpisodePage((pagesMap) => ({
															...pagesMap,
															[season.season]: 1
														}))),
														disabled: safeSeasonPage === 1,
														children: "Primeira"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														size: "sm",
														variant: "outline",
														className: "h-11 px-2.5 text-[10px] sm:h-8",
														onClick: () => (0, import_react.startTransition)(() => setEpisodePage((pagesMap) => ({
															...pagesMap,
															[season.season]: Math.max(1, (pagesMap[season.season] ?? 1) - 1)
														}))),
														disabled: safeSeasonPage === 1,
														children: "Anterior"
													}),
													pages.map((page) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														size: "sm",
														variant: page === safeSeasonPage ? "default" : "outline",
														className: "h-11 min-w-11 px-2.5 text-[10px] sm:h-8 sm:min-w-8",
														onClick: () => (0, import_react.startTransition)(() => setEpisodePage((pagesMap) => ({
															...pagesMap,
															[season.season]: page
														}))),
														children: page
													}, page)),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														size: "sm",
														variant: "outline",
														className: "h-11 px-2.5 text-[10px] sm:h-8",
														onClick: () => (0, import_react.startTransition)(() => setEpisodePage((pagesMap) => ({
															...pagesMap,
															[season.season]: Math.min(totalPagesForSeason, (pagesMap[season.season] ?? 1) + 1)
														}))),
														disabled: safeSeasonPage === totalPagesForSeason,
														children: "Próxima"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														size: "sm",
														variant: "outline",
														className: "h-11 px-2.5 text-[10px] sm:h-8",
														onClick: () => (0, import_react.startTransition)(() => setEpisodePage((pagesMap) => ({
															...pagesMap,
															[season.season]: totalPagesForSeason
														}))),
														disabled: safeSeasonPage === totalPagesForSeason,
														children: "Última"
													})
												]
											}) : null]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "space-y-1",
											children: items.map((episode) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatalogEpisodeButton, {
												episode,
												loading: loadingId === episode.id,
												onPrefetch: prefetchEpisodePlayback,
												onActivate: activateEpisode
											}, episode.id))
										})
									]
								}, season.season))
							] })
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 border-b border-border/60 px-1 pb-3",
								children: [!searchAll ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "ghost",
									className: "h-8 shrink-0 gap-1 px-2 text-xs",
									onClick: () => setCategoryId(null),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" }), "Voltar para Categorias"]
								}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm font-bold uppercase tracking-tight",
									children: searchAll ? `Busca em ${LABEL[kind].title}` : categories.data?.find((category) => category.category_id === activeCategory)?.category_name ?? LABEL[kind].list
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative px-1 pb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: term,
									onChange: (event) => setTerm(event.target.value),
									placeholder: LABEL[kind].search,
									className: "h-9 pl-9"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-3 px-1 pb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted-foreground",
									children: [
										"Mostrando ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-primary",
											children: pageStart
										}),
										" a",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-primary",
											children: pageEnd
										}),
										" de",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold",
											children: totalItems
										}),
										" itens"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-[150px]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: String(activePageSize),
										onValueChange: (value) => (0, import_react.startTransition)(() => {
											setPageSize((pages) => ({
												...pages,
												[kind]: Number(value)
											}));
											setCurrentPage((pages) => ({
												...pages,
												[kind]: 1
											}));
										}),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "h-9",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "24" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
											12,
											24,
											48
										].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
											value: String(value),
											children: [value, " por página"]
										}, value)) })]
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								id: "wp-items-area",
								className: "wp-scroll flex-1 min-h-0 overflow-y-auto px-1 pb-4",
								children: streams.isLoading && !streams.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex justify-center p-16",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" })
								}) : streams.isError && !streams.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive",
									children: ["Não foi possível carregar os conteúdos deste servidor no momento.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "pt-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											size: "sm",
											className: "h-8 border-destructive/30 text-destructive hover:bg-destructive/20",
											onClick: () => void streams.refetch(),
											children: "Tentar novamente"
										})
									})]
								}) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "p-8 text-center text-sm text-muted-foreground",
									children: LABEL[kind].empty
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [streams.isFetching ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-[11px] text-primary",
										children: "Atualizando catálogo..."
									}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: cn("grid gap-2 transition-opacity duration-150", kind === "live" ? "grid-cols-2 xl:grid-cols-3" : "grid-cols-2 xl:grid-cols-4", streams.isFetching && streams.data?.length ? "opacity-80" : "opacity-100"),
										children: paginatedItems.map((item, index) => {
											const isActiveItem = playing?.id === item.id;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatalogGridCard, {
												item,
												kind,
												serverId,
												active: isActiveItem,
												loading: loadingId === item.id,
												priority: index < 4,
												onPrefetch: prefetchPlayback,
												onActivate: activateCatalogItem,
												onHover: kind === "series" ? prefetchSeriesInfo : void 0
											}, `${item.id}-${item.name}`);
										})
									})]
								})
							}),
							totalPages > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-1 pt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted-foreground",
									children: [
										"Página ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-foreground",
											children: safePage
										}),
										" de",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-foreground",
											children: totalPages
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "sm",
											className: "h-11 px-3 text-xs sm:h-8",
											onClick: () => (0, import_react.startTransition)(() => setCurrentPage((pages) => ({
												...pages,
												[kind]: 1
											}))),
											disabled: safePage === 1,
											children: "Primeira"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "sm",
											className: "h-11 px-3 text-xs sm:h-8",
											onClick: () => (0, import_react.startTransition)(() => setCurrentPage((pages) => ({
												...pages,
												[kind]: Math.max(1, pages[kind] - 1)
											}))),
											disabled: safePage === 1,
											children: "Anterior"
										}),
										paginationPages.map((page) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											size: "sm",
											variant: page === safePage ? "default" : "outline",
											className: "h-11 min-w-11 px-3 text-xs sm:h-8 sm:min-w-9",
											onClick: () => (0, import_react.startTransition)(() => setCurrentPage((pages) => ({
												...pages,
												[kind]: page
											}))),
											children: page
										}, page)),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "sm",
											className: "h-11 px-3 text-xs sm:h-8",
											onClick: () => (0, import_react.startTransition)(() => setCurrentPage((pages) => ({
												...pages,
												[kind]: Math.min(totalPages, pages[kind] + 1)
											}))),
											disabled: safePage === totalPages,
											children: "Próxima"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "sm",
											className: "h-11 px-3 text-xs sm:h-8",
											onClick: () => (0, import_react.startTransition)(() => setCurrentPage((pages) => ({
												...pages,
												[kind]: totalPages
											}))),
											disabled: safePage === totalPages,
											children: "Última"
										})
									]
								})]
							}) : null
						] })
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "wp-player-area",
						className: "order-1 min-w-0 lg:order-none lg:sticky lg:top-0 lg:h-full lg:max-h-full lg:overflow-hidden lg:pr-1 lg:self-start lg:w-full",
						children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex h-full min-h-0 flex-col gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPlayer, {
									url: playing.url,
									poster: proxyMediaUrl(playing.icon, serverId) ?? playing.icon,
									title: playing.name,
									kind
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "shrink-0 truncate text-sm font-semibold",
									children: playing.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "min-h-0 flex-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerInfo, {
										streamId: playing.id,
										kind,
										name: playing.name,
										fetchEPG,
										fetchTMDB
									})
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "h-10 w-10 text-primary/50" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold",
									children: kind === "live" ? "Selecione um canal" : "Selecione um conteúdo"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "px-6 text-xs text-muted-foreground",
									children: "O player abre aqui ao lado, com navegação integrada."
								})
							]
						})
					})
				]
			})
		]
	});
}
function PlayerInfo({ streamId, kind, name, fetchEPG, fetchTMDB }) {
	const { serverId } = usePlayerSession();
	const epg = useQuery({
		queryKey: [
			"epg",
			serverId,
			streamId
		],
		queryFn: () => fetchEPG({ data: {
			server_id: serverId,
			stream_id: streamId
		} }),
		enabled: kind === "live" && !!serverId && !!streamId,
		staleTime: 6e4,
		placeholderData: (previous) => previous
	});
	const tmdb = useQuery({
		queryKey: [
			"tmdb",
			name,
			kind
		],
		queryFn: () => fetchTMDB({ data: {
			kind,
			name
		} }),
		enabled: (kind === "movie" || kind === "series") && !!name,
		staleTime: 1440 * 60 * 1e3,
		placeholderData: (previous) => previous
	});
	if (kind === "live") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col space-y-2 rounded-xl border border-border bg-card/50 p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
			className: "text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "h-3 w-3" }), " Programação EPG"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "wp-scroll min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1",
			children: epg.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-muted-foreground" })
			}) : (epg.data ?? []).length > 0 ? epg.data.slice(0, 5).map((prog, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("min-w-0 border-l-2 py-1 pl-2 text-[11px]", i === 0 ? "border-primary bg-primary/5" : "border-muted"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-start justify-between gap-2 font-bold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "min-w-0 break-words",
						children: prog.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 text-[10px] text-muted-foreground",
						children: prog.start.split(" ")[1]
					})]
				}), prog.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-0.5 break-words text-muted-foreground line-clamp-3",
					children: prog.description
				})]
			}, i)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] text-muted-foreground text-center py-2 italic",
				children: "Sem guia de programação disponível para este canal."
			})
		})]
	});
	if (tmdb.data) {
		const data = tmdb.data;
		const rating = data.vote_average ? Math.round(data.vote_average * 10) / 10 : null;
		const posterUrl = data.poster_path ? proxyMediaUrl(`https://image.tmdb.org/t/p/w300${data.poster_path}`) : null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-xl border border-border bg-card/50 p-3 space-y-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-3",
				children: [posterUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: posterUrl,
					className: "w-20 sm:w-24 rounded-lg shadow-2xl border border-primary/20 ring-1 ring-white/10",
					alt: "Poster TMDB",
					loading: "lazy"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 space-y-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-bold leading-tight",
								children: data.title || data.name
							}), rating && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "bg-yellow-500/20 text-yellow-500 text-[10px] px-1.5 py-0.5 rounded font-black",
								children: ["⭐ ", rating]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[10px] text-muted-foreground",
							children: [
								data.release_date?.split("-")[0] || data.first_air_date?.split("-")[0],
								" • ",
								data.genres?.map((g) => g.name).join(", ")
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-muted-foreground line-clamp-4 leading-relaxed mt-1",
							children: data.overview || "Sem sinopse disponível."
						})
					]
				})]
			})
		});
	}
	return null;
}
//#endregion
export { Catalog as t };
