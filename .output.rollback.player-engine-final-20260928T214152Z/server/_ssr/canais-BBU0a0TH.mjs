import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { r as usePlayerSession } from "./player-store-Cf6yFwLI.mjs";
import { c as Tv } from "../_libs/lucide-react.mjs";
import { t as Catalog } from "./Catalog-ReqSGMep.mjs";
import { t as UserPageShell } from "./user-page-shell-FboHVz56.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/canais-BBU0a0TH.js
var import_jsx_runtime = require_jsx_runtime();
function CanaisPage() {
	const { serverId } = usePlayerSession();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPageShell, {
		className: "flex h-full min-h-0 flex-col",
		contentClassName: "flex-1 min-h-0",
		title: "TV ao Vivo",
		description: "",
		icon: Tv,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Catalog, {
			kind: "live",
			hideHeader: true
		}, serverId ?? "no-server")
	});
}
//#endregion
export { CanaisPage as component };
