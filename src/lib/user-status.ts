export type UserStatus = "active" | "blocked" | "expired";

export type UserStatusInput = {
  is_active: boolean | null | undefined;
  is_blocked?: boolean | null | undefined;
  expires_at: string | null | undefined;
};

function parseExpiry(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return Number.NaN;

  const localDate = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (localDate) {
    const [, day, month, year] = localDate;
    return new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999).getTime();
  }

  const isoDateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999).getTime();
  }

  return Date.parse(raw);
}

export function resolveUserStatus(input: UserStatusInput, now = Date.now()): UserStatus {
  if (input.is_blocked === true || input.is_active === false) {
    return "blocked";
  }

  const expiresAt = parseExpiry(input.expires_at);
  if (Number.isFinite(expiresAt) && expiresAt < now) {
    return "expired";
  }

  return "active";
}
