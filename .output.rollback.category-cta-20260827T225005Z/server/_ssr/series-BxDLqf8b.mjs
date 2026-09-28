import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { T as MonitorPlay } from "../_libs/lucide-react.mjs";
import { r as Route$8 } from "./router-L3QvnmIb.mjs";
import { r as usePlayerSession } from "./player-store-D5Z3l8qW.mjs";
import { t as Catalog } from "./Catalog-BZt_Wurh.mjs";
import { t as UserPageShell } from "./user-page-shell-Dl_BEmx_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/series-BxDLqf8b.js
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
