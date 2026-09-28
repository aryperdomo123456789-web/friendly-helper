import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/series-BzgCBznB.js
var $$splitComponentImporter = () => import("./series-CUPJ1HB2.mjs");
var Route = createFileRoute("/_authenticated/series")({
	validateSearch: (search) => ({ q: typeof search.q === "string" ? search.q : "" }),
	head: () => ({ meta: [
		{ title: "Séries" },
		{
			name: "description",
			content: "Séries com temporadas e episódios do servidor ativo."
		},
		{
			property: "og:title",
			content: "Séries"
		},
		{
			property: "og:description",
			content: "Séries on demand multi-servidor."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
