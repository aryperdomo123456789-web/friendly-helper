import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { s as cn } from "./router-B0doKaHR.mjs";
import { t as SectionErrorBoundary } from "./section-error-boundary-0Jwwlhhu.mjs";
import { n as CardContent, t as Card } from "./card-8do58Ocu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/owner-page-shell-BnDXtycs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Table = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: "relative w-full overflow-auto",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
		ref,
		className: cn("w-full caption-bottom text-sm", className),
		...props
	})
}));
Table.displayName = "Table";
var TableHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
	ref,
	className: cn("[&_tr]:border-b", className),
	...props
}));
TableHeader.displayName = "TableHeader";
var TableBody = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
	ref,
	className: cn("[&_tr:last-child]:border-0", className),
	...props
}));
TableBody.displayName = "TableBody";
var TableFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", {
	ref,
	className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
	...props
}));
TableFooter.displayName = "TableFooter";
var TableRow = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
	ref,
	className: cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className),
	...props
}));
TableRow.displayName = "TableRow";
var TableHead = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
	ref,
	className: cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableHead.displayName = "TableHead";
var TableCell = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
	ref,
	className: cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableCell.displayName = "TableCell";
var TableCaption = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
	ref,
	className: cn("mt-4 text-sm text-muted-foreground", className),
	...props
}));
TableCaption.displayName = "TableCaption";
function OwnerPageShell({ eyebrow = "Núcleo administrativo", title, description, icon: Icon, rightSlot, children, className, contentClassName }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("space-y-6 min-w-0 w-full overflow-x-hidden", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "relative overflow-hidden border-sidebar-border/80 bg-gradient-to-br from-sidebar via-card to-background shadow-[0_18px_60px_rgba(0,0,0,0.2)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-0 overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -bottom-28 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "relative z-10 p-3 lg:p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-primary",
								children: eyebrow
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3",
							children: [Icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5" })
							}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-2xl font-bold tracking-tight sm:text-3xl",
								children: title
							}), description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm",
								children: description
							}) : null] })]
						})]
					}), rightSlot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "shrink-0 self-start lg:ml-3 lg:max-w-[170px]",
						children: rightSlot
					}) : null]
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionErrorBoundary, {
			title: "Conteúdo administrativo indisponível",
			description: "A estrutura do painel do dono permaneceu ativa, mas este bloco específico encontrou uma falha.",
			resetKey: title,
			className: cn("space-y-6", contentClassName),
			children
		})]
	});
}
//#endregion
export { TableHead as a, TableCell as i, Table as n, TableHeader as o, TableBody as r, TableRow as s, OwnerPageShell as t };
