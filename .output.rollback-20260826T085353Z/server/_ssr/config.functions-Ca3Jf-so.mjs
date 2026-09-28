import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
import { t as getRequest } from "./request-response-BEPp1C2k.mjs";
import { n as supabaseAdmin } from "./client.server-BlnvGJA3.mjs";
import { t as AppConfigSchema } from "./types-CnolIA9z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/config.functions-Ca3Jf-so.js
var DEFAULT_BRAND_IMAGE_URL = "/brand/webplayer-brand.png";
function getRuntimeBaseUrl() {
	const request = getRequest();
	if (!request) return null;
	const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
	if (!host) return null;
	return `${request.headers.get("x-forwarded-proto") || "https"}://${host}`;
}
function getRuntimeDomain() {
	const request = getRequest();
	const host = request?.headers.get("x-forwarded-host") || request?.headers.get("host");
	return host ? host.replace(/:\d+$/, "") : null;
}
function mergeRuntimeConfig(config) {
	const parsed = AppConfigSchema.parse(config);
	const runtimeBaseUrl = getRuntimeBaseUrl();
	const runtimeDomain = getRuntimeDomain();
	return {
		...parsed,
		logo_url: parsed.logo_url || DEFAULT_BRAND_IMAGE_URL,
		logo_small_url: parsed.logo_small_url || parsed.logo_url || DEFAULT_BRAND_IMAGE_URL,
		favicon_url: parsed.favicon_url || parsed.logo_url || DEFAULT_BRAND_IMAGE_URL,
		...runtimeDomain ? { domain: runtimeDomain } : null,
		...runtimeBaseUrl ? { base_url: runtimeBaseUrl } : null
	};
}
/**
* Gets the central application configuration from the database.
* If not exists, creates one with defaults.
*/
var getAppConfig_createServerFn_handler = createServerRpc({
	id: "1b4e5ab8dc827f044326b39d001b7e10b3f298c9b9290f1b815da508b3ea8125",
	name: "getAppConfig",
	filename: "src/lib/config.functions.ts"
}, (opts) => getAppConfig.__executeServer(opts));
var getAppConfig = createServerFn({ method: "GET" }).handler(getAppConfig_createServerFn_handler, async () => {
	const { data, error } = await supabaseAdmin.from("app_config").select("*").limit(1).maybeSingle();
	if (error) throw new Error("Erro ao carregar as configurações: " + error.message);
	if (!data) {
		const defaultConfig = AppConfigSchema.parse({});
		const { data: newData, error: insertError } = await supabaseAdmin.from("app_config").insert([{ config: defaultConfig }]).select().single();
		if (insertError) throw new Error("Erro ao criar as configurações padrão: " + insertError.message);
		return mergeRuntimeConfig(newData.config);
	}
	return mergeRuntimeConfig(data.config);
});
var updateAppConfig_createServerFn_handler = createServerRpc({
	id: "7192cb636aa1b3bcfe01a43a9aa10101a3c79dfc39ead098b2082d4eae885634",
	name: "updateAppConfig",
	filename: "src/lib/config.functions.ts"
}, (opts) => updateAppConfig.__executeServer(opts));
var updateAppConfig = createServerFn({ method: "POST" }).validator((data) => AppConfigSchema.parse(data)).handler(updateAppConfig_createServerFn_handler, async ({ data: newConfig }) => {
	const { data: existing } = await supabaseAdmin.from("app_config").select("id").limit(1).maybeSingle();
	if (existing) {
		const { error: updateError } = await supabaseAdmin.from("app_config").update({ config: newConfig }).eq("id", existing.id);
		if (updateError) throw new Error("Erro ao atualizar as configurações: " + updateError.message);
	} else {
		const { error: insertError } = await supabaseAdmin.from("app_config").insert([{ config: newConfig }]);
		if (insertError) throw new Error("Erro ao inserir as configurações: " + insertError.message);
	}
	return { success: true };
});
//#endregion
export { getAppConfig_createServerFn_handler, updateAppConfig_createServerFn_handler };
