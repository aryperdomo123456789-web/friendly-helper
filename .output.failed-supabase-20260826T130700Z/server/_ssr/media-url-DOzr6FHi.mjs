//#region ../../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/media-url-DOzr6FHi.js
function isAbsoluteHttpUrl(value) {
	return /^https?:\/\//i.test(value);
}
function proxyMediaUrl(url, serverId) {
	if (!url) return null;
	const trimmed = url.trim();
	if (!trimmed) return null;
	if (!isAbsoluteHttpUrl(trimmed)) return trimmed;
	const params = new URLSearchParams({ src: trimmed });
	if (serverId?.trim()) params.set("server_id", serverId.trim());
	return `/api/public/image?${params.toString()}`;
}
//#endregion
export { proxyMediaUrl as t };
