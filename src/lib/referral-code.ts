import { randomBytes } from "node:crypto";

function normalizeCodeCandidate(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
}

export function generateReferralCode(prefix = "REF"): string {
  const token = randomBytes(4).toString("hex").toUpperCase();
  return normalizeCodeCandidate(`${prefix}_${token}`);
}

export async function generateUniqueReferralCode(supabaseAdmin: any, prefix = "REF"): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateReferralCode(prefix);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code", candidate)
      .maybeSingle();

    if (error) throw error;
    if (!data) return candidate;
  }

  throw new Error("Nao foi possivel gerar um link de indicacao unico");
}

type ReferralPlanLike = {
  name?: string | null;
  price?: number | string | null;
} | null | undefined;

export function isReferralEligiblePlan(plan: ReferralPlanLike): boolean {
  if (!plan) return false;

  const price = Number((plan as any).price ?? 0);
  const name = String((plan as any).name ?? "").trim().toLowerCase();

  if (!Number.isFinite(price) || price <= 0) return false;
  if (name.includes("teste")) return false;
  if (name.includes("trial")) return false;
  if (name.includes("free")) return false;
  if (name.includes("gratis")) return false;
  if (name.includes("grátis")) return false;

  return true;
}

export async function ensureUserReferralCode(
  supabaseAdmin: any,
  userId: string,
  plan: ReferralPlanLike,
): Promise<string | null> {
  if (!isReferralEligiblePlan(plan)) return null;

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (profile?.referral_code) return profile.referral_code;

  const referralCode = await generateUniqueReferralCode(supabaseAdmin);
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ referral_code: referralCode })
    .eq("id", userId);

  if (updateError) throw updateError;
  return referralCode;
}
