import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { w as MonitorPlay } from "../_libs/lucide-react.mjs";
import { r as Route$8 } from "./router-BaX5SD7f.mjs";
import { r as usePlayerSession } from "./player-store-sICc32AB.mjs";
import { t as Catalog } from "./Catalog-CB_ZMSoX.mjs";
import { t as UserPageShell } from "./user-page-shell-BdsklkXV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/series-Rnl3iRWp.js
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
