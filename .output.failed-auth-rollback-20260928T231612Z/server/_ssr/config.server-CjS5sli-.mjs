import { o as getRequest } from "./server-DRqQh07e.mjs";
import { n as supabaseAdmin } from "./client.server-BlnvGJA3.mjs";
import { t as AppConfigSchema } from "./types-CnolIA9z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/config.server-CjS5sli-.js
var DEFAULT_BRAND_IMAGE_URL = "/brand/webplayer-brand.png";
function getRuntimeEnv(name) {
	return globalThis.process?.env?.[name];
}
function applySandboxOverrides(config) {
	if (!(getRuntimeEnv("NODE_ENV") !== "production" && getRuntimeEnv("MP_SANDBOX_MODE") === "true")) return config;
	const sandboxToken = getRuntimeEnv("MP_SANDBOX_ACCESS_TOKEN")?.trim();
	const sandboxPublicKey = getRuntimeEnv("MP_SANDBOX_PUBLIC_KEY")?.trim();
	const sandboxWebhookSecret = getRuntimeEnv("MP_SANDBOX_WEBHOOK_SECRET")?.trim();
	return AppConfigSchema.parse({
		...config,
		...sandboxToken ? {
			mp_access_token: sandboxToken,
			mp_enabled: true
		} : null,
		...sandboxPublicKey ? { mp_public_key: sandboxPublicKey } : null,
		...sandboxWebhookSecret ? { mp_webhook_secret: sandboxWebhookSecret } : null
	});
}
function mergeRuntimeConfig(config) {
	const parsed = applySandboxOverrides(AppConfigSchema.parse(config));
	const request = getRequest();
	const host = request?.headers.get("x-forwarded-host") || request?.headers.get("host");
	const proto = request?.headers.get("x-forwarded-proto") || "https";
	const runtimeBaseUrl = host ? `${proto}://${host}` : null;
	const runtimeDomain = host ? host.replace(/:\d+$/, "") : null;
	return {
		...parsed,
		logo_url: parsed.logo_url || DEFAULT_BRAND_IMAGE_URL,
		logo_small_url: parsed.logo_small_url || parsed.logo_url || DEFAULT_BRAND_IMAGE_URL,
		favicon_url: parsed.favicon_url || parsed.logo_url || DEFAULT_BRAND_IMAGE_URL,
		...runtimeDomain ? { domain: runtimeDomain } : null,
		...runtimeBaseUrl ? { base_url: runtimeBaseUrl } : null
	};
}
async function loadAppConfig() {
	const { data, error } = await supabaseAdmin.from("app_config").select("*").limit(1).maybeSingle();
	if (error) throw new Error("Erro ao carregar as configurações: " + error.message);
	if (!data) {
		const defaultConfig = AppConfigSchema.parse({});
		const { data: newData, error: insertError } = await supabaseAdmin.from("app_config").insert([{ config: defaultConfig }]).select().single();
		if (insertError) throw new Error("Erro ao criar as configurações padrão: " + insertError.message);
		return mergeRuntimeConfig(newData.config);
	}
	return mergeRuntimeConfig(data.config);
}
async function assertConfigAdmin(supabase, userId) {
	const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).in("role", ["owner", "admin"]).limit(1);
	if (error) throw new Error(error.message);
	if (!data || data.length === 0) throw new Error("Acesso restrito à configuração administrativa.");
}
//#endregion
export { assertConfigAdmin, loadAppConfig };
