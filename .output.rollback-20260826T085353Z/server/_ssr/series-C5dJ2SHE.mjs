import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as usePlayerSession } from "./player-store-C3_c98g2.mjs";
import { C as MonitorPlay } from "../_libs/lucide-react.mjs";
import { t as Catalog } from "./Catalog-BXuzOp45.mjs";
import { t as UserPageShell } from "./user-page-shell-CzgECp42.mjs";
import { t as Route } from "./series-grM-Ywr0.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/series-C5dJ2SHE.js
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
