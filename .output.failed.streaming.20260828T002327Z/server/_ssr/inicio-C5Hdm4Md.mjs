import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as Link, p as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as supabase } from "./client-DUSZWvd2.mjs";
import { i as getAppConfig, t as APP_CONFIG_QUERY_KEY } from "./config.functions-BWn5JPcG.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { A as LoaderCircle, C as Play, E as MessageSquare, F as Info, G as CreditCard, L as Image, T as MonitorPlay, V as Film, _ as Server, c as Tv, d as Star, n as X, t as Zap, v as Send } from "../_libs/lucide-react.mjs";
import { i as Route$10, l as useServerFn, s as cn } from "./router-BGkDCQjE.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { r as usePlayerSession } from "./player-store-CW4d7cEA.mjs";
import { t as Input } from "./input-spZu49Ko.mjs";
import { t as Button } from "./button-JGmfQfxz.mjs";
import { t as proxyMediaUrl } from "./media-url-DOzr6FHi.mjs";
import { t as UserPageShell } from "./user-page-shell-DBoTbWc7.mjs";
import { t as createPaymentPreference } from "./payments.functions-DLBZ_Lc8.mjs";
import { a as CardHeader, n as CardContent, o as CardTitle, r as CardDescription, t as Card } from "./card-CiNa8gL2.mjs";
import { t as Badge } from "./badge-B3HlWDLM.mjs";
import { n as getPlans } from "./plans.functions-BSK3CjPD.mjs";
import { a as listSupportMessagesPage, c as markThreadRead, d as sendSupportMessage, l as respondToClosurePrompt, n as getOrCreateThread, p as submitSupportSatisfaction, t as closeSupportThread } from "./chat.functions-D9GeVzjf.mjs";
import { a as PaginationNext, c as inferSupportMessageType, i as PaginationItem, n as PaginationContent, o as PaginationPrevious, r as PaginationEllipsis, s as getSupportMessageTypeMeta, t as Pagination } from "./pagination-DK0HGGxA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inicio-C5Hdm4Md.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function TMDBHeroCarousel() {
	const fetchConfig = useServerFn(getAppConfig);
	const navigate = useNavigate();
	const [currentIndex, setCurrentIndex] = (0, import_react.useState)(0);
	const [items, setItems] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const { data: config, error: configError } = useQuery({
		queryKey: APP_CONFIG_QUERY_KEY,
		queryFn: () => fetchConfig(),
		staleTime: 3e5,
		retry: false
	});
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		async function fetchTrending() {
			if (!config?.tmdb_api_key) {
				if (!cancelled) setLoading(false);
				return;
			}
			try {
				const data = await (await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${config.tmdb_api_key}&language=pt-BR`)).json();
				if (cancelled) return;
				if (data?.results) {
					const filtered = data.results.filter((item) => item.backdrop_path && (item.media_type === "movie" || item.media_type === "tv")).slice(0, 8);
					setItems(filtered);
				} else setItems([]);
			} catch (err) {
				console.error("Erro ao buscar tendências TMDB:", err);
				if (!cancelled) setItems([]);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		if (config || configError) fetchTrending();
		return () => {
			cancelled = true;
		};
	}, [config, configError]);
	(0, import_react.useEffect)(() => {
		if (items.length <= 1) return;
		const timer = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % items.length);
		}, 8e3);
		return () => clearInterval(timer);
	}, [items]);
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-[350px] sm:h-[500px] w-full items-center justify-center rounded-2xl border border-border bg-card/50",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" })
	});
	if (items.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-[250px] sm:h-[320px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card/40 px-6 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				className: "bg-primary/15 text-primary hover:bg-primary/15",
				children: "TMDB"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-bold",
				children: "Carrossel indisponível no momento"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-xl text-sm text-muted-foreground",
				children: "Se a API do TMDB estiver sem resposta, esta área fica segura e não quebra a home."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				"data-tv-focus": true,
				type: "button",
				size: "sm",
				variant: "outline",
				onClick: () => navigate({ to: "/filmes" }),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "mr-2 h-4 w-4" }), " Ir para Filmes"]
			})
		]
	});
	const current = items[currentIndex];
	const year = (current.release_date || current.first_air_date || "").split("-")[0];
	const searchTerm = (current.title || current.name || "").trim();
	const targetRoute = current.media_type === "movie" ? "/filmes" : "/series";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative group overflow-hidden rounded-2xl border border-border shadow-2xl bg-black h-[350px] sm:h-[500px] w-full",
		children: [items.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("absolute inset-0 transition-all duration-1000 ease-in-out", idx === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: proxyMediaUrl(`https://image.tmdb.org/t/p/original${item.backdrop_path}`) ?? `https://image.tmdb.org/t/p/original${item.backdrop_path}`,
						alt: item.title || item.name || "Conteúdo TMDB",
						className: "h-full w-full object-cover object-top sm:object-center"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent hidden sm:block" })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 flex flex-col justify-end p-6 sm:p-12 sm:pb-16 max-w-3xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									className: "bg-primary hover:bg-primary font-bold tracking-wider uppercase text-[10px]",
									children: item.media_type === "movie" ? "Filme" : "Série"
								}),
								year && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-white/60",
									children: year
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1 text-yellow-500",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3 w-3 fill-current" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-bold",
										children: (item.vote_average ?? 0).toFixed(1)
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-3xl sm:text-5xl font-black text-white leading-tight tracking-tighter drop-shadow-lg",
							children: item.title || item.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm sm:text-base text-white/70 line-clamp-2 sm:line-clamp-3 max-w-xl font-medium leading-relaxed drop-shadow",
							children: item.overview
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-3 pt-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								"data-tv-focus": true,
								type: "button",
								size: "lg",
								className: "rounded-full font-bold px-8 h-12 shadow-xl shadow-primary/20 hover:scale-105 transition-transform",
								onClick: () => navigate({
									to: targetRoute,
									search: searchTerm ? { q: searchTerm } : void 0
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "mr-2 h-5 w-5 fill-current" }), " ASSISTIR AGORA"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								"data-tv-focus": true,
								type: "button",
								variant: "outline",
								size: "lg",
								className: "rounded-full bg-white/10 border-white/20 backdrop-blur-md text-white font-bold px-8 h-12 hover:bg-white/20",
								onClick: () => navigate({
									to: targetRoute,
									search: searchTerm ? { q: searchTerm } : void 0
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "mr-2 h-5 w-5" }), " DETALHES"]
							})]
						})
					]
				})
			})]
		}, item.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20",
			children: items.map((_, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				"data-tv-focus": true,
				type: "button",
				onClick: () => setCurrentIndex(idx),
				className: cn("h-1.5 rounded-full transition-all duration-300", idx === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/30 hover:bg-white/50"),
				"aria-label": `Ir para slide ${idx + 1}`
			}, idx))
		})]
	});
}
var CARDS = [
	{
		to: "/canais",
		label: "TV ao Vivo",
		icon: Tv
	},
	{
		to: "/filmes",
		label: "Filmes",
		icon: Film
	},
	{
		to: "/series",
		label: "Séries",
		icon: MonitorPlay
	},
	{
		to: "/servidores",
		label: "Servidores",
		icon: Server
	}
];
function Inicio() {
	const { profile, isOwner, authUserId } = usePlayerSession();
	const search = Route$10.useSearch();
	const navigate = useNavigate();
	const createPayment = useServerFn(createPaymentPreference);
	(0, import_react.useEffect)(() => {
		if (search.payment === "success") {
			toast.success("Pagamento aprovado! Seu acesso foi renovado.");
			navigate({
				to: "/inicio",
				search: {},
				replace: true
			});
		} else if (search.payment === "failure") {
			toast.error("O pagamento falhou ou foi cancelado.");
			navigate({
				to: "/inicio",
				search: {},
				replace: true
			});
		}
	}, [search.payment, navigate]);
	const fetchPlans = useServerFn(getPlans);
	const { data: plans } = useQuery({
		queryKey: ["available-plans"],
		queryFn: () => fetchPlans()
	});
	const [paymentLoading, setPaymentLoading] = (0, import_react.useState)(false);
	const handlePay = async (planId) => {
		setPaymentLoading(true);
		try {
			const res = await createPayment({ data: { planId } });
			window.location.href = res.init_point;
		} catch (err) {
			toast.error(err.message || "Erro ao iniciar pagamento");
		} finally {
			setPaymentLoading(false);
		}
	};
	const isExpired = profile?.expires_at && new Date(profile.expires_at).getTime() < Date.now();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(UserPageShell, {
		title: "Início",
		description: "",
		icon: Tv,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TMDBHeroCarousel, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-hidden rounded-2xl border border-border bg-card px-4 py-5 lg:px-6 lg:py-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-2xl font-bold",
					children: "Seu acesso está pronto para uso"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "Atalhos rápidos para o catálogo e para a conta."
				})]
			}),
			isExpired && !isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "border-destructive/50 bg-destructive/10 animate-pulse",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
					className: "pb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
						className: "text-destructive flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "h-5 w-5" }), " ACESSO EXPIRADO"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
						className: "text-destructive/80 font-medium",
						children: "Sua assinatura venceu. Escolha um plano abaixo para continuar assistindo."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
					children: plans?.filter((p) => p.price > 0).map((plan) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "bg-card/50 border-destructive/20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-base",
								children: plan.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xl font-black text-primary",
								children: ["R$ ", Number(plan.price).toFixed(2)]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
							className: "p-4 pt-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								className: "w-full h-10 font-bold",
								onClick: () => handlePay(plan.id),
								disabled: paymentLoading,
								children: paymentLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "mr-2 h-4 w-4" }), " RENOVAR AGORA"] })
							})
						})]
					}, plan.id))
				}) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
				children: CARDS.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: card.to,
					preload: "intent",
					preloadDelay: 80,
					className: "block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						className: "h-full transition-all hover:-translate-y-0.5 hover:border-primary/60",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "flex items-center gap-4 p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(card.icon, { className: "h-5 w-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: card.label
							}) })]
						})
					})
				}, card.to))
			}),
			!isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloatingChat, { userId: profile?.id ?? authUserId })
		]
	});
}
function FloatingChat({ userId }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [thread, setThread] = (0, import_react.useState)(null);
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [newMessage, setNewMessage] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const [unread, setUnread] = (0, import_react.useState)(0);
	const [messagesPage, setMessagesPage] = (0, import_react.useState)(1);
	const [actionLoading, setActionLoading] = (0, import_react.useState)(false);
	const messagesPageSize = 15;
	const scrollRef = (0, import_react.useRef)(null);
	const messagesPageRef = (0, import_react.useRef)(1);
	const queryClient = useQueryClient();
	const fetchThread = useServerFn(getOrCreateThread);
	const fetchMessagesPage = useServerFn(listSupportMessagesPage);
	const mutationMarkRead = useServerFn(markThreadRead);
	const mutationSendSupport = useServerFn(sendSupportMessage);
	const messagesQuery = useQuery({
		queryKey: [
			"floating-support-messages",
			thread?.id,
			messagesPage,
			messagesPageSize
		],
		queryFn: () => fetchMessagesPage({ data: {
			threadId: thread.id,
			page: messagesPage,
			page_size: messagesPageSize
		} }),
		enabled: isOpen && !!thread?.id,
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
		messagesPageRef.current = messagesPage;
	}, [messagesPage]);
	(0, import_react.useEffect)(() => {
		if (!userId || !isOpen) return;
		let channel;
		const init = async () => {
			try {
				const data = await fetchThread({ data: { userId } });
				setThread(data);
				setUnread(0);
				setMessagesPage(1);
				await mutationMarkRead({ data: {
					threadId: data["id"],
					isOwner: false
				} });
				channel = supabase.channel(`thread_user:${data["id"]}`).on("postgres_changes", {
					event: "INSERT",
					schema: "public",
					table: "support_messages",
					filter: `thread_id=eq.${data["id"]}`
				}, (payload) => {
					if (messagesPageRef.current === 1) setMessages((prev) => {
						if (prev.some((m) => m["id"] === payload.new["id"])) return prev;
						return [...prev, payload.new];
					});
				}).subscribe();
			} catch (err) {
				console.error("Erro ao inicializar chat:", err);
				toast.error("Erro ao carregar mensagens");
			}
		};
		init();
		return () => {
			if (channel) supabase.removeChannel(channel);
		};
	}, [
		userId,
		isOpen,
		fetchThread,
		mutationMarkRead
	]);
	(0, import_react.useEffect)(() => {
		if (!thread?.id || !isOpen) return;
		setMessages(messagesQuery.data?.items ?? []);
	}, [
		messagesQuery.data,
		thread?.id,
		isOpen
	]);
	(0, import_react.useEffect)(() => {
		if (!thread?.id) return;
		setMessagesPage(1);
		queryClient.invalidateQueries({ queryKey: ["floating-support-messages", thread.id] });
	}, [thread?.id, queryClient]);
	(0, import_react.useEffect)(() => {
		if (!userId || isOpen) return;
		const checkUnread = async () => {
			const { data } = await supabase.from("support_threads").select("unread_count_user").eq("user_id", userId).maybeSingle();
			if (data) setUnread(data.unread_count_user);
		};
		checkUnread();
	}, [userId, isOpen]);
	(0, import_react.useEffect)(() => {
		scrollRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);
	const handleSend = async (e) => {
		e.preventDefault();
		const formValue = new FormData(e.currentTarget).get("message");
		const messageToSend = (typeof formValue === "string" ? formValue : newMessage).trim();
		if (!messageToSend || !userId) return;
		setSending(true);
		try {
			const result = await mutationSendSupport({ data: { content: messageToSend } });
			if (result?.thread && !thread) setThread(result.thread);
			if (result?.userMessage) setMessages((prev) => [...prev, result.userMessage]);
			if (result?.autoReply) setMessages((prev) => [...prev, result.autoReply]);
			setNewMessage("");
			setMessagesPage(1);
			if (thread?.id) queryClient.invalidateQueries({ queryKey: ["floating-support-messages", thread.id] });
			toast.success("Mensagem enviada!");
		} catch (err) {
			toast.error("Erro: " + (err.message || "Falha na conexão"));
		} finally {
			setSending(false);
		}
	};
	const handleClosePromptYes = async () => {
		if (!thread?.id) return;
		setActionLoading(true);
		try {
			await closeSupportThread({ data: {
				threadId: thread.id,
				closedByRole: "client"
			} });
			queryClient.invalidateQueries({ queryKey: ["floating-support-messages", thread.id] });
			toast.success("Atendimento encerrado.");
		} catch (err) {
			toast.error(err.message || "Erro ao encerrar.");
		} finally {
			setActionLoading(false);
		}
	};
	const handleClosePromptNo = async () => {
		if (!thread?.id) return;
		setActionLoading(true);
		try {
			await respondToClosurePrompt({ data: {
				threadId: thread.id,
				keepOpen: true
			} });
			queryClient.invalidateQueries({ queryKey: ["floating-support-messages", thread.id] });
			toast.success("Atendimento mantido em aberto.");
		} catch (err) {
			toast.error(err.message || "Erro ao responder.");
		} finally {
			setActionLoading(false);
		}
	};
	const handleSatisfaction = async (score) => {
		if (!thread?.id) return;
		setActionLoading(true);
		try {
			await submitSupportSatisfaction({ data: {
				threadId: thread.id,
				score
			} });
			queryClient.invalidateQueries({ queryKey: ["floating-support-messages", thread.id] });
			toast.success(`Avaliação registrada: ${score}/5.`);
		} catch (err) {
			toast.error(err.message || "Erro ao avaliar.");
		} finally {
			setActionLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed bottom-6 right-6 z-50 flex flex-col items-end",
		children: [isOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "mb-4 w-[320px] sm:w-[380px] h-[450px] flex flex-col shadow-2xl overflow-hidden border-primary/20 animate-in slide-in-from-bottom-4 duration-300",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-primary p-4 text-primary-foreground flex justify-between items-center shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-5 w-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-bold",
							children: "Suporte Direto"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						"data-tv-focus": true,
						variant: "ghost",
						size: "icon",
						className: "text-primary-foreground hover:bg-white/10",
						onClick: () => setIsOpen(false),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-5 w-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30",
					children: [
						messagesTotalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-border/70 bg-background/80 p-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground",
								children: [
									"Página ",
									messagesSafePage,
									" de ",
									messagesTotalPages
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pagination, {
								className: "mx-0 w-full justify-start",
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
										className: "h-7 w-7",
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
							className: "rounded-2xl border border-border/70 bg-background/60 p-6 text-center text-xs text-muted-foreground",
							children: "Carregando mensagens..."
						}) : null,
						messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "h-full flex flex-col items-center justify-center text-center p-6 space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "bg-primary/10 p-4 rounded-full",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-8 w-8 text-primary" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium",
									children: "Como podemos ajudar?"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: "Envie sua dúvida para o dono do sistema."
								})
							]
						}) : messages.map((msg) => {
							const isMe = msg["sender_id"] === userId;
							const messageType = inferSupportMessageType(msg, userId);
							const messageMeta = getSupportMessageTypeMeta(messageType);
							const isClosePrompt = messageType === "closure_prompt";
							const isSatisfactionPrompt = messageType === "satisfaction_prompt";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: cn("chat-bubble-container flex", isMe ? "justify-end" : "justify-start"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cn("max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm", isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none"),
									children: [messageType !== "user_message" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mb-1 flex items-center gap-1.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]", messageMeta.className),
											children: messageMeta.label
										})
									}), isClosePrompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: msg["content"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												size: "sm",
												onClick: () => void handleClosePromptYes(),
												disabled: actionLoading,
												children: "Sim"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												size: "sm",
												variant: "outline",
												onClick: () => void handleClosePromptNo(),
												disabled: actionLoading,
												children: "Não"
											})]
										})]
									}) : isSatisfactionPrompt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: msg["content"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid grid-cols-5 gap-2",
											children: [
												1,
												2,
												3,
												4,
												5
											].map((score) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												type: "button",
												size: "sm",
												variant: score >= 4 ? "default" : "outline",
												onClick: () => void handleSatisfaction(score),
												disabled: actionLoading,
												children: score
											}, score))
										})]
									}) : msg["file_url"] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-1",
										children: msg["file_type"] === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: msg["file_url"],
											alt: "Envio",
											className: "max-w-full rounded-lg"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: msg["file_url"],
											target: "_blank",
											className: "flex items-center gap-2 underline text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-3 w-3" }), " Ver Arquivo"]
										})
									}) : msg["content"]]
								})
							}, msg["id"]);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: scrollRef })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
					onSubmit: handleSend,
					className: "p-3 border-t bg-card shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							name: "message",
							placeholder: "Diga algo...",
							value: newMessage,
							onChange: (e) => setNewMessage(e.target.value),
							className: "bg-muted/50 border-none h-9 text-sm",
							"data-tv-focus": true,
							enterKeyHint: "send"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							"data-tv-focus": true,
							type: "submit",
							size: "icon",
							className: "h-9 w-9",
							disabled: sending || !newMessage.trim(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" })
						})]
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			"data-tv-focus": true,
			size: "lg",
			className: cn("h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105", unread > 0 ? "animate-bounce" : ""),
			onClick: () => setIsOpen(!isOpen),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-6 w-6" }), unread > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground",
				children: unread
			})]
		})]
	});
}
//#endregion
export { Inicio as component };
