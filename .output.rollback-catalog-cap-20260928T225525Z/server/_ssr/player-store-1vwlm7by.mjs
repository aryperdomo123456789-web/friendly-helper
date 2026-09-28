import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { n as useServerFn } from "./utils-DtOh-j_S.mjs";
import { t as supabase } from "./client-JHW31y48.mjs";
import { c as heartbeat, i as getMySession, t as getCategories } from "./player.functions-D2OqyVdy.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/player-store-1vwlm7by.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEY = "wp_device_id";
function getDeviceId() {
	if (typeof window === "undefined") return "ssr-device";
	let id = window.localStorage.getItem(KEY);
	if (!id) {
		id = `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
		window.localStorage.setItem(KEY, id);
	}
	return id;
}
var SERVER_KEY = "wp_server_id";
var SessionContext = (0, import_react.createContext)(null);
function isServerScopedQuery(queryKey, serverId) {
	if (!Array.isArray(queryKey)) return false;
	const [scope, second, third] = queryKey;
	return (scope === "categories" || scope === "series-info" || scope === "epg") && second === serverId || (scope === "streams" || scope === "playback-url") && (second === serverId || third === serverId);
}
function PlayerSessionProvider({ children }) {
	const fetchSession = useServerFn(getMySession);
	const ping = useServerFn(heartbeat);
	const fetchCategories = useServerFn(getCategories);
	const queryClient = useQueryClient();
	const [serverId, setServerIdState] = (0, import_react.useState)(null);
	const [blocked, setBlocked] = (0, import_react.useState)(null);
	const catalogInvalidateTimer = (0, import_react.useRef)(null);
	const warmedServersRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const warmingServersRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const scheduleCatalogInvalidation = () => {
		if (catalogInvalidateTimer.current) clearTimeout(catalogInvalidateTimer.current);
		catalogInvalidateTimer.current = setTimeout(() => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			queryClient.invalidateQueries({ queryKey: ["streams"] });
			queryClient.invalidateQueries({ queryKey: ["series-info"] });
			queryClient.invalidateQueries({ queryKey: ["epg"] });
			catalogInvalidateTimer.current = null;
		}, 600);
	};
	const { data, isLoading } = useQuery({
		queryKey: ["player-session"],
		queryFn: () => fetchSession(),
		staleTime: 6e4
	});
	const servers = data?.servers ?? [];
	(0, import_react.useEffect)(() => {
		if (servers.length === 0) return;
		const stored = typeof window !== "undefined" ? window.localStorage.getItem(SERVER_KEY) : null;
		const valid = servers.find((server) => server.id === stored)?.id ?? servers[0].id;
		setServerIdState((current) => {
			if (!current) return valid;
			return servers.some((server) => server.id === current) ? current : valid;
		});
	}, [servers]);
	const warmServerCatalog = (0, import_react.useCallback)(async (targetServerId) => {
		if (!targetServerId) return;
		if (warmingServersRef.current.has(targetServerId) || warmedServersRef.current.has(targetServerId)) return;
		warmingServersRef.current.add(targetServerId);
		const kinds = [
			"live",
			"movie",
			"series"
		];
		try {
			await Promise.all(kinds.map((kind) => queryClient.prefetchQuery({
				queryKey: [
					"categories",
					kind,
					targetServerId
				],
				queryFn: () => fetchCategories({ data: {
					server_id: targetServerId,
					kind
				} }),
				staleTime: 6e4
			})));
			warmedServersRef.current.add(targetServerId);
		} catch {} finally {
			warmingServersRef.current.delete(targetServerId);
		}
	}, [fetchCategories, queryClient]);
	(0, import_react.useEffect)(() => {
		const channel = supabase.channel("player_session_realtime").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "iptv_servers"
		}, () => {
			queryClient.invalidateQueries({ queryKey: ["player-session"] });
		}).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "user_server_access"
		}, () => {
			queryClient.invalidateQueries({ queryKey: ["player-session"] });
		}).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "iptv_server_cache"
		}, (payload) => {
			const affectedServerId = payload.new?.server_id ?? payload.old?.server_id ?? null;
			if (serverId && affectedServerId && affectedServerId !== serverId) return;
			scheduleCatalogInvalidation();
		}).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "iptv_server_m3u_cache"
		}, (payload) => {
			const affectedServerId = payload.new?.server_id ?? payload.old?.server_id ?? null;
			if (serverId && affectedServerId && affectedServerId !== serverId) return;
			scheduleCatalogInvalidation();
		}).subscribe();
		return () => {
			if (catalogInvalidateTimer.current) {
				clearTimeout(catalogInvalidateTimer.current);
				catalogInvalidateTimer.current = null;
			}
			supabase.removeChannel(channel);
		};
	}, [queryClient, serverId]);
	(0, import_react.useEffect)(() => {
		if (isLoading) return;
		let cancelled = false;
		const send = async () => {
			try {
				const result = await ping({ data: {
					device_id: getDeviceId(),
					user_agent: navigator.userAgent.slice(0, 280)
				} });
				if (!cancelled) setBlocked(result.expired ? "Plano expirado" : null);
			} catch (error) {
				if (!cancelled) {
					const message = error instanceof Error ? error.message : "Conexão recusada.";
					setBlocked(message);
				}
			}
		};
		send();
		const timer = setInterval(send, 6e4);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [isLoading, ping]);
	const value = (0, import_react.useMemo)(() => ({
		loading: isLoading,
		isOwner: Boolean(data?.isOwner),
		authUserId: data?.authUserId ?? null,
		profile: data?.profile ?? null,
		servers,
		serverId,
		activeServer: servers.find((server) => server.id === serverId) ?? null,
		preloadServerCatalog: (id) => {
			warmServerCatalog(id);
		},
		setServerId: (id) => {
			const previousServerId = serverId;
			setServerIdState(id);
			window.localStorage.setItem(SERVER_KEY, id);
			if (previousServerId && previousServerId !== id) {
				queryClient.cancelQueries({ predicate: (query) => isServerScopedQuery(query.queryKey, previousServerId) });
				queryClient.removeQueries({ predicate: (query) => isServerScopedQuery(query.queryKey, previousServerId) });
			}
			toast.success(`Servidor ativo: ${servers.find((s) => s.id === id)?.name ?? ""}`);
		},
		blocked,
		expired: Boolean(data?.expired)
	}), [
		blocked,
		data,
		isLoading,
		queryClient,
		serverId,
		servers,
		warmServerCatalog
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionContext.Provider, {
		value,
		children
	});
}
function usePlayerSession() {
	const context = (0, import_react.useContext)(SessionContext);
	if (!context) throw new Error("usePlayerSession precisa estar dentro do PlayerSessionProvider");
	return context;
}
//#endregion
export { getDeviceId as n, usePlayerSession as r, PlayerSessionProvider as t };
