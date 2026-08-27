export type AdminAuditScalar = boolean | number | string | null;
export type AdminAuditDetails = Record<string, AdminAuditScalar>;

const FORBIDDEN_DETAIL_KEY =
  /(password|pass|token|secret|credential|playlist|stream|url|dns|cookie|authorization|header|payload|body|id|ref)/i;
const SAFE_DETAIL_KEYS = new Set(["password_changed"]);
const MAX_DETAIL_KEY_LENGTH = 64;
const MAX_DETAIL_STRING_LENGTH = 160;

export function sanitizeAdminAuditDetails(details: AdminAuditDetails | null | undefined) {
  const sanitized: Record<string, AdminAuditScalar> = {};
  for (const [rawKey, rawValue] of Object.entries(details ?? {})) {
    const key = rawKey.trim().slice(0, MAX_DETAIL_KEY_LENGTH);
    if (!key || (FORBIDDEN_DETAIL_KEY.test(key) && !SAFE_DETAIL_KEYS.has(key))) continue;
    if (
      rawValue === null ||
      typeof rawValue === "boolean" ||
      typeof rawValue === "number" ||
      typeof rawValue === "string"
    ) {
      sanitized[key] =
        typeof rawValue === "string" ? rawValue.slice(0, MAX_DETAIL_STRING_LENGTH) : rawValue;
    }
  }
  return sanitized;
}
