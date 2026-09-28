//#region ../../www/wwwroot/stream.mago-bot.com/node_modules/.nitro/vite/services/ssr/assets/clipboard-CZDYJKX1.js
async function copyToClipboard(text) {
	if (!text) return false;
	if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {}
	if (typeof document === "undefined") return false;
	try {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.setAttribute("readonly", "true");
		textarea.style.position = "fixed";
		textarea.style.opacity = "0";
		textarea.style.pointerEvents = "none";
		textarea.style.left = "-9999px";
		document.body.appendChild(textarea);
		textarea.focus();
		textarea.select();
		const copied = document.execCommand("copy");
		document.body.removeChild(textarea);
		return copied;
	} catch {
		return false;
	}
}
//#endregion
export { copyToClipboard as t };
