//#region node_modules/.nitro/vite/services/ssr/assets/chat-policy-DsA529M1.js
var SUPPORT_MAX_MESSAGE_LENGTH = 4e3;
var SUPPORT_MIN_MESSAGE_INTERVAL_MS = 1500;
var SUPPORT_STATUS_META = {
	open: {
		label: "Aberto",
		description: "Aguardando triagem"
	},
	pending_support: {
		label: "Aguardando suporte",
		description: "A equipe precisa responder"
	},
	pending_customer: {
		label: "Aguardando cliente",
		description: "Aguardando retorno do cliente"
	},
	closed: {
		label: "Fechado",
		description: "Atendimento encerrado"
	}
};
function normalizeSupportMessage(content) {
	return content.trim();
}
function getSupportStatusMeta(status) {
	return SUPPORT_STATUS_META[String(status)] ?? SUPPORT_STATUS_META.open;
}
function getStatusAfterUserMessage(status) {
	if (status === "closed") throw new Error("Este atendimento está encerrado.");
	return "pending_support";
}
function getStatusAfterOwnerMessage(status) {
	if (status === "closed") throw new Error("Este atendimento está encerrado.");
	return "pending_customer";
}
function isValidAttachmentType(contentType) {
	return contentType.startsWith("image/") || contentType.startsWith("audio/");
}
function isAttachmentWithinLimit(size) {
	return Number.isFinite(size) && size >= 0 && size <= 10485760;
}
//#endregion
export { getSupportStatusMeta as a, normalizeSupportMessage as c, getStatusAfterUserMessage as i, SUPPORT_MIN_MESSAGE_INTERVAL_MS as n, isAttachmentWithinLimit as o, getStatusAfterOwnerMessage as r, isValidAttachmentType as s, SUPPORT_MAX_MESSAGE_LENGTH as t };
