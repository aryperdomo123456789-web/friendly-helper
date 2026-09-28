import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { r as usePlayerSession } from "./player-store-5bTN3jgZ.mjs";
import { T as MonitorPlay } from "../_libs/lucide-react.mjs";
import { t as Catalog } from "./Catalog-B-_rkGGT.mjs";
import { t as UserPageShell } from "./user-page-shell-FboHVz56.mjs";
import { t as Route } from "./series-Bfyc9Y2n.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/series-CzIS1HUO.js
var import_jsx_runtime = require_jsx_runtime();
function SeriesPage() {
	const search = Route.useSearch();
	const initialSearch = typeof search.q === "string" ? search.q : "";
	const { serverId } = usePlayerSession();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPageShell, {
		className: "flex h-full min-h-0 flex-col",
		contentClassName: "flex-1 min-h-0",
		title: "Séries",
		description: "",
		icon: MonitorPlay,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Catalog, {
			kind: "series",
			initialSearch,
			hideHeader: true
		}, serverId ?? "no-server")
	});
}
//#endregion
export { SeriesPage as component };
