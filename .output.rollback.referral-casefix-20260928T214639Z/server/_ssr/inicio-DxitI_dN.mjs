import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inicio-DxitI_dN.js
var $$splitComponentImporter = () => import("./inicio-DecV90gX.mjs");
var Route = createFileRoute("/_authenticated/inicio")({
	head: () => ({ meta: [
		{ title: "Início" },
		{
			name: "description",
			content: "Painel inicial com acesso rápido ao catálogo."
		},
		{
			property: "og:title",
			content: "Início"
		},
		{
			property: "og:description",
			content: "Seu player IPTV multi-servidor."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
