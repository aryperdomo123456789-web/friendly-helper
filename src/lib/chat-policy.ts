export type SupportStatus = "open" | "pending_support" | "pending_customer" | "closed";
export type SupportPriority = "low" | "normal" | "high" | "urgent";

export const SUPPORT_MAX_MESSAGE_LENGTH = 4000;
export const SUPPORT_MIN_MESSAGE_INTERVAL_MS = 1500;
export const SUPPORT_DAILY_MESSAGE_LIMIT = 100;

export const SUPPORT_STATUS_META: Record<SupportStatus, { label: string; description: string }> = {
  open: { label: "Aberto", description: "Aguardando triagem" },
  pending_support: { label: "Aguardando suporte", description: "A equipe precisa responder" },
  pending_customer: { label: "Aguardando cliente", description: "Aguardando retorno do cliente" },
  closed: { label: "Fechado", description: "Atendimento encerrado" },
};

export function normalizeSupportMessage(content: string) {
  return content.trim();
}

export function getSupportStatusMeta(status: unknown) {
  return SUPPORT_STATUS_META[String(status) as SupportStatus] ?? SUPPORT_STATUS_META.open;
}

export function getStatusAfterUserMessage(status: SupportStatus) {
  if (status === "closed") throw new Error("Este atendimento está encerrado.");
  return "pending_support" as const;
}

export function getStatusAfterOwnerMessage(status: SupportStatus) {
  if (status === "closed") throw new Error("Este atendimento está encerrado.");
  return "pending_customer" as const;
}

export function isValidAttachmentType(contentType: string) {
  return contentType.startsWith("image/") || contentType.startsWith("audio/");
}

export function isAttachmentWithinLimit(size: number) {
  return Number.isFinite(size) && size >= 0 && size <= 10 * 1024 * 1024;
}
