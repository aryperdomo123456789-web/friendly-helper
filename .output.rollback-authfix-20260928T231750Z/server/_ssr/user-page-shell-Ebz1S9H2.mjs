import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { t as cn } from "./utils-DtOh-j_S.mjs";
import { t as SectionErrorBoundary } from "./section-error-boundary-9WTuyEB3.mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/user-page-shell-Ebz1S9H2.js
var import_jsx_runtime = require_jsx_runtime();
function UserPageShell({ title, description, hideHeader = false, children, className, contentClassName }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("min-w-0 w-full overflow-x-hidden", className),
		children: [!hideHeader ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-center gap-2 border-b border-border/60 pb-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "truncate text-base font-bold tracking-tight sm:text-lg",
					children: title
				}),
				description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hidden truncate text-xs text-muted-foreground sm:block",
					children: description
				}) : null
			]
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionErrorBoundary, {
			title: "Conteúdo do usuário indisponível",
			description: "O shell visual permaneceu ativo, mas este bloco da página apresentou uma falha.",
			resetKey: title,
			className: cn("min-w-0", contentClassName),
			children
		})]
	});
}
//#endregion
export { UserPageShell as t };
