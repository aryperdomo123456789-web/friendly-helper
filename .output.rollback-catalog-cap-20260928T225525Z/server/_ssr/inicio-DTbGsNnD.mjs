import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/inicio-DTbGsNnD.js
var $$splitComponentImporter = () => import("./inicio-RYTmkSWL.mjs");
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
