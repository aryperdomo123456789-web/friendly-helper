import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as DEFAULT_BRAND_IMAGE_URL } from "./config.functions-Cs2ubYVV.mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/routes-Wn9buGUs.js
var $$splitComponentImporter = () => import("./routes-DwFB1_Vh.mjs");
var Route = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Login do Cliente" },
		{
			name: "description",
			content: "Acesse sua conta de cliente."
		},
		{
			property: "og:title",
			content: "Login do Cliente"
		},
		{
			property: "og:description",
			content: "Entre com suas credenciais de cliente para acessar canais, filmes e séries."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			property: "og:image",
			content: DEFAULT_BRAND_IMAGE_URL
		},
		{
			property: "og:image:secure_url",
			content: DEFAULT_BRAND_IMAGE_URL
		},
		{
			property: "og:image:alt",
			content: "Mago Player PRO"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{
			name: "twitter:image",
			content: DEFAULT_BRAND_IMAGE_URL
		},
		{
			name: "twitter:image:alt",
			content: "Mago Player PRO"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
