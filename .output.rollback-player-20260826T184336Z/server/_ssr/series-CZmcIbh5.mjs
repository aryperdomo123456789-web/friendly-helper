import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { C as MonitorPlay } from "../_libs/lucide-react.mjs";
import { r as Route$8 } from "./router-DG2Zwgow.mjs";
import { r as usePlayerSession } from "./player-store-Bt55zQrm.mjs";
import { t as Catalog } from "./Catalog-Cg8K5r6m.mjs";
import { t as UserPageShell } from "./user-page-shell-BAY1w-4u.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/series-CZmcIbh5.js
var import_jsx_runtime = require_jsx_runtime();
function SeriesPage() {
	const search = Route$8.useSearch();
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
