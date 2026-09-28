import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { s as cn } from "./router-BGkDCQjE.mjs";
import { t as SectionErrorBoundary } from "./section-error-boundary-CevK8PnG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/user-page-shell-DBoTbWc7.js
var import_jsx_runtime = require_jsx_runtime();
function UserPageShell({ eyebrow, title, description, icon: Icon, rightSlot, hideHeader = false, children, className, contentClassName }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("w-full min-w-0 space-y-5 overflow-x-hidden", className),
		children: [!hideHeader ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-w-0 flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-start gap-3",
				children: [Icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						className: "h-5 w-5",
						"aria-hidden": "true"
					})
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [
						eyebrow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-primary/80",
							children: eyebrow
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "truncate text-2xl font-black tracking-tight sm:text-4xl",
							children: title
						}),
						description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm",
							children: description
						}) : null
					]
				})]
			}), rightSlot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "shrink-0 sm:pt-1",
				children: rightSlot
			}) : null]
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionErrorBoundary, {
			title: "Conteúdo do usuário indisponível",
			description: "O shell visual permaneceu ativo, mas este bloco da página apresentou uma falha.",
			resetKey: title,
			className: cn("space-y-6", contentClassName),
			children
		})]
	});
}
//#endregion
export { UserPageShell as t };
