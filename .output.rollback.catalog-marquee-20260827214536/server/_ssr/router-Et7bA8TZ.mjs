import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { F as isRedirect, R as redirect, _ as createRootRouteWithContext, b as useRouter, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as __exportAll, r as createServerFn } from "./server-BKGO9b_w.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-CW0Oz35S.mjs";
import { t as ensureUserReferralCode } from "./referral-code-CKiYkjE0.mjs";
import { a as numberType, i as literalType, n as booleanType, o as objectType, s as stringType } from "../_libs/zod.mjs";
import { t as supabase } from "./client-DUSZWvd2.mjs";
import { n as MAGO_RUNTIME_CLEAR_EVENT, r as MAGO_RUNTIME_ERROR_EVENT } from "./ssr.mjs";
import { n as readLocalImageCache, r as writeLocalImageCache } from "./server-media-cache.server-BRfjV5Wz.mjs";
import { n as recordAuditLog, r as recordPaymentEvent, t as claimApprovedPayment } from "./payments-tracking.functions-Bp-uxtDc.mjs";
import { t as createSsrRpc } from "./createSsrRpc-pov-8oIe.mjs";
import { i as getAppConfig, n as DEFAULT_BRAND_IMAGE_URL, t as APP_CONFIG_QUERY_KEY } from "./config.functions-BhlETQbd.mjs";
import { t as readStreamToken } from "./stream-proxy.server-ByScHUwZ.mjs";
import { t as resolveReferralSourceSlug } from "./referral-C4TN5CS0.mjs";
import { n as QueryClientProvider, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as ChevronDown, Y as ChevronUp, l as TriangleAlert, n as X } from "../_libs/lucide-react.mjs";
import { a as Viewport, i as ScrollAreaThumb, n as Root, r as ScrollAreaScrollbar, t as Corner } from "../_libs/radix-ui__react-scroll-area.mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/test-links.functions-CHyug4a5.js
var checkDeviceBlocked = createServerFn({ method: "POST" }).inputValidator((input) => objectType({
	fingerprint: stringType(),
	slug: stringType().min(1)
}).parse(input)).handler(createSsrRpc("f94c5062750447c8b15f30f6570af04435932d0d5f4efa480b9d588cfe306e6f"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("45aada6ded07ac5475d96a3392b2b0e2c78a7b093d2176ad3cc8441b374768cf"));
var listTestLinksPage = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((input) => objectType({
	page: numberType().int().min(1),
	page_size: numberType().int().min(1).max(100)
}).parse(input)).handler(createSsrRpc("0c0ee742b0c7014702d425e4387f1a2246eb11b609c8599e348737f523320de7"));
var saveTestLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	id: stringType().uuid().optional(),
	slug: stringType().min(3),
	duration_minutes: numberType().int().min(1),
	max_connections: numberType().int().min(1),
	is_active: booleanType(),
	owner_only: booleanType().default(false),
	allow_repeat_device: booleanType().default(false),
	bonus_days_monthly: numberType().int().min(0).default(15),
	bonus_days_quarterly: numberType().int().min(0).default(30),
	description: stringType().optional().or(literalType(""))
}).parse(input)).handler(createSsrRpc("438ff3736a4945e58121f91695f6aec4ba8a783b6a6d4df83c125ec6c60d8cdb"));
var deleteTestLink = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({ id: stringType().uuid() }).parse(input)).handler(createSsrRpc("b22cab00db581279574cb639893d2bf934896c79ffcc37a003e6edc9b5fc82d7"));
var createTestUser = createServerFn({ method: "POST" }).inputValidator((input) => objectType({
	slug: stringType(),
	fingerprint: stringType(),
	referral_code: stringType().nullable().optional()
}).parse(input)).handler(createSsrRpc("e056343c43757919d3c8ea2820c1687458d0dd801bc0b92ca0e6b6ccc3134eeb"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-Et7bA8TZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
var FOCUSABLE_SELECTOR = [
	"a[href]",
	"button:not([disabled])",
	"input:not([type=\"hidden\"]):not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])",
	"[role=\"button\"]",
	"[role=\"menuitem\"]",
	"[role=\"option\"]",
	"[role=\"tab\"]",
	"[data-tv-focus]"
].join(",");
var IGNORE_ARROW_NAV_SELECTOR = [
	"input",
	"textarea",
	"select",
	"[contenteditable=\"true\"]",
	"video",
	"audio",
	"[role=\"textbox\"]",
	"[role=\"searchbox\"]",
	"[role=\"slider\"]",
	"[role=\"combobox\"]",
	"[role=\"listbox\"]",
	"[role=\"option\"]",
	"[role=\"menu\"]",
	"[role=\"menuitem\"]",
	"[role=\"tablist\"]",
	"[role=\"tab\"]",
	"[role=\"tree\"]",
	"[role=\"treeitem\"]",
	"[role=\"radiogroup\"]",
	"[role=\"radio\"]"
].join(",");
function isVisible(element) {
	if (!element.isConnected) return false;
	const rect = element.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) return false;
	const style = window.getComputedStyle(element);
	return style.visibility !== "hidden" && style.display !== "none";
}
function isTypingContext(element) {
	if (!(element instanceof HTMLElement)) return false;
	return Boolean(element.closest(IGNORE_ARROW_NAV_SELECTOR));
}
function getFocusableElements() {
	return Array.from(document.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => isVisible(element) && !element.hasAttribute("aria-hidden"));
}
function focusFirstFocusable() {
	const first = getFocusableElements()[0];
	if (!first) return false;
	first.focus({ preventScroll: false });
	return true;
}
function isActivationKey(event) {
	return event.key === "Enter" || event.key === " " || event.key === "Spacebar" || event.key === "OK" || event.key === "Select" || event.key === "Accept" || event.key === "Go" || event.code === "Enter" || event.code === "Space" || event.code === "NumpadEnter" || event.keyCode === 13 || event.keyCode === 32 || event.keyCode === 23 || event.keyCode === 167;
}
function activateFocusedElement() {
	const active = document.activeElement;
	if (!(active instanceof HTMLElement)) return false;
	if (active.matches(IGNORE_ARROW_NAV_SELECTOR)) return false;
	if (active instanceof HTMLButtonElement || active instanceof HTMLAnchorElement) {
		active.click();
		return true;
	}
	if (active.getAttribute("role") === "button" || active.hasAttribute("data-tv-focus")) {
		active.click();
		return true;
	}
	active.click();
	return true;
}
function moveFocus(direction) {
	const focusables = getFocusableElements();
	if (focusables.length === 0) return;
	const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	const current = active && focusables.includes(active) ? active : null;
	if (!current) {
		if (!focusFirstFocusable()) return;
		return;
	}
	const currentRect = current.getBoundingClientRect();
	const currentCenterX = currentRect.left + currentRect.width / 2;
	const currentCenterY = currentRect.top + currentRect.height / 2;
	let best = null;
	for (const candidate of focusables) {
		if (candidate === current) continue;
		const rect = candidate.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const deltaX = centerX - currentCenterX;
		const deltaY = centerY - currentCenterY;
		if (direction === "right" && deltaX <= 4) continue;
		if (direction === "left" && deltaX >= -4) continue;
		if (direction === "down" && deltaY <= 4) continue;
		if (direction === "up" && deltaY >= -4) continue;
		const primary = direction === "right" || direction === "left" ? Math.abs(deltaX) : Math.abs(deltaY);
		const secondary = direction === "right" || direction === "left" ? Math.abs(deltaY) : Math.abs(deltaX);
		const score = primary * 1.5 + secondary;
		if (!best || score < best.score) best = {
			element: candidate,
			score
		};
	}
	if (best) {
		best.element.focus({ preventScroll: false });
		best.element.scrollIntoView({
			block: "nearest",
			inline: "nearest"
		});
	}
}
function useGlobalRemoteNavigation() {
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
			if (isActivationKey(event)) {
				const target = event.target;
				if (target instanceof HTMLElement && isTypingContext(target)) return;
				const active = document.activeElement;
				if (active instanceof HTMLElement && active !== document.body) {
					event.preventDefault();
					if (activateFocusedElement()) return;
				}
				if (focusFirstFocusable()) {
					event.preventDefault();
					activateFocusedElement();
				}
				return;
			}
			if (![
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight"
			].includes(event.key)) return;
			const target = event.target;
			if (isTypingContext(target)) return;
			event.preventDefault();
			moveFocus(event.key === "ArrowUp" ? "up" : event.key === "ArrowDown" ? "down" : event.key === "ArrowLeft" ? "left" : "right");
		};
		window.addEventListener("keydown", onKey, true);
		window.addEventListener("keyup", onKey, true);
		window.addEventListener("keypress", onKey, true);
		document.addEventListener("keydown", onKey, true);
		document.addEventListener("keyup", onKey, true);
		document.addEventListener("keypress", onKey, true);
		return () => {
			window.removeEventListener("keydown", onKey, true);
			window.removeEventListener("keyup", onKey, true);
			window.removeEventListener("keypress", onKey, true);
			document.removeEventListener("keydown", onKey, true);
			document.removeEventListener("keyup", onKey, true);
			document.removeEventListener("keypress", onKey, true);
		};
	}, []);
}
var styles_default = "/assets/styles-CnG6tYAP.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const message = error instanceof Response ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` : error instanceof Error ? error.message : String(error);
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message,
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var ScrollArea = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Root, {
	ref,
	className: cn("relative overflow-hidden", className),
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Viewport, {
			className: "h-full w-full rounded-[inherit]",
			children
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollBar, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Corner, {})
	]
}));
ScrollArea.displayName = Root.displayName;
var ScrollBar = import_react.forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollAreaScrollbar, {
	ref,
	orientation,
	className: cn("flex touch-none select-none transition-colors", orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]", orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-border" })
}));
ScrollBar.displayName = ScrollAreaScrollbar.displayName;
var MAX_ITEMS = 5;
var MAX_ITEM_AGE_MS = 12e4;
var PRUNE_INTERVAL_MS = 5e3;
var ORIGIN_ORDER = [
	"server",
	"worker",
	"client",
	"unknown"
];
var ORIGIN_LABELS = {
	server: "Server",
	worker: "Worker",
	client: "Cliente",
	unknown: "Outro"
};
function getHeadline(summary) {
	return summary.split("\n").find((line) => line.trim())?.trim() || "Erro sem detalhes";
}
function getOriginTone(origin) {
	if (origin === "worker") return "border-amber-500/20 bg-amber-500/10 text-amber-200";
	if (origin === "server") return "border-sky-500/20 bg-sky-500/10 text-sky-200";
	if (origin === "client") return "border-violet-500/20 bg-violet-500/10 text-violet-200";
	return "border-white/10 bg-white/5 text-neutral-300";
}
function formatTime(timestamp) {
	return new Intl.DateTimeFormat("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit"
	}).format(timestamp);
}
function RuntimeErrorMonitor() {
	const [items, setItems] = (0, import_react.useState)([]);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [activeOrigin, setActiveOrigin] = (0, import_react.useState)("all");
	(0, import_react.useEffect)(() => {
		const handleCapturedError = (event) => {
			const detail = event.detail;
			if (!detail?.id) return;
			if (Date.now() - detail.at > MAX_ITEM_AGE_MS) return;
			setItems((current) => {
				if (current.some((item) => item.id === detail.id)) return current;
				return [{
					...detail,
					headline: getHeadline(detail.summary)
				}, ...current].slice(0, MAX_ITEMS);
			});
			setOpen(true);
		};
		const handleClear = () => {
			setItems([]);
			setOpen(false);
		};
		window.addEventListener(MAGO_RUNTIME_ERROR_EVENT, handleCapturedError);
		window.addEventListener(MAGO_RUNTIME_CLEAR_EVENT, handleClear);
		const pruneTimer = window.setInterval(() => {
			setItems((current) => {
				const now = Date.now();
				const next = current.filter((item) => now - item.at <= MAX_ITEM_AGE_MS);
				if (next.length === current.length) return current;
				if (next.length === 0) setOpen(false);
				return next;
			});
		}, PRUNE_INTERVAL_MS);
		window.dispatchEvent(new Event(MAGO_RUNTIME_CLEAR_EVENT));
		return () => {
			window.removeEventListener(MAGO_RUNTIME_ERROR_EVENT, handleCapturedError);
			window.removeEventListener(MAGO_RUNTIME_CLEAR_EVENT, handleClear);
			window.clearInterval(pruneTimer);
		};
	}, []);
	const visibleItems = (0, import_react.useMemo)(() => {
		return (activeOrigin === "all" ? items : items.filter((item) => item.origin === activeOrigin)).slice(0, MAX_ITEMS);
	}, [activeOrigin, items]);
	const groupedItems = (0, import_react.useMemo)(() => {
		if (activeOrigin !== "all") return [{
			origin: activeOrigin,
			items: visibleItems
		}];
		return ORIGIN_ORDER.map((origin) => ({
			origin,
			items: items.filter((item) => item.origin === origin).slice(0, MAX_ITEMS)
		})).filter((group) => group.items.length > 0);
	}, [
		activeOrigin,
		items,
		visibleItems
	]);
	const latest = visibleItems[0] ?? items[0];
	if (!latest) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed bottom-4 right-4 z-[60] w-[min(27rem,calc(100vw-1rem))]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("overflow-hidden rounded-2xl border border-red-500/20 bg-[#101010]/95 text-white shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-200", open ? "scale-100 opacity-100" : "scale-[0.99] opacity-95"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setOpen((current) => !current),
				className: "flex w-full items-center justify-between gap-2.5 border-b border-white/8 px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.02]",
				"aria-expanded": open,
				"aria-label": "Alternar monitor de erros recentes",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-200",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { size: 16 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[13px] font-semibold text-white",
								children: "Erro novo detectado"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-200",
								children: visibleItems.length
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-[11px] leading-4 text-neutral-400",
							children: latest.headline
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5 text-neutral-300",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] uppercase tracking-[0.18em] text-neutral-500",
						children: formatTime(latest.at)
					}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 15 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { size: 15 })]
				})]
			}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2.5 flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] uppercase tracking-[0.24em] text-neutral-500",
							children: "Monitor leve"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[12px] leading-5 text-neutral-300",
							children: "Só aparece quando um erro realmente novo entra no fluxo."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setItems([]),
							className: "inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 13 }), "Limpar"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2.5 flex flex-wrap gap-1.5",
						children: ["all", ...ORIGIN_ORDER].map((origin) => {
							const count = origin === "all" ? items.length : items.filter((item) => item.origin === origin).length;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setActiveOrigin(origin),
								className: cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-colors", activeOrigin === origin ? "border-white/15 bg-white/10 text-white" : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: origin === "all" ? "Todos" : ORIGIN_LABELS[origin] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-black/20 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-neutral-300",
									children: count
								})]
							}, origin);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollArea, {
						className: "max-h-56 pr-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2.5",
							children: groupedItems.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "space-y-1.5",
								children: [activeOrigin === "all" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center justify-between gap-2 px-0.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]", getOriginTone(group.origin)),
											children: ORIGIN_LABELS[group.origin]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[11px] text-neutral-500",
											children: [group.items.length, " alerta(s)"]
										})]
									})
								}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-1.5",
									children: group.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-2xl border border-white/10 bg-black/25 p-2.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-wrap items-center gap-1.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]", getOriginTone(item.origin)),
															children: ORIGIN_LABELS[item.origin]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-red-200",
															children: item.mechanism
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] text-neutral-500",
															children: formatTime(item.at)
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1.5 text-[13px] font-medium leading-5 text-white",
													children: item.headline
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-300",
												children: "novo"
											})]
										}), item.summary !== item.headline ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
											className: "mt-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
												className: "cursor-pointer list-none text-[11px] text-neutral-400 transition-colors hover:text-neutral-200",
												children: "Ver detalhe técnico"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
												className: "mt-1.5 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-white/8 bg-black/30 p-2.5 text-[11px] leading-5 text-neutral-200",
												children: item.summary
											})]
										}) : null]
									}, item.id))
								})]
							}, group.origin))
						})
					})
				]
			}) : null]
		})
	});
}
var LEGACY_CSS_BOOTSTRAP = `
(function () {
  try {
    var ua = navigator.userAgent || "";
    var isTvBrowser = /(webos|tizen|smarttv|smart-tv|android tv|googletv|hbbtv|firetv|appletv|netcast)/i.test(ua);
    var needsLegacy = isTvBrowser || !("CSSLayerBlockRule" in window) || !window.CSS || !window.CSS.supports || !window.CSS.supports("color", "oklch(0 0 0)");
    if (!needsLegacy || document.querySelector('link[data-legacy-css="true"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/api/public/legacy-css?v=20260805";
    link.setAttribute("data-legacy-css", "true");
    document.head.appendChild(link);
  } catch (error) {}
})();`;
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$17 = createRootRouteWithContext()({
	head: () => {
		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1"
				},
				{ title: "Aplicativo IPTV" },
				{
					name: "description",
					content: "Aplicativo IPTV multi-servidor."
				},
				{
					name: "author",
					content: "Sistema"
				},
				{
					property: "og:title",
					content: "Aplicativo IPTV"
				},
				{
					property: "og:description",
					content: "Aplicativo IPTV multi-servidor."
				},
				{
					property: "og:type",
					content: "website"
				},
				{
					property: "og:image",
					content: DEFAULT_BRAND_IMAGE_URL
				},
				{
					property: "og:image:secure_url",
					content: DEFAULT_BRAND_IMAGE_URL
				},
				{
					property: "og:image:alt",
					content: "Aplicativo IPTV"
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				},
				{
					name: "twitter:site",
					content: "@app"
				},
				{
					name: "twitter:image",
					content: DEFAULT_BRAND_IMAGE_URL
				},
				{
					name: "twitter:image:alt",
					content: "Aplicativo IPTV"
				},
				{
					name: "theme-color",
					content: "#05070b"
				},
				{
					name: "apple-mobile-web-app-capable",
					content: "yes"
				},
				{
					name: "apple-mobile-web-app-status-bar-style",
					content: "black-translucent"
				}
			],
			links: [
				{
					rel: "stylesheet",
					href: styles_default
				},
				{
					rel: "icon",
					href: DEFAULT_BRAND_IMAGE_URL,
					type: "image/png"
				},
				{
					rel: "manifest",
					href: "/manifest.webmanifest"
				}
			]
		};
	},
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: LEGACY_CSS_BOOTSTRAP } }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			children,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RuntimeErrorMonitor, {})
		] })]
	});
}
function ThemeApplier() {
	const fetchConfig = useServerFn(getAppConfig);
	const { data: config } = useQuery({
		queryKey: APP_CONFIG_QUERY_KEY,
		queryFn: () => fetchConfig(),
		staleTime: 3e5
	});
	(0, import_react.useEffect)(() => {
		const mode = config?.theme_mode ?? "azul";
		document.documentElement.setAttribute("data-theme", mode);
		document.documentElement.classList.toggle("dark", mode !== "light");
		const head = document.getElementsByTagName("head")[0];
		if (head) {
			let link = document.querySelector("link[rel~='icon']");
			if (!link) {
				link = document.createElement("link");
				link.rel = "icon";
				head.appendChild(link);
			}
			link.href = config?.favicon_url || config?.logo_small_url || config?.logo_url || "/brand/webplayer-brand.png";
		}
		const primary = config?.theme?.primary || "#3ba0ff";
		const background = config?.theme?.bg || "#05070b";
		const brandName = config?.short_name || config?.name || "Sistema IPTV";
		const description = config?.description || "Aplicativo IPTV multi-servidor.";
		const primaryForeground = (() => {
			const hex = primary.replace("#", "");
			if (hex.length !== 6) return .2;
			const linear = [
				Number.parseInt(hex.slice(0, 2), 16) / 255,
				Number.parseInt(hex.slice(2, 4), 16) / 255,
				Number.parseInt(hex.slice(4, 6), 16) / 255
			].map((value) => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
			return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
		})() > .45 ? "#05070b" : "#ffffff";
		document.documentElement.style.setProperty("--background", background);
		document.documentElement.style.setProperty("--primary", primary);
		document.documentElement.style.setProperty("--primary-foreground", primaryForeground);
		document.documentElement.style.setProperty("--sidebar-primary", primary);
		document.documentElement.style.setProperty("--sidebar-primary-foreground", primaryForeground);
		document.documentElement.style.setProperty("--ring", primary);
		document.documentElement.style.setProperty("--theme-color", primary);
		document.title = `${document.title.replace(/\s*\|.*$/, "").trim()} | ${brandName}`;
		const themeColorMeta = document.querySelector("meta[name='theme-color']");
		if (themeColorMeta) themeColorMeta.setAttribute("content", primary);
		const upsertMeta = (selector, attr, key, value) => {
			let meta = document.querySelector(selector);
			if (!meta) {
				meta = document.createElement("meta");
				meta.setAttribute(attr, key);
				document.head.appendChild(meta);
			}
			meta.setAttribute("content", value);
		};
		upsertMeta("meta[name='description']", "name", "description", description);
		upsertMeta("meta[name='author']", "name", "author", brandName);
		upsertMeta("meta[property='og:title']", "property", "og:title", `${document.title}`);
		upsertMeta("meta[property='og:description']", "property", "og:description", description);
		upsertMeta("meta[property='og:image:alt']", "property", "og:image:alt", brandName);
		upsertMeta("meta[name='twitter:image:alt']", "name", "twitter:image:alt", brandName);
	}, [config]);
	return null;
}
function RootComponent() {
	const { queryClient } = Route$17.useRouteContext();
	useGlobalRemoteNavigation();
	(0, import_react.useEffect)(() => {
		const reloadFlagKey = "wp-chunk-reload-once";
		sessionStorage.removeItem(reloadFlagKey);
		const shouldReloadForChunkError = (value) => {
			const message = typeof value === "string" ? value.toLowerCase() : value instanceof Error ? `${value.name}: ${value.message}`.toLowerCase() : "";
			if (!message) return false;
			return message.includes("failed to fetch dynamically imported module") || message.includes("importing a module script failed") || message.includes("chunkloaderror") || message.includes("vite:preloaderror");
		};
		const triggerSafeReload = () => {
			if (sessionStorage.getItem(reloadFlagKey) === "1") return;
			sessionStorage.setItem(reloadFlagKey, "1");
			window.location.reload();
		};
		const onVitePreloadError = (event) => {
			event.preventDefault();
			triggerSafeReload();
		};
		const onWindowError = (event) => {
			if (shouldReloadForChunkError(event.error ?? event.message)) {
				event.preventDefault();
				triggerSafeReload();
			}
		};
		const onUnhandledRejection = (event) => {
			if (shouldReloadForChunkError(event.reason)) {
				event.preventDefault();
				triggerSafeReload();
			}
		};
		window.addEventListener("vite:preloadError", onVitePreloadError);
		window.addEventListener("error", onWindowError);
		window.addEventListener("unhandledrejection", onUnhandledRejection);
		return () => {
			window.removeEventListener("vite:preloadError", onVitePreloadError);
			window.removeEventListener("error", onWindowError);
			window.removeEventListener("unhandledrejection", onUnhandledRejection);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeApplier, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})]
	});
}
var $$splitComponentImporter$12 = () => import("./routes-YUbT9Pny.mjs");
var Route$16 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Login do Cliente" },
		{
			name: "description",
			content: "Acesse sua conta de cliente."
		},
		{
			property: "og:title",
			content: "Login do Cliente"
		},
		{
			property: "og:description",
			content: "Entre com suas credenciais de cliente para acessar canais, filmes e séries."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			property: "og:image",
			content: DEFAULT_BRAND_IMAGE_URL
		},
		{
			property: "og:image:secure_url",
			content: DEFAULT_BRAND_IMAGE_URL
		},
		{
			property: "og:image:alt",
			content: "Aplicativo IPTV"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{
			name: "twitter:image",
			content: DEFAULT_BRAND_IMAGE_URL
		},
		{
			name: "twitter:image:alt",
			content: "Aplicativo IPTV"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./route-CY6BEOwO.mjs");
var Route$15 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({ to: "/" });
	},
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitComponentImporter$10 = () => import("./dono-CNWvTr89.mjs");
var Route$14 = createFileRoute("/dono")({
	head: () => ({ meta: [
		{ title: "Acesso administrativo" },
		{
			name: "description",
			content: "Entrada administrativa exclusiva do dono do sistema."
		},
		{
			property: "og:title",
			content: "Acesso administrativo"
		},
		{
			property: "og:description",
			content: "Tela administrativa separada da entrada pública de clientes."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			property: "og:image",
			content: DEFAULT_BRAND_IMAGE_URL
		},
		{
			property: "og:image:secure_url",
			content: DEFAULT_BRAND_IMAGE_URL
		},
		{
			property: "og:image:alt",
			content: "Aplicativo IPTV"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{
			name: "twitter:image",
			content: DEFAULT_BRAND_IMAGE_URL
		},
		{
			name: "twitter:image:alt",
			content: "Aplicativo IPTV"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./canais-DI0ZsMsW.mjs");
var Route$13 = createFileRoute("/_authenticated/canais")({
	head: () => ({ meta: [
		{ title: "TV ao Vivo" },
		{
			name: "description",
			content: "Assista os canais ao vivo do servidor selecionado."
		},
		{
			property: "og:title",
			content: "TV ao Vivo"
		},
		{
			property: "og:description",
			content: "Canais ao vivo multi-servidor."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./conta-BpaCq3GB.mjs");
var Route$12 = createFileRoute("/_authenticated/conta")({
	head: () => ({ meta: [
		{ title: "Minha Conta" },
		{
			name: "description",
			content: "Gerencie seu plano, conexões e credenciais de acesso."
		},
		{
			property: "og:title",
			content: "Minha Conta"
		},
		{
			property: "og:description",
			content: "Gerencie seu plano e credenciais de acesso."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var $$splitComponentImporter$7 = () => import("./filmes-Bb2Nyy8W.mjs");
var Route$11 = createFileRoute("/_authenticated/filmes")({
	validateSearch: (search) => ({ q: typeof search.q === "string" ? search.q : "" }),
	head: () => ({ meta: [
		{ title: "Filmes" },
		{
			name: "description",
			content: "Catálogo de filmes on demand do servidor selecionado."
		},
		{
			property: "og:title",
			content: "Filmes"
		},
		{
			property: "og:description",
			content: "Filmes on demand multi-servidor."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./inicio-BIDL0zPg.mjs");
var Route$10 = createFileRoute("/_authenticated/inicio")({
	head: () => ({ meta: [
		{ title: "Início" },
		{
			name: "description",
			content: "Painel inicial com acesso rápido ao catálogo."
		},
		{
			property: "og:title",
			content: "Início"
		},
		{
			property: "og:description",
			content: "Seu player IPTV multi-servidor."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./painel-CW3U8eFJ.mjs");
var Route$9 = createFileRoute("/_authenticated/painel")({
	head: () => ({ meta: [{ title: "Painel do dono" }, {
		name: "description",
		content: "Gerenciamento de servidores e acessos de usuários."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./series-aan6xj34.mjs");
var Route$8 = createFileRoute("/_authenticated/series")({
	validateSearch: (search) => ({ q: typeof search.q === "string" ? search.q : "" }),
	head: () => ({ meta: [
		{ title: "Séries" },
		{
			name: "description",
			content: "Séries com temporadas e episódios do servidor ativo."
		},
		{
			property: "og:title",
			content: "Séries"
		},
		{
			property: "og:description",
			content: "Séries on demand multi-servidor."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./servidores-F9PM6i78.mjs");
var Route$7 = createFileRoute("/_authenticated/servidores")({
	head: () => ({ meta: [
		{ title: "Servidores" },
		{
			name: "description",
			content: "Troque entre os servidores IPTV liberados para o seu acesso."
		},
		{
			property: "og:title",
			content: "Servidores"
		},
		{
			property: "og:description",
			content: "Multi-servidor sem misturar catálogos."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./suporte-X0Y35Lod.mjs");
var Route$6 = createFileRoute("/_authenticated/suporte")({
	head: () => ({ meta: [{ title: "Suporte Técnico" }, {
		name: "description",
		content: "Atendimento ao cliente em tempo real."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./usuarios-DRQcqlvt.mjs");
var Route$5 = createFileRoute("/_authenticated/usuarios")({
	head: () => ({ meta: [
		{ title: "Usuários" },
		{
			name: "description",
			content: "Crie e gerencie usuários com acesso a canais, filmes, séries e troca de servidor."
		},
		{
			property: "og:title",
			content: "Usuários"
		},
		{
			property: "og:description",
			content: "Gestão de acessos com limite de conexões por dispositivo."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./teste._slug-Bx80wy8y.mjs");
var Route$4 = createFileRoute("/teste/$slug")({
	head: () => ({ meta: [{ title: "Teste Grátis | MAGO PLAYER PRO" }, {
		name: "description",
		content: "Solicite seu teste grátis e experimente o melhor do IPTV."
	}] }),
	server: { handlers: { POST: async ({ request }) => {
		const formData = await request.formData();
		const slugFromForm = formData.get("slug")?.toString().trim();
		const fingerprintFromForm = formData.get("fingerprint")?.toString().trim() ?? "";
		const referralCodeRaw = formData.get("referral_code")?.toString().trim() ?? "";
		const referralCode = referralCodeRaw.length > 0 ? referralCodeRaw : null;
		const result = await createTestUser({ data: {
			slug: slugFromForm || new URL(request.url).pathname.split("/").filter(Boolean).at(-1) || "teste",
			fingerprint: fingerprintFromForm || deriveServerFingerprint(request),
			referral_code: referralCode
		} });
		const redirectUrl = new URL(request.url);
		redirectUrl.searchParams.set("username", result.username);
		redirectUrl.searchParams.set("password", result.password);
		redirectUrl.searchParams.set("expiresAt", result.expiresAt);
		redirectUrl.searchParams.set("generated", "1");
		return new Response(null, {
			status: 303,
			headers: {
				location: redirectUrl.toString(),
				"cache-control": "no-store, no-cache, must-revalidate, private"
			}
		});
	} } },
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
function deriveServerFingerprint(request) {
	const headers = request.headers;
	const raw = [
		headers.get("user-agent") ?? "",
		headers.get("accept-language") ?? "",
		headers.get("x-forwarded-for") ?? headers.get("x-real-ip") ?? "",
		headers.get("sec-ch-ua") ?? "",
		headers.get("sec-ch-ua-mobile") ?? "",
		headers.get("sec-ch-ua-platform") ?? "",
		headers.get("sec-ch-ua-model") ?? ""
	].join("|");
	let hash = 0;
	for (let index = 0; index < raw.length; index += 1) hash = (hash << 5) - hash + raw.charCodeAt(index) | 0;
	return Math.abs(hash).toString(16).padStart(8, "0");
}
var Route$3 = createFileRoute("/api/public/image")({ server: { handlers: { GET: async ({ request }) => {
	const url = new URL(request.url);
	const src = url.searchParams.get("src");
	const serverId = url.searchParams.get("server_id");
	if (!src) return new Response("Missing src", { status: 400 });
	let target;
	try {
		target = new URL(src);
	} catch {
		return new Response("Invalid src", { status: 400 });
	}
	if (target.protocol !== "http:" && target.protocol !== "https:") return new Response("Unsupported protocol", { status: 400 });
	const cached = await readLocalImageCache(target.toString(), serverId);
	const serveCached = (reason = "hit") => {
		if (!cached?.body) return null;
		const headers = new Headers();
		headers.set("content-type", cached.meta.content_type);
		headers.set("cache-control", "public, max-age=86400, stale-while-revalidate=604800");
		headers.set("x-content-type-options", "nosniff");
		headers.set("referrer-policy", "no-referrer");
		headers.set("x-image-cache", reason);
		if (serverId) headers.set("x-server-id", serverId);
		return new Response(cached.body, {
			status: 200,
			headers
		});
	};
	if (cached?.body && !cached.stale) return serveCached("hit");
	try {
		const upstream = await fetch(target.toString(), {
			redirect: "follow",
			headers: {
				"User-Agent": "IPTV-System/1.0",
				Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
			}
		});
		if (!upstream.ok) return serveCached("stale-fallback") ?? new Response("Image unavailable", { status: 502 });
		const contentType = upstream.headers.get("content-type") ?? "";
		if (!contentType.startsWith("image/")) return serveCached("stale-fallback") ?? new Response("Not an image", { status: 415 });
		const upstreamBody = await upstream.arrayBuffer();
		const body = Buffer.from(upstreamBody);
		await writeLocalImageCache(target.toString(), serverId, contentType, body);
		const headers = new Headers();
		headers.set("content-type", contentType);
		headers.set("cache-control", "public, max-age=86400, stale-while-revalidate=604800");
		headers.set("x-content-type-options", "nosniff");
		headers.set("referrer-policy", "no-referrer");
		headers.set("x-image-cache", "miss");
		if (serverId) headers.set("x-server-id", serverId);
		return new Response(body, {
			status: 200,
			headers
		});
	} catch {
		return serveCached("stale-fallback") ?? new Response("Image unavailable", { status: 502 });
	}
} } } });
var Route$2 = createFileRoute("/api/public/legacy-css")({ server: { handlers: { GET: async () => {
	const legacyCssPath = path.join(process.cwd(), ".output/public/legacy.css");
	try {
		const css = await fs.readFile(legacyCssPath, "utf8");
		return new Response(css, {
			status: 200,
			headers: {
				"content-type": "text/css; charset=utf-8",
				"cache-control": "no-store, no-cache, must-revalidate, private",
				"x-content-type-options": "nosniff",
				"referrer-policy": "no-referrer"
			}
		});
	} catch (error) {
		console.error("Failed to serve legacy CSS:", error);
		return new Response("/* legacy css unavailable */", {
			status: 500,
			headers: {
				"content-type": "text/css; charset=utf-8",
				"cache-control": "no-store, no-cache, must-revalidate, private",
				"x-content-type-options": "nosniff"
			}
		});
	}
} } } });
async function proxyToInternalService(request, serviceBaseUrl) {
	const sourceUrl = new URL(request.url);
	const targetUrl = new URL(`${sourceUrl.pathname}${sourceUrl.search}`, serviceBaseUrl);
	const headers = new Headers();
	for (const header of [
		"accept",
		"accept-language",
		"accept-encoding",
		"range",
		"user-agent",
		"referer",
		"origin",
		"cache-control",
		"pragma",
		"content-type",
		"authorization",
		"x-request-id",
		"x-signature",
		"x-webhook-signature",
		"x-hub-signature-256",
		"x-forwarded-for",
		"x-forwarded-proto",
		"x-forwarded-host",
		"x-real-ip",
		"cf-connecting-ip",
		"cf-ipcountry"
	]) {
		const value = request.headers.get(header);
		if (value) headers.set(header, value);
	}
	for (const hopByHopHeader of [
		"connection",
		"keep-alive",
		"proxy-authenticate",
		"proxy-authorization",
		"te",
		"trailer",
		"transfer-encoding",
		"upgrade"
	]) headers.delete(hopByHopHeader);
	const init = {
		method: request.method,
		headers,
		redirect: "manual",
		signal: request.signal
	};
	if (request.method !== "GET" && request.method !== "HEAD") {
		init.body = request.body;
		init.duplex = "half";
	}
	return fetch(targetUrl, init);
}
function validateMercadoPagoSignature(params) {
	const { signature, requestId, dataId, secret } = params;
	if (!secret) return false;
	if (!signature) return false;
	const parts = new Map(signature.split(",").map((part) => part.trim().split("=")).filter(([key, value]) => key && value).map(([key, value]) => [key, value]));
	const ts = parts.get("ts");
	const expected = parts.get("v1");
	if (!ts || !expected) return false;
	const manifest = [
		dataId ? `id:${dataId};` : "",
		requestId ? `request-id:${requestId};` : "",
		`ts:${ts};`
	].join("");
	const computed = createHmac("sha256", secret).update(manifest).digest("hex");
	const expectedBuf = Buffer.from(expected, "hex");
	const computedBuf = Buffer.from(computed, "hex");
	if (expectedBuf.length !== computedBuf.length) return false;
	return timingSafeEqual(expectedBuf, computedBuf);
}
var Route$1 = createFileRoute("/api/public/mercadopago-webhook")({ server: { handlers: { POST: async ({ request }) => {
	const paymentsServiceUrl = process.env["PAYMENTS_SERVICE_URL"];
	if (paymentsServiceUrl) try {
		return await proxyToInternalService(request, paymentsServiceUrl);
	} catch (error) {
		console.error("Falha ao encaminhar o webhook de pagamentos para o servico dedicado", error);
	}
	try {
		const body = await request.json();
		const dataId = new URL(request.url).searchParams.get("data.id") ?? body?.data?.id ?? null;
		const requestId = request.headers.get("x-request-id");
		const signature = request.headers.get("x-signature");
		const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
		const { data: configRow } = await supabaseAdmin.from("app_config").select("config").single();
		const config = configRow?.config;
		const webhookSecret = typeof config?.mp_webhook_secret === "string" ? config.mp_webhook_secret.trim() : "";
		if (!webhookSecret) {
			console.error("Segredo do webhook do Mercado Pago não configurado");
			return new Response("Webhook não configurado", { status: 503 });
		}
		if (!validateMercadoPagoSignature({
			signature,
			requestId,
			dataId,
			secret: webhookSecret
		})) {
			console.error("Assinatura inválida do webhook do Mercado Pago");
			return new Response("Não autorizado", { status: 401 });
		}
		if (!dataId) return new Response("ok", { status: 200 });
		if (!config?.mp_access_token) {
			console.error("Token de acesso do Mercado Pago não configurado");
			return new Response("Configuração ausente", { status: 500 });
		}
		const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, { headers: { Authorization: `Bearer ${config.mp_access_token}` } });
		if (!mpRes.ok) throw new Error("Falha ao consultar o pagamento no Mercado Pago.");
		const payment = await mpRes.json();
		if (payment.status === "approved" && payment.external_reference) try {
			const { userId, planId } = JSON.parse(payment.external_reference);
			if (!userId || !planId) throw new Error("Dados inválidos em external_reference.");
			const { data: userProfile } = await supabaseAdmin.from("profiles").select("referred_by_id, display_name, referral_source_slug").eq("id", userId).single();
			const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
			const { data: plan } = await supabaseAdmin.from("subscription_plans").select("*").eq("id", planId).single();
			if (plan) {
				const newExpiry = /* @__PURE__ */ new Date();
				const factor = plan.duration_unit === "minutes" ? 6e4 : plan.duration_unit === "hours" ? 36e5 : 864e5;
				const msToAdd = plan.duration_value * factor;
				newExpiry.setTime(newExpiry.getTime() + msToAdd);
				const paymentReceivedAt = (/* @__PURE__ */ new Date()).toISOString();
				const paymentId = String(payment.id ?? dataId);
				const claim = await claimApprovedPayment({
					user_id: userId,
					plan_id: planId,
					provider: "mercadopago",
					provider_payment_id: paymentId,
					provider_preference_id: payment.preference_id ?? payment.preferenceId ?? null,
					external_reference: payment.external_reference,
					status: "approved",
					amount: Number(payment.transaction_amount ?? plan.price ?? 0),
					currency: String(payment.currency_id ?? "BRL"),
					webhook_payload: payment,
					webhook_received_at: paymentReceivedAt,
					approved_at: paymentReceivedAt
				});
				await recordPaymentEvent({
					payment_id: claim.payment.id,
					event_type: claim.shouldApply ? "payment.approved" : "payment.approved.duplicate",
					payload: {
						provider_payment_id: paymentId,
						provider: "mercadopago"
					}
				});
				await recordAuditLog({
					actor_user_id: userId,
					target_user_id: userId,
					action: claim.shouldApply ? "payment.approved" : "payment.approved.duplicate",
					entity_type: "payment",
					entity_id: claim.payment.id,
					details: {
						planId,
						provider: "mercadopago",
						provider_payment_id: paymentId,
						provider_preference_id: payment.preference_id ?? payment.preferenceId ?? null,
						amount: Number(payment.transaction_amount ?? plan.price ?? 0),
						currency: String(payment.currency_id ?? "BRL")
					},
					source: "mercadopago"
				});
				if (!claim.shouldApply) return new Response("ok", { status: 200 });
				await supabaseAdmin.from("profiles").update({
					plan_id: planId,
					max_connections: plan.max_connections,
					expires_at: newExpiry.toISOString(),
					is_active: true
				}).eq("id", userId);
				await ensureUserReferralCode(supabaseAdmin, userId, plan);
				if (userProfile?.referred_by_id) {
					let bonusDays = 0;
					const linkSlug = resolveReferralSourceSlug({
						referralSourceSlug: userProfile.referral_source_slug ?? null,
						testLinkSlug: authUser.user?.user_metadata?.["test_link_slug"] ?? null,
						displayName: userProfile.display_name
					});
					if (linkSlug) {
						const { data: link } = await supabaseAdmin.from("test_links").select("bonus_days_monthly, bonus_days_quarterly").eq("slug", linkSlug).maybeSingle();
						if (link) bonusDays = (plan.duration_unit === "days" ? plan.duration_value : plan.duration_unit === "hours" ? plan.duration_value / 24 : plan.duration_value / 1440) > 30 ? link.bonus_days_quarterly ?? 30 : link.bonus_days_monthly ?? 15;
					}
					if (bonusDays > 0) {
						const { data: referrer } = await supabaseAdmin.from("profiles").select("expires_at").eq("id", userProfile.referred_by_id).single();
						if (referrer) {
							const currentRefExpiry = referrer.expires_at ? new Date(referrer.expires_at) : /* @__PURE__ */ new Date();
							const newRefExpiry = new Date((currentRefExpiry > /* @__PURE__ */ new Date() ? currentRefExpiry : /* @__PURE__ */ new Date()).getTime() + bonusDays * 24 * 60 * 60 * 1e3);
							await supabaseAdmin.from("profiles").update({ expires_at: newRefExpiry.toISOString() }).eq("id", userProfile.referred_by_id);
						}
					}
				}
				try {
					const message = `Pagamento aprovado para o plano ${plan.name}. Seu acesso foi renovado com sucesso.`;
					const { data: thread } = await supabaseAdmin.from("support_threads").upsert({
						user_id: userId,
						last_message: message,
						last_message_at: paymentReceivedAt
					}, { onConflict: "user_id" }).select("id").single();
					if (thread?.id) await supabaseAdmin.from("support_messages").insert({
						thread_id: thread.id,
						sender_id: null,
						content: message,
						message_type: "payment_receipt"
					});
				} catch (threadError) {
					console.error("Falha ao registrar comprovante no chat:", threadError);
				}
			}
		} catch (parseErr) {
			console.error("Erro ao processar pagamento aprovado:", parseErr);
		}
		return new Response("ok", { status: 200 });
	} catch (err) {
		console.error("Erro ao processar o webhook:", err);
		return new Response(err.message, { status: 500 });
	}
} } } });
var TEXT_ENCODER = new TextEncoder();
async function hashStreamReference(value) {
	if (!value) return "unknown";
	const digest = await crypto.subtle.digest("SHA-256", TEXT_ENCODER.encode(value));
	return Array.from(new Uint8Array(digest)).slice(0, 8).map((part) => part.toString(16).padStart(2, "0")).join("");
}
function sanitizeContentType(value) {
	if (!value) return void 0;
	const normalized = value.split(";", 1)[0]?.trim().toLowerCase();
	return normalized ? normalized.slice(0, 80) : void 0;
}
function logStreamUpstream(outcome) {
	console.info(JSON.stringify({
		event: "stream_upstream",
		service: outcome.service,
		server_ref: outcome.serverRef ?? "unknown",
		outcome: outcome.outcome,
		status: outcome.status ?? null,
		content_type: outcome.contentType ?? null,
		attempts: outcome.attempts,
		elapsed_ms: Math.max(0, Math.min(864e5, Math.round(outcome.elapsedMs))),
		expects_hls: outcome.expectsHls,
		...outcome.reason ? { reason: outcome.reason.slice(0, 80) } : {},
		recorded_at: (/* @__PURE__ */ new Date()).toISOString()
	}));
}
var Route = createFileRoute("/api/public/stream")({ server: { handlers: { GET: async ({ request }) => {
	const url = new URL(request.url);
	const playerServiceUrl = process.env["STREAM_SERVICE_URL"];
	if (playerServiceUrl) {
		const startedAt = Date.now();
		const token = await readStreamToken(url.searchParams.get("s"));
		const serverRef = await hashStreamReference(token?.reference);
		const expectsHls = url.searchParams.get("hls") === "1" || Boolean(token?.url.includes(".m3u8"));
		try {
			const response = await proxyToInternalService(request, playerServiceUrl);
			logStreamUpstream({
				service: "main",
				serverRef,
				outcome: response.status >= 200 && response.status < 400 ? "upstream_response" : "http_error",
				status: response.status,
				contentType: sanitizeContentType(response.headers.get("content-type")),
				attempts: 1,
				elapsedMs: Date.now() - startedAt,
				expectsHls,
				reason: "internal_player_response"
			});
			return response;
		} catch {
			console.error("Falha ao encaminhar a rota de stream para o player dedicado");
			logStreamUpstream({
				service: "main",
				serverRef,
				outcome: "handler_error",
				status: null,
				attempts: 1,
				elapsedMs: Date.now() - startedAt,
				expectsHls,
				reason: "internal_player_unreachable"
			});
		}
	}
	const { looksLikePlaylist, rewritePlaylist } = await import("./stream-proxy.server-ByScHUwZ.mjs").then((n) => n.n);
	const token = await readStreamToken(url.searchParams.get("s"));
	if (!token) return new Response("Token inválido ou expirado.", { status: 403 });
	const target = token.url;
	const range = request.headers.get("range");
	const expectsHls = url.searchParams.get("hls") === "1" || target.includes(".m3u8");
	const requestSignal = request.signal;
	const attemptFetch = async () => {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), 6e4);
		const abortForwarded = () => controller.abort();
		if (requestSignal.aborted) controller.abort();
		else requestSignal.addEventListener("abort", abortForwarded, { once: true });
		try {
			return await fetch(target, {
				redirect: "follow",
				signal: controller.signal,
				headers: {
					"User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
					"Accept-Encoding": "identity",
					"Icy-MetaData": "1",
					Accept: "*/*",
					...range ? { Range: range } : {}
				}
			});
		} catch {
			return null;
		} finally {
			clearTimeout(timer);
			requestSignal.removeEventListener("abort", abortForwarded);
		}
	};
	let upstream = null;
	for (let attempt = 0; attempt < 4; attempt += 1) {
		if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
		upstream = await attemptFetch();
		if (upstream && (upstream.status === 301 || upstream.status === 302)) {
			const location = upstream.headers.get("location");
			if (location) {
				const redirectRes = await fetch(location, {
					signal: requestSignal,
					headers: {
						"User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
						Accept: "*/*"
					}
				});
				if (redirectRes.ok || redirectRes.status === 206) {
					upstream = redirectRes;
					break;
				}
			}
		}
		if (upstream && (upstream.ok || upstream.status === 206 || upstream.status === 404)) break;
		await upstream?.body?.cancel().catch(() => void 0);
	}
	if (!upstream) {
		if (expectsHls) return unavailableHlsResponse();
		return unavailableMediaResponse();
	}
	const contentType = upstream.headers.get("content-type") ?? "";
	const baseUrl = upstream.url || target;
	if (!upstream.ok && upstream.status !== 206) {
		if (expectsHls) {
			await upstream.body?.cancel().catch(() => void 0);
			return unavailableHlsResponse();
		}
		await upstream.body?.cancel().catch(() => void 0);
		return unavailableMediaResponse();
	}
	if (/mpegurl|application\/vnd\.apple|text\/plain|text\/html/i.test(contentType) || target.includes(".m3u8")) {
		const body = await upstream.text();
		if (looksLikePlaylist(contentType, body)) {
			const rewritten = await rewritePlaylist(body, baseUrl, {
				ttlSeconds: Math.max(60, token.expiresAt - Math.floor(Date.now() / 1e3)),
				...token.subject ? { subject: token.subject } : {},
				...token.reference ? { reference: token.reference } : {}
			});
			const headers = baseSecurityHeaders();
			headers.set("content-type", "application/vnd.apple.mpegurl");
			return new Response(rewritten, {
				status: 200,
				headers
			});
		}
		return unavailableHlsResponse();
	}
	const headers = baseSecurityHeaders();
	headers.set("content-type", contentType || "video/mp2t");
	for (const key of [
		"content-length",
		"content-range",
		"accept-ranges"
	]) {
		const value = upstream.headers.get(key);
		if (value) headers.set(key, value);
	}
	return new Response(upstream.body, {
		status: upstream.status,
		headers
	});
} } } });
function baseSecurityHeaders() {
	const headers = new Headers();
	headers.set("cache-control", "no-store, no-cache, must-revalidate, private");
	headers.set("referrer-policy", "no-referrer");
	headers.set("x-content-type-options", "nosniff");
	headers.set("x-robots-tag", "noindex, nofollow");
	return headers;
}
function unavailableHlsResponse() {
	const headers = baseSecurityHeaders();
	headers.set("content-type", "application/vnd.apple.mpegurl");
	headers.set("x-stream-status", "unavailable");
	const playlist = [
		"#EXTM3U",
		"#EXT-X-VERSION:3",
		"#EXT-X-TARGETDURATION:1",
		"#EXT-X-MEDIA-SEQUENCE:0",
		"#EXT-X-ENDLIST",
		""
	].join("\n");
	return new Response(playlist, {
		status: 200,
		headers
	});
}
function unavailableMediaResponse() {
	const headers = baseSecurityHeaders();
	headers.set("x-stream-status", "unavailable");
	return new Response(null, {
		status: 204,
		headers
	});
}
var IndexRoute = Route$16.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$17
});
var AuthenticatedRouteRoute = Route$15.update({
	id: "/_authenticated",
	getParentRoute: () => Route$17
});
var DonoRoute = Route$14.update({
	id: "/dono",
	path: "/dono",
	getParentRoute: () => Route$17
});
var AuthenticatedCanaisRoute = Route$13.update({
	id: "/canais",
	path: "/canais",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedContaRoute = Route$12.update({
	id: "/conta",
	path: "/conta",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedFilmesRoute = Route$11.update({
	id: "/filmes",
	path: "/filmes",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedInicioRoute = Route$10.update({
	id: "/inicio",
	path: "/inicio",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedPainelRoute = Route$9.update({
	id: "/painel",
	path: "/painel",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedSeriesRoute = Route$8.update({
	id: "/series",
	path: "/series",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedServidoresRoute = Route$7.update({
	id: "/servidores",
	path: "/servidores",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedSuporteRoute = Route$6.update({
	id: "/suporte",
	path: "/suporte",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedUsuariosRoute = Route$5.update({
	id: "/usuarios",
	path: "/usuarios",
	getParentRoute: () => AuthenticatedRouteRoute
});
var TesteSlugRoute = Route$4.update({
	id: "/teste/$slug",
	path: "/teste/$slug",
	getParentRoute: () => Route$17
});
var ApiPublicImageRoute = Route$3.update({
	id: "/api/public/image",
	path: "/api/public/image",
	getParentRoute: () => Route$17
});
var ApiPublicLegacyCssRoute = Route$2.update({
	id: "/api/public/legacy-css",
	path: "/api/public/legacy-css",
	getParentRoute: () => Route$17
});
var ApiPublicMercadopagoWebhookRoute = Route$1.update({
	id: "/api/public/mercadopago-webhook",
	path: "/api/public/mercadopago-webhook",
	getParentRoute: () => Route$17
});
var ApiPublicStreamRoute = Route.update({
	id: "/api/public/stream",
	path: "/api/public/stream",
	getParentRoute: () => Route$17
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedCanaisRoute,
	AuthenticatedContaRoute,
	AuthenticatedFilmesRoute,
	AuthenticatedInicioRoute,
	AuthenticatedPainelRoute,
	AuthenticatedSeriesRoute,
	AuthenticatedServidoresRoute,
	AuthenticatedSuporteRoute,
	AuthenticatedUsuariosRoute
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	DonoRoute,
	TesteSlugRoute,
	ApiPublicImageRoute,
	ApiPublicLegacyCssRoute,
	ApiPublicMercadopagoWebhookRoute,
	ApiPublicStreamRoute
};
var routeTree = Route$17._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { Route$11 as a, reportLovableError as c, createTestUser as d, deleteTestLink as f, Route$10 as i, useServerFn as l, saveTestLink as m, Route$4 as n, Route$16 as o, listTestLinksPage as p, Route$8 as r, cn as s, router_exports as t, checkDeviceBlocked as u };
