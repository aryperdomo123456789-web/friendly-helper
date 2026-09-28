import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { t as cn } from "./utils-CxKEs9cN.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { r as usePlayerSession } from "./player-store-5bTN3jgZ.mjs";
import { t as Button } from "./button-CgrLLZKA.mjs";
import { $ as Check, _ as Server } from "../_libs/lucide-react.mjs";
import { t as UserPageShell } from "./user-page-shell-FboHVz56.mjs";
import { n as CardContent, t as Card } from "./card-iLHTHitm.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/servidores-COYbuWwd.js
var import_jsx_runtime = require_jsx_runtime();
function Servidores() {
	const { servers, serverId, setServerId, preloadServerCatalog } = usePlayerSession();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPageShell, {
		title: "Servidores",
		description: "",
		icon: Server,
		children: servers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground",
			children: "Nenhum servidor liberado para este acesso."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
			children: servers.map((server) => {
				const active = server.id === serverId;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: cn(active && "border-primary"),
					onMouseEnter: () => preloadServerCatalog(server.id),
					onFocusCapture: () => preloadServerCatalog(server.id),
					tabIndex: 0,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "flex items-center justify-between gap-4 p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("grid h-11 w-11 place-items-center rounded-xl", active ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, { className: "h-5 w-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: server.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: active ? "Em uso agora" : "Disponível"
							})] })]
						}), active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-5 w-5 text-online" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							onClick: () => {
								if (confirm("Deseja alternar para este servidor?")) {
									setServerId(server.id);
									toast.success("Servidor alterado com sucesso!");
								}
							},
							children: "Usar"
						})]
					})
				}, server.id);
			})
		})
	});
}
//#endregion
export { Servidores as component };
