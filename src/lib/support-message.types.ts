export const SUPPORT_MESSAGE_TYPES = [
  "user_message",
  "support_reply",
  "payment_receipt",
  "payment_event",
  "system_notification",
  "admin_note",
  "closure_prompt",
  "closure_response",
  "thread_closed",
  "satisfaction_prompt",
  "satisfaction_response",
] as const;

export type SupportMessageType = (typeof SUPPORT_MESSAGE_TYPES)[number];

const SUPPORT_MESSAGE_META: Record<
  SupportMessageType,
  { label: string; className: string }
> = {
  user_message: {
    label: "Cliente",
    className: "bg-slate-500/15 text-slate-200 border-slate-500/20",
  },
  support_reply: {
    label: "Suporte",
    className: "bg-sky-500/15 text-sky-200 border-sky-500/20",
  },
  payment_receipt: {
    label: "Comprovante",
    className: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
  },
  payment_event: {
    label: "Pagamento",
    className: "bg-cyan-500/15 text-cyan-200 border-cyan-500/20",
  },
  system_notification: {
    label: "Sistema",
    className: "bg-amber-500/15 text-amber-200 border-amber-500/20",
  },
  admin_note: {
    label: "Interno",
    className: "bg-violet-500/15 text-violet-200 border-violet-500/20",
  },
  closure_prompt: {
    label: "Encerramento",
    className: "bg-rose-500/15 text-rose-200 border-rose-500/20",
  },
  closure_response: {
    label: "Resposta",
    className: "bg-rose-500/15 text-rose-200 border-rose-500/20",
  },
  thread_closed: {
    label: "Fechado",
    className: "bg-zinc-500/15 text-zinc-200 border-zinc-500/20",
  },
  satisfaction_prompt: {
    label: "Satisfação",
    className: "bg-amber-500/15 text-amber-200 border-amber-500/20",
  },
  satisfaction_response: {
    label: "Avaliação",
    className: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
  },
};

export function normalizeSupportMessageType(value: unknown): SupportMessageType {
  if (typeof value === "string" && (SUPPORT_MESSAGE_TYPES as readonly string[]).includes(value)) {
    return value as SupportMessageType;
  }
  return "user_message";
}

export function inferSupportMessageType(
  message: { message_type?: string | null; sender_id?: string | null },
  threadUserId: string,
): SupportMessageType {
  const explicitType = normalizeSupportMessageType(message.message_type);
  if (message.message_type && explicitType) return explicitType;
  if (!message.sender_id) return "system_notification";
  return message.sender_id === threadUserId ? "user_message" : "support_reply";
}

export function getSupportMessageTypeMeta(type: unknown) {
  return SUPPORT_MESSAGE_META[normalizeSupportMessageType(type)] ?? SUPPORT_MESSAGE_META.user_message;
}
