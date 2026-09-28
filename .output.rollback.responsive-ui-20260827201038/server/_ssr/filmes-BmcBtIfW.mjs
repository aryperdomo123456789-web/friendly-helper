import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { B as Film } from "../_libs/lucide-react.mjs";
import { a as Route$11 } from "./router-BzVfE0ti.mjs";
import { r as usePlayerSession } from "./player-store-Bz7tWT6O.mjs";
import { t as Catalog } from "./Catalog-LmVqkCa1.mjs";
import { t as UserPageShell } from "./user-page-shell-sOMFBVr3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/filmes-BmcBtIfW.js
var import_jsx_runtime = require_jsx_runtime();
function FilmesPage() {
	const search = Route$11.useSearch();
	const initialSearch = typeof search.q === "string" ? search.q : "";
	const { serverId } = usePlayerSession();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPageShell, {
		className: "flex h-full min-h-0 flex-col",
		contentClassName: "flex-1 min-h-0",
		title: "Filmes",
		description: "",
		icon: Film,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Catalog, {
			kind: "movie",
			initialSearch,
			hideHeader: true
		}, serverId ?? "no-server")
	});
}
//#endregion
export { FilmesPage as component };
