import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useRouter, d as useLocation, m as Outlet, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as supabase } from "./client-DUSZWvd2.mjs";
import { i as getAppConfig, t as APP_CONFIG_QUERY_KEY } from "./config.functions-B4QYtDAn.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { $ as Check, B as Film, D as LogOut, E as Menu, K as Circle, L as House, M as LayoutDashboard, R as History, T as MessageSquare, X as ChevronRight, _ as Server, a as Users, c as Tv, j as LifeBuoy, l as TriangleAlert, p as ShieldCheck, q as CircleUserRound, s as UserCog, tt as Bell, w as MonitorPlay } from "../_libs/lucide-react.mjs";
import { l as useServerFn, s as cn } from "./router-CR30oRUU.mjs";
import { t as getCategories } from "./player.functions-mcFST_nX.mjs";
import { r as usePlayerSession, t as PlayerSessionProvider } from "./player-store-BuWR_IDB.mjs";
import { t as Button } from "./button-BUuVLMjW.mjs";
import { a as Label2, c as Root2, d as SubTrigger2, f as Trigger, i as ItemIndicator2, l as Separator2, n as Content2, o as Portal2, r as Item2, s as RadioItem2, t as CheckboxItem2, u as SubContent2 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dd16uR0A.mjs";
import { t as SectionErrorBoundary } from "./section-error-boundary-D8mKE0wZ.mjs";
import { o as listSupportThreads } from "./chat.functions-DUOIOr26.mjs";
import { n as markNotificationRead, t as getNotifications } from "./notifications.functions-BFxYIdvc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-CUpMu398.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DropdownMenu = Root2;
var DropdownMenuTrigger = Trigger;
var DropdownMenuSubTrigger = import_react.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SubTrigger2, {
	ref,
	className: cn("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-auto" })]
}));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
var DropdownMenuSubContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubContent2, {
	ref,
	className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}));
