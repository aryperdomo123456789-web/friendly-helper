import { r as createServerFn } from "./server-DyTiXMq0.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-CkS34ZPZ.mjs";
import { t as AppConfigSchema } from "./types-CnolIA9z.mjs";
import { t as createSsrRpc } from "./createSsrRpc-BOQNjuhu.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/config.functions-DljGKYKp.js
var DEFAULT_BRAND_IMAGE_URL = "/brand/webplayer-brand.png";
var APP_CONFIG_QUERY_KEY = ["app-config"];
/**
* Gets the public application configuration without payment access tokens or webhook secrets.
*/
var getAppConfig = createServerFn({ method: "GET" }).handler(createSsrRpc("1b4e5ab8dc827f044326b39d001b7e10b3f298c9b9290f1b815da508b3ea8125"));
var getAdminAppConfig = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("4afd557e2eec29f1bfbc45eb758d31856e88a3f990579b55721c51922a393dd0"));
/**
* Updates the central application configuration.
*/
var updateAppConfig = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => AppConfigSchema.parse(data)).handler(createSsrRpc("7192cb636aa1b3bcfe01a43a9aa10101a3c79dfc39ead098b2082d4eae885634"));
//#endregion
export { updateAppConfig as a, getAppConfig as i, DEFAULT_BRAND_IMAGE_URL as n, getAdminAppConfig as r, APP_CONFIG_QUERY_KEY as t };
