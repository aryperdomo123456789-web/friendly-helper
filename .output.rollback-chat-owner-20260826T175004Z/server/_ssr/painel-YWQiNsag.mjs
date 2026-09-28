import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as supabase } from "./client-DUSZWvd2.mjs";
import { a as updateAppConfig, r as getAdminAppConfig, t as APP_CONFIG_QUERY_KEY } from "./config.functions-RNMyCYrc.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { $ as Bell, L as GripVertical, M as Key, O as LoaderCircle, P as Image, Q as Calendar, U as Copy, _ as Server, a as Users, b as RefreshCw, f as SquarePen, g as Settings, h as Share2, i as WifiOff, m as ShieldAlert, n as X, r as Wifi, u as Trash2, v as Send, w as MessageSquare, x as Plus } from "../_libs/lucide-react.mjs";
import { f as deleteTestLink, l as useServerFn, m as saveTestLink, p as listTestLinksPage, s as cn } from "./router-8fIezSF-.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { r as usePlayerSession } from "./player-store-BbMMusW_.mjs";
import { t as Input } from "./input-Db0gc8vu.mjs";
import { t as Button } from "./button-Cg6-P-8F.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DEoMe3dJ.mjs";
import { t as proxyMediaUrl } from "./media-url-DOzr6FHi.mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, r as CardDescription, t as Card } from "./card-C0b0lFHs.mjs";
import { t as Label } from "./label-AErQiI-8.mjs";
import { t as Badge } from "./badge-Dy5oGD-2.mjs";
import { t as copyToClipboard } from "./clipboard-CZDYJKX1.mjs";
import { i as savePlan, n as getPlans, r as getPlansPage, t as deletePlan } from "./plans.functions-CDyqRVZ4.mjs";
import { a as listSupportMessagesPage, c as markThreadRead, s as listSupportThreadsPage } from "./chat.functions-CZgYBxZM.mjs";
import { a as PaginationNext, c as inferSupportMessageType, i as PaginationItem, n as PaginationContent, o as PaginationPrevious, r as PaginationEllipsis, s as getSupportMessageTypeMeta, t as Pagination } from "./pagination-DgkOVkYl.mjs";
import { t as portalName } from "./portal-name-BO2d2ici.mjs";
import { a as listAccessUsersPage, c as reorderServers, d as updateAccessUser, i as kickDevices, l as saveServer, n as deleteAccessUser, o as listServers, r as deleteServer, s as refreshServerCache, t as createAccessUser, u as testServerConnection } from "./owner.functions-Ofj5C1Io.mjs";
import { a as DialogHeader, c as Tabs, d as TabsTrigger, i as DialogFooter, l as TabsContent, n as DialogContent, o as DialogTitle, r as DialogDescription, s as DialogTrigger, t as Dialog, u as TabsList } from "./dialog-CfKkM4di.mjs";
import { a as TableHead, i as TableCell, n as Table, o as TableHeader, r as TableBody, s as TableRow, t as OwnerPageShell } from "./owner-page-shell-CbdgrEZO.mjs";
import { r as sendMassNotification } from "./notifications.functions-D4o3NY0X.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/painel-YWQiNsag.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
var OWNER_PANEL_TABS = [
	{
		value: "acessos",
		label: "Acessos",
		icon: Users
	},
	{
		value: "servidores",
		label: "Servidores",
		icon: Server
	},
	{
		value: "configuracao",
		label: "Central",
		icon: Settings
	},
	{
		value: "suporte",
		label: "Suporte",
		icon: MessageSquare
	},
	{
		value: "planos",
		label: "Planos",
		icon: Key
	},
	{
		value: "referencia",
		label: "Indicação",
		icon: Share2
	}
];
function OwnerPanelTabs({ hasUnreadSupport }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3 rounded-2xl border border-sidebar-border bg-sidebar/30 p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-between gap-3 px-1",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground",
				children: "Núcleo administrativo"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: "Acesso separado para operação, suporte, planos e configuração."
			})] })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsList, {
			className: "flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0",
			children: OWNER_PANEL_TABS.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
				value: tab.value,
				className: "gap-2 rounded-full border border-sidebar-border/70 bg-sidebar-accent/30 px-4 py-2 data-[state=active]:border-primary/50 data-[state=active]:bg-primary/10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(tab.icon, { className: "h-4 w-4" }),
					tab.label,
					tab.value === "suporte" && hasUnreadSupport ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("h-2 w-2 rounded-full bg-destructive animate-pulse") }) : null
				]
			}, tab.value))
		})]
	});
}
function PainelDono() {
	const { isOwner } = usePlayerSession();
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = (0, import_react.useState)("acessos");
	const [usersSearch, setUsersSearch] = (0, import_react.useState)("");
	const [debouncedUsersSearch, setDebouncedUsersSearch] = (0, import_react.useState)("");
	const [usersPageSize, setUsersPageSize] = (0, import_react.useState)(10);
	const [usersCurrentPage, setUsersCurrentPage] = (0, import_react.useState)(1);
	const [plansCurrentPage, setPlansCurrentPage] = (0, import_react.useState)(1);
	const [testLinksCurrentPage, setTestLinksCurrentPage] = (0, import_react.useState)(1);
	const [threadsPage, setThreadsPage] = (0, import_react.useState)(1);
	const threadsPageSize = 10;
	const fetchServers = useServerFn(listServers);
	const fetchUsersPage = useServerFn(listAccessUsersPage);
	const mutationSaveServer = useServerFn(saveServer);
	const mutationDeleteServer = useServerFn(deleteServer);
	const mutationRefreshServerCache = useServerFn(refreshServerCache);
	const mutationReorderServers = useServerFn(reorderServers);
	const mutationCreateUser = useServerFn(createAccessUser);
	const mutationUpdateUser = useServerFn(updateAccessUser);
	const mutationDeleteUser = useServerFn(deleteAccessUser);
	useServerFn(kickDevices);
	useServerFn(testServerConnection);
	const fetchConfig = useServerFn(getAdminAppConfig);
	const mutationSaveConfig = useServerFn(updateAppConfig);
	const fetchTestLinksPage = useServerFn(listTestLinksPage);
	const mutationSaveTestLink = useServerFn(saveTestLink);
	const mutationDeleteTestLink = useServerFn(deleteTestLink);
	const mutationMassNotif = useServerFn(sendMassNotification);
	const fetchPlans = useServerFn(getPlans);
	const fetchPlansPage = useServerFn(getPlansPage);
	const mutationSavePlan = useServerFn(savePlan);
	const mutationDeletePlan = useServerFn(deletePlan);
	const fetchThreadsPage = useServerFn(listSupportThreadsPage);
	const mutationMarkRead = useServerFn(markThreadRead);
	const threads = useQuery({
		queryKey: [
			"support-threads-page",
			threadsPage,
			threadsPageSize
		],
		queryFn: () => fetchThreadsPage({ data: {
			page: threadsPage,
			page_size: threadsPageSize
		} }),
		enabled: isOwner,
		refetchInterval: 1e4,
		placeholderData: (previous) => previous
	});
	const threadsTotal = threads.data?.total ?? 0;
	const threadsTotalPages = Math.max(1, Math.ceil(threadsTotal / threadsPageSize));
	const threadsSafePage = Math.min(threadsPage, threadsTotalPages);
	const threadsItems = threads.data?.items ?? [];
	const threadsPaginationPages = (0, import_react.useMemo)(() => {
		const windowSize = 5;
		if (threadsTotalPages <= windowSize) return Array.from({ length: threadsTotalPages }, (_, index) => index + 1);
		const start = Math.max(1, Math.min(threadsSafePage - 2, threadsTotalPages - 4));
		const end = Math.min(threadsTotalPages, start + windowSize - 1);
		return Array.from({ length: end - start + 1 }, (_, index) => start + index);
	}, [threadsSafePage, threadsTotalPages]);
	const [selectedThread, setSelectedThread] = (0, import_react.useState)(null);
	const [copyingLinkId, setCopyingLinkId] = (0, import_react.useState)(null);
	const [notifTitle, setNotifTitle] = (0, import_react.useState)("");
	const [notifContent, setNotifContent] = (0, import_react.useState)("");
	const [sendingNotif, setSendingNotif] = (0, import_react.useState)(false);
	const [showNotifDialog, setShowNotifDialog] = (0, import_react.useState)(false);
	const [showConfigSaveConfirm, setShowConfigSaveConfirm] = (0, import_react.useState)(false);
	const configFormRef = (0, import_react.useRef)(null);
	const [saveConfirm, setSaveConfirm] = (0, import_react.useState)(null);
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [newMessage, setNewMessage] = (0, import_react.useState)("");
	const [serverItems, setServerItems] = (0, import_react.useState)([]);
	const [draggingServerId, setDraggingServerId] = (0, import_react.useState)(null);
	const [dragOverServerId, setDragOverServerId] = (0, import_react.useState)(null);
	const [refreshingServerId, setRefreshingServerId] = (0, import_react.useState)(null);
	const [refreshStageByServerId, setRefreshStageByServerId] = (0, import_react.useState)({});
	(0, import_react.useRef)(null);
	const refreshTimersRef = (0, import_react.useRef)({});
	const nextServerSortOrder = serverItems.reduce((max, server) => Math.max(max, Number(server.sort_order) || 0), -1) + 1;
	const plans = useQuery({
		queryKey: ["admin-plans"],
		queryFn: () => fetchPlans(),
		enabled: isOwner
	});
	const plansPage = useQuery({
		queryKey: ["admin-plans-page", plansCurrentPage],
		queryFn: () => fetchPlansPage({ data: {
			page: plansCurrentPage,
			page_size: 6
		} }),
		enabled: isOwner,
		placeholderData: (previous) => previous
	});
	const testLinksPage = useQuery({
		queryKey: ["admin-test-links-page", testLinksCurrentPage],
		queryFn: () => fetchTestLinksPage({ data: {
			page: testLinksCurrentPage,
			page_size: 10
		} }),
		enabled: isOwner,
		placeholderData: (previous) => previous
	});
	const configQuery = useQuery({
		queryKey: APP_CONFIG_QUERY_KEY,
		queryFn: () => fetchConfig(),
		enabled: isOwner
	});
	const servers = useQuery({
		queryKey: ["admin-servers"],
		queryFn: () => fetchServers(),
		enabled: isOwner
	});
	(0, import_react.useEffect)(() => {
		setServerItems(servers.data ?? []);
	}, [servers.data]);
	(0, import_react.useEffect)(() => {
		return () => {
			Object.values(refreshTimersRef.current).forEach((timer) => {
				if (timer) window.clearTimeout(timer);
			});
			refreshTimersRef.current = {};
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const timer = window.setTimeout(() => setDebouncedUsersSearch(usersSearch.trim()), 250);
		return () => window.clearTimeout(timer);
	}, [usersSearch]);
	(0, import_react.useEffect)(() => {
		setUsersCurrentPage(1);
	}, [debouncedUsersSearch, usersPageSize]);
	const users = useQuery({
		queryKey: [
			"admin-users-page",
			debouncedUsersSearch,
			usersCurrentPage,
			usersPageSize
		],
		queryFn: () => fetchUsersPage({ data: {
			search: debouncedUsersSearch,
			status: "all",
			server_id: null,
			plan_id: null,
			referral: "all",
			sort_order: "newest",
			page: usersCurrentPage,
			page_size: usersPageSize
		} }),
		enabled: isOwner,
		placeholderData: (previous) => previous
	});
	const usersTotal = users.data?.total ?? 0;
	const usersTotalPages = Math.max(1, Math.ceil(usersTotal / usersPageSize));
	const usersSafePage = Math.min(usersCurrentPage, usersTotalPages);
	const usersPageStart = usersTotal === 0 ? 0 : (usersSafePage - 1) * usersPageSize + 1;
	const usersPageEnd = Math.min(usersSafePage * usersPageSize, usersTotal);
	const usersItems = users.data?.items ?? [];
	const usersPaginationPages = (0, import_react.useMemo)(() => {
		const windowSize = 5;
		if (usersTotalPages <= windowSize) return Array.from({ length: usersTotalPages }, (_, index) => index + 1);
		const start = Math.max(1, Math.min(usersSafePage - 2, usersTotalPages - 4));
		const end = Math.min(usersTotalPages, start + windowSize - 1);
		return Array.from({ length: end - start + 1 }, (_, index) => start + index);
	}, [usersSafePage, usersTotalPages]);
	const plansTotal = plansPage.data?.total ?? 0;
	const plansTotalPages = Math.max(1, Math.ceil(plansTotal / 6));
	const plansSafePage = Math.min(plansCurrentPage, plansTotalPages);
	const plansItems = plansPage.data?.items ?? [];
	const plansPaginationPages = (0, import_react.useMemo)(() => {
		const windowSize = 5;
		if (plansTotalPages <= windowSize) return Array.from({ length: plansTotalPages }, (_, index) => index + 1);
		const start = Math.max(1, Math.min(plansSafePage - 2, plansTotalPages - 4));
		const end = Math.min(plansTotalPages, start + windowSize - 1);
		return Array.from({ length: end - start + 1 }, (_, index) => start + index);
	}, [plansSafePage, plansTotalPages]);
	const testLinksTotal = testLinksPage.data?.total ?? 0;
	const testLinksTotalPages = Math.max(1, Math.ceil(testLinksTotal / 10));
	const testLinksSafePage = Math.min(testLinksCurrentPage, testLinksTotalPages);
	const testLinksItems = testLinksPage.data?.items ?? [];
	const testLinksPaginationPages = (0, import_react.useMemo)(() => {
		const windowSize = 5;
		if (testLinksTotalPages <= windowSize) return Array.from({ length: testLinksTotalPages }, (_, index) => index + 1);
		const start = Math.max(1, Math.min(testLinksSafePage - 2, testLinksTotalPages - 4));
		const end = Math.min(testLinksTotalPages, start + windowSize - 1);
		return Array.from({ length: end - start + 1 }, (_, index) => start + index);
	}, [testLinksSafePage, testLinksTotalPages]);
	const [serverModal, setServerModal] = (0, import_react.useState)(null);
	const [serverCreateSeed, setServerCreateSeed] = (0, import_react.useState)(0);
	const [userModal, setUserModal] = (0, import_react.useState)(null);
	const [userCreateSeed, setUserCreateSeed] = (0, import_react.useState)(0);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [testLinkModal, setTestLinkModal] = (0, import_react.useState)(null);
	const [testLinkCreateSeed, setTestLinkCreateSeed] = (0, import_react.useState)(0);
	const [planModal, setPlanModal] = (0, import_react.useState)(null);
	const [planCreateSeed, setPlanCreateSeed] = (0, import_react.useState)(0);
	const openServerModal = (server) => {
		if (!server) {
			const seed = Date.now();
			setServerCreateSeed(seed);
			setServerModal({
				name: portalName(nextServerSortOrder),
				owner_note: "",
				can_edit_owner_note: true,
				credentials: [{
					username: "",
					password: "",
					dns: ""
				}],
				is_active: true,
				sort_order: nextServerSortOrder,
				connection_capacity: null,
				bulk_action: "none",
				__draft_seed: seed
			});
			return;
		}
		const currentCredential = server.credentials?.[0] ?? null;
		setServerModal({
			...server,
			name: portalName(Number(server.sort_order) || 0),
			credentials: [{
				username: currentCredential?.username ?? "",
				password: currentCredential?.password ?? "",
				dns: currentCredential?.dns ?? server.url ?? ""
			}],
			bulk_action: "none",
			__draft_seed: server.id
		});
	};
	const handleSaveServer = async (e) => {
		e.preventDefault();
		await executeSaveServer();
	};
	const executeSaveServer = async () => {
		setLoading(true);
		try {
			await mutationSaveServer({ data: serverModal });
			toast.success("Servidor salvo com sucesso.");
			setServerModal(null);
			setSaveConfirm(null);
			queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
			queryClient.invalidateQueries({ queryKey: ["player-session"] });
		} catch (err) {
			toast.error(`Falha ao salvar o servidor: ${err.message || "erro desconhecido"}`);
		} finally {
			setLoading(false);
		}
	};
	const handleDeleteServer = async (id) => {
		if (!confirm("Tem certeza que deseja excluir este servidor?")) return;
		try {
			await mutationDeleteServer({ data: { id } });
			toast.success("Servidor removido com sucesso!");
			queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
			queryClient.invalidateQueries({ queryKey: ["player-session"] });
		} catch (err) {
			toast.error(err.message || "Erro ao excluir servidor");
		}
	};
	const clearRefreshTimers = (0, import_react.useCallback)((id) => {
		const timer = refreshTimersRef.current[id];
		if (timer) window.clearTimeout(timer);
		delete refreshTimersRef.current[id];
	}, []);
	const setRefreshStage = (0, import_react.useCallback)((id, stage) => {
		setRefreshStageByServerId((current) => ({
			...current,
			[id]: stage
		}));
	}, []);
	const handleRefreshServerCache = async (id, name) => {
		clearRefreshTimers(id);
		setRefreshingServerId(id);
		setRefreshStage(id, "validando");
		refreshTimersRef.current[id] = window.setTimeout(() => {
			setRefreshStageByServerId((current) => current[id] === "validando" ? {
				...current,
				[id]: "baixando"
			} : current);
		}, 450);
		try {
			const result = await mutationRefreshServerCache({ data: {
				id,
				clear_local_before_fetch: true
			} });
			clearRefreshTimers(id);
			setRefreshStage(id, "concluido");
			toast.success(result.source === "m3u" ? `Portal ${name} validado e recarregado com M3U local.` : `Portal ${name} validado com fallback Xtream e cache atualizado.`);
			queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
			queryClient.invalidateQueries({ queryKey: ["player-session"] });
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			queryClient.invalidateQueries({ queryKey: ["streams"] });
			queryClient.invalidateQueries({ queryKey: ["series-info"] });
			queryClient.invalidateQueries({ queryKey: ["epg"] });
			refreshTimersRef.current[id] = window.setTimeout(() => {
				setRefreshStageByServerId((current) => {
					if (current[id] !== "concluido") return current;
					const next = { ...current };
					delete next[id];
					return next;
				});
				delete refreshTimersRef.current[id];
			}, 1600);
		} catch (err) {
			clearRefreshTimers(id);
			setRefreshStage(id, "falha");
			toast.error(err.message || "Erro ao recarregar cache do servidor");
			refreshTimersRef.current[id] = window.setTimeout(() => {
				setRefreshStageByServerId((current) => {
					if (current[id] !== "falha") return current;
					const next = { ...current };
					delete next[id];
					return next;
				});
				delete refreshTimersRef.current[id];
			}, 2400);
		} finally {
			setRefreshingServerId((current) => current === id ? null : current);
		}
	};
	const handleServerOrderChange = async (targetServerId) => {
		if (!draggingServerId || draggingServerId === targetServerId) return;
		const previousServers = serverItems;
		const fromIndex = previousServers.findIndex((server) => server.id === draggingServerId);
		const toIndex = previousServers.findIndex((server) => server.id === targetServerId);
		if (fromIndex < 0 || toIndex < 0) return;
		const nextServers = [...previousServers];
		const [moved] = nextServers.splice(fromIndex, 1);
		nextServers.splice(toIndex, 0, moved);
		const normalizedServers = nextServers.map((server, index) => ({
			...server,
			name: portalName(index),
			sort_order: index
		}));
		setServerItems(normalizedServers);
		setDraggingServerId(null);
		setDragOverServerId(null);
		try {
			await mutationReorderServers({ data: { ids: normalizedServers.map((server) => server.id) } });
			toast.success("Ordem dos servidores atualizada");
			queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
			queryClient.invalidateQueries({ queryKey: ["player-session"] });
		} catch (err) {
			setServerItems(previousServers);
			toast.error(err.message || "Erro ao reordenar servidores");
		}
	};
	const handleSaveUser = async (e) => {
		e.preventDefault();
		setSaveConfirm({
			kind: "user",
			title: userModal?.id ? "Confirmar atualização do acesso" : "Confirmar criação do acesso",
			description: userModal?.id ? "Você tem certeza que deseja salvar as alterações deste usuário?" : "Você tem certeza que deseja criar este novo acesso?"
		});
	};
	const executeSaveUser = async () => {
		setLoading(true);
		try {
			if (userModal.id) {
				await mutationUpdateUser({ data: userModal });
				toast.success("Acesso atualizado com sucesso.");
			} else {
				await mutationCreateUser({ data: userModal });
				toast.success("Novo acesso criado com sucesso.");
			}
			setUserModal(null);
			setSaveConfirm(null);
			queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
		} catch (err) {
			toast.error(`Falha ao salvar o usuário: ${err.message || "erro desconhecido"}`);
		} finally {
			setLoading(false);
		}
	};
	const handleSaveTestLink = async (e) => {
		e.preventDefault();
		setSaveConfirm({
			kind: "testLink",
			title: testLinkModal?.id ? "Confirmar atualização do link" : "Confirmar criação do link",
			description: testLinkModal?.id ? "Você tem certeza que deseja salvar as alterações deste link de teste?" : "Você tem certeza que deseja criar este novo link de teste?"
		});
	};
	const executeSaveTestLink = async () => {
		setLoading(true);
		try {
			await mutationSaveTestLink({ data: testLinkModal });
			toast.success("Link de teste salvo com sucesso.");
			setTestLinkModal(null);
			setSaveConfirm(null);
			queryClient.invalidateQueries({ queryKey: ["admin-test-links"] });
			queryClient.invalidateQueries({ queryKey: ["admin-test-links-page"] });
		} catch (err) {
			toast.error(`Falha ao salvar o link de teste: ${err.message || "erro desconhecido"}`);
		} finally {
			setLoading(false);
		}
	};
	const handleDeleteTestLink = async (id) => {
		if (!confirm("Tem certeza que deseja excluir este link de teste?")) return;
		try {
			await mutationDeleteTestLink({ data: { id } });
			toast.success("Link removido com sucesso!");
			queryClient.invalidateQueries({ queryKey: ["admin-test-links"] });
			queryClient.invalidateQueries({ queryKey: ["admin-test-links-page"] });
		} catch (err) {
			toast.error(err.message || "Erro ao excluir link");
		}
	};
	const handleDeleteUser = async (id) => {
		if (!confirm("Tem certeza de que deseja remover este acesso? O usuário será desconectado.")) return;
		try {
			await mutationDeleteUser({ data: { id } });
			toast.success("Acesso removido com sucesso!");
			queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
		} catch (err) {
			toast.error(err.message || "Erro ao excluir usuário");
		}
	};
	const handleSavePlan = async (e) => {
		e.preventDefault();
		setSaveConfirm({
			kind: "plan",
			title: planModal?.id ? "Confirmar atualização do plano" : "Confirmar criação do plano",
			description: planModal?.id ? "Você tem certeza que deseja salvar as alterações deste plano?" : "Você tem certeza que deseja criar este novo plano?"
		});
	};
	const executeSavePlan = async () => {
		setLoading(true);
		try {
			await mutationSavePlan({ data: planModal });
			toast.success("Plano salvo com sucesso.");
			setPlanModal(null);
			setSaveConfirm(null);
			queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
			queryClient.invalidateQueries({ queryKey: ["admin-plans-page"] });
			queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
		} catch (err) {
			toast.error(`Falha ao salvar o plano: ${err.message || "erro desconhecido"}`);
		} finally {
			setLoading(false);
		}
	};
	const handleDeletePlan = async (id) => {
		if (!confirm("Tem certeza que deseja excluir este plano?")) return;
		try {
			await mutationDeletePlan({ data: { id } });
			toast.success("Plano removido com sucesso!");
			queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
			queryClient.invalidateQueries({ queryKey: ["admin-plans-page"] });
		} catch (err) {
			toast.error(err.message || "Erro ao excluir plano");
		}
	};
	const confirmSaveAction = async () => {
		if (!saveConfirm) return;
		switch (saveConfirm.kind) {
			case "server":
				await executeSaveServer();
				return;
			case "user":
				await executeSaveUser();
				return;
			case "testLink":
				await executeSaveTestLink();
				return;
			case "plan":
				await executeSavePlan();
				return;
			default: return;
		}
	};
	const handleSaveConfig = async () => {
		const form = configFormRef.current;
		if (!form) {
			toast.error("Não foi possível localizar o formulário da configuração central.");
			return;
		}
		setLoading(true);
		try {
			const data = new FormData(form);
			const values = Object.fromEntries(data.entries());
			const newConfig = {
				...configQuery.data,
				name: values["name"],
				short_name: values["short_name"],
				domain: values["domain"],
				base_url: values["base_url"],
				logo_url: values["logo_url"],
				logo_small_url: values["logo_small_url"],
				favicon_url: values["favicon_url"],
				tmdb_api_key: values["tmdb_api_key"] || void 0,
				epg_xmltv_url: values["epg_xmltv_url"] || void 0,
				theme_mode: values["theme_mode"],
				telegram_handle: values["telegram_handle"],
				mp_access_token: values["mp_access_token"],
				mp_public_key: values["mp_public_key"],
				mp_webhook_secret: values["mp_webhook_secret"],
				mp_enabled: values["mp_enabled"] === "on",
				theme: {
					...configQuery.data?.theme,
					primary: values["primary"],
					bg: values["bg"]
				},
				support_attendant_name: values["support_attendant_name"],
				support_auto_reply: values["support_auto_reply"],
				copy: {
					...configQuery.data?.copy,
					home_title: values["home_title"]
				}
			};
			await mutationSaveConfig({ data: newConfig });
			toast.success("Configuração salva com sucesso.");
			await queryClient.invalidateQueries({ queryKey: APP_CONFIG_QUERY_KEY });
			await configQuery.refetch();
			setShowConfigSaveConfirm(false);
		} catch (err) {
			toast.error(`Falha ao salvar a configuração: ${err?.message || "erro desconhecido"}`);
		} finally {
			setLoading(false);
		}
	};
	if (!isOwner) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card p-10 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "mx-auto mb-3 h-8 w-8 text-muted-foreground" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-bold",
				children: "Acesso restrito"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Somente o dono do sistema pode cadastrar, editar ou excluir servidores."
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OwnerPageShell, {
		className: "mx-auto max-w-7xl pb-20",
		title: "Painel do dono",
		description: "Concentre servidores, planos, suporte e configuração global em um núcleo visual próprio, mais limpo e profissional.",
		icon: ShieldAlert,
		rightSlot: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-[140px] rounded-xl border border-sidebar-border/70 bg-background/60 px-2.5 py-2 text-[10px] leading-snug shadow-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[8px] font-black uppercase tracking-[0.16em] text-muted-foreground",
				children: "Admin"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 truncate font-semibold text-foreground",
				children: "Operação central"
			})]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "border-sidebar-border bg-sidebar/25",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-5 md:p-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground",
									children: "Núcleo administrativo"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-3xl font-bold tracking-tight",
									children: "Painel do dono"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "max-w-2xl text-sm text-muted-foreground",
									children: "Esta área concentra controles internos de operação. O fluxo do usuário comum permanece separado, com acesso ao catálogo, conta e suporte sem exposição das ferramentas administrativas."
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2 sm:grid-cols-2 xl:grid-cols-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-sidebar-border bg-background/50 px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-4 w-4 text-primary" }), "Acessos"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-muted-foreground",
										children: "Usuários, permissões e ciclo de acesso."
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-sidebar-border bg-background/50 px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { className: "h-4 w-4 text-primary" }), "Servidores"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-muted-foreground",
										children: "Fonte IPTV, credenciais e ordem operacional."
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-sidebar-border bg-background/50 px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-4 w-4 text-primary" }), "Central"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-muted-foreground",
										children: "Marca, textos globais e configuração principal."
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl border border-sidebar-border bg-background/50 px-4 py-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-4 w-4 text-primary" }), "Suporte"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-sm text-muted-foreground",
										children: "Conversas, comprovantes e resposta interna."
									})]
								})
							]
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold text-muted-foreground",
					children: "Configurações e operação"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground",
					children: "Gerencie sua estrutura multi-servidor e seus clientes."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
					open: showNotifDialog,
					onOpenChange: setShowNotifDialog,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-bold gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4" }), " Enviar Mensagem em Massa"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
						className: "bg-sidebar border-sidebar-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
								className: "text-xl font-bold flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "text-primary h-5 w-5" }), " Notificação Global"]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4 py-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs font-bold uppercase tracking-widest opacity-60",
										children: "Título da Mensagem"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										name: "mass_notif_title",
										autoComplete: "off",
										placeholder: "Ex: Manutenção Programada",
										value: notifTitle,
										onChange: (e) => setNotifTitle(e.target.value),
										className: "bg-background/40"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs font-bold uppercase tracking-widest opacity-60",
										children: "Conteúdo"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										name: "mass_notif_content",
										autoComplete: "off",
										placeholder: "Descreva a mensagem que todos os usuários receberão...",
										value: notifContent,
										onChange: (e) => setNotifContent(e.target.value),
										className: "w-full min-h-[120px] rounded-xl bg-background/40 border border-border p-3 text-sm focus:ring-primary"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								onClick: () => setShowNotifDialog(false),
								className: "font-bold",
								children: "Cancelar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								disabled: sendingNotif || !notifTitle || !notifContent,
								onClick: async () => {
									setSendingNotif(true);
									try {
										const res = await mutationMassNotif({ data: {
											title: notifTitle,
											content: notifContent
										} });
										toast.success(`Notificação enviada para ${res.count} usuários!`);
										setShowNotifDialog(false);
										setNotifTitle("");
										setNotifContent("");
									} catch (err) {
										toast.error("Erro ao enviar: " + err.message);
									} finally {
										setSendingNotif(false);
									}
								},
								className: "font-bold gap-2",
								children: [sendingNotif ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" }), "Disparar Notificação"]
							})] })
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				value: activeTab,
				onValueChange: setActiveTab,
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OwnerPanelTabs, { hasUnreadSupport: threadsItems.some((t) => t.unread_count_owner > 0) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "acessos",
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "border-sidebar-border bg-sidebar/20",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "space-y-4 p-5 md:p-6",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground",
													children: "Núcleo de acessos"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
													className: "text-2xl font-bold tracking-tight",
													children: "Usuários do sistema"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Crie, edite e revise acessos com paginação server-side, mantendo a tela leve mesmo em bases grandes."
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											onClick: () => {
												const testPlan = plans.data?.find((p) => p.name.toLowerCase().includes("teste") || Number(p.price) === 0);
												setUserCreateSeed(Date.now());
												setUserModal({
													username: "",
													password: "",
													display_name: "",
													max_connections: testPlan?.max_connections ?? 1,
													server_ids: [],
													is_active: true,
													plan_id: testPlan?.id || null,
													expires_at: testPlan ? new Date(Date.now() + testPlan.duration_value * (testPlan.duration_unit === "minutes" ? 6e4 : testPlan.duration_unit === "hours" ? 36e5 : 864e5)).toISOString() : null
												});
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " Criar acesso"]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-3 lg:grid-cols-[1.4fr,0.6fr]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												className: "text-[10px] uppercase tracking-wider text-muted-foreground",
												children: "Buscar"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												placeholder: "Username ou nome...",
												value: usersSearch,
												onChange: (event) => setUsersSearch(event.target.value),
												className: "h-9"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-[10px] uppercase tracking-wider text-muted-foreground",
													children: "Linhas por página"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: String(usersPageSize),
													onValueChange: (value) => setUsersPageSize(Number(value)),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
														className: "h-9",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "10" })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
														10,
														25,
														50,
														100
													].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: String(value),
														children: value
													}, value)) })]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													className: "text-[10px] uppercase tracking-wider text-muted-foreground",
													children: "Resultado"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex h-9 items-center rounded-md border border-border bg-background/60 px-3 text-sm",
													children: usersPageStart === 0 ? "Nenhum usuário" : `${usersPageStart} - ${usersPageEnd} de ${usersTotal}`
												})]
											})]
										})]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "min-w-[800px]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Usuário" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Referência" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Servidores" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-center",
											children: "Conexões"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Vencimento" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right",
											children: "Ações"
										})
									] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: users.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										colSpan: 7,
										className: "h-24 text-center text-xs text-muted-foreground uppercase tracking-widest",
										children: "Carregando..."
									}) }) : usersItems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										colSpan: 7,
										className: "h-24 text-center text-xs text-muted-foreground uppercase tracking-widest",
										children: "Nenhum usuário encontrado."
									}) }) : usersItems.map((user) => (() => {
										const isProtectedOwner = user.username === "magodono";
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "font-medium flex items-center gap-2",
												children: [user.display_name || user.username, user.plan_id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-col",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: cn("text-[10px] px-1.5 py-0.5 rounded-full border uppercase font-bold w-fit", plans.data?.find((p) => p.id === user.plan_id)?.name.toLowerCase().includes("teste") ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : "bg-primary/20 text-primary border-primary/30"),
														children: plans.data?.find((p) => p.id === user.plan_id)?.name || "Plano"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-[9px] text-muted-foreground mt-0.5",
														children: ["R$ ", Number(plans.data?.find((p) => p.id === user.plan_id)?.price || 0).toFixed(2)]
													})]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-xs text-muted-foreground",
												children: ["@", user.username]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: user.referred_by ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-xs font-bold text-primary",
												children: ["@", user.referred_by.username]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-muted-foreground",
												children: "Direto"
											}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap gap-1",
												children: [user.server_ids.length, " sv(s)"]
											}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-center",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", user.online > 0 ? "bg-online/10 text-online" : "bg-muted text-muted-foreground"),
													children: [
														user.online,
														" / ",
														user.max_connections
													]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-xs",
												children: user.expires_at ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-3 w-3" }), new Date(user.expires_at).toLocaleDateString("pt-BR")]
												}) : "Sem limite"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: user.is_active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1.5 text-xs text-online",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, { className: "h-3 w-3" }), " Ativo"]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1.5 text-xs text-destructive",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { className: "h-3 w-3" }), " Bloqueado"]
											}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
												className: "text-right",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-end gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														onClick: () => setUserModal(user),
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "h-4 w-4" })
													}), !isProtectedOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														className: "text-destructive",
														onClick: () => handleDeleteUser(user.id),
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														className: "text-muted-foreground/40 cursor-not-allowed",
														title: "O dono não pode ser apagado",
														disabled: true,
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
													})]
												})
											})
										] }, user.id);
									})()) })] })
								})
							}),
							usersTotalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "border-sidebar-border bg-sidebar/20",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-sm text-muted-foreground",
										children: [
											"Página ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: usersSafePage
											}),
											" de",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: usersTotalPages
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pagination, {
										className: "mx-0 w-auto justify-start md:justify-end",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaginationContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationPrevious, {
												href: "#",
												onClick: (event) => {
													event.preventDefault();
													setUsersCurrentPage((current) => Math.max(1, current - 1));
												},
												className: usersSafePage <= 1 ? "pointer-events-none opacity-50" : ""
											}) }),
											usersPaginationPages.map((page) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: page === usersSafePage ? "default" : "ghost",
												size: "icon",
												className: "h-9 w-9",
												onClick: () => setUsersCurrentPage(page),
												children: page
											}) }, page)),
											usersTotalPages > usersPaginationPages[usersPaginationPages.length - 1] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationEllipsis, {}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationNext, {
												href: "#",
												onClick: (event) => {
													event.preventDefault();
													setUsersCurrentPage((current) => Math.min(usersTotalPages, current + 1));
												},
												className: usersSafePage >= usersTotalPages ? "pointer-events-none opacity-50" : ""
											}) })
										] })
									})]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "servidores",
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-xl font-semibold",
									children: "Fontes de IPTV"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => openServerModal(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " Adicionar Servidor"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-xl border border-border/40 bg-card/30 p-3 text-xs text-muted-foreground",
								children: "Arraste o ícone ao lado do nome para definir a ordem do primeiro, segundo e demais servidores."
							}),
							servers.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-xl border border-border/40 bg-card/30 p-8 text-center text-muted-foreground",
								children: "Carregando servidores..."
							}) : serverItems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-xl border border-border/40 bg-card/30 p-8 text-center text-muted-foreground",
								children: "Nenhum servidor cadastrado."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
								children: serverItems.map((server, index) => {
									const isDragging = draggingServerId === server.id;
									const isDropTarget = dragOverServerId === server.id;
									const refreshStage = refreshStageByServerId[server.id] ?? null;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
										className: cn("transition-all", isDragging && "opacity-50 scale-[0.98]", isDropTarget && "ring-2 ring-primary ring-offset-2 ring-offset-background"),
										onDragOver: (event) => {
											event.preventDefault();
											setDragOverServerId(server.id);
										},
										onDragLeave: () => {
											if (dragOverServerId === server.id) setDragOverServerId(null);
										},
										onDrop: (event) => {
											event.preventDefault();
											handleServerOrderChange(server.id);
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
											className: "flex flex-row items-start justify-between space-y-0 pb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0 space-y-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														draggable: true,
														onDragStart: (event) => {
															event.dataTransfer.effectAllowed = "move";
															event.dataTransfer.setData("text/plain", server.id);
															setDraggingServerId(server.id);
															setDragOverServerId(server.id);
														},
														onDragEnd: () => {
															setDraggingServerId(null);
															setDragOverServerId(null);
														},
														className: "inline-flex h-7 w-7 cursor-grab items-center justify-center rounded-md border border-border/60 bg-background/40 text-muted-foreground transition hover:text-foreground active:cursor-grabbing",
														"aria-label": `Arrastar ${portalName(index)}`,
														title: "Arrastar para reordenar",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { className: "h-4 w-4" })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
														className: "truncate text-sm font-bold uppercase tracking-wider",
														children: portalName(index)
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
													children: ["Posição ", index + 1]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-8 w-8",
													onClick: () => handleRefreshServerCache(server.id, portalName(index)),
													disabled: refreshingServerId === server.id,
													title: refreshStage ? refreshStage === "validando" ? "Validando M3U..." : refreshStage === "baixando" ? "Baixando M3U..." : refreshStage === "concluido" ? "Concluído" : "Falha ao recarregar" : "Recarregar M3U / Cache",
													children: refreshingServerId === server.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-4 w-4" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { className: "h-4 w-4 text-primary" })]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mb-1 truncate text-xs text-muted-foreground",
												children: "Credenciais protegidas no servidor"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mb-4 text-xs text-muted-foreground",
												children: ["Capacidade: ", server.connection_capacity ? `${server.connection_capacity} conexões` : "não definida"]
											}),
											refreshStage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mb-4 flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: refreshStage === "falha" ? "destructive" : "secondary",
													className: cn("px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em]", refreshStage === "concluido" && "border-primary/30 bg-primary/10 text-primary", refreshStage === "validando" && "border-yellow-500/30 bg-yellow-500/10 text-yellow-500", refreshStage === "baixando" && "border-sky-500/30 bg-sky-500/10 text-sky-500"),
													children: refreshStage === "validando" ? "Validando" : refreshStage === "baixando" ? "Baixando" : refreshStage === "concluido" ? "Concluído" : "Falha"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[11px] text-muted-foreground",
													children: refreshStage === "validando" ? "Conferindo o portal e preparando a leitura." : refreshStage === "baixando" ? "M3U sendo baixada e organizada por este servidor." : refreshStage === "concluido" ? "Cache pronto e isolado para este portal." : "O portal respondeu com erro ou conteúdo inválido."
												})]
											}) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between items-center",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: cn("text-xs px-2 py-0.5 rounded-full font-medium", server.is_active ? "bg-online/10 text-online" : "bg-destructive/10 text-destructive"),
													children: server.is_active ? "Ativo" : "Inativo"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														onClick: () => openServerModal(server),
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "h-4 w-4" })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "ghost",
														size: "icon",
														className: "text-destructive",
														onClick: () => handleDeleteServer(server.id),
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
													})]
												})]
											})
										] })]
									}, server.id);
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "testes",
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "border-sidebar-border bg-sidebar/20",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "space-y-4 p-5 md:p-6",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground",
													children: "Núcleo de indicação"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
													className: "text-2xl font-bold tracking-tight",
													children: "Links de Indicação (Teste Grátis)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Visual mais premium com paginação server-side para não carregar tudo de uma vez."
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											onClick: () => setTestLinkModal({
												slug: "",
												duration_minutes: 240,
												max_connections: 1,
												is_active: true
											}) || setTestLinkCreateSeed(Date.now()),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " Novo Link"]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm text-muted-foreground",
										children: testLinksTotal === 0 ? "Nenhum link de teste criado." : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											"Página ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: testLinksSafePage
											}),
											" de",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: testLinksTotalPages
											})
										] })
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "overflow-x-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "min-w-[800px]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Identificador (Slug)" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Duração" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Conexões" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Bônus" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "URL Pública" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
											className: "text-right",
											children: "Ações"
										})
									] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: testLinksPage.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										colSpan: 7,
										className: "h-24 text-center",
										children: "Carregando..."
									}) }) : testLinksItems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
										colSpan: 7,
										className: "h-24 text-center",
										children: "Nenhum link de teste criado."
									}) }) : testLinksItems.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "font-medium",
											children: link.slug
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [
											Math.floor(link.duration_minutes / 60),
											"h ",
											link.duration_minutes % 60,
											"m"
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: link.max_connections }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-xs leading-5 text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Mensal: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-semibold text-foreground",
												children: [link.bonus_days_monthly ?? 15, " dias"]
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Trimestral+: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-semibold text-foreground",
												children: [link.bonus_days_quarterly ?? 30, " dias"]
											})] })]
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("code", {
												className: "text-[10px] bg-muted px-1.5 py-0.5 rounded",
												children: ["/teste/", link.slug]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "icon",
												className: "h-6 w-6",
												type: "button",
												disabled: copyingLinkId === link.id,
												onClick: async () => {
													const url = `${window.location.origin}/teste/${link.slug}`;
													setCopyingLinkId(link.id);
													if (await copyToClipboard(url)) toast.success("URL copiada com sucesso!");
													else toast.error("Não foi possível copiar a URL.");
													setCopyingLinkId((current) => current === link.id ? null : current);
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.3 w-3.3" })
											})]
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", link.is_active ? "bg-online/10 text-online" : "bg-destructive/10 text-destructive"),
											children: link.is_active ? "Ativo" : "Inativo"
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
											className: "text-right",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-end gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													onClick: () => setTestLinkModal(link),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "h-4 w-4" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "text-destructive",
													onClick: () => handleDeleteTestLink(link.id),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
												})]
											})
										})
									] }, link.id)) })] })
								})
							}),
							testLinksTotalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "border-sidebar-border bg-sidebar/20",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-sm text-muted-foreground",
										children: [
											"Página ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: testLinksSafePage
											}),
											" de",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: testLinksTotalPages
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pagination, {
										className: "mx-0 w-auto justify-start md:justify-end",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaginationContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationPrevious, {
												href: "#",
												onClick: (event) => {
													event.preventDefault();
													setTestLinksCurrentPage((current) => Math.max(1, current - 1));
												},
												className: testLinksSafePage <= 1 ? "pointer-events-none opacity-50" : ""
											}) }),
											testLinksPaginationPages.map((page) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: page === testLinksSafePage ? "default" : "ghost",
												size: "icon",
												className: "h-9 w-9",
												onClick: () => setTestLinksCurrentPage(page),
												children: page
											}) }, page)),
											testLinksTotalPages > testLinksPaginationPages[testLinksPaginationPages.length - 1] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationEllipsis, {}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationNext, {
												href: "#",
												onClick: (event) => {
													event.preventDefault();
													setTestLinksCurrentPage((current) => Math.min(testLinksTotalPages, current + 1));
												},
												className: testLinksSafePage >= testLinksTotalPages ? "pointer-events-none opacity-50" : ""
											}) })
										] })
									})]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "configuracao",
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Configuração Central do Sistema" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Gerencie identidade, temas e textos globais do sistema." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: configQuery.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "p-8 text-center text-muted-foreground",
								children: "Carregando configurações..."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								ref: configFormRef,
								className: "grid gap-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 md:grid-cols-2 gap-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Nome do Site" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													name: "name",
													defaultValue: configQuery.data?.name
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Nome Curto" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													name: "short_name",
													defaultValue: configQuery.data?.short_name
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Domínio Principal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													name: "domain",
													defaultValue: configQuery.data?.domain
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "URL Base (DNS Cliente)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													name: "base_url",
													defaultValue: configQuery.data?.base_url
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "TMDB API Key (v3 auth)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													name: "tmdb_api_key",
													placeholder: "Insira sua chave TMDB para posters/sinopses extras",
													defaultValue: configQuery.data?.tmdb_api_key
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "XMLTV EPG URL (ddns.net/epg.xml)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													name: "epg_xmltv_url",
													placeholder: "URL para guia de programação externo",
													defaultValue: configQuery.data?.epg_xmltv_url
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-t pt-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-sm font-semibold mb-3",
											children: "Identidade Visual (Logos & Icones)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Logo Principal (URL)" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															name: "logo_url",
															placeholder: "https://exemplo.com/logo.png",
															defaultValue: configQuery.data?.logo_url
														}),
														configQuery.data?.logo_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "rounded-lg border border-border bg-background/60 p-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "mb-1 text-[10px] uppercase tracking-widest text-muted-foreground",
																children: "Preview"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																src: proxyMediaUrl(configQuery.data.logo_url) ?? configQuery.data.logo_url,
																alt: "Preview logo principal",
																className: "max-h-20 w-auto object-contain"
															})]
														}) : null
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Logo Miniatura (URL)" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															name: "logo_small_url",
															placeholder: "https://exemplo.com/logo-small.png",
															defaultValue: configQuery.data?.logo_small_url
														}),
														configQuery.data?.logo_small_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "rounded-lg border border-border bg-background/60 p-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "mb-1 text-[10px] uppercase tracking-widest text-muted-foreground",
																children: "Preview"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																src: proxyMediaUrl(configQuery.data.logo_small_url) ?? configQuery.data.logo_small_url,
																alt: "Preview logo miniatura",
																className: "max-h-16 w-auto object-contain"
															})]
														}) : null
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Favicon / Ícone (URL)" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															name: "favicon_url",
															placeholder: "https://exemplo.com/favicon.ico",
															defaultValue: configQuery.data?.favicon_url
														}),
														configQuery.data?.favicon_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "rounded-lg border border-border bg-background/60 p-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "mb-1 text-[10px] uppercase tracking-widest text-muted-foreground",
																children: "Preview"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																src: proxyMediaUrl(configQuery.data.favicon_url) ?? configQuery.data.favicon_url,
																alt: "Preview favicon",
																className: "max-h-10 w-auto object-contain"
															})]
														}) : null
													]
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-t pt-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-sm font-semibold mb-3",
											children: "Temas & Estilo"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Tema do Sistema" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
														name: "theme_mode",
														defaultValue: configQuery.data?.theme_mode || "azul",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
															className: "w-full",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecione o tema" })
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																value: "azul",
																children: "Azul (Clássico)"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																value: "dark",
																children: "Preto e Branco (Dark)"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
																value: "light",
																children: "Branco e Preto (Light)"
															})
														] })]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Cor Primária" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															name: "primary",
															type: "color",
															className: "w-12 p-1 h-10",
															defaultValue: configQuery.data?.theme?.primary
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { defaultValue: configQuery.data?.theme?.primary })]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Cor de Fundo" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															name: "bg",
															type: "color",
															className: "w-12 p-1 h-10",
															defaultValue: configQuery.data?.theme?.bg
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { defaultValue: configQuery.data?.theme?.bg })]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Título Home" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														name: "home_title",
														defaultValue: configQuery.data?.copy?.home_title
													})]
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-t pt-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-sm font-semibold mb-3",
												children: "Configuração Mercado Pago"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-1 md:grid-cols-2 gap-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Access Token (MP)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															name: "mp_access_token",
															type: "password",
															defaultValue: configQuery.data?.mp_access_token,
															placeholder: "APP_USR-..."
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Public Key (MP)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															name: "mp_public_key",
															defaultValue: configQuery.data?.mp_public_key,
															placeholder: "APP_USR-..."
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Webhook Secret (opcional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															name: "mp_webhook_secret",
															type: "password",
															defaultValue: configQuery.data?.mp_webhook_secret,
															placeholder: "Secret da assinatura do webhook"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2 pt-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															type: "checkbox",
															name: "mp_enabled",
															defaultChecked: configQuery.data?.mp_enabled,
															id: "mp-enabled",
															className: "rounded border-border bg-sidebar-accent"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															htmlFor: "mp-enabled",
															children: "Habilitar Pagamentos Automáticos"
														})]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-[10px] text-muted-foreground mt-2",
												children: ["URL de Webhook para configurar no Mercado Pago: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("code", {
													className: "bg-muted px-1 rounded",
													children: [configQuery.data?.base_url, "/api/public/mercadopago-webhook"]
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-t pt-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-sm font-semibold mb-3",
												children: "Configuração de Suporte"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-1 md:grid-cols-2 gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Nome do Atendente" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														name: "support_attendant_name",
														defaultValue: configQuery.data?.support_attendant_name,
														placeholder: "Ex: Suporte Mago"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Mensagem de Resposta Automática" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														name: "support_auto_reply",
														defaultValue: configQuery.data?.support_auto_reply,
														placeholder: "Olá! Recebemos sua mensagem..."
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground mt-2",
												children: "* A resposta automática é enviada apenas na primeira mensagem do dia de cada cliente."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-t pt-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-sm font-semibold mb-3",
												children: "Rodapé & Telegram"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "grid grid-cols-1 md:grid-cols-2 gap-4",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "@ do Telegram" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														name: "telegram_handle",
														defaultValue: configQuery.data?.telegram_handle,
														placeholder: "@contato"
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground mt-2",
												children: "Esse @ aparece no rodapé público e vira link direto para o Telegram."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex justify-end pt-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											disabled: loading,
											onClick: () => setShowConfigSaveConfirm(true),
											children: "Salvar Alterações"
										})
									})
								]
							}) })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
								open: showConfigSaveConfirm,
								onOpenChange: setShowConfigSaveConfirm,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
									className: "sm:max-w-[440px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Confirmar salvamento" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Você tem certeza que deseja salvar estas alterações na Central do Sistema? Esta ação aplica as mudanças globais imediatamente." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										onClick: () => setShowConfigSaveConfirm(false),
										disabled: loading,
										children: "Não, voltar"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										onClick: () => void handleSaveConfig(),
										disabled: loading,
										children: "Sim, salvar"
									})] })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
								open: !!saveConfirm,
								onOpenChange: (open) => !open && setSaveConfirm(null),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
									className: "sm:max-w-[440px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: saveConfirm?.title ?? "Confirmar salvamento" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: saveConfirm?.description ?? "Você tem certeza que deseja salvar estas alterações?" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										onClick: () => setSaveConfirm(null),
										disabled: loading,
										children: "Não, voltar"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										onClick: () => void confirmSaveAction(),
										disabled: loading,
										children: "Sim, salvar"
									})] })]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
						value: "suporte",
						className: "h-[70vh]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 md:grid-cols-12 gap-6 h-full",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
								className: "md:col-span-4 flex flex-col overflow-hidden bg-sidebar/30 border-sidebar-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
										className: "py-4 border-b border-sidebar-border",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
											className: "text-lg flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-5 w-5" }), " Conversas"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: threadsTotal === 0 ? "Nenhuma conversa ativa." : `Página ${threadsSafePage} de ${threadsTotalPages}`
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex-1 overflow-y-auto custom-scrollbar",
										children: threads.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "p-4 text-center",
											children: "Carregando..."
										}) : threadsItems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "p-4 text-center text-muted-foreground text-sm italic",
											children: "Nenhuma conversa ativa."
										}) : threadsItems.map((thread) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: async () => {
												setSelectedThread(thread);
												await mutationMarkRead({ data: {
													threadId: thread.id,
													isOwner: true
												} });
												queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
											},
											className: cn("w-full p-4 text-left hover:bg-primary/10 border-b border-sidebar-border transition-all flex items-center justify-between group", selectedThread?.id === thread.id && "bg-primary/20 border-l-4 border-l-primary"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0 flex-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "font-bold truncate text-sm group-hover:text-primary transition-colors",
													children: thread.profile?.display_name || thread.profile?.username || "Usuário"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-[11px] text-muted-foreground truncate opacity-70",
													children: thread.last_message || "Iniciou uma conversa"
												})]
											}), thread.unread_count_owner > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "ml-2 bg-destructive text-destructive-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg",
												children: thread.unread_count_owner
											})]
										}, thread.id))
									}),
									threadsTotalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "border-t border-sidebar-border p-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pagination, {
											className: "mx-0 w-full justify-start",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaginationContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationPrevious, {
													href: "#",
													onClick: (event) => {
														event.preventDefault();
														setThreadsPage((current) => Math.max(1, current - 1));
													},
													className: threadsSafePage <= 1 ? "pointer-events-none opacity-50" : ""
												}) }),
												threadsPaginationPages.map((page) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: page === threadsSafePage ? "default" : "ghost",
													size: "icon",
													className: "h-8 w-8",
													onClick: () => setThreadsPage(page),
													children: page
												}) }, page)),
												threadsTotalPages > threadsPaginationPages[threadsPaginationPages.length - 1] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationEllipsis, {}) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationNext, {
													href: "#",
													onClick: (event) => {
														event.preventDefault();
														setThreadsPage((current) => Math.min(threadsTotalPages, current + 1));
													},
													className: threadsSafePage >= threadsTotalPages ? "pointer-events-none opacity-50" : ""
												}) })
											] })
										})
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "md:col-span-8 flex flex-col overflow-hidden border-sidebar-border bg-sidebar/20",
								children: selectedThread ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatWindow, {
									thread: selectedThread,
									onClose: () => setSelectedThread(null)
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-20 w-20 rounded-full bg-sidebar-accent/50 flex items-center justify-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-10 w-10 opacity-20" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-bold text-lg",
										children: "Central de Atendimento"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm opacity-60",
										children: "Selecione um cliente para iniciar o suporte."
									})] })]
								})
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "planos",
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "border-sidebar-border bg-sidebar/20",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "space-y-4 p-5 md:p-6",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground",
													children: "Núcleo comercial"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
													className: "text-2xl font-bold tracking-tight",
													children: "Planos de Assinatura"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Catálogo paginado para manter a tela leve e facilitar a operação do dono."
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											onClick: () => {
												setPlanCreateSeed(Date.now());
												setPlanModal({
													name: "",
													price: 30,
													duration_value: 30,
													duration_unit: "days",
													max_connections: 1
												});
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " Novo Plano"]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm text-muted-foreground",
										children: plansTotal === 0 ? "Nenhum plano cadastrado." : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											"Página ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: plansSafePage
											}),
											" de",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: plansTotalPages
											})
										] })
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
								children: plans.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "col-span-full p-8 text-center text-muted-foreground",
									children: "Carregando planos..."
								}) : plansItems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "col-span-full p-8 text-center text-muted-foreground",
									children: "Nenhum plano cadastrado."
								}) : plansItems.map((plan) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									className: "relative overflow-hidden group",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-8 w-8",
													onClick: () => setPlanModal(plan),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "h-4 w-4" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "ghost",
													size: "icon",
													className: "h-8 w-8 text-destructive",
													onClick: () => handleDeletePlan(plan.id),
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
												})]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
											className: "flex justify-between items-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: plan.name })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-2xl font-bold text-primary",
											children: ["R$ ", Number(plan.price).toFixed(2).replace(".", ",")]
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
											className: "space-y-2 text-sm text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "h-4 w-4" }),
													" ",
													plan.duration_value,
													" ",
													plan.duration_unit === "minutes" ? "minutos" : plan.duration_unit === "hours" ? "horas" : "dias",
													" de acesso"
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, { className: "h-4 w-4" }),
													" ",
													plan.max_connections,
													" conexão(ões)"
												]
											})]
										})
									]
								}, plan.id))
							}),
							plansTotalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "border-sidebar-border bg-sidebar/20",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-sm text-muted-foreground",
										children: [
											"Página ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: plansSafePage
											}),
											" de",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: plansTotalPages
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pagination, {
										className: "mx-0 w-auto justify-start md:justify-end",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaginationContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationPrevious, {
												href: "#",
												onClick: (event) => {
													event.preventDefault();
													setPlansCurrentPage((current) => Math.max(1, current - 1));
												},
												className: plansSafePage <= 1 ? "pointer-events-none opacity-50" : ""
											}) }),
											plansPaginationPages.map((page) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: page === plansSafePage ? "default" : "ghost",
												size: "icon",
												className: "h-9 w-9",
												onClick: () => setPlansCurrentPage(page),
												children: page
											}) }, page)),
											plansTotalPages > plansPaginationPages[plansPaginationPages.length - 1] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationEllipsis, {}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationNext, {
												href: "#",
												onClick: (event) => {
													event.preventDefault();
													setPlansCurrentPage((current) => Math.min(plansTotalPages, current + 1));
												},
												className: plansSafePage >= plansTotalPages ? "pointer-events-none opacity-50" : ""
											}) })
										] })
									})]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "referencia",
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "border-sidebar-border bg-sidebar/20",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "space-y-4 p-5 md:p-6",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground",
													children: "Núcleo de indicação"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
													className: "text-2xl font-bold tracking-tight",
													children: "Links de Indicação / Teste"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Catálogo de links com paginação server-side para manter a tela leve."
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "outline",
												onClick: () => {
													const testPlan = plans.data?.find((p) => p.name.toLowerCase().includes("teste") || Number(p.price) === 0);
													setTestLinkCreateSeed(Date.now());
													setTestLinkModal({
														slug: "",
														duration_minutes: testPlan ? testPlan.duration_unit === "minutes" ? testPlan.duration_value : testPlan.duration_unit === "hours" ? testPlan.duration_value * 60 : testPlan.duration_value * 1440 : 360,
														max_connections: testPlan?.max_connections ?? 1,
														is_active: true,
														description: "",
														owner_only: false,
														allow_repeat_device: false,
														bonus_days_monthly: 15,
														bonus_days_quarterly: 30
													});
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " Novo Link Público"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												onClick: () => {
													const testPlan = plans.data?.find((p) => p.name.toLowerCase().includes("teste") || Number(p.price) === 0);
													setTestLinkCreateSeed(Date.now());
													setTestLinkModal({
														slug: "dono-livre",
														duration_minutes: testPlan ? testPlan.duration_unit === "minutes" ? testPlan.duration_value : testPlan.duration_unit === "hours" ? testPlan.duration_value * 60 : testPlan.duration_value * 1440 : 360,
														max_connections: testPlan?.max_connections ?? 1,
														is_active: true,
														description: "Link exclusivo do dono",
														owner_only: true,
														allow_repeat_device: true,
														bonus_days_monthly: 15,
														bonus_days_quarterly: 30
													});
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " Link exclusivo do dono"]
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm text-muted-foreground",
										children: testLinksTotal === 0 ? "Nenhum link de teste criado." : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											"Página ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: testLinksSafePage
											}),
											" de",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: testLinksTotalPages
											})
										] })
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Slug / Identificador" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Criado Por" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Acesso" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Duração" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Conexões" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Bônus" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
									className: "text-right",
									children: "Ações"
								})
							] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: testLinksPage.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								colSpan: 8,
								className: "h-24 text-center text-muted-foreground",
								children: "Carregando..."
							}) }) : testLinksItems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								colSpan: 8,
								className: "h-24 text-center text-muted-foreground",
								children: "Nenhum link de teste criado."
							}) }) : testLinksItems.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "font-mono text-xs",
									children: link.slug
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: link.profile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs font-bold text-primary",
									children: ["@", link.profile.username]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground italic",
									children: "Sistema / dono"
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-1",
									children: [link.owner_only || link.slug === "dono-livre" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "text-[9px] uppercase font-bold",
										children: "Exclusivo do dono"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "text-[9px] uppercase font-bold",
										children: "Público"
									}), link.owner_only || link.slug === "dono-livre" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "text-[9px] uppercase font-bold border-online/30 text-online",
										children: "Sem Bloqueio"
									}) : null]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
									className: "text-xs",
									children: [link.duration_minutes, " min"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
									className: "text-xs",
									children: [link.max_connections, " conn"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs leading-5 text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Mensal: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold text-foreground",
										children: [link.bonus_days_monthly ?? 15, " dias"]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Trimestral+: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold text-foreground",
										children: [link.bonus_days_quarterly ?? 30, " dias"]
									})] })]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("text-[10px] px-2 py-0.5 rounded-full", link.is_active ? "bg-online/10 text-online" : "bg-destructive/10 text-destructive"),
									children: link.is_active ? "Ativo" : "Inativo"
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-end gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "icon",
												type: "button",
												disabled: copyingLinkId === link.id,
												onClick: async () => {
													const url = `${window.location.origin}/teste/${link.slug}`;
													setCopyingLinkId(link.id);
													if (await copyToClipboard(url)) toast.success("Link copiado!");
													else toast.error("Não foi possível copiar o link.");
													setCopyingLinkId((current) => current === link.id ? null : current);
												},
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-4 w-4" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "icon",
												onClick: () => setTestLinkModal(link),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "h-4 w-4" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "icon",
												className: "text-destructive",
												onClick: () => handleDeleteTestLink(link.id),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" })
											})
										]
									})
								})
							] }, link.id)) })] }) }),
							testLinksTotalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
								className: "border-sidebar-border bg-sidebar/20",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
									className: "flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-sm text-muted-foreground",
										children: [
											"Página ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: testLinksSafePage
											}),
											" de",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-foreground",
												children: testLinksTotalPages
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pagination, {
										className: "mx-0 w-auto justify-start md:justify-end",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaginationContent, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationPrevious, {
												href: "#",
												onClick: (event) => {
													event.preventDefault();
													setTestLinksCurrentPage((current) => Math.max(1, current - 1));
												},
												className: testLinksSafePage <= 1 ? "pointer-events-none opacity-50" : ""
											}) }),
											testLinksPaginationPages.map((page) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: page === testLinksSafePage ? "default" : "ghost",
												size: "icon",
												className: "h-9 w-9",
												onClick: () => setTestLinksCurrentPage(page),
												children: page
											}) }, page)),
											testLinksTotalPages > testLinksPaginationPages[testLinksPaginationPages.length - 1] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationEllipsis, {}) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationNext, {
												href: "#",
												onClick: (event) => {
													event.preventDefault();
													setTestLinksCurrentPage((current) => Math.min(testLinksTotalPages, current + 1));
												},
												className: testLinksSafePage >= testLinksTotalPages ? "pointer-events-none opacity-50" : ""
											}) })
										] })
									})]
								})
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!serverModal,
				onOpenChange: (o) => !o && setServerModal(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSaveServer,
						autoComplete: "off",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								"aria-hidden": "true",
								tabIndex: -1,
								className: "sr-only",
								autoComplete: "username",
								name: "server-modal-username-hint"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								"aria-hidden": "true",
								tabIndex: -1,
								className: "sr-only",
								type: "password",
								autoComplete: "current-password",
								name: "server-modal-password-hint"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: serverModal?.id ? `Editar ${portalName(Number(serverModal.sort_order) || 0)}` : "Novo portal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "O nome é definido automaticamente pela ordem. Configure abaixo a origem Xtream Codes." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-primary/20 bg-primary/5 px-3 py-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] font-black uppercase tracking-[0.2em] text-primary",
												children: "Identificação automática"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-sm font-semibold",
												children: portalName(Number(serverModal?.sort_order) || 0)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-[10px] text-muted-foreground",
												children: "A identificação acompanha a ordem definida no arraste."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "DNS do servidor (ex: http://link.site:80)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											name: "server_dns",
											autoComplete: "off",
											value: serverModal?.credentials?.[0]?.dns || "",
											onChange: (e) => {
												const creds = [...serverModal.credentials || []];
												creds[0] = {
													...creds[0] || {},
													dns: e.target.value
												};
												setServerModal({
													...serverModal,
													credentials: creds
												});
											},
											placeholder: serverModal?.id ? "Deixe em branco para manter o DNS atual" : "Obrigatório para novo servidor"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Conexões contratadas neste servidor (opcional)" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												min: 1,
												max: 1e6,
												value: serverModal?.connection_capacity ?? "",
												onChange: (event) => {
													const value = event.target.value;
													setServerModal({
														...serverModal,
														connection_capacity: value ? Number(value) : null
													});
												},
												placeholder: "Ex.: 1000"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Limita conexões simultâneas deste servidor; a quantidade de servidores cadastrados não limita ativos."
											})
										]
									}),
									serverModal?.can_edit_owner_note ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "owner_note",
												children: "Observação privada do dono"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
												id: "owner_note",
												name: "owner_note",
												value: serverModal?.owner_note ?? "",
												onChange: (event) => setServerModal({
													...serverModal,
													owner_note: event.target.value
												}),
												placeholder: "Ex.: referência interna do servidor conectado, contrato, região ou observação operacional.",
												maxLength: 2e3,
												rows: 4
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Visível e editável somente pelo dono. Usuários e administradores não recebem este conteúdo."
											})
										]
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Usuário da API" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												name: "server_api_username",
												autoComplete: "new-password",
												"data-lpignore": "true",
												value: serverModal?.credentials?.[0]?.username || "",
												onChange: (e) => {
													const creds = [...serverModal.credentials || []];
													creds[0] = {
														...creds[0] || {},
														username: e.target.value
													};
													setServerModal({
														...serverModal,
														credentials: creds
													});
												},
												placeholder: serverModal?.id ? "Deixe em branco para manter o usuário atual" : "Obrigatório para novo servidor"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Senha da API" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "password",
												name: "server_api_password",
												autoComplete: "new-password",
												"data-lpignore": "true",
												value: serverModal?.credentials?.[0]?.password || "",
												onChange: (e) => {
													const creds = [...serverModal.credentials || []];
													creds[0] = {
														...creds[0] || {},
														password: e.target.value
													};
													setServerModal({
														...serverModal,
														credentials: creds
													});
												},
												placeholder: serverModal?.id ? "Deixe em branco para manter a senha atual" : "Obrigatório para novo servidor"
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-muted-foreground -mt-2",
										children: "Ao editar, os dados atuais do servidor já vêm preenchidos. Se você apagar algum campo e salvar, o sistema mantém o valor atual."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "bulk_action",
												children: "Ação em massa para usuários"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: serverModal?.bulk_action || "none",
												onValueChange: (val) => setServerModal({
													...serverModal,
													bulk_action: val
												}),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													id: "bulk_action",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Escolha uma ação" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "none",
														children: "Nenhuma (apenas salvar servidor)"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "add_to_all",
														children: "Adicionar este servidor para todos os usuários"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "remove_from_all",
														children: "Remover este servidor de todos os usuários"
													})
												] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground mt-1",
												children: "* A ação será executada ao clicar em Salvar."
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setServerModal(null),
								children: "Cancelar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: loading,
								children: loading ? "Salvando..." : "Salvar"
							})] })
						]
					})
				}, serverModal?.id ? `server-edit-${serverModal.id}` : `server-create-${serverCreateSeed}`)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!userModal,
				onOpenChange: (o) => !o && setUserModal(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSaveUser,
						autoComplete: "off",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: userModal?.id ? "Editar acesso" : "Novo acesso" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Gere credenciais para seu cliente acessar o sistema." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Plano de assinatura (opcional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: userModal?.plan_id || "none",
											onValueChange: (val) => {
												const planId = val === "none" ? null : val;
												const selectedPlan = plans.data?.find((p) => p.id === planId);
												const updates = { plan_id: planId };
												if (selectedPlan) {
													updates.max_connections = selectedPlan.max_connections;
													const expiry = /* @__PURE__ */ new Date();
													const factor = selectedPlan.duration_unit === "minutes" ? 6e4 : selectedPlan.duration_unit === "hours" ? 36e5 : 864e5;
													const msToAdd = selectedPlan.duration_value * factor;
													expiry.setTime(expiry.getTime() + msToAdd);
													updates.expires_at = expiry.toISOString();
												}
												setUserModal({
													...userModal,
													...updates
												});
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecione um plano" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "none",
												children: "Personalizado (Sem plano)"
											}), plans.data?.map((plan) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
												value: plan.id,
												children: [
													plan.name,
													" - R$ ",
													Number(plan.price).toFixed(2).replace(".", ",")
												]
											}, plan.id))] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Nome de exibição (opcional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											autoComplete: "off",
											value: userModal?.display_name || "",
											onChange: (e) => setUserModal({
												...userModal,
												display_name: e.target.value
											}),
											placeholder: "Ex: José da Silva"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Usuário" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												name: "user_access_username",
												autoComplete: "off",
												value: userModal?.username || "",
												onChange: (e) => setUserModal({
													...userModal,
													username: e.target.value
												}),
												disabled: !!userModal?.id,
												required: true
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: userModal?.id ? "Nova senha (opcional)" : "Senha" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "password",
												name: "user_access_password",
												autoComplete: "off",
												value: userModal?.password || "",
												onChange: (e) => setUserModal({
													...userModal,
													password: e.target.value
												}),
												required: !userModal?.id
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Máx. conexões" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												min: "1",
												max: "20",
												autoComplete: "off",
												value: userModal?.max_connections || 1,
												onChange: (e) => setUserModal({
													...userModal,
													max_connections: parseInt(e.target.value)
												}),
												required: true
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Vencimento (UTC)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "datetime-local",
												autoComplete: "off",
												value: userModal?.expires_at ? new Date(userModal.expires_at).toISOString().slice(0, 16) : "",
												onChange: (e) => setUserModal({
													...userModal,
													expires_at: e.target.value ? new Date(e.target.value).toISOString() : null
												})
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Servidores liberados" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md",
											children: servers.data?.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "flex items-center gap-2 text-sm cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: (userModal?.server_ids || []).includes(s.id),
													onChange: (e) => {
														const ids = [...userModal.server_ids || []];
														if (e.target.checked) ids.push(s.id);
														else {
															const idx = ids.indexOf(s.id);
															if (idx > -1) ids.splice(idx, 1);
														}
														setUserModal({
															...userModal,
															server_ids: ids
														});
													}
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "truncate",
													children: s.name
												})]
											}, s.id))
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setUserModal(null),
								children: "Cancelar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: loading,
								children: "Salvar acesso"
							})] })
						]
					})
				}, userModal?.id ? `user-edit-${userModal.id}` : `user-create-${userCreateSeed}`)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!testLinkModal,
				onOpenChange: (open) => !open && setTestLinkModal(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-[425px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSaveTestLink,
						autoComplete: "off",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: testLinkModal?.id ? "Editar Link" : "Novo Link de Teste" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Configure o link que será enviado para novos clientes." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "slug",
											children: "Slug do Link (Ex: promo-4h)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "slug",
											name: "test_link_slug",
											autoComplete: "off",
											value: testLinkModal?.slug || "",
											onChange: (e) => setTestLinkModal({
												...testLinkModal,
												slug: e.target.value
											}),
											placeholder: "identificador-unico",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "description",
												children: "Descrição para o Usuário"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "description",
												name: "test_link_description",
												autoComplete: "off",
												value: testLinkModal?.description || "",
												onChange: (e) => setTestLinkModal({
													...testLinkModal,
													description: e.target.value
												}),
												placeholder: "Ex: Teste Premium com Canais 4K"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Esta descrição aparecerá na aba Conta do usuário."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 gap-3 rounded-xl border border-border/60 bg-muted/20 p-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "flex items-center gap-2 text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: !!testLinkModal?.owner_only,
													onChange: (e) => setTestLinkModal({
														...testLinkModal,
														owner_only: e.target.checked
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Exclusivo do dono" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "flex items-center gap-2 text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: !!testLinkModal?.allow_repeat_device,
													onChange: (e) => setTestLinkModal({
														...testLinkModal,
														allow_repeat_device: e.target.checked
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Não bloquear o mesmo dispositivo" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground",
												children: "Use o modo exclusivo para links privados do dono. O modo sem bloqueio permite criar vários testes no mesmo navegador sem travar o aparelho."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2 relative",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "absolute -top-1 right-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														variant: "outline",
														className: "text-[9px] font-bold uppercase py-0 px-1 border-primary/30 text-primary",
														children: "Herdado do Plano Teste"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "duration",
													className: "opacity-70",
													children: "Duração do Teste (minutos)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													id: "duration",
													name: "test_link_duration",
													autoComplete: "off",
													type: "number",
													value: testLinkModal?.duration_minutes || 240,
													readOnly: true,
													className: "bg-muted/50 cursor-not-allowed"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] text-muted-foreground",
													children: "Configurado automaticamente pelo Plano Teste."
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2 relative",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "absolute -top-1 right-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
														variant: "outline",
														className: "text-[9px] font-bold uppercase py-0 px-1 border-primary/30 text-primary",
														children: "Herdado do Plano Teste"
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "conn",
													className: "opacity-70",
													children: "Limite de Conexões"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													id: "conn",
													name: "test_link_connections",
													autoComplete: "off",
													type: "number",
													value: testLinkModal?.max_connections || 1,
													readOnly: true,
													className: "bg-muted/50 cursor-not-allowed"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[10px] text-muted-foreground",
													children: "Configurado automaticamente pelo Plano Teste."
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 py-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											id: "active-link",
											checked: testLinkModal?.is_active ?? true,
											onChange: (e) => setTestLinkModal({
												...testLinkModal,
												is_active: e.target.checked
											}),
											className: "rounded border-border bg-sidebar-accent"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "active-link",
											children: "Link Ativo"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-4 pt-4 border-t border-border/50",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
												className: "text-sm font-bold text-primary flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "h-4 w-4" }), " Bonificação (Configuração Global para este Link)"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															className: "text-xs",
															children: "Bônus Mensal (Dias)"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															name: "test_link_bonus_monthly",
															autoComplete: "off",
															type: "number",
															value: testLinkModal?.bonus_days_monthly ?? 15,
															onChange: (e) => setTestLinkModal({
																...testLinkModal,
																bonus_days_monthly: parseInt(e.target.value) || 0
															}),
															placeholder: "15",
															className: "h-8"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[10px] text-muted-foreground",
															children: "Para planos de até 30 dias."
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
															className: "text-xs",
															children: "Bônus Trimestral+ (Dias)"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															name: "test_link_bonus_quarterly",
															autoComplete: "off",
															type: "number",
															value: testLinkModal?.bonus_days_quarterly ?? 30,
															onChange: (e) => setTestLinkModal({
																...testLinkModal,
																bonus_days_quarterly: parseInt(e.target.value) || 0
															}),
															placeholder: "30",
															className: "h-8"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-[10px] text-muted-foreground",
															children: [
																"Para planos ",
																" > ",
																" 30 dias."
															]
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-muted-foreground italic",
												children: "* Estas regras valem para qualquer usuário que usar este link específico."
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: loading,
								children: loading ? "Salvando..." : "Salvar Link"
							}) })
						]
					})
				}, testLinkModal?.id ? `test-link-edit-${testLinkModal.id}` : `test-link-create-${testLinkCreateSeed}`)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!planModal,
				onOpenChange: (o) => !o && setPlanModal(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-[425px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSavePlan,
						autoComplete: "off",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: planModal?.id ? "Editar Plano" : "Novo Plano" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Configure os detalhes do plano de assinatura." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "plan-name",
											children: "Nome do Plano"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "plan-name",
											name: "plan_name",
											autoComplete: "off",
											value: planModal?.name || "",
											onChange: (e) => setPlanModal({
												...planModal,
												name: e.target.value
											}),
											placeholder: "Ex: Plano Mensal",
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "plan-price",
												children: "Valor (R$)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "plan-price",
												name: "plan_price",
												autoComplete: "off",
												type: "number",
												step: "0.01",
												value: planModal?.price || 0,
												onChange: (e) => setPlanModal({
													...planModal,
													price: parseFloat(e.target.value)
												}),
												required: true
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "plan-duration",
												children: "Duração"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													id: "plan-duration",
													name: "plan_duration_value",
													autoComplete: "off",
													type: "number",
													className: "flex-1",
													value: planModal?.duration_value || 30,
													onChange: (e) => setPlanModal({
														...planModal,
														duration_value: parseInt(e.target.value)
													}),
													required: true
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: planModal?.duration_unit || "days",
													onValueChange: (val) => setPlanModal({
														...planModal,
														duration_unit: val
													}),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
														className: "w-[110px]",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
															value: "days",
															children: "Dias"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
															value: "hours",
															children: "Horas"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
															value: "minutes",
															children: "Minutos"
														})
													] })]
												})]
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "plan-conn",
											children: "Máximo de Conexões"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "plan-conn",
											name: "plan_max_connections",
											autoComplete: "off",
											type: "number",
											min: "1",
											value: planModal?.max_connections || 1,
											onChange: (e) => setPlanModal({
												...planModal,
												max_connections: parseInt(e.target.value)
											}),
											required: true
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setPlanModal(null),
								children: "Cancelar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: loading,
								children: "Salvar Plano"
							})] })
						]
					})
				}, planModal?.id ? `plan-edit-${planModal.id}` : `plan-create-${planCreateSeed}`)
			})
		]
	});
}
function ChatWindow({ thread, onClose }) {
	const queryClient = useQueryClient();
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [newMessage, setNewMessage] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const [messagesPage, setMessagesPage] = (0, import_react.useState)(1);
	const messagesPageSize = 25;
	const scrollRef = (0, import_react.useRef)(null);
	const fileInputRef = (0, import_react.useRef)(null);
	const fetchMessagesPage = useServerFn(listSupportMessagesPage);
	const messagesQuery = useQuery({
		queryKey: [
			"support-messages-page",
			thread.id,
			messagesPage,
			messagesPageSize
		],
		queryFn: () => fetchMessagesPage({ data: {
			threadId: thread.id,
			page: messagesPage,
			page_size: messagesPageSize
		} }),
		placeholderData: (previous) => previous
	});
	const messagesTotal = messagesQuery.data?.total ?? 0;
	const messagesTotalPages = Math.max(1, Math.ceil(messagesTotal / messagesPageSize));
	const messagesSafePage = Math.min(messagesPage, messagesTotalPages);
	const messagesPaginationPages = (0, import_react.useMemo)(() => {
		const windowSize = 5;
		if (messagesTotalPages <= windowSize) return Array.from({ length: messagesTotalPages }, (_, index) => index + 1);
		const start = Math.max(1, Math.min(messagesSafePage - 2, messagesTotalPages - 4));
		const end = Math.min(messagesTotalPages, start + windowSize - 1);
		return Array.from({ length: end - start + 1 }, (_, index) => start + index);
	}, [messagesSafePage, messagesTotalPages]);
	(0, import_react.useEffect)(() => {
		setMessagesPage(1);
	}, [thread.id]);
	(0, import_react.useEffect)(() => {
		setMessages(messagesQuery.data?.items ?? []);
	}, [messagesQuery.data, thread.id]);
	(0, import_react.useEffect)(() => {
		const channel = supabase.channel(`thread:${thread.id}`).on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "support_messages",
			filter: `thread_id=eq.${thread.id}`
		}, (payload) => {
			if (messagesPage === 1) setMessages((prev) => {
				if (prev.some((message) => message.id === payload.new.id)) return prev;
				return [...prev, payload.new];
			});
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [thread.id, messagesPage]);
	(0, import_react.useEffect)(() => {
		scrollRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);
	const handleSend = async (e) => {
		e?.preventDefault();
		if (!newMessage.trim()) return;
		setSending(true);
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) return;
		try {
			const { data: configData } = await supabase.from("app_config").select("config").maybeSingle();
			const attendantName = (configData?.config || {}).support_attendant_name || "Suporte";
			const { error } = await supabase.from("support_messages").insert([{
				thread_id: thread.id,
				sender_id: session.user.id,
				content: `${attendantName}: ${newMessage}`,
				message_type: "support_reply"
			}]);
			if (error) throw error;
			await supabase.from("support_threads").update({
				last_message: newMessage,
				last_message_at: (/* @__PURE__ */ new Date()).toISOString(),
				unread_count_user: (thread.unread_count_user || 0) + 1
			}).eq("id", thread.id);
			setNewMessage("");
			setMessagesPage(1);
			queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
		} catch (err) {
			toast.error("Erro ao enviar: " + err.message);
		} finally {
			setSending(false);
		}
	};
	const handleFileUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setSending(true);
		try {
			const fileExt = file.name.split(".").pop();
			const fileName = `${Math.random()}.${fileExt}`;
			const filePath = `chat/${thread.id}/${fileName}`;
			const { error: uploadError } = await supabase.storage.from("chat-files-v2").upload(filePath, file);
			if (uploadError) throw uploadError;
			const { data: signed, error: signErr } = await supabase.storage.from("chat-files-v2").createSignedUrl(filePath, 31536e3);
			if (signErr) throw signErr;
			const publicUrl = signed.signedUrl;
			const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "file";
			const { data: { session } } = await supabase.auth.getSession();
			await supabase.from("support_messages").insert([{
				thread_id: thread.id,
				sender_id: session?.user.id,
				file_url: publicUrl,
				file_type: fileType,
				content: `Enviou um ${fileType}`,
				message_type: "support_reply"
			}]);
			toast.success("Arquivo enviado!");
		} catch (err) {
			toast.error("Erro no upload: " + err.message);
		} finally {
			setSending(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col h-full",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-4 border-b flex items-center justify-between bg-muted/20",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold",
						children: (thread.profile?.display_name || thread.profile?.username || "?")[0].toUpperCase()
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-semibold text-sm",
						children: thread.profile?.display_name || thread.profile?.username
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-[10px] text-online font-medium flex items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-online animate-pulse" }), " Online"]
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					onClick: onClose,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-y-auto p-4 space-y-4 bg-sidebar-accent/10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 rounded-2xl border border-sidebar-border/60 bg-sidebar/40 p-3 lg:flex-row lg:items-center lg:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: messagesTotal === 0 ? "Nenhuma mensagem nesta conversa." : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								"Página ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-foreground",
									children: messagesSafePage
								}),
								" de",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-foreground",
									children: messagesTotalPages
								})
							] })
						}), messagesTotalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pagination, {
							className: "mx-0 w-auto justify-start lg:justify-end",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaginationContent, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationPrevious, {
									href: "#",
									onClick: (event) => {
										event.preventDefault();
										setMessagesPage((current) => Math.max(1, current - 1));
									},
									className: messagesSafePage <= 1 ? "pointer-events-none opacity-50" : ""
								}) }),
								messagesPaginationPages.map((page) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: page === messagesSafePage ? "default" : "ghost",
									size: "icon",
									className: "h-9 w-9",
									onClick: () => setMessagesPage(page),
									children: page
								}) }, page)),
								messagesTotalPages > messagesPaginationPages[messagesPaginationPages.length - 1] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationEllipsis, {}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationNext, {
									href: "#",
									onClick: (event) => {
										event.preventDefault();
										setMessagesPage((current) => Math.min(messagesTotalPages, current + 1));
									},
									className: messagesSafePage >= messagesTotalPages ? "pointer-events-none opacity-50" : ""
								}) })
							] })
						})]
					}),
					messagesQuery.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-2xl border border-sidebar-border/60 bg-sidebar/30 p-6 text-center text-sm text-muted-foreground",
						children: "Carregando mensagens..."
					}) : null,
					messages.map((msg) => {
						const isMe = msg.sender_id === thread.user_id ? false : true;
						const messageType = inferSupportMessageType(msg, thread.user_id);
						const messageMeta = getSupportMessageTypeMeta(messageType);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("flex", isMe ? "justify-end" : "justify-start"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("max-w-[80%] rounded-2xl px-4 py-2 text-sm", isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"),
								children: [
									messageType !== "user_message" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mb-1 flex items-center gap-1.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]", messageMeta.className),
											children: messageMeta.label
										})
									}),
									msg.file_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-2",
										children: msg.file_type === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: msg.file_url,
											alt: "Imagem",
											className: "max-w-full rounded-lg cursor-pointer hover:opacity-90",
											onClick: () => window.open(msg.file_url)
										}) : msg.file_type === "audio" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
											controls: true,
											src: msg.file_url,
											className: "w-full max-w-[200px]"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: msg.file_url,
											target: "_blank",
											className: "flex items-center gap-2 underline",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-4 w-4" }), " Ver Arquivo"]
										})
									}) : msg.content,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] mt-1 opacity-60 text-right",
										children: new Date(msg.created_at).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit"
										})
									})
								]
							})
						}, msg.id);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: scrollRef })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
				onSubmit: handleSend,
				className: "p-4 border-t bg-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							ref: fileInputRef,
							className: "hidden",
							onChange: handleFileUpload,
							accept: "image/*,audio/*"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "icon",
							className: "text-muted-foreground",
							onClick: () => fileInputRef.current?.click(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-5 w-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							placeholder: "Digite sua mensagem...",
							value: newMessage,
							onChange: (e) => setNewMessage(e.target.value),
							className: "flex-1 bg-muted/40 border-none focus-visible:ring-1"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							size: "icon",
							disabled: sending || !newMessage.trim(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" })
						})
					]
				})
			})
		]
	});
}
//#endregion
export { PainelDono as component };
