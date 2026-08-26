import { recordAuditLog } from "./payments-tracking.functions";
import { sanitizeAdminAuditDetails, type AdminAuditDetails } from "./admin-audit";

type AdminAuditInput = {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  targetUserId?: string | null;
  details?: AdminAuditDetails;
};

/**
 * Registra uma ação administrativa sem persistir credenciais, URLs, tokens ou payloads.
 * Auditoria é best-effort para nunca transformar observabilidade em indisponibilidade.
 */
export async function recordAdminAudit(input: AdminAuditInput) {
  return recordAuditLog({
    actor_user_id: input.actorUserId,
    target_user_id: input.targetUserId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    details: sanitizeAdminAuditDetails(input.details),
    source: "admin_server",
  });
}
