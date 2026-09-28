import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/filmes-BOmo1ePl.js
var $$splitComponentImporter = () => import("./filmes-DjIupTCP.mjs");
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
