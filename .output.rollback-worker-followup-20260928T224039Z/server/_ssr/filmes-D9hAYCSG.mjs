import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { r as usePlayerSession } from "./player-store-Cb2bJsja.mjs";
import { B as Film } from "../_libs/lucide-react.mjs";
import { t as Catalog } from "./Catalog-D903U7gU.mjs";
import { t as UserPageShell } from "./user-page-shell-Ebz1S9H2.mjs";
import { t as Route } from "./filmes-DUBsUd-I.mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/filmes-D9hAYCSG.js
var import_jsx_runtime = require_jsx_runtime();
function FilmesPage() {
	const search = Route.useSearch();
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
