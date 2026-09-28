import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/filmes-GF6I9N8u.js
var $$splitComponentImporter = () => import("./filmes-DhdtXfVd.mjs");
var Route = createFileRoute("/_authenticated/filmes")({
	validateSearch: (search) => ({ q: typeof search.q === "string" ? search.q : "" }),
	head: () => ({ meta: [
		{ title: "Filmes" },
		{
			name: "description",
			content: "Catálogo de filmes on demand do servidor selecionado."
		},
		{
			property: "og:title",
			content: "Filmes"
		},
		{
			property: "og:description",
			content: "Filmes on demand multi-servidor."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
