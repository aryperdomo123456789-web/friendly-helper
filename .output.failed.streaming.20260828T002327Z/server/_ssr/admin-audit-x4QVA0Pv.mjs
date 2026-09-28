//#region node_modules/.nitro/vite/services/ssr/assets/admin-audit-x4QVA0Pv.js
function isTerminalLongOperationState(state) {
	return state === "succeeded" || state === "failed" || state === "cancelled";
}
function getLongOperationPollDelay(attempt) {
	return Math.min(15e3, Math.round(1e3 * 1.5 ** Math.max(0, Math.floor(attempt))));
}
function portalName(position) {
	return `Portal ${Math.max(0, Math.trunc(position)) + 1}`;
}
var FORBIDDEN_DETAIL_KEY = /(password|pass|token|secret|credential|playlist|stream|url|dns|cookie|authorization|header|payload|body|id|ref)/i;
var SAFE_DETAIL_KEYS = /* @__PURE__ */ new Set(["password_changed"]);
var MAX_DETAIL_KEY_LENGTH = 64;
var MAX_DETAIL_STRING_LENGTH = 160;
function sanitizeAdminAuditDetails(details) {
	const sanitized = {};
	for (const [rawKey, rawValue] of Object.entries(details ?? {})) {
		const key = rawKey.trim().slice(0, MAX_DETAIL_KEY_LENGTH);
		if (!key || FORBIDDEN_DETAIL_KEY.test(key) && !SAFE_DETAIL_KEYS.has(key)) continue;
		if (rawValue === null || typeof rawValue === "boolean" || typeof rawValue === "number" || typeof rawValue === "string") sanitized[key] = typeof rawValue === "string" ? rawValue.slice(0, MAX_DETAIL_STRING_LENGTH) : rawValue;
	}
	return sanitized;
}
//#endregion
export { sanitizeAdminAuditDetails as i, isTerminalLongOperationState as n, portalName as r, getLongOperationPollDelay as t };
