//#region node_modules/.nitro/vite/services/ssr/assets/stream-format-nCh6VqOO.js
var LIVE_EXTENSIONS = /* @__PURE__ */ new Set(["ts", "m3u8"]);
var MEDIA_EXTENSIONS = /* @__PURE__ */ new Set([
	"mp4",
	"mkv",
	"avi",
	"webm",
	"mov"
]);
function normalizeStreamExtension(kind, extension) {
	const requestedExt = extension.trim().toLowerCase().replace(/^\./, "");
	const allowedExtensions = kind === "live" ? LIVE_EXTENSIONS : MEDIA_EXTENSIONS;
	const fallbackExt = kind === "live" ? "m3u8" : "mp4";
	return allowedExtensions.has(requestedExt) ? requestedExt : fallbackExt;
}
function getPlaybackExtensions(kind, extension) {
	const normalized = extension?.trim().toLowerCase().replace(/^\./, "") ?? "";
	if (kind !== "live") return [normalizeStreamExtension(kind, normalized)];
	if (normalized === "ts" || normalized === "m3u8") return [normalized];
	return ["m3u8", "ts"];
}
//#endregion
export { normalizeStreamExtension as n, getPlaybackExtensions as t };
