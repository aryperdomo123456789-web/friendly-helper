import { a as numberType, i as literalType, n as booleanType, o as objectType, r as enumType, s as stringType } from "../_libs/zod.mjs";
//#region ../../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/types-CnolIA9z.js
var AppConfigSchema = objectType({
	domain: stringType().default("stream.mago-bot.com"),
	base_url: stringType().url().default("https://stream.mago-bot.com"),
	name: stringType().default("Sistema IPTV"),
	short_name: stringType().default("Sistema IPTV"),
	description: stringType().default("Sistema IPTV multi-servidor com navegação centralizada."),
	tmdb_api_key: stringType().default("56bb2e86749197e89c3dbb878314ea03"),
	epg_xmltv_url: stringType().url().default("http://epgpainel.ddns.net/epg.xml"),
	epg_xmltv_ttl_hours: numberType().default(3),
	logo_url: stringType().url().optional().or(literalType("")),
	logo_small_url: stringType().url().optional().or(literalType("")),
	favicon_url: stringType().url().optional().or(literalType("")),
	theme_mode: enumType([
		"azul",
		"dark",
		"light"
	]).default("azul"),
	telegram_handle: stringType().default("@contato"),
	support_auto_reply: stringType().default("Olá! Esta é uma resposta automática. Recebemos sua mensagem e em breve um de nossos atendentes irá te ajudar."),
	support_attendant_name: stringType().default("Suporte do Sistema"),
	mp_enabled: booleanType().default(false),
	mp_access_token: stringType().optional(),
	mp_public_key: stringType().optional(),
	mp_webhook_secret: stringType().optional(),
	theme: objectType({
		bg: stringType().default("#05070b"),
		surface: stringType().default("#0f171e"),
		surface_alt: stringType().default("#141b29"),
		primary: stringType().default("#3ba0ff"),
		text: stringType().default("#ffffff"),
		radius: stringType().default("18px")
	}).default({}),
	copy: objectType({
		home_title: stringType().default("Início"),
		home_subtitle: stringType().default("Biblioteca principal sincronizada."),
		movies_title: stringType().default("Filmes"),
		series_title: stringType().default("Séries"),
		live_title: stringType().default("TV ao Vivo")
	}).default({})
});
//#endregion
export { AppConfigSchema as t };
