import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { D as LogOut, Q as ChevronDown, S as Plus, X as ChevronRight, Z as ChevronLeft, a as Users, et as Calendar, f as SquarePen, i as WifiOff, r as Wifi, u as Trash2 } from "../_libs/lucide-react.mjs";
import { l as useServerFn, s as cn } from "./router-DLyAfsuk.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { r as usePlayerSession } from "./player-store-Gl_opx_k.mjs";
import { t as Input } from "./input-CyJ0sT8b.mjs";
import { n as buttonVariants, t as Button } from "./button-Oqlhi9pb.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Cz1L-GiL.mjs";
import { t as Card } from "./card-yI-WY7B7.mjs";
import { t as Label } from "./label-BJ9ThqVJ.mjs";
import { t as ptBR, u as format } from "../_libs/date-fns.mjs";
import { n as getPlans } from "./plans.functions-B4T48g8J.mjs";
import { a as listAccessUsersPage, f as updateAccessUser, i as kickDevices, n as deleteAccessUser, s as listServers, t as createAccessUser } from "./owner.functions-kupFJvto.mjs";
import { a as DialogHeader, c as Tabs, d as TabsTrigger, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog, u as TabsList } from "./dialog-DYJP34bD.mjs";
import { a as TableHead, i as TableCell, n as Table, o as TableHeader, r as TableBody, s as TableRow, t as OwnerPageShell } from "./owner-page-shell-BrdvsZpu.mjs";
import { n as getDefaultClassNames, t as DayPicker } from "../_libs/react-day-picker.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "../_libs/radix-ui__react-popover.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/usuarios-D6wtLfDl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Calendar$1({ className, classNames, showOutsideDays = true, captionLayout = "label", buttonVariant = "ghost", formatters, components, ...props }) {
	const defaultClassNames = getDefaultClassNames();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayPicker, {
		showOutsideDays,
		className: cn("bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent", String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`, String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`, className),
		captionLayout,
		formatters: {
			formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
			...formatters
		},
		classNames: {
			root: cn("w-fit", defaultClassNames.root),
			months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
			month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
			nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", defaultClassNames.nav),
			button_previous: cn(buttonVariants({ variant: buttonVariant }), "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50", defaultClassNames.button_previous),
			button_next: cn(buttonVariants({ variant: buttonVariant }), "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50", defaultClassNames.button_next),
			month_caption: cn("flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)", defaultClassNames.month_caption),
			dropdowns: cn("flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium", defaultClassNames.dropdowns),
			dropdown_root: cn("has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border", defaultClassNames.dropdown_root),
			dropdown: cn("bg-popover absolute inset-0 opacity-0", defaultClassNames.dropdown),
			caption_label: cn("select-none font-medium", captionLayout === "label" ? "text-sm" : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5", defaultClassNames.caption_label),
			table: "w-full border-collapse",
			weekdays: cn("flex", defaultClassNames.weekdays),
			weekday: cn("text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal", defaultClassNames.weekday),
			week: cn("mt-2 flex w-full", defaultClassNames.week),
			week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
			week_number: cn("text-muted-foreground select-none text-[0.8rem]", defaultClassNames.week_number),
			day: cn("group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md", defaultClassNames.day),
			range_start: cn("bg-accent rounded-l-md", defaultClassNames.range_start),
			range_middle: cn("rounded-none", defaultClassNames.range_middle),
			range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
			today: cn("bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none", defaultClassNames.today),
			outside: cn("text-muted-foreground aria-selected:text-muted-foreground", defaultClassNames.outside),
			disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
			hidden: cn("invisible", defaultClassNames.hidden),
			...classNames
		},
		components: {
			Root: ({ className, rootRef, ...props }) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-slot": "calendar",
					ref: rootRef,
					className: cn(className),
					...props
				});
			},
			Chevron: ({ className, orientation, ...props }) => {
				if (orientation === "left") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
					className: cn("size-4", className),
					...props
				});
				if (orientation === "right") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
					className: cn("size-4", className),
					...props
				});
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
					className: cn("size-4", className),
					...props
				});
			},
			DayButton: CalendarDayButton,
			WeekNumber: ({ children, ...props }) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					...props,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex size-(--cell-size) items-center justify-center text-center",
						children
					})
				});
			},
			...components
		},
		...props
	});
}
function CalendarDayButton({ className, day, modifiers, ...props }) {
	const defaultClassNames = getDefaultClassNames();
	const ref = import_react.useRef(null);
	import_react.useEffect(() => {
		if (modifiers["focused"]) ref.current?.focus();
	}, [modifiers]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
		ref,
		variant: "ghost",
		size: "icon",
		"data-day": day.date.toLocaleDateString(),
		"data-selected-single": modifiers["selected"] && !modifiers["range_start"] && !modifiers["range_end"] && !modifiers["range_middle"],
		"data-range-start": modifiers["range_start"],
		"data-range-end": modifiers["range_end"],
		"data-range-middle": modifiers["range_middle"],
		className: cn("data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-(--cell-size) flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70", defaultClassNames.day, className),
		...props
	});
}
var Popover = Root2;
var PopoverTrigger = Trigger;
var PopoverContent = import_react.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	align,
	sideOffset,
	className: cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)", className),
	...props
}) }));
PopoverContent.displayName = Content2.displayName;
function UsuariosPage() {
	const { isOwner } = usePlayerSession();
	const queryClient = useQueryClient();
	const [userModal, setUserModal] = (0, import_react.useState)(null);
	const [userCreateSeed, setUserCreateSeed] = (0, import_react.useState)(0);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [destructiveLoading, setDestructiveLoading] = (0, import_react.useState)(false);
	const [saveConfirm, setSaveConfirm] = (0, import_react.useState)(null);
	const [destructiveConfirm, setDestructiveConfirm] = (0, import_react.useState)(null);
	const [search, setSearch] = (0, import_react.useState)("");
	const [debouncedSearch, setDebouncedSearch] = (0, import_react.useState)("");
	const [statusFilter, setStatusFilter] = (0, import_react.useState)("all");
	const [serverFilter, setServerFilter] = (0, import_react.useState)("all");
	const [planFilter, setPlanFilter] = (0, import_react.useState)("all");
	const [referralFilter, setReferralFilter] = (0, import_react.useState)("all");
	const [sortOrder, setSortOrder] = (0, import_react.useState)("newest");
	const [pageSize, setPageSize] = (0, import_react.useState)(10);
	const [currentPage, setCurrentPage] = (0, import_react.useState)(1);
	const fetchServers = useServerFn(listServers);
	const fetchUsersPage = useServerFn(listAccessUsersPage);
	const fetchPlans = useServerFn(getPlans);
	const mutationCreateUser = useServerFn(createAccessUser);
	const mutationUpdateUser = useServerFn(updateAccessUser);
	const mutationDeleteUser = useServerFn(deleteAccessUser);
	const mutationKick = useServerFn(kickDevices);
	const servers = useQuery({
		queryKey: ["admin-servers"],
		queryFn: () => fetchServers(),
		enabled: isOwner
	});
	const usersPage = useQuery({
		queryKey: [
			"admin-users-page",
			debouncedSearch,
			statusFilter,
			serverFilter,
			planFilter,
			referralFilter,
			sortOrder,
			currentPage,
			pageSize
		],
		queryFn: () => fetchUsersPage({ data: {
			search: debouncedSearch,
			status: statusFilter,
			server_id: serverFilter === "all" ? null : serverFilter,
			plan_id: planFilter === "all" || planFilter === "" ? null : planFilter,
			referral: referralFilter,
			sort_order: sortOrder,
			page: currentPage,
			page_size: pageSize
		} }),
		enabled: isOwner,
		placeholderData: (previous) => previous
	});
	const plans = useQuery({
		queryKey: ["admin-plans"],
		queryFn: () => fetchPlans(),
		enabled: isOwner
	});
	(0, import_react.useEffect)(() => {
		const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
		return () => window.clearTimeout(timer);
	}, [search]);
	(0, import_react.useEffect)(() => {
		setCurrentPage(1);
	}, [
		debouncedSearch,
		statusFilter,
		serverFilter,
		planFilter,
		referralFilter,
		sortOrder,
		pageSize
	]);
	const handleSaveUser = async (event) => {
		event.preventDefault();
		if (!userModal?.server_ids?.length) {
			toast.error("Selecione pelo menos um servidor");
			return;
		}
		const pwd = (userModal.password || "").trim();
		if (!userModal.id && pwd.length < 6) {
			toast.error("A senha precisa ter no minimo 6 caracteres");
			return;
		}
		if (userModal.id && pwd.length > 0 && pwd.length < 6) {
			toast.error("A nova senha precisa ter no minimo 6 caracteres");
			return;
		}
		setSaveConfirm({
			title: userModal.id ? "Confirmar atualização do usuário" : "Confirmar criação do usuário",
			description: userModal.id ? "Você tem certeza que deseja salvar as alterações deste acesso?" : "Você tem certeza que deseja criar este novo acesso?"
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
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro ao salvar usuário");
		} finally {
			setLoading(false);
		}
	};
	const confirmSaveAction = async () => {
		if (!saveConfirm) return;
		await executeSaveUser();
	};
	const handleDeleteUser = async (id) => {
		setDestructiveConfirm({
			kind: "delete",
			title: "Confirmar remoção do acesso",
			description: "Esta ação remove o acesso e desconecta o usuário. Deseja continuar?",
			actionLabel: "Sim, remover",
			targetId: id
		});
	};
	const executeDeleteUser = async (id) => {
		setDestructiveLoading(true);
		try {
			await mutationDeleteUser({ data: { id } });
			toast.success("Acesso removido com sucesso.");
			queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			setDestructiveConfirm(null);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro ao remover usuário");
		} finally {
			setDestructiveLoading(false);
		}
	};
	const handleKick = async (id) => {
		setDestructiveConfirm({
			kind: "kick",
			title: "Confirmar desconexão",
			description: "Esta ação desconecta todos os dispositivos deste usuário. Deseja continuar?",
			actionLabel: "Sim, desconectar",
			targetId: id
		});
	};
	const executeKick = async (id) => {
		setDestructiveLoading(true);
		try {
			await mutationKick({ data: { id } });
			toast.success("Dispositivos desconectados com sucesso.");
			queryClient.invalidateQueries({ queryKey: ["admin-users-page"] });
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			setDestructiveConfirm(null);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro ao desconectar");
		} finally {
			setDestructiveLoading(false);
		}
	};
	const confirmDestructiveAction = async () => {
		if (!destructiveConfirm) return;
		if (destructiveConfirm.kind === "delete") {
			await executeDeleteUser(destructiveConfirm.targetId);
			return;
		}
		await executeKick(destructiveConfirm.targetId);
	};
	const toggleServer = (serverId) => {
		const current = userModal.server_ids ?? [];
		setUserModal({
			...userModal,
			server_ids: current.includes(serverId) ? current.filter((id) => id !== serverId) : [...current, serverId]
		});
	};
	const totalUsers = usersPage.data?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
	const safePage = Math.min(currentPage, totalPages);
	const pageStart = totalUsers === 0 ? 0 : (safePage - 1) * pageSize + 1;
	const pageEnd = Math.min(safePage * pageSize, totalUsers);
	const visibleUsers = usersPage.data?.items ?? [];
	const statusCounts = usersPage.data?.status_counts ?? {
		all: 0,
		active: 0,
		blocked: 0,
		expired: 0,
		online: 0
	};
	(0, import_react.useEffect)(() => {
		if (currentPage > totalPages) setCurrentPage(totalPages);
	}, [currentPage, totalPages]);
	const paginationPages = (0, import_react.useMemo)(() => {
		const windowSize = 5;
		if (totalPages <= windowSize) return Array.from({ length: totalPages }, (_, index) => index + 1);
		const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
		const end = Math.min(totalPages, start + windowSize - 1);
		return Array.from({ length: end - start + 1 }, (_, index) => start + index);
	}, [safePage, totalPages]);
	if (!isOwner) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto max-w-md rounded-xl border border-border bg-card p-6 text-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-semibold",
			children: "Área restrita ao dono do sistema."
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(OwnerPageShell, {
		className: "mx-auto max-w-7xl pb-20",
		title: "Usuários do sistema",
		description: "Crie, edite e proteja acessos com uma superfície visual própria para operação, separada da experiência do cliente.",
		icon: Users,
		rightSlot: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-[140px] rounded-xl border border-sidebar-border/70 bg-background/60 px-2.5 py-2 text-[10px] leading-snug shadow-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[8px] font-black uppercase tracking-[0.16em] text-muted-foreground",
				children: "Operação"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-0.5 truncate font-semibold text-foreground",
				children: "Acessos e limites"
			})]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-bold tracking-tight",
					children: "Usuários"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground",
					children: "Cada usuário criado acessa canais, filmes, séries e troca de servidor."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => {
						const testPlan = plans.data?.find((p) => p.name.toLowerCase().includes("teste"));
						setUserCreateSeed(Date.now());
						setUserModal({
							username: "",
							password: "",
							display_name: "",
							max_connections: testPlan?.max_connections ?? 1,
							server_ids: (servers.data ?? []).map((server) => server.id),
							is_active: true,
							plan_id: testPlan?.id || null,
							expires_at: testPlan ? new Date(Date.now() + testPlan.duration_value * (testPlan.duration_unit === "minutes" ? 6e4 : testPlan.duration_unit === "hours" ? 36e5 : 864e5)).toISOString() : null
						});
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "mr-2 h-4 w-4" }), " Criar usuário"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "border-primary/20 bg-card/50 p-4 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								className: "text-xs uppercase tracking-wider text-muted-foreground",
								children: "Status"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tabs, {
								value: statusFilter,
								onValueChange: (value) => setStatusFilter(value),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
									className: "grid h-auto w-full grid-cols-5 gap-1 rounded-xl bg-muted/40 p-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "all",
											className: "h-10 rounded-lg text-xs font-semibold",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1.5",
												children: ["Todos", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground",
													children: statusCounts.all
												})]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "active",
											className: "h-10 rounded-lg text-xs font-semibold",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1.5",
												children: ["Ativos", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground",
													children: statusCounts.active
												})]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "online",
											className: "h-10 rounded-lg text-xs font-semibold",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1.5",
												children: ["Online", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground",
													children: statusCounts.online
												})]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "blocked",
											className: "h-10 rounded-lg text-xs font-semibold",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1.5",
												children: ["Bloqueados", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground",
													children: statusCounts.blocked
												})]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
											value: "expired",
											className: "h-10 rounded-lg text-xs font-semibold",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1.5",
												children: ["Expirados", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground",
													children: statusCounts.expired
												})]
											})
										})
									]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-4 md:grid-cols-2 xl:grid-cols-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5 xl:col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs uppercase tracking-wider text-muted-foreground",
										children: "Buscar"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "Username ou nome...",
										value: search,
										onChange: (event) => setSearch(event.target.value),
										className: "h-9"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs uppercase tracking-wider text-muted-foreground",
										children: "Servidor"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
										value: serverFilter,
										onChange: (event) => setServerFilter(event.target.value),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "all",
											children: "Todos"
										}), servers.data?.map((server) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: server.id,
											children: server.name
										}, server.id))]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs uppercase tracking-wider text-muted-foreground",
										children: "Plano"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
										value: planFilter,
										onChange: (event) => setPlanFilter(event.target.value),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "all",
												children: "Todos"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "Sem Plano"
											}),
											plans.data?.map((plan) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: plan.id,
												children: plan.name
											}, plan.id))
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs uppercase tracking-wider text-muted-foreground",
										children: "Indicação"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
										value: referralFilter,
										onChange: (event) => setReferralFilter(event.target.value),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "all",
												children: "Todas"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "direct",
												children: "Direto"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "referred",
												children: "Indicado"
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "text-xs uppercase tracking-wider text-muted-foreground",
										children: "Ordenar"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
										value: sortOrder,
										onChange: (event) => setSortOrder(event.target.value),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "newest",
												children: "Mais recentes"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "oldest",
												children: "Mais antigos"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "expiry",
												children: "Vencimento"
											})
										]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-end justify-between gap-3 border-t border-border/40 pt-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-4",
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
											children: totalUsers
										}),
										" usuários"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "w-[150px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
										className: "mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground",
										children: "Linhas por página"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
										value: String(pageSize),
										onValueChange: (value) => setPageSize(Number(value)),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
											className: "h-9",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "10" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: [
											10,
											25,
											50,
											250,
											500,
											1e3
										].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
											value: String(value),
											children: value
										}, value)) })]
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "sm",
								className: "h-8 text-xs",
								onClick: () => {
									setSearch("");
									setStatusFilter("all");
									setServerFilter("all");
									setPlanFilter("all");
									setReferralFilter("all");
									setSortOrder("newest");
									setPageSize(10);
									setCurrentPage(1);
								},
								children: "Limpar Filtros"
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-w-[800px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Usuário" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Indicação" }),
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
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: usersPage.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 7,
						className: "h-24 text-center text-xs text-destructive",
						children: usersPage.error instanceof Error ? usersPage.error.message : "Falha ao carregar usuários."
					}) }) : usersPage.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 7,
						className: "h-24 text-center text-xs text-muted-foreground",
						children: "Carregando usuários..."
					}) }) : totalUsers === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 7,
						className: "h-24 text-center text-xs text-muted-foreground",
						children: "Nenhum usuário encontrado com os filtros atuais."
					}) }) : visibleUsers.map((user) => (() => {
						const isProtectedOwner = user.username === "magodono";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-medium",
								children: user.display_name || user.username
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-xs text-muted-foreground",
								children: ["@", user.username]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: user.referred_by ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20",
								children: ["@", user.referred_by.username]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-muted-foreground uppercase tracking-tighter",
								children: "Direto"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
								className: "text-xs",
								children: [user.server_ids.length, " sv(s)"]
							}),
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
								children: user.expires_at ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
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
									className: "flex justify-end gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "icon",
											title: "Desconectar dispositivos",
											onClick: () => handleKick(user.id),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "icon",
											onClick: () => setUserModal(user),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SquarePen, { className: "h-4 w-4" })
										}),
										!isProtectedOwner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
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
										})
									]
								})
							})
						] }, user.id);
					})()) })] })
				})
			}),
			totalUsers > 0 && totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "border-primary/10 bg-card/40 px-4 py-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-between gap-3",
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
								onClick: () => setCurrentPage(1),
								disabled: safePage === 1,
								children: "Primeira"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								onClick: () => setCurrentPage((page) => Math.max(1, page - 1)),
								disabled: safePage === 1,
								children: "Anterior"
							}),
							paginationPages.map((page) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: page === safePage ? "default" : "outline",
								className: "min-w-10",
								onClick: () => setCurrentPage(page),
								children: page
							}, page)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								onClick: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
								disabled: safePage === totalPages,
								children: "Próxima"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								onClick: () => setCurrentPage(totalPages),
								disabled: safePage === totalPages,
								children: "Última"
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!userModal,
				onOpenChange: (open) => !open && setUserModal(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-[520px] w-[95vw] max-h-[90vh] overflow-y-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSaveUser,
						autoComplete: "off",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: userModal?.id ? "Editar usuário" : "Novo usuário" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Credenciais de acesso ao sistema com limite de conexões por dispositivo." })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Nome de exibição (opcional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											name: "user_display_name",
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
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Plano de assinatura (opcional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
											value: userModal?.plan_id || "",
											onChange: (e) => {
												const planId = e.target.value || null;
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
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "",
												children: "Personalizado (Sem plano)"
											}), (plans.data ?? []).map((plan) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
												value: plan.id,
												children: [
													plan.name,
													" - R$ ",
													Number(plan.price).toFixed(2)
												]
											}, plan.id))]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-4 sm:grid-cols-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Usuário" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												name: "user_username",
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
												name: "user_password",
												autoComplete: "new-password",
												value: userModal?.password || "",
												minLength: 6,
												placeholder: "Mínimo de 6 caracteres",
												onChange: (e) => setUserModal({
													...userModal,
													password: e.target.value
												}),
												required: !userModal?.id
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-4 sm:grid-cols-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Máx. conexões" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												min: "1",
												max: "20",
												name: "user_max_connections",
												autoComplete: "off",
												value: userModal?.max_connections ?? 1,
												onChange: (e) => setUserModal({
													...userModal,
													max_connections: parseInt(e.target.value || "1", 10)
												}),
												required: true
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Vencimento (opcional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
												asChild: true,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													type: "button",
													variant: "outline",
													className: cn("justify-start text-left font-normal", !userModal?.expires_at && "text-muted-foreground"),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "mr-2 h-4 w-4" }), userModal?.expires_at ? format(new Date(userModal.expires_at), "dd/MM/yyyy") : "Escolher data"]
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PopoverContent, {
												className: "w-auto p-0",
												align: "start",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar$1, {
													mode: "single",
													locale: ptBR,
													captionLayout: "dropdown",
													startMonth: new Date(1970, 0),
													endMonth: new Date(2100, 11),
													defaultMonth: userModal?.expires_at ? new Date(userModal.expires_at) : /* @__PURE__ */ new Date(),
													selected: userModal?.expires_at ? new Date(userModal.expires_at) : void 0,
													onSelect: (date) => setUserModal({
														...userModal,
														expires_at: date ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString() : null
													}),
													className: "pointer-events-auto p-3"
												}), userModal?.expires_at ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "border-t p-2",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														variant: "ghost",
														size: "sm",
														className: "w-full",
														onClick: () => setUserModal({
															...userModal,
															expires_at: null
														}),
														children: "Sem validade"
													})
												}) : null]
											})] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Servidores liberados" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid max-h-[150px] grid-cols-2 gap-2 overflow-y-auto rounded-md border p-2",
											children: servers.data?.map((server) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												className: "flex cursor-pointer items-center gap-2 text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: (userModal?.server_ids ?? []).includes(server.id),
													onChange: () => toggleServer(server.id)
												}), server.name]
											}, server.id))
										})]
									}),
									userModal?.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex cursor-pointer items-center gap-2 text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: !!userModal?.is_active,
											onChange: (e) => setUserModal({
												...userModal,
												is_active: e.target.checked
											})
										}), "Acesso ativo"]
									}) : null
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
								children: "Salvar"
							})] })
						]
					})
				}, userModal?.id ? `user-edit-${userModal.id}` : `user-create-${userCreateSeed}`)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!saveConfirm,
				onOpenChange: (open) => !open && setSaveConfirm(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-[425px]",
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
						children: loading ? "Salvando..." : "Sim, salvar"
					})] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!destructiveConfirm,
				onOpenChange: (open) => !open && setDestructiveConfirm(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-[440px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: destructiveConfirm?.title ?? "Confirmar ação" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: destructiveConfirm?.description ?? "Você tem certeza que deseja continuar?" })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] font-black uppercase tracking-[0.2em] text-destructive",
								children: "Ação irreversível"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2",
								children: "Esta operação altera dados e não deve ser executada sem intenção explícita."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							onClick: () => setDestructiveConfirm(null),
							disabled: destructiveLoading,
							children: "Não, voltar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "destructive",
							onClick: () => void confirmDestructiveAction(),
							disabled: destructiveLoading,
							children: destructiveLoading ? "Executando..." : destructiveConfirm?.actionLabel ?? "Sim, continuar"
						})] })
					]
				})
			})
		]
	});
}
//#endregion
export { UsuariosPage as component };
