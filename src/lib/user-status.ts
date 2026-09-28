export type UserStatus = "active" | "blocked" | "expired";

export type UserStatusInput = {
  is_active: boolean | null | undefined;
  expires_at: string | null | undefined;
};

export function resolveUserStatus(input: UserStatusInput, now = Date.now()): UserStatus {
  const expiresAt = input.expires_at ? Date.parse(input.expires_at) : Number.NaN;

  if (Number.isFinite(expiresAt) && expiresAt < now) {
    return "expired";
  }

  return input.is_active ? "active" : "blocked";
}
