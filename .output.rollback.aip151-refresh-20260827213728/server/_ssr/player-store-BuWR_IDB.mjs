import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as supabase } from "./client-DUSZWvd2.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { l as useServerFn } from "./router-CR30oRUU.mjs";
import { c as heartbeat, i as getMySession, t as getCategories } from "./player.functions-mcFST_nX.mjs";
import { t as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/player-store-BuWR_IDB.js
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
var LEGACY_SERVER_SELECTION_KEY = "wp_server_id";
var SERVER_SCOPED_QUERY_SCOPES = /* @__PURE__ */ new Set([
	"categories",
	"streams",
	"series-info",
	"epg",
	"playback-url"
]);
function getServerSelectionStorageKey(userId) {
	const normalized = userId?.trim();
	return normalized ? `${LEGACY_SERVER_SELECTION_KEY}:${normalized}` : null;
}
function resolveServerSelection(servers, storedServerId) {
	return servers.find((server) => server.id === storedServerId)?.id ?? servers[0]?.id ?? null;
}
function isServerScopedQuery(queryKey, serverId) {
	if (!Array.isArray(queryKey) || !SERVER_SCOPED_QUERY_SCOPES.has(String(queryKey[0]))) return false;
	if (!serverId) return true;
	return queryKey.slice(1).some((part) => part === serverId);
}
function isPlayerQuery(queryKey) {
	return queryKey[0] === "player-session" || isServerScopedQuery(queryKey);
}
var SessionContext = (0, import_react.createContext)(null);
function PlayerSessionProvider({ children }) {
	const fetchSession = useServerFn(getMySession);
	const ping = useServerFn(heartbeat);
	const fetchCategories = useServerFn(getCategories);
	const queryClient = useQueryClient();
	const [authUserId, setAuthUserId] = (0, import_react.useState)(null);
	const [serverId, setServerIdState] = (0, import_react.useState)(null);
	const [blocked, setBlocked] = (0, import_react.useState)(null);
	const catalogInvalidateTimer = (0, import_react.useRef)(null);
	const warmedServersRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const warmingServersRef = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const previousAuthUserIdRef = (0, import_react.useRef)(null);
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
	(0, import_react.useEffect)(() => {
		let mounted = true;
		supabase.auth.getSession().then(({ data: sessionData }) => {
			if (mounted) setAuthUserId(sessionData.session?.user.id ?? null);
		});
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			setAuthUserId(session?.user.id ?? null);
		});
		return () => {
			mounted = false;
			subscription.unsubscribe();
		};
	}, []);
	const { data, isLoading } = useQuery({
		queryKey: ["player-session", authUserId],
		queryFn: () => fetchSession(),
		staleTime: 6e4,
		enabled: authUserId !== null
	});
	const servers = data?.servers ?? [];
	(0, import_react.useEffect)(() => {
		const previousAuthUserId = previousAuthUserIdRef.current;
		if (previousAuthUserId === authUserId) return;
		if (previousAuthUserId !== null) {
			queryClient.cancelQueries({ predicate: (query) => isPlayerQuery(query.queryKey) });
			queryClient.removeQueries({ predicate: (query) => isPlayerQuery(query.queryKey) });
			warmedServersRef.current.clear();
			warmingServersRef.current.clear();
			setServerIdState(null);
			setBlocked(null);
		}
		previousAuthUserIdRef.current = authUserId;
	}, [authUserId, queryClient]);
	(0, import_react.useEffect)(() => {
		if (!authUserId || servers.length === 0) {
			setServerIdState(null);
			return;
		}
		const storageKey = getServerSelectionStorageKey(authUserId);
		const stored = storageKey ? window.localStorage.getItem(storageKey) : null;
		const valid = resolveServerSelection(servers, stored);
		setServerIdState((current) => current && servers.some((server) => server.id === current) ? current : valid);
	}, [authUserId, servers]);
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
		if (isLoading || !authUserId) return;
		let cancelled = false;
		const send = async () => {
			try {
				const result = await ping({ data: {
					device_id: getDeviceId(),
					server_id: serverId ?? void 0,
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
	}, [
		authUserId,
		isLoading,
		ping,
		serverId
	]);
	const value = (0, import_react.useMemo)(() => ({
		loading: isLoading,
		isOwner: Boolean(data?.isOwner),
		authUserId,
		profile: data?.profile ?? null,
		servers,
		serverId,
		activeServer: servers.find((server) => server.id === serverId) ?? null,
		preloadServerCatalog: (id) => {
			warmServerCatalog(id);
		},
		setServerId: (id) => {
			const selectedServer = servers.find((server) => server.id === id);
			if (!selectedServer) {
				setBlocked("Servidor não autorizado para este acesso.");
				return;
			}
			const previousServerId = serverId;
			setServerIdState(id);
			const storageKey = getServerSelectionStorageKey(authUserId);
			if (storageKey) window.localStorage.setItem(storageKey, id);
			if (previousServerId && previousServerId !== id) {
				queryClient.cancelQueries({ predicate: (query) => isServerScopedQuery(query.queryKey, previousServerId) });
				queryClient.removeQueries({ predicate: (query) => isServerScopedQuery(query.queryKey, previousServerId) });
			}
			toast.success(`Servidor ativo: ${selectedServer.name}`);
		},
		blocked,
		expired: Boolean(data?.expired)
	}), [
		authUserId,
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
