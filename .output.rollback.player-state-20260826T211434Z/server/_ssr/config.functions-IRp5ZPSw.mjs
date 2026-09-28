import { r as createServerFn } from "./server-CzoAWkkd.mjs";
import { t as createServerRpc } from "./createServerRpc-BVifCp9A.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-NMBNe3uN.mjs";
import { t as AppConfigSchema } from "./types-CnolIA9z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/config.functions-IRp5ZPSw.js
function toPublicAppConfig(config) {
	const { mp_access_token: _accessToken, mp_webhook_secret: _webhookSecret, ...publicConfig } = config;
	return publicConfig;
}
/**
* Gets the public application configuration without payment access tokens or webhook secrets.
*/
var getAppConfig_createServerFn_handler = createServerRpc({
	id: "1b4e5ab8dc827f044326b39d001b7e10b3f298c9b9290f1b815da508b3ea8125",
	name: "getAppConfig",
	filename: "src/lib/config.functions.ts"
}, (opts) => getAppConfig.__executeServer(opts));
var getAppConfig = createServerFn({ method: "GET" }).handler(getAppConfig_createServerFn_handler, async () => {
	const { loadAppConfig } = await import("./config.server-9cwsKyLR.mjs");
	return toPublicAppConfig(await loadAppConfig());
});
var getAdminAppConfig_createServerFn_handler = createServerRpc({
	id: "4afd557e2eec29f1bfbc45eb758d31856e88a3f990579b55721c51922a393dd0",
	name: "getAdminAppConfig",
	filename: "src/lib/config.functions.ts"
}, (opts) => getAdminAppConfig.__executeServer(opts));
var getAdminAppConfig = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getAdminAppConfig_createServerFn_handler, async ({ context }) => {
	const { assertConfigAdmin, loadAppConfig } = await import("./config.server-9cwsKyLR.mjs");
	await assertConfigAdmin(context.supabase, context.userId);
	return loadAppConfig();
});
var updateAppConfig_createServerFn_handler = createServerRpc({
	id: "7192cb636aa1b3bcfe01a43a9aa10101a3c79dfc39ead098b2082d4eae885634",
	name: "updateAppConfig",
	filename: "src/lib/config.functions.ts"
}, (opts) => updateAppConfig.__executeServer(opts));
var updateAppConfig = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((data) => AppConfigSchema.parse(data)).handler(updateAppConfig_createServerFn_handler, async ({ data: newConfig, context }) => {
	const { assertConfigAdmin } = await import("./config.server-9cwsKyLR.mjs");
	const { supabaseAdmin } = await import("./client.server-BlnvGJA3.mjs").then((n) => n.t).then((n) => n.t);
	await assertConfigAdmin(context.supabase, context.userId);
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
export { getAdminAppConfig_createServerFn_handler, getAppConfig_createServerFn_handler, updateAppConfig_createServerFn_handler };