DropdownMenuSubContent.displayName = SubContent2.displayName;
var DropdownMenuContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}) }));
DropdownMenuContent.displayName = Content2.displayName;
var DropdownMenuItem = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
	...props
}));
DropdownMenuItem.displayName = Item2.displayName;
var DropdownMenuCheckboxItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CheckboxItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), children]
}));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
var DropdownMenuRadioItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RadioItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-2 w-2 fill-current" }) })
	}), children]
}));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
var DropdownMenuLabel = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label2, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
	...props
}));
DropdownMenuLabel.displayName = Label2.displayName;
var DropdownMenuSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator2, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
DropdownMenuSeparator.displayName = Separator2.displayName;
var DropdownMenuShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest opacity-60", className),
		...props
	});
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
var USER_NAV = [
	{
		to: "/inicio",
		label: "Início",
		icon: House,
		restricted: true
	},
	{
		to: "/canais",
		label: "TV ao Vivo",
		icon: Tv,
		restricted: true
	},
	{
		to: "/filmes",
		label: "Filmes",
		icon: Film,
		restricted: true
	},
	{
		to: "/series",
		label: "Séries",
		icon: MonitorPlay,
		restricted: true
	},
	{
		to: "/servidores",
		label: "Servidores",
		icon: Server,
		restricted: true
	}
];
var OWNER_NAV = [
	{
		to: "/usuarios",
		label: "Usuários",
		icon: Users
	},
	{
		to: "/painel",
		label: "Painel do dono",
		icon: ShieldCheck
	},
	{
		to: "/suporte",
		label: "Suporte",
		icon: MessageSquare
	}
];
var PRIMARY_TABS = [
	{
		to: "/inicio",
		label: "Início"
	},
	{
		to: "/canais",
		label: "TV ao Vivo"
	},
	{
		to: "/filmes",
		label: "Filmes"
	},
	{
		to: "/series",
		label: "Séries"
	}
];
function SidebarSection({ title, description, icon: Icon, titleClassName, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3 px-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-0.5 grid h-9 w-9 place-items-center rounded-xl border border-sidebar-border bg-sidebar-accent/60 text-sidebar-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("text-[11px] font-black uppercase tracking-[0.22em] text-sidebar-foreground/50", titleClassName),
					children: title
				}), description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs leading-relaxed text-sidebar-foreground/60",
					children: description
				}) : null]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-1.5 px-1",
			children
		})]
	});
}
function SidebarLink({ to, label, icon: Icon, onClick, activeClassName, className, badge, preload = "intent" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to,
		onClick,
		preload,
		preloadDelay: 80,
		activeProps: { className: activeClassName ?? "bg-sidebar-accent text-sidebar-accent-foreground" },
		className: cn("flex items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-all hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" }), label]
		}), badge]
	});
}
function Shell() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerSessionProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellLayout, {}) });
}
function ShellLayout() {
	const { profile, isOwner, servers, serverId, setServerId, preloadServerCatalog, blocked, expired } = usePlayerSession();
	const [open, setOpen] = (0, import_react.useState)(false);
	const router = useRouter();
	const location = useLocation();
	const queryClient = useQueryClient();
	const fetchConfig = useServerFn(getAppConfig);
	const fetchThreads = useServerFn(listSupportThreads);
	const fetchNotifications = useServerFn(getNotifications);
	const fetchCategories = useServerFn(getCategories);
	const mutationMarkRead = useServerFn(markNotificationRead);
	const { data: appConfig } = useQuery({
		queryKey: APP_CONFIG_QUERY_KEY,
		queryFn: () => fetchConfig(),
		staleTime: 3e5
	});
	const { data: threads } = useQuery({
		queryKey: ["support-threads-nav"],
		queryFn: () => fetchThreads(),
		enabled: isOwner,
		refetchInterval: 1e4
	});
	const { data: userNotifications } = useQuery({
		queryKey: ["notifications"],
		queryFn: () => fetchNotifications(),
		refetchInterval: 3e4
	});
	const userSectionTitle = profile?.display_name?.trim() || profile?.username || "Seu perfil";
	const showPrimaryTabs = !isOwner && [
		"/inicio",
		"/canais",
		"/filmes",
		"/series"
	].includes(location.pathname);
	(0, import_react.useEffect)(() => {
		if (isOwner || !showPrimaryTabs || !serverId) return;
		const kindFromPath = location.pathname === "/canais" ? "live" : location.pathname === "/filmes" ? "movie" : location.pathname === "/series" ? "series" : null;
		if (!kindFromPath) return;
		let cancelled = false;
		const schedule = typeof window !== "undefined" && "requestIdleCallback" in window ? window.requestIdleCallback.bind(window) : (callback) => window.setTimeout(callback, 300);
		const cancel = typeof window !== "undefined" && "cancelIdleCallback" in window ? window.cancelIdleCallback.bind(window) : window.clearTimeout.bind(window);
		const handle = schedule(() => {
			if (cancelled) return;
			queryClient.prefetchQuery({
				queryKey: [
					"categories",
					kindFromPath,
					serverId
				],
				queryFn: () => fetchCategories({ data: {
					server_id: serverId,
					kind: kindFromPath
				} }),
				staleTime: 6e4
			}).catch(() => void 0);
		});
		return () => {
			cancelled = true;
			cancel(handle);
		};
	}, [
		fetchCategories,
		isOwner,
		location.pathname,
		queryClient,
		serverId,
		showPrimaryTabs
	]);
	(0, import_react.useEffect)(() => {
		if (!isOwner) return;
		const invalidateSupportScopes = () => {
			queryClient.invalidateQueries({ queryKey: ["support-threads-nav"] });
			queryClient.invalidateQueries({ queryKey: ["support-threads-page"] });
			queryClient.invalidateQueries({ queryKey: ["support-thread-user"] });
			queryClient.invalidateQueries({ queryKey: ["support-my-threads"] });
			queryClient.invalidateQueries({ queryKey: ["support-messages-page"] });
			queryClient.invalidateQueries({ queryKey: ["floating-support-messages"] });
			queryClient.invalidateQueries({ queryKey: ["support-stats"] });
		};
		const invalidateUserScopes = () => {
			queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			queryClient.invalidateQueries({ queryKey: ["my-account"] });
			queryClient.invalidateQueries({ queryKey: ["player-session"] });
		};
		const invalidateServerScopes = () => {
			queryClient.invalidateQueries({ queryKey: ["admin-servers"] });
			queryClient.invalidateQueries({ queryKey: ["player-session"] });
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			queryClient.invalidateQueries({ queryKey: ["streams"] });
			queryClient.invalidateQueries({ queryKey: ["series-info"] });
			queryClient.invalidateQueries({ queryKey: ["epg"] });
		};
		const invalidatePlanScopes = () => {
			queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
			queryClient.invalidateQueries({ queryKey: ["admin-plans-page"] });
			queryClient.invalidateQueries({ queryKey: ["available-plans"] });
			queryClient.invalidateQueries({ queryKey: ["my-account"] });
		};
		const invalidateTestLinkScopes = () => {
			queryClient.invalidateQueries({ queryKey: ["admin-test-links"] });
			queryClient.invalidateQueries({ queryKey: ["admin-test-links-page"] });
			queryClient.invalidateQueries({ queryKey: ["my-account"] });
		};
		const channel = supabase.channel("owner_shell_realtime").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "support_threads"
		}, invalidateSupportScopes).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "support_messages"
		}, invalidateSupportScopes).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "notifications"
		}, () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		}).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "iptv_servers"
		}, invalidateServerScopes).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "server_credentials"
		}, invalidateServerScopes).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "user_server_access"
		}, invalidateUserScopes).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "profiles"
		}, invalidateUserScopes).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "user_roles"
		}, invalidateUserScopes).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "subscription_plans"
		}, invalidatePlanScopes).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "test_links"
		}, invalidateTestLinkScopes).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "app_config"
		}, () => {
			queryClient.invalidateQueries({ queryKey: APP_CONFIG_QUERY_KEY });
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [isOwner, queryClient]);
	const unreadNotificationsCount = (0, import_react.useMemo)(() => (userNotifications ?? []).filter((n) => !n.is_read).length, [userNotifications]);
	const totalUnread = (threads ?? []).reduce((acc, t) => acc + (t.unread_count_owner || 0), 0);
	const signOut = async () => {
		await queryClient.cancelQueries();
		queryClient.clear();
		await supabase.auth.signOut();
		router.navigate({
			to: "/",
			replace: true
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-dvh overflow-hidden bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: cn("fixed inset-y-0 left-0 z-40 flex h-dvh w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-16 items-center gap-2 border-b border-sidebar-border px-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-primary/10 text-sm font-black text-primary-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: appConfig?.logo_small_url || appConfig?.logo_url || "/brand/webplayer-brand.png",
								alt: "Logo",
								className: "h-full w-full object-contain p-1"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-bold tracking-[0.18em] text-sidebar-foreground",
							children: appConfig?.short_name || "Sistema IPTV"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex-1 space-y-6 overflow-y-auto px-3 py-4 custom-scrollbar",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SidebarSection, {
								title: userSectionTitle,
								description: void 0,
								icon: CircleUserRound,
								titleClassName: "normal-case tracking-[0.06em] text-sidebar-foreground",
								children: [
									USER_NAV.map((item) => {
										if (!isOwner && (blocked || expired) && item.restricted) return null;
										const isPrimaryNavigation = PRIMARY_TABS.some((tab) => tab.to === item.to);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarLink, {
											to: item.to,
											onClick: () => setOpen(false),
											label: item.label,
											icon: item.icon,
											className: cn(showPrimaryTabs && isPrimaryNavigation && "lg:hidden")
										}, item.to);
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarLink, {
										to: "/conta",
										onClick: () => setOpen(false),
										label: "Conta",
										icon: UserCog
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarLink, {
										to: "/suporte",
										onClick: () => setOpen(false),
										label: isOwner ? "Suporte" : "Histórico de Suporte",
										icon: isOwner ? MessageSquare : History,
										badge: isOwner ? totalUnread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse",
											children: totalUnread
										}) : null : null,
										className: cn(!isOwner && "bg-sidebar-accent/20")
									})
								]
							}),
							isOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-sidebar-border/70" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarSection, {
								title: "Núcleo administrativo",
								description: "Controles internos, operação e auditoria do sistema.",
								icon: LayoutDashboard,
								children: OWNER_NAV.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarLink, {
									to: item.to,
									onClick: () => setOpen(false),
									label: item.label,
									icon: item.icon,
									className: "text-gold"
								}, item.to))
							})] }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-2xl border border-sidebar-border bg-sidebar-accent/20 p-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LifeBuoy, { className: "h-4 w-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-black uppercase tracking-[0.2em] text-sidebar-foreground/50",
												children: "Núcleo ativo"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-sm font-semibold text-sidebar-foreground",
												children: isOwner ? "Administração e suporte" : "Experiência do cliente"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-xs leading-relaxed text-sidebar-foreground/60",
												children: isOwner ? "Apenas o dono acessa estas rotinas de controle." : "A interface mantém o foco no uso diário e no consumo do catálogo."
											})
										]
									})]
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 border-t border-sidebar-border p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-sidebar-foreground",
								children: profile?.display_name || profile?.username || (isOwner ? "Administrador" : "Acesso")
							}), profile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								profile.max_connections,
								" conexão(ões)",
								profile.expires_at ? ` · vence ${new Date(profile.expires_at).toLocaleDateString("pt-BR")}` : " · sem validade"
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Acesso administrativo" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							size: "sm",
							className: "w-full",
							onClick: signOut,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "mr-2 h-4 w-4" }), " Sair"]
						})]
					})
				]
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": "Fechar menu",
				className: "fixed inset-0 z-30 bg-black/60 lg:hidden",
				onClick: () => setOpen(false)
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-dvh min-w-0 w-full flex-1 flex-col overflow-hidden lg:pl-64",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								className: "relative z-10 lg:hidden",
								onClick: () => setOpen((value) => !value),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "h-5 w-5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "relative z-10 flex min-w-0 flex-1 items-center gap-3",
								children: showPrimaryTabs ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
									className: "hidden min-w-0 flex-1 justify-center lg:flex",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex min-w-0 max-w-4xl items-center justify-center gap-1.5 overflow-x-auto rounded-full border border-border/60 bg-sidebar/35 px-1.5 py-1.5 shadow-sm backdrop-blur",
										children: PRIMARY_TABS.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: tab.to,
											preload: "intent",
											preloadDelay: 80,
											className: "whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold text-sidebar-foreground/75 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
											activeProps: { className: "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" },
											children: tab.label
										}, tab.to))
									})
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [
										isOwner && location.pathname === "/painel" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2 text-gold",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-5 w-5" }), " Núcleo administrativo"]
										}),
										location.pathname === "/suporte" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2 font-bold text-primary",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-5 w-5" }),
												" ",
												isOwner ? "Suporte do dono" : userSectionTitle
											]
										}),
										!isOwner && ["/servidores", "/conta"].includes(location.pathname) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-2 text-sidebar-foreground/70",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleUserRound, { className: "h-5 w-5" }),
												" ",
												userSectionTitle
											]
										})
									]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ml-auto flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "icon",
										className: "relative h-10 w-10 rounded-full border border-border/50 bg-sidebar/40 hover:bg-primary/10 hover:text-primary transition-all",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-5 w-5" }), unreadNotificationsCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground shadow-lg animate-bounce",
											children: unreadNotificationsCount
										})]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
									align: "end",
									className: "w-80 bg-sidebar border-sidebar-border p-2 shadow-2xl backdrop-blur-xl",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuLabel, {
											className: "flex items-center justify-between px-2 py-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs font-black uppercase tracking-widest text-muted-foreground",
												children: "Notificações"
											}), unreadNotificationsCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold",
												children: [unreadNotificationsCount, " NOVAS"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, { className: "bg-sidebar-border opacity-50" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "max-h-[350px] overflow-y-auto py-1 custom-scrollbar",
											children: userNotifications?.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "px-4 py-8 text-center",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent/50 opacity-20",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-5 w-5" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs font-medium text-muted-foreground",
													children: "Tudo em dia! Nenhuma notificação por aqui."
												})]
											}) : userNotifications?.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												className: cn("flex flex-col items-start gap-1 p-3 rounded-xl transition-all mb-1 cursor-default", !n.is_read ? "bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary" : "opacity-60 grayscale hover:grayscale-0 hover:bg-sidebar-accent"),
												onSelect: async () => {
													if (!n.is_read) {
														await mutationMarkRead({ data: n.id });
														queryClient.invalidateQueries({ queryKey: ["notifications"] });
													}
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex w-full items-center justify-between gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: cn("text-xs font-black uppercase tracking-tight", n.type === "expiration" ? "text-destructive" : "text-primary"),
														children: n.title
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[9px] font-bold text-muted-foreground/60",
														children: new Date(n.created_at).toLocaleDateString()
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[11px] leading-relaxed text-sidebar-foreground/80",
													children: n.content
												})]
											}, n.id))
										})
									]
								})] }), servers.length > 0 && location.pathname !== "/painel" && location.pathname !== "/suporte" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: serverId ?? "",
									onValueChange: setServerId,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "w-[150px] max-w-[38vw] bg-sidebar/50 border-border/50 sm:w-[190px]",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Servidor" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
										className: "bg-sidebar border-sidebar-border",
										children: servers.map((server) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: server.id,
											onMouseEnter: () => preloadServerCatalog(server.id),
											onFocus: () => preloadServerCatalog(server.id),
											children: server.name
										}, server.id))
									})]
								}) : null]
							})
						]
					}),
					blocked && !expired ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3 border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 h-4 w-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: blocked })]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "min-h-0 flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionErrorBoundary, {
							title: "Essa área encontrou um problema",
							description: "O núcleo principal segue carregado. Você pode tentar novamente sem perder a navegação lateral.",
							resetKey: location.pathname,
							className: "h-full",
							children: !isOwner && (blocked || expired) && location.pathname !== "/conta" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-center justify-center py-20 text-center",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mb-6 rounded-full bg-destructive/10 p-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-16 w-16 text-destructive" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-3xl font-black uppercase italic tracking-tighter text-primary",
										children: "Acesso suspenso"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 max-w-md text-muted-foreground font-medium",
										children: "Seu plano expirou ou o acesso foi bloqueado. Para continuar assistindo, renove sua assinatura agora mesmo."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										className: "mt-8 font-black uppercase italic tracking-widest h-12 px-8 shadow-lg shadow-primary/20",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/conta",
											children: "Ir para Renovação"
										})
									})
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
						})
					})
				]
			})
		]
	});
}
//#endregion
export { Shell as component };
