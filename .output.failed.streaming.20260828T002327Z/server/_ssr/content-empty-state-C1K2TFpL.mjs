import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { I as Inbox } from "../_libs/lucide-react.mjs";
import { s as cn } from "./router-BGkDCQjE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/content-empty-state-C1K2TFpL.js
var import_jsx_runtime = require_jsx_runtime();
function ContentEmptyState({ icon: Icon = Inbox, title, description, action, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		role: "status",
		className: cn("flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/70 px-5 py-10 text-center shadow-sm sm:min-h-60 sm:px-8", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
					className: "h-6 w-6",
					"aria-hidden": "true"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-base font-bold tracking-tight text-foreground sm:text-lg",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm",
				children: description
			}),
			action ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5",
				children: action
			}) : null
		]
	});
}
//#endregion
export { ContentEmptyState as t };
