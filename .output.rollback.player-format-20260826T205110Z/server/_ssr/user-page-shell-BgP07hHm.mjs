import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { s as cn } from "./router-CGhQeMHl.mjs";
import { t as SectionErrorBoundary } from "./section-error-boundary-BxB_TTy2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/user-page-shell-BgP07hHm.js
var import_jsx_runtime = require_jsx_runtime();
function UserPageShell({ title, description, hideHeader = false, children, className, contentClassName }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("space-y-6 min-w-0 w-full overflow-x-hidden", className),
		children: [!hideHeader ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border-b border-border/70 pb-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-black tracking-tight sm:text-5xl",
				children: title
			}), description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm",
				children: description
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
