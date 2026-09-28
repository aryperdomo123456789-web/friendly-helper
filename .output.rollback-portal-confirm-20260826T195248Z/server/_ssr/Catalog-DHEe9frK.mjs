import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { K as CirclePlay, N as Info, O as LoaderCircle, Y as ChevronLeft, c as Tv, l as TriangleAlert, y as Search } from "../_libs/lucide-react.mjs";
import { l as useServerFn, s as cn } from "./router-TbbkYafm.mjs";
import { a as getPlaybackUrl, l as recordPlaybackTelemetry, n as getChannelEPG, o as getSeriesInfo, r as getEnrichedMetadata, s as getStreams, t as getCategories } from "./player.functions-By3APCJ0.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { n as getDeviceId, r as usePlayerSession } from "./player-store-CtR0JOH1.mjs";
import { t as Input } from "./input-947ctaEy.mjs";
import { t as Button } from "./button-CGP0JvU9.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-sfd73k0s.mjs";
import { t as proxyMediaUrl } from "./media-url-DOzr6FHi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Catalog-DHEe9frK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MAX_EVENT_BATCH = 20;
var MAX_QUEUE_SIZE = 60;
var MAX_REASON_LENGTH = 80;
function sanitizePlaybackErrorCode(value) {
	return String(value ?? "").trim().toLowerCase().replace(/https?:\/\/[^\s]+/gi, "url").replace(/(token|password|senha|username|usuario)\s*[=:]\s*[^\s,;]+/gi, "$1=[redacted]").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64) || "unknown";
}
function sanitizePlaybackReason(value) {
	return String(value ?? "").trim().replace(/https?:\/\/[^\s]+/gi, "[url]").replace(/(token|password|senha|username|usuario)\s*[=:]\s*[^\s,;]+/gi, "$1=[redacted]").slice(0, MAX_REASON_LENGTH) || void 0;
}
function clampNonNegative(value, maximum) {
	if (value === void 0 || !Number.isFinite(value)) return void 0;
	return Math.min(maximum, Math.max(0, Math.round(value)));
}
function createPlaybackSessionId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
	return `playback-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
function createPlaybackTelemetry(options) {
	const now = options.now ?? (() => Date.now());
	const startedAt = now();
	let queue = [];
	let firstFrameMs = null;
	let bufferStartedAt = null;
	let rebufferCount = 0;
	let rebufferDurationMs = 0;
	let sending = false;
	let destroyed = false;
	let timer = null;
	const relativeNow = () => Math.max(0, Math.round(now() - startedAt));
	const record = (name, details = {}) => {
		if (destroyed) return;
		const event = {
			name,
			at_ms: relativeNow()
		};
		if (details.duration_ms !== void 0) {
			const durationMs = clampNonNegative(details.duration_ms, 864e5);
			if (durationMs !== void 0) event.duration_ms = durationMs;
		}
		if (details.buffer_seconds !== void 0) {
			const bufferSeconds = clampNonNegative(details.buffer_seconds * 1e3, 864e5);
			if (bufferSeconds !== void 0) event.buffer_seconds = bufferSeconds / 1e3;
		}
		if (details.latency_ms !== void 0) {
			const latencyMs = clampNonNegative(details.latency_ms, 864e5);
			if (latencyMs !== void 0) event.latency_ms = latencyMs;
		}
		if (details.bitrate !== void 0) {
			const bitrate = clampNonNegative(details.bitrate, 1e9);
			if (bitrate !== void 0) event.bitrate = bitrate;
		}
		if (details.level !== void 0) {
			const level = clampNonNegative(details.level, 1e4);
			if (level !== void 0) event.level = level;
		}
		if (details.fatal !== void 0) event.fatal = details.fatal;
		if (details.recovery_attempt !== void 0) event.recovery_attempt = details.recovery_attempt;
		if (details.error_code !== void 0) event.error_code = sanitizePlaybackErrorCode(details.error_code);
		if (details.reason !== void 0) {
			const reason = sanitizePlaybackReason(details.reason);
			if (reason) event.reason = reason;
		}
		queue.push(event);
		if (queue.length > MAX_QUEUE_SIZE) queue = queue.slice(-60);
		if (queue.length >= MAX_EVENT_BATCH) flush();
	};
	const markFirstFrame = (details = {}) => {
		if (firstFrameMs !== null) return;
		firstFrameMs = relativeNow();
		record("first_frame", {
			...details,
			duration_ms: firstFrameMs
		});
	};
	const markBufferStart = (details = {}) => {
		if (bufferStartedAt !== null) return;
		bufferStartedAt = now();
		rebufferCount += 1;
		record("buffer_start", details);
	};
	const markBufferEnd = (details = {}) => {
		if (bufferStartedAt === null) return;
		const duration = Math.max(0, Math.round(now() - bufferStartedAt));
		rebufferDurationMs += duration;
		bufferStartedAt = null;
		record("buffer_end", {
			...details,
			duration_ms: duration
		});
	};
	const flush = async () => {
		if (sending || queue.length === 0 || destroyed) return;
		sending = true;
		const events = queue.splice(0, MAX_EVENT_BATCH);
		try {
			await options.send({
				session_id: options.sessionId,
				server_id: options.serverId,
				kind: options.kind,
				engine: options.engine,
				events
			});
		} catch {
			queue = [...events, ...queue].slice(-60);
		} finally {
			sending = false;
		}
	};
	if (typeof window !== "undefined") timer = setInterval(() => void flush(), options.flushIntervalMs ?? 1e4);
	return {
		record,
		markFirstFrame,
		markBufferStart,
		markBufferEnd,
		flush,
		summary() {
			return {
				first_frame_ms: firstFrameMs,
				startup_success: firstFrameMs !== null,
				rebuffer_count: rebufferCount,
				rebuffer_duration_ms: rebufferDurationMs,
				event_count: queue.length
			};
		},
		async destroy(reason) {
			if (destroyed) return;
			const reasonDetails = reason ? { reason } : {};
			if (bufferStartedAt !== null) markBufferEnd(reasonDetails);
			record("destroyed", reasonDetails);
			destroyed = true;
			if (timer) clearInterval(timer);
			const events = queue.splice(0, MAX_EVENT_BATCH);
			if (events.length > 0) try {
				await options.send({
					session_id: options.sessionId,
					server_id: options.serverId,
					kind: options.kind,
					engine: options.engine,
					events
				});
			} catch {}
		}
	};
}
function getBufferedSeconds(video) {
	if (!Number.isFinite(video.currentTime) || video.buffered.length === 0) return void 0;
	for (let index = 0; index < video.buffered.length; index += 1) {
		const start = video.buffered.start(index);
		const end = video.buffered.end(index);
		if (video.currentTime >= start && video.currentTime <= end) return Math.max(0, Math.min(86400, end - video.currentTime));
	}
}
function getLiveLatency(video) {
	if (!Number.isFinite(video.currentTime)) return void 0;
	const seekable = video.seekable;
	if (seekable.length === 0) return void 0;
	const liveEdge = seekable.end(seekable.length - 1);
	return Math.max(0, Math.round((liveEdge - video.currentTime) * 1e3));
}
function VideoPlayer({ url, serverId, poster, title, kind = "movie" }) {
	const videoRef = (0, import_react.useRef)(null);
	const sendTelemetry = useServerFn(recordPlaybackTelemetry);
	const [error, setError] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const video = videoRef.current;
		if (!video || !url || !serverId) return;
		let destroyed = false;
		let hls = null;
		let recoveryTimer = null;
		let recoveryAttempts = 0;
		let hasStartedPlaying = false;
		let hasReportedPlaying = false;
		const telemetry = createPlaybackTelemetry({
			sessionId: createPlaybackSessionId(),
			serverId,
			kind,
			engine: video.canPlayType("application/vnd.apple.mpegurl") !== "" ? "native" : "hls.js",
			send: async (batch) => {
				await sendTelemetry({ data: batch });
			}
		});
		const currentDetails = () => {
			const details = {};
			const bufferSeconds = getBufferedSeconds(video);
			const latencyMs = kind === "live" ? getLiveLatency(video) : void 0;
			if (bufferSeconds !== void 0) details.buffer_seconds = bufferSeconds;
			if (latencyMs !== void 0) details.latency_ms = latencyMs;
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
			if (recoveryAttempts > 0) telemetry.record("recover_success", {
				...currentDetails(),
				recovery_attempt: recoveryAttempts
			});
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
			telemetry.record("ended", {
				reason: "media_ended",
				...currentDetails()
			});
			telemetry.flush();
		};
		const onNativeError = () => {
			if (destroyed) return;
			telemetry.record("fatal_error", {
				error_code: "native_media_error",
				fatal: true,
				reason: "native_playback_error",
				...currentDetails()
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
					reason: "browser_requires_user_gesture"
				});
				if (allowMutedFallback && !video.muted) {
					video.muted = true;
					try {
						await video.play();
					} catch {}
				}
			}
		};
		const start = async () => {
			telemetry.record("startup_requested");
			const isHls = url.includes(".m3u8") || url.includes("hls=1");
			const nativeHls = video.canPlayType("application/vnd.apple.mpegurl") !== "";
			if (isHls && !nativeHls) {
				const Hls = (await import("../_libs/hls.js.mjs").then((n) => n.t)).default;
				if (destroyed) return;
				if (Hls.isSupported()) {
					hls = new Hls({
						lowLatencyMode: false,
						enableWorker: true,
						backBufferLength: 90,
						maxBufferLength: 30,
						maxMaxBufferLength: 120,
						maxBufferHole: .5,
						liveSyncDurationCount: 3,
						liveMaxLatencyDurationCount: 8,
						manifestLoadingMaxRetry: 15,
						levelLoadingMaxRetry: 15,
						fragLoadingMaxRetry: 25,
						fragLoadingTimeOut: 6e4,
						manifestLoadingTimeOut: 6e4
					});
					hls.attachMedia(video);
					hls.loadSource(url);
					hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
						const manifestDetails = currentDetails();
						const levelCount = Array.isArray(data.levels) ? data.levels.length : void 0;
						if (levelCount !== void 0) manifestDetails.level = levelCount;
						telemetry.record("manifest_loaded", manifestDetails);
						ready();
						startPlayback(kind === "live");
					});
					hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
						const details = data.details;
						const levelDetails = currentDetails();
						if (details?.latency !== void 0) levelDetails.latency_ms = details.latency * 1e3;
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
							...currentDetails()
						});
						if (recoveryAttempts >= 2) {
							const code = data.response?.code;
							setError(code === 404 || code === 502 ? "Canal indisponível no servidor no momento. Tente outro canal ou portal." : "Não foi possível iniciar o canal. Tente novamente ou escolha outro portal.");
							return;
						}
						if (data.type === Hls.ErrorTypes.MEDIA_ERROR || data.type === Hls.ErrorTypes.NETWORK_ERROR) {
							recoveryAttempts += 1;
							telemetry.record("recover_attempt", {
								recovery_attempt: recoveryAttempts,
								error_code: errorCode
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
			startPlayback(kind === "live");
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
		start().catch(() => {
			if (destroyed) return;
			telemetry.record("fatal_error", {
				error_code: "player_initialization_error",
				fatal: true,
				reason: "engine_initialization_failed"
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
			telemetry.destroy("component_unmount");
		};
	}, [
		kind,
		sendTelemetry,
		serverId,
		url
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-2xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: videoRef,
				poster: poster ?? void 0,
				controls: true,
				autoPlay: true,
				playsInline: true,
				preload: "metadata",
				controlsList: "nodownload noplaybackrate noremoteplayback",
				disablePictureInPicture: true,
				"aria-label": title ?? "Reprodutor de vídeo",
				className: "h-full w-full",
				onPlaying: () => setLoading(false),
				onCanPlay: () => setLoading(false),
				onLoadedData: () => setLoading(false),
				onWaiting: () => setLoading(true),
				onStalled: () => setLoading(true),
				onError: () => setError("Fluxo indisponível neste momento.")
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
var CatalogGridCard = (0, import_react.memo)(function CatalogGridCard({ item, kind, serverId, active, loading, priority, onActivate, onHover }) {
	const imageUrl = proxyMediaUrl(item.icon, serverId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onMouseEnter: () => onHover?.(item),
		onFocus: () => onHover?.(item),
		onClick: () => onActivate(item),
		tabIndex: 0,
		"data-tv-focus": true,
		"aria-label": item.name,
		className: cn("group overflow-hidden rounded-xl border border-border bg-secondary/20 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background", active && "border-primary/60 shadow-lg shadow-primary/10"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("relative flex items-center justify-center overflow-hidden bg-secondary/40", kind === "live" ? "aspect-video" : "aspect-[2/3]"),
			children: [imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: imageUrl,
				alt: item.name,
				loading: priority ? "eager" : "lazy",
				fetchPriority: priority ? "high" : "auto",
				decoding: "async",
				className: cn("h-full w-full", kind === "live" ? "object-contain p-3" : "object-cover"),
				onError: (event) => {
					event.currentTarget.style.display = "none";
				}
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tv, { className: "h-8 w-8 text-muted-foreground" }), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "absolute inset-0 m-auto h-8 w-8 animate-spin text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "absolute inset-0 m-auto h-9 w-9 text-primary opacity-0 transition-opacity group-hover:opacity-100" })]
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
var CatalogEpisodeButton = (0, import_react.memo)(function CatalogEpisodeButton({ episode, loading, onActivate }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "secondary",
		className: "w-full justify-start",
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
				staleTime: 864e5
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
			staleTime: 3e5
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
			staleTime: 6e5
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
		staleTime: 6e5,
		placeholderData: (previous) => previous
	});
	const activeCategory = Boolean(initialSearch.trim()) ? null : categoryId ?? categories.data?.[0]?.category_id ?? null;
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
		enabled: Boolean(serverId) && (kind === "live" ? Boolean(activeCategory) : true),
		retry: 1,
		staleTime: 3e5,
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
					const startPage = Math.max(1, Math.min(safeSeasonPage - 2, totalPagesForSeason - 4));
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
	const pageImageSources = (0, import_react.useMemo)(() => paginatedItems.slice(0, 4).map((item) => proxyMediaUrl(item.icon, serverId)), [paginatedItems, serverId]);
	const paginationPages = (0, import_react.useMemo)(() => {
		const windowSize = 5;
		if (totalPages <= windowSize) return Array.from({ length: totalPages }, (_, index) => index + 1);
		const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
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
	if (!serverId) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground",
		children: "Nenhum servidor liberado para este acesso."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 w-full min-w-0 flex-col gap-4 overflow-hidden",
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
				className: "grid flex-1 min-h-0 min-w-0 gap-4 lg:grid-cols-[284px_minmax(0,1.14fr)_minmax(360px,420px)] xl:grid-cols-[284px_minmax(0,1.22fr)_minmax(340px,400px)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-border bg-card p-2",
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
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-border bg-card p-2",
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
														className: "h-8 px-2.5 text-[10px]",
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
														className: "h-8 px-2.5 text-[10px]",
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
														className: "h-8 min-w-8 px-2.5 text-[10px]",
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
														className: "h-8 px-2.5 text-[10px]",
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
														className: "h-8 px-2.5 text-[10px]",
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
												onActivate: activateEpisode
											}, episode.id))
										})
									]
								}, season.season))
							] })
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "px-2 pb-2 text-sm font-semibold",
								children: LABEL[kind].list
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
											const isActiveItem = kind !== "series" && playing?.id === item.id;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatalogGridCard, {
												item,
												kind,
												serverId,
												active: isActiveItem,
												loading: loadingId === item.id,
												priority: index < 4,
												onActivate: activateCatalogItem,
												...kind === "series" ? { onHover: prefetchSeriesInfo } : {}
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
											className: "h-8 px-3 text-xs",
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
											className: "h-8 px-3 text-xs",
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
											className: "h-8 min-w-9 px-3 text-xs",
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
											className: "h-8 px-3 text-xs",
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
											className: "h-8 px-3 text-xs",
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
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						id: "wp-player-area",
						className: "lg:sticky lg:top-4 lg:self-start lg:w-full lg:max-w-[420px] xl:max-w-[400px] lg:justify-self-end",
						children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VideoPlayer, {
									url: playing.url,
									serverId,
									poster: proxyMediaUrl(playing.icon, serverId) ?? playing.icon,
									title: playing.name,
									kind
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate text-sm font-semibold",
									children: playing.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerInfo, {
									streamId: playing.id,
									kind,
									name: playing.name,
									fetchEPG,
									fetchTMDB
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
		staleTime: 864e5,
		placeholderData: (previous) => previous
	});
	if (kind === "live") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card/50 p-3 space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
			className: "text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "h-3 w-3" }), " Programação EPG"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2 max-h-[200px] overflow-y-auto wp-scroll pr-1",
			children: epg.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin text-muted-foreground" })
			}) : (epg.data ?? []).length > 0 ? epg.data.slice(0, 5).map((prog, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("text-[11px] border-l-2 pl-2 py-0.5", i === 0 ? "border-primary bg-primary/5" : "border-muted"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between font-bold",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: prog.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] text-muted-foreground",
						children: prog.start.split(" ")[1]
					})]
				}), prog.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground line-clamp-2 mt-0.5",
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
