import { c as __exportAll } from "./server-Cdind0PX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stream-proxy.server-ByScHUwZ.js
var stream_proxy_server_exports = /* @__PURE__ */ __exportAll({
	DEFAULT_TTL_SECONDS: () => DEFAULT_TTL_SECONDS,
	looksLikePlaylist: () => looksLikePlaylist,
	readStreamToken: () => readStreamToken,
	rewritePlaylist: () => rewritePlaylist,
	signStreamUrl: () => signStreamUrl
});
var TEXT = new TextEncoder();
var DEFAULT_TTL_SECONDS = 21600;
function b64urlFromBytes(bytes) {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function bytesFromB64url(value) {
	const padded = value.replace(/-/g, "+").replace(/_/g, "/");
	const binary = atob(padded + "=".repeat((4 - padded.length % 4) % 4));
	const out = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
	return out;
}
var keyPromise = null;
async function aesKey() {
	if (!keyPromise) keyPromise = (async () => {
		const secret = process.env["STREAM_PROXY_SECRET"];
		if (!secret || secret.length < 16) throw new Error("STREAM_PROXY_SECRET ausente ou fraco no ambiente do servidor.");
		const material = await crypto.subtle.digest("SHA-256", TEXT.encode(secret));
		return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
	})();
	return keyPromise;
}
async function signStreamUrl(target, options = {}) {
	const payload = {
		u: target,
		e: Math.floor(Date.now() / 1e3) + (options.ttlSeconds ?? 21600),
		...options.subject ? { s: options.subject } : {},
		...options.reference ? { r: options.reference } : {}
	};
	const iv = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(12));
	const cipher = new Uint8Array(await crypto.subtle.encrypt({
		name: "AES-GCM",
		iv
	}, await aesKey(), TEXT.encode(JSON.stringify(payload))));
	const packed = new Uint8Array(iv.length + cipher.length);
	packed.set(iv, 0);
	packed.set(cipher, iv.length);
	return `/api/public/stream?s=${b64urlFromBytes(packed)}`;
}
async function readStreamToken(token) {
	if (!token || token.length > 4096) return null;
	try {
		const packed = bytesFromB64url(token);
		if (packed.length < 29) return null;
		const iv = packed.slice(0, 12);
		const plain = await crypto.subtle.decrypt({
			name: "AES-GCM",
			iv
		}, await aesKey(), packed.slice(12));
		const payload = JSON.parse(new TextDecoder().decode(plain));
		if (typeof payload.u !== "string" || typeof payload.e !== "number") return null;
		if (payload.e * 1e3 < Date.now()) return null;
		const parsed = new URL(payload.u);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
		return {
			url: payload.u,
			expiresAt: payload.e,
			...payload.s ? { subject: payload.s } : {},
			...payload.r ? { reference: payload.r } : {}
		};
	} catch {
		return null;
	}
}
var PLAYLIST_HINTS = ["#EXTM3U", "#EXT-X-"];
function looksLikePlaylist(contentType, body) {
	if (/mpegurl/i.test(contentType)) return true;
	return PLAYLIST_HINTS.some((hint) => body.slice(0, 400).includes(hint));
}
async function rewritePlaylist(body, baseUrl, options = {}) {
	const lines = body.split(/\r?\n/);
	const out = [];
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) {
			out.push(line);
			continue;
		}
		if (trimmed.startsWith("#")) {
			const match = trimmed.match(/URI="([^"]+)"/i);
			if (match?.[1]) {
				const absolute = new URL(match[1], baseUrl).toString();
				out.push(trimmed.replace(match[1], await signStreamUrl(absolute, options)));
				continue;
			}
			out.push(line);
			continue;
		}
		const absolute = new URL(trimmed, baseUrl).toString();
		out.push(await signStreamUrl(absolute, options));
	}
	return out.join("\n");
}
//#endregion
export { stream_proxy_server_exports as n, readStreamToken as t };
