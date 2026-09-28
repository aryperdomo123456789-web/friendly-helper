import { n as normalizeStreamExtension } from "./player.functions-C7_QQY21.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stream-candidates-jGioIxai.js
function normalizeDns(dns) {
	const base = dns.trim().replace(/\/+$/, "");
	return /^https?:\/\//i.test(base) ? base : `http://${base}`;
}
function buildCandidateUrl(creds, dns, kind, streamId, extension) {
	const safeExtension = normalizeStreamExtension(kind, extension);
	return `${normalizeDns(dns)}/${kind}/${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}/${streamId}.${safeExtension}`;
}
function buildStreamUrlCandidates(creds, kind, streamId, extensions, maxCandidates = 5) {
	const dnsCandidates = Array.from(new Set([creds.dns, ...creds.dnsPool ?? []].filter(Boolean).map(normalizeDns)));
	const safeExtensions = Array.from(new Set(extensions)).slice(0, 3);
	const candidates = [];
	const primaryExtension = safeExtensions[0] ?? "m3u8";
	const safeMax = Math.max(1, Math.floor(maxCandidates));
	for (const dns of dnsCandidates) {
		if (candidates.length >= safeMax) break;
		candidates.push(buildCandidateUrl(creds, dns, kind, streamId, primaryExtension));
	}
	for (const extension of safeExtensions.slice(1)) {
		if (candidates.length >= safeMax) break;
		candidates.push(buildCandidateUrl(creds, creds.dns, kind, streamId, extension));
	}
	return Array.from(new Set(candidates)).slice(0, safeMax);
}
//#endregion
export { buildStreamUrlCandidates };
