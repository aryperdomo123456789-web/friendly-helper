import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as supabase } from "./client-DUSZWvd2.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { I as History, P as Image, d as Star, et as BadgeCheck, n as X, p as ShieldCheck, v as Send, w as MessageSquare, y as Search } from "../_libs/lucide-react.mjs";
import { l as useServerFn, s as cn } from "./router-Bn3HbVDc.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { r as usePlayerSession } from "./player-store-DqV4LM-I.mjs";
import { t as Input } from "./input-CHBzvTqI.mjs";
import { t as Button } from "./button-yGYLwFt-.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-QfwOCRSd.mjs";
import { t as UserPageShell } from "./user-page-shell-zZbt5T2D.mjs";
import { a as getSupportStatusMeta } from "./chat-policy-DsA529M1.mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, t as Card } from "./card-CoVGGRJy.mjs";
import { t as Badge } from "./badge--9IDYdU8.mjs";
import { a as listSupportMessagesPage, c as markThreadRead, d as sendSupportMessage, f as sendSupportOwnerMessage, i as listMySupportThreads, l as respondToClosurePrompt, m as updateSupportThreadOperations, n as getOrCreateThread, p as submitSupportSatisfaction, r as getSupportStats, s as listSupportThreadsPage, t as closeSupportThread, u as sendSupportAttachment } from "./chat.functions-y6IPnhZ4.mjs";
import { a as PaginationNext, c as inferSupportMessageType, i as PaginationItem, n as PaginationContent, o as PaginationPrevious, r as PaginationEllipsis, s as getSupportMessageTypeMeta, t as Pagination } from "./pagination-CPYV9jMi.mjs";
import { a as DialogHeader, c as Tabs, d as TabsTrigger, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog, u as TabsList } from "./dialog-D3nhANRa.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/suporte-Cy6l62Ei.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SuportePage() {
	const { isOwner, profile, authUserId } = usePlayerSession();
	const queryClient = useQueryClient();
	const fetchThreadsPage = useServerFn(listSupportThreadsPage);
	const fetchMyThreads = useServerFn(listMySupportThreads);
	const mutationMarkRead = useServerFn(markThreadRead);
	const fetchOrCreateThread = useServerFn(getOrCreateThread);
	const fetchSupportStats = useServerFn(getSupportStats);
	const [threadsPage, setThreadsPage] = (0, import_react.useState)(1);
	const threadsPageSize = 10;
	const [ownerView, setOwnerView] = (0, import_react.useState)("atendimento");
	const [ownerSearch, setOwnerSearch] = (0, import_react.useState)("");
	const [ownerStatus, setOwnerStatus] = (0, import_react.useState)("all");
	const [ownerPriority, setOwnerPriority] = (0, import_react.useState)("all");
	const threads = useQuery({
		queryKey: [
			"support-threads-page",
			threadsPage,
			threadsPageSize,
			ownerStatus,
			ownerPriority,
			ownerSearch
		],
		queryFn: () => fetchThreadsPage({ data: {
			page: threadsPage,
			page_size: threadsPageSize,
			...ownerStatus !== "all" ? { status: ownerStatus } : {},
			...ownerPriority !== "all" ? { priority: ownerPriority } : {},
			...ownerSearch.trim() ? { search: ownerSearch.trim() } : {}
		} }),
		enabled: isOwner,
		refetchInterval: 1e4,
		placeholderData: (previous) => previous
	});
	(0, import_react.useEffect)(() => {
		setThreadsPage(1);
	}, [
		ownerSearch,
		ownerStatus,
		ownerPriority
	]);
	const threadsTotal = threads.data?.total ?? 0;
	const threadsTotalPages = Math.max(1, Math.ceil(threadsTotal / threadsPageSize));
	const threadsSafePage = Math.min(threadsPage, threadsTotalPages);
	const threadsPaginationPages = (0, import_react.useMemo)(() => {
		const windowSize = 5;
		if (threadsTotalPages <= windowSize) return Array.from({ length: threadsTotalPages }, (_, index) => index + 1);
		const start = Math.max(1, Math.min(threadsSafePage - 2, threadsTotalPages - 4));
		const end = Math.min(threadsTotalPages, start + windowSize - 1);
		return Array.from({ length: end - start + 1 }, (_, index) => start + index);
	}, [threadsSafePage, threadsTotalPages]);
	const effectiveUserId = profile?.id ?? authUserId ?? null;
	const userThreadQuery = useQuery({
		queryKey: ["support-thread-user", effectiveUserId],
		queryFn: () => fetchOrCreateThread({ data: { userId: effectiveUserId } }),
		enabled: !!effectiveUserId && !isOwner
	});
	const myThreadsQuery = useQuery({
		queryKey: ["support-my-threads", effectiveUserId],
		queryFn: () => fetchMyThreads(),
		enabled: !!effectiveUserId && !isOwner,
		placeholderData: (previous) => previous
	});
	const statsQuery = useQuery({
		queryKey: ["support-stats"],
		queryFn: () => fetchSupportStats(),
		enabled: isOwner && ownerView === "estatisticas"
	});
	const supportStats = statsQuery.data;
	const satisfactionAverage = Number(supportStats?.satisfaction_average ?? 0);
	(0, import_react.useEffect)(() => {
		if (!isOwner) return;
		const channel = supabase.channel("support_threads_page").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "support_threads"
		}, () => {
			queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [isOwner, queryClient]);
	const [selectedThread, setSelectedThread] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!isOwner && userThreadQuery.data) setSelectedThread(userThreadQuery.data);
	}, [userThreadQuery.data, isOwner]);
	if (!effectiveUserId && !isOwner) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-[70vh] items-center justify-center text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "mx-auto h-16 w-16 opacity-10" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-bold",
				children: "Carregando perfil..."
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPageShell, {
		title: isOwner ? "Suporte ao Vivo" : "Histórico de Suporte",
		description: "",
		icon: MessageSquare,
		children: isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs, {
				value: ownerView,
				onValueChange: (value) => setOwnerView(value),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
					className: "grid h-11 w-full max-w-xl grid-cols-2 bg-muted/40",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "atendimento",
						className: "text-sm font-semibold",
						children: "Atendimento"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "estatisticas",
						className: "text-sm font-semibold",
						children: "Estatísticas"
					})]
				})
			}), ownerView === "atendimento" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 h-[75vh] grid-cols-1 md:grid-cols-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "md:col-span-4 flex flex-col overflow-hidden bg-sidebar/30 border-sidebar-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
							className: "py-4 border-b border-sidebar-border",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
										className: "text-lg flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-5 w-5" }), " Conversas"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: threadsTotal === 0 ? "Nenhuma conversa ativa." : `Página ${threadsSafePage} de ${threadsTotalPages}`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2 pt-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												value: ownerSearch,
												onChange: (event) => setOwnerSearch(event.target.value),
												placeholder: "Buscar por protocolo",
												className: "h-9 pl-9 bg-background/60",
												"aria-label": "Buscar conversa por protocolo"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: ownerStatus,
												onValueChange: (value) => setOwnerStatus(value),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													"aria-label": "Filtrar por status",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Status" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "all",
														children: "Todos os status"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "pending_support",
														children: "Aguardando suporte"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "pending_customer",
														children: "Aguardando cliente"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "open",
														children: "Aberto"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "closed",
														children: "Fechado"
													})
												] })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: ownerPriority,
												onValueChange: (value) => setOwnerPriority(value),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
													"aria-label": "Filtrar por prioridade",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Prioridade" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "all",
														children: "Todas prioridades"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "urgent",
														children: "Urgente"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "high",
														children: "Alta"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "normal",
														children: "Normal"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "low",
														children: "Baixa"
													})
												] })]
											})]
										})]
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 overflow-y-auto custom-scrollbar",
							children: threads.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "p-4 text-center",
								children: "Carregando..."
							}) : (threads.data?.items ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "p-4 text-center text-muted-foreground text-sm italic",
								children: "Nenhuma conversa ativa."
							}) : threads.data?.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									setSelectedThread(item);
									mutationMarkRead({ data: {
										threadId: item.id,
										isOwner: true
									} });
									queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
								},
								"data-tv-focus": true,
								className: cn("w-full p-4 text-left hover:bg-primary/10 border-b border-sidebar-border transition-all flex items-center justify-between group", selectedThread?.id === item.id && "bg-primary/20 border-l-4 border-l-primary"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-bold truncate text-sm group-hover:text-primary transition-colors",
											children: item.profile?.display_name || item.profile?.username || "Usuário"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: item.status === "closed" ? "secondary" : "default",
											className: "text-[9px] uppercase",
											children: getSupportStatusMeta(item.status).label
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[11px] text-muted-foreground truncate opacity-70",
										children: [item.protocol ? `#${item.protocol} · ` : "", item.last_message || "Iniciou uma conversa"]
									})]
								}), item.unread_count_owner > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 bg-destructive text-destructive-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg animate-bounce",
									children: item.unread_count_owner
								})]
							}, item.id))
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
									threadsTotalPages > (threadsPaginationPages[threadsPaginationPages.length - 1] ?? threadsSafePage) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationEllipsis, {}) }),
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
						onClose: () => setSelectedThread(null),
						isOwner
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
							children: "Selecione um cliente ao lado para iniciar o suporte."
						})] })]
					})
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 xl:grid-cols-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "xl:col-span-1 border-sidebar-border bg-sidebar/30",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "pb-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
							className: "text-lg flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-5 w-5" }), " Resumo"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-border/70 bg-background/70 p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground",
								children: "Totais"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Aberto"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-2xl font-black text-foreground",
									children: statsQuery.data?.open_threads ?? 0
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Fechado"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-2xl font-black text-foreground",
									children: statsQuery.data?.closed_threads ?? 0
								})] })]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-border/70 bg-background/70 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground",
									children: "Satisfação"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-3xl font-black text-primary",
									children: satisfactionAverage.toFixed(2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground",
									children: [
										"Base: ",
										statsQuery.data?.satisfaction_count ?? 0,
										" avaliação(ões)"
									]
								})
							]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "xl:col-span-3 border-sidebar-border bg-sidebar/20",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "border-b border-sidebar-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
							className: "text-lg flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-5 w-5" }), " Distribuição 1 a 5"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5",
						children: (statsQuery.data?.distribution ?? [
							1,
							2,
							3,
							4,
							5
						].map((score) => ({
							score,
							count: 0
						}))).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-border/70 bg-background/70 p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs font-black uppercase tracking-[0.18em] text-muted-foreground",
										children: ["Nota ", item.score]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "secondary",
										className: "text-[10px]",
										children: item.count
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-3xl font-black",
									children: item.count
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Resultados registrados"
								})
							]
						}, item.score))
					})]
				})]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 h-[75vh] grid-cols-1 md:grid-cols-12",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "md:col-span-4 flex flex-col overflow-hidden bg-sidebar/30 border-sidebar-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
					className: "py-4 border-b border-sidebar-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
							className: "text-lg flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "h-5 w-5" }), " Meu histórico"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground",
							children: myThreadsQuery.isLoading ? "Carregando histórico..." : `${(myThreadsQuery.data ?? []).length} atendimento(s) encontrados`
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 overflow-y-auto custom-scrollbar",
					children: myThreadsQuery.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-4 text-center",
						children: "Carregando..."
					}) : (myThreadsQuery.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-4 text-center text-muted-foreground text-sm italic",
						children: "Nenhum atendimento encontrado."
					}) : (myThreadsQuery.data ?? []).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setSelectedThread(item);
							mutationMarkRead({ data: {
								threadId: item.id,
								isOwner: false
							} });
						},
						"data-tv-focus": true,
						className: cn("w-full p-4 text-left hover:bg-primary/10 border-b border-sidebar-border transition-all flex items-center justify-between group", selectedThread?.id === item.id && "bg-primary/20 border-l-4 border-l-primary"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-bold truncate text-sm group-hover:text-primary transition-colors",
									children: item.protocol ? `#${item.protocol}` : "Atendimento"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: item.status === "closed" ? "secondary" : "default",
									className: "text-[9px] uppercase",
									children: getSupportStatusMeta(item.status).label
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-muted-foreground truncate opacity-70",
								children: item.last_message || "Sem mensagens"
							})]
						}), typeof item.satisfaction_score === "number" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "ml-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-200",
							children: [item.satisfaction_score, "/5"]
						})]
					}, item.id))
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "md:col-span-8 flex flex-col overflow-hidden border-sidebar-border bg-sidebar/20",
				children: selectedThread ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatWindow, {
					thread: selectedThread,
					onClose: () => setSelectedThread(null),
					isOwner
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-20 w-20 rounded-full bg-sidebar-accent/50 flex items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-10 w-10 opacity-20" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-bold text-lg",
						children: "Histórico de suporte"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm opacity-60",
						children: "Selecione um protocolo para ver o atendimento completo."
					})] })]
				})
			})]
		})
	});
}
function ChatWindow({ thread, onClose, isOwner }) {
	const queryClient = useQueryClient();
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [newMessage, setNewMessage] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const pendingMessageIdRef = (0, import_react.useRef)(null);
	const [closing, setClosing] = (0, import_react.useState)(false);
	const [threadStatus, setThreadStatus] = (0, import_react.useState)(thread.status ?? "open");
	const [threadPriority, setThreadPriority] = (0, import_react.useState)(thread.priority ?? "normal");
	const [threadCategory, setThreadCategory] = (0, import_react.useState)(thread.category ?? "general");
	const [threadSatisfaction, setThreadSatisfaction] = (0, import_react.useState)(thread.satisfaction_score ?? null);
	const [messagesPage, setMessagesPage] = (0, import_react.useState)(1);
	const messagesPageSize = 25;
	const scrollRef = (0, import_react.useRef)(null);
	const fileInputRef = (0, import_react.useRef)(null);
	const fetchMessagesPage = useServerFn(listSupportMessagesPage);
	const mutationSendSupport = useServerFn(sendSupportMessage);
	const mutationSendOwnerSupport = useServerFn(sendSupportOwnerMessage);
	const mutationSendAttachment = useServerFn(sendSupportAttachment);
	const mutationUpdateThreadOperations = useServerFn(updateSupportThreadOperations);
	const mutationCloseThread = useServerFn(closeSupportThread);
	const mutationRespondClosePrompt = useServerFn(respondToClosurePrompt);
	const mutationSubmitSatisfaction = useServerFn(submitSupportSatisfaction);
	const [closeConfirm, setCloseConfirm] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setThreadStatus(thread.status ?? "open");
		setThreadPriority(thread.priority ?? "normal");
		setThreadCategory(thread.category ?? "general");
		setThreadSatisfaction(thread.satisfaction_score ?? null);
	}, [
		thread.id,
		thread.status,
		thread.priority,
		thread.category,
		thread.satisfaction_score
	]);
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
		const channel = supabase.channel(`thread_owner:${thread.id}`).on("postgres_changes", {
			event: "INSERT",
			schema: "public",
			table: "support_messages",
			filter: `thread_id=eq.${thread.id}`
		}, (payload) => {
			if (messagesPage === 1) setMessages((prev) => {
				if (prev.some((m) => m["id"] === payload.new["id"])) return prev;
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
	const executeSend = async (messageToSend) => {
		if (!messageToSend.trim()) return;
		setSending(true);
		const clientMessageId = pendingMessageIdRef.current ?? crypto.randomUUID();
		pendingMessageIdRef.current = clientMessageId;
		try {
			if (isOwner) {
				const msgData = await mutationSendOwnerSupport({ data: {
					threadId: thread.id,
					content: messageToSend,
					clientMessageId
				} });
				if (msgData) setMessages((prev) => prev.some((message) => message.id === msgData.id) ? prev : [...prev, msgData]);
			} else {
				const result = await mutationSendSupport({ data: {
					content: messageToSend,
					clientMessageId
				} });
				if (result?.userMessage) setMessages((prev) => prev.some((message) => message.id === result.userMessage.id) ? prev : [...prev, result.userMessage]);
				if (result?.autoReply) setMessages((prev) => prev.some((message) => message.id === result.autoReply.id) ? prev : [...prev, result.autoReply]);
			}
			pendingMessageIdRef.current = null;
			setNewMessage("");
			setMessagesPage(1);
			queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
			queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
			queryClient.invalidateQueries({ queryKey: ["support-my-threads"] });
			toast.success("Mensagem enviada!");
		} catch (err) {
			toast.error("Erro ao enviar: " + err.message);
		} finally {
			setSending(false);
		}
	};
	const handleCloseThread = async () => {
		setClosing(true);
		try {
			await mutationCloseThread({ data: {
				threadId: thread.id,
				closedByRole: isOwner ? "owner" : "client"
			} });
			queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
			queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
			queryClient.invalidateQueries({ queryKey: ["support-my-threads"] });
			toast.success("Atendimento encerrado com sucesso.");
			setThreadStatus("closed");
		} catch (err) {
			toast.error("Erro ao encerrar: " + err.message);
		} finally {
			setClosing(false);
			setCloseConfirm(false);
		}
	};
	const handleKeepOpen = async () => {
		try {
			await mutationRespondClosePrompt({ data: {
				threadId: thread.id,
				keepOpen: true
			} });
			queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
			queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
			queryClient.invalidateQueries({ queryKey: ["support-my-threads"] });
			toast.success("Atendimento mantido em aberto.");
			setThreadStatus("open");
		} catch (err) {
			toast.error("Erro ao responder: " + err.message);
		}
	};
	const handleOperationUpdate = async (input) => {
		const previous = {
			priority: threadPriority,
			category: threadCategory
		};
		if (input.priority) setThreadPriority(input.priority);
		if (input.category) setThreadCategory(input.category);
		try {
			await mutationUpdateThreadOperations({ data: {
				threadId: thread.id,
				...input
			} });
			queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
			toast.success("Dados operacionais atualizados.");
		} catch (err) {
			setThreadPriority(previous.priority);
			setThreadCategory(previous.category);
			toast.error("Erro ao atualizar atendimento: " + err.message);
		}
	};
	const handleSatisfaction = async (score) => {
		setClosing(true);
		try {
			await mutationSubmitSatisfaction({ data: {
				threadId: thread.id,
				score
			} });
			queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
			queryClient.invalidateQueries({ queryKey: ["support-my-threads"] });
			toast.success(`Avaliação registrada: ${score}/5.`);
			setThreadSatisfaction(score);
		} catch (err) {
			toast.error("Erro ao registrar avaliação: " + err.message);
		} finally {
			setClosing(false);
		}
	};
	const handleSend = async (e) => {
		e?.preventDefault();
		const formValue = e?.currentTarget ? new FormData(e.currentTarget).get("message") : null;
		const messageToSend = (typeof formValue === "string" ? formValue : newMessage).trim();
		if (!messageToSend) return;
		await executeSend(messageToSend);
	};
	const handleFileUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const fileType = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : null;
		if (!fileType) {
			toast.error("Envie somente imagem ou áudio.");
			e.target.value = "";
			return;
		}
		if (file.size > 10485760) {
			toast.error("O arquivo deve ter no máximo 10 MB.");
			e.target.value = "";
			return;
		}
		setSending(true);
		try {
			const fileExt = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
			const filePath = `chat/${thread.id}/${crypto.randomUUID()}.${fileExt}`;
			const clientMessageId = crypto.randomUUID();
			const { error: uploadError } = await supabase.storage.from("chat-files-v2").upload(filePath, file, {
				contentType: file.type,
				upsert: false
			});
			if (uploadError) throw uploadError;
			const message = await mutationSendAttachment({ data: {
				threadId: thread.id,
				path: filePath,
				fileType,
				clientMessageId
			} });
			setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
			queryClient.invalidateQueries({ queryKey: ["support-messages-page", thread.id] });
			queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
			queryClient.invalidateQueries({ queryKey: ["support-my-threads"] });
			toast.success("Arquivo enviado!");
		} catch (err) {
			toast.error("Erro no upload: " + err.message);
		} finally {
			e.target.value = "";
			setSending(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col h-full bg-card/50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-4 border-b border-sidebar-border flex items-center justify-between bg-sidebar/40 backdrop-blur-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-11 w-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black shadow-inner",
						children: (thread.profile?.display_name || thread.profile?.username || "S")[0].toUpperCase()
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "font-bold text-sm tracking-tight flex flex-wrap items-center gap-2",
							children: [
								thread.profile?.display_name || thread.profile?.username || "Suporte Central",
								thread.protocol && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[10px] bg-sidebar-accent px-1.5 py-0.5 rounded text-muted-foreground font-mono",
									children: ["#", thread.protocol]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: threadStatus === "closed" ? "secondary" : "default",
									className: "text-[9px] uppercase",
									children: getSupportStatusMeta(threadStatus).label
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1.5 rounded-full border border-online/20 bg-online/10 px-2.5 py-1 text-online",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full bg-online animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" }), getSupportStatusMeta(threadStatus).description]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1",
								children: "Histórico preservado"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 text-[10px] text-muted-foreground leading-relaxed max-w-xl",
							children: "Chat contínuo para suporte do cliente, com histórico, confirmação de envio e identificação por protocolo."
						})
					] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hidden items-center gap-2 lg:flex",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: threadPriority,
								onValueChange: (value) => void handleOperationUpdate({ priority: value }),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "w-[132px]",
									"aria-label": "Prioridade da conversa",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "urgent",
										children: "Urgente"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "high",
										children: "Alta"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "normal",
										children: "Normal"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "low",
										children: "Baixa"
									})
								] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: threadCategory,
								onValueChange: (value) => void handleOperationUpdate({ category: value }),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									className: "w-[132px]",
									"aria-label": "Categoria da conversa",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "general",
										children: "Geral"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "access",
										children: "Acesso"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "billing",
										children: "Financeiro"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "playback",
										children: "Player"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "catalog",
										children: "Catálogo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "technical",
										children: "Técnico"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "other",
										children: "Outro"
									})
								] })]
							})]
						}),
						isOwner && threadStatus !== "closed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							className: "border-rose-500/30 text-rose-200 hover:bg-rose-500/10",
							onClick: () => setCloseConfirm(true),
							children: "Encerrar"
						}),
						isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							"data-tv-focus": true,
							variant: "ghost",
							size: "icon",
							onClick: onClose,
							className: "hover:bg-destructive/10 hover:text-destructive",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 rounded-2xl border border-sidebar-border/60 bg-sidebar/40 p-4 lg:flex-row lg:items-center lg:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm text-muted-foreground",
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
								messagesTotalPages > (messagesPaginationPages[messagesPaginationPages.length - 1] ?? messagesSafePage) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationItem, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaginationEllipsis, {}) }),
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
						const isMe = isOwner ? msg.sender_id !== thread.user_id : msg.sender_id === thread.user_id;
						const messageType = inferSupportMessageType(msg, thread.user_id);
						const messageMeta = getSupportMessageTypeMeta(messageType);
						const isClosePrompt = messageType === "closure_prompt";
						const isSatisfactionPrompt = messageType === "satisfaction_prompt";
						const scoreValue = threadSatisfaction;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("flex flex-col", isMe ? "items-end" : "items-start"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all hover:shadow-lg", isMe ? "bg-primary text-primary-foreground rounded-tr-none border border-primary/20" : "bg-sidebar-accent/80 border border-sidebar-border rounded-tl-none backdrop-blur-sm"),
								children: [
									messageType !== "user_message" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mb-2 flex items-center gap-1.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]", messageMeta.className),
											children: messageMeta.label
										})
									}),
									isClosePrompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "leading-relaxed",
											children: msg.content
										}), !isOwner && threadStatus === "open" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												size: "sm",
												variant: "default",
												onClick: () => void handleCloseThread(),
												disabled: closing,
												children: "Sim, encerrar"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												size: "sm",
												variant: "outline",
												onClick: () => void handleKeepOpen(),
												disabled: closing,
												children: "Não, manter aberto"
											})]
										})]
									}) : isSatisfactionPrompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "leading-relaxed",
											children: msg.content
										}), !isOwner && !threadSatisfaction ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid grid-cols-5 gap-2",
											children: [
												1,
												2,
												3,
												4,
												5
											].map((score) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												variant: score >= 4 ? "default" : "outline",
												className: "h-10",
												onClick: () => void handleSatisfaction(score),
												disabled: closing,
												children: score
											}, score))
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground",
											children: scoreValue ? `Avaliação registrada: ${scoreValue}/5` : "Aguardando avaliação."
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: msg.file_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-2 py-1",
										children: msg.file_type === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: msg.file_url,
											alt: "Imagem",
											className: "max-w-full rounded-lg cursor-zoom-in border border-white/10",
											onClick: () => window.open(msg.file_url)
										}) : msg.file_type === "audio" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
											controls: true,
											src: msg.file_url,
											className: "w-full max-w-[240px] h-10"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: msg.file_url,
											target: "_blank",
											className: "flex items-center gap-2 font-bold underline decoration-primary/50",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-4 w-4" }), " Abrir Arquivo"]
										})
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "leading-relaxed",
										children: msg.content
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: cn("text-[9px] mt-1 font-bold opacity-50", isMe ? "text-right" : "text-left"),
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
			threadStatus === "closed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t border-sidebar-border bg-sidebar/60 p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-border/70 bg-background/70 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-4 w-4 text-online" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold",
							children: "Atendimento encerrado."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: "Este protocolo permanece no histórico. Para abrir um novo atendimento, volte ao início e envie uma nova mensagem."
					})]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
				onSubmit: handleSend,
				className: "p-4 border-t border-sidebar-border bg-sidebar/60 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							ref: fileInputRef,
							className: "hidden",
							onChange: handleFileUpload,
							accept: "image/*,audio/*"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							"data-tv-focus": true,
							type: "button",
							variant: "ghost",
							size: "icon",
							className: "text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full",
							onClick: () => fileInputRef.current?.click(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-5 w-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							name: "message",
							autoComplete: "off",
							placeholder: isOwner ? "Responder ao cliente..." : "Descreva sua solicitação...",
							value: newMessage,
							onChange: (e) => {
								setNewMessage(e.target.value);
								pendingMessageIdRef.current = null;
							},
							className: "flex-1 bg-sidebar-accent/30 border-sidebar-border focus-visible:ring-primary h-11 rounded-xl shadow-inner",
							"data-tv-focus": true,
							enterKeyHint: "send"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							"data-tv-focus": true,
							type: "submit",
							size: "icon",
							className: "h-11 w-11 rounded-full shadow-lg",
							disabled: sending || !newMessage.trim(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" })
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: closeConfirm,
				onOpenChange: (open) => !open && setCloseConfirm(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-[425px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Encerrar atendimento" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Você tem certeza que deseja fechar este protocolo e iniciar a etapa de satisfação?" })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-muted-foreground",
							children: "O cliente receberá a confirmação de encerramento e a campanha de avaliação 1 a 5."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: () => setCloseConfirm(false),
							disabled: closing,
							children: "Não, voltar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "destructive",
							onClick: () => void handleCloseThread(),
							disabled: closing,
							children: closing ? "Encerrando..." : "Sim, encerrar"
						})] })
					]
				})
			})
		]
	});
}
//#endregion
export { SuportePage as component };
