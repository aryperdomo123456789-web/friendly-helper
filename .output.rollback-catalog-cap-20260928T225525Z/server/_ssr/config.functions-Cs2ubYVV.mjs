import { c as createServerFn } from "./createServerFn-BsVP-4Ld.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-B5qtjxOb.mjs";
import { t as createSsrRpc } from "./createSsrRpc-a47hDOu4.mjs";
import { t as AppConfigSchema } from "./types-CLmfLgYX.mjs";
//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/config.functions-Cs2ubYVV.js
var DEFAULT_BRAND_IMAGE_URL = "/brand/webplayer-brand.png";
var APP_CONFIG_QUERY_KEY = ["app-config"];
/**
* Gets the central application configuration from the database.
* If not exists, creates one with defaults.
*/
var getAppConfig = createServerFn({ method: "GET" }).handler(createSsrRpc("1b4e5ab8dc827f044326b39d001b7e10b3f298c9b9290f1b815da508b3ea8125"));
/**
* Updates the central application configuration.
*/
var updateAppConfig = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => AppConfigSchema.parse(data)).handler(createSsrRpc("7192cb636aa1b3bcfe01a43a9aa10101a3c79dfc39ead098b2082d4eae885634"));
//#endregion
export { updateAppConfig as i, DEFAULT_BRAND_IMAGE_URL as n, getAppConfig as r, APP_CONFIG_QUERY_KEY as t };
