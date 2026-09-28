/* eslint-disable @typescript-eslint/no-explicit-any */

export async function applyReferralBonusOnce(
  supabaseAdmin: any,
  input: {
    paymentId: string;
    referredUserId: string;
    sourceSlug: string | null;
    bonusDays: number;
  },
) {
  if (!input.paymentId || !input.sourceSlug || input.sourceSlug === "dono-livre" || input.bonusDays <= 0) {
    return { applied: false, reason: "ineligible" };
  }

  const { data, error } = await supabaseAdmin.rpc("apply_referral_bonus_once", {
    p_payment_id: input.paymentId,
    p_referred_user_id: input.referredUserId,
    p_source_slug: input.sourceSlug,
    p_bonus_days: Math.min(Math.max(Math.trunc(input.bonusDays), 0), 365),
  });

  if (error) throw error;
  return data ?? { applied: false, reason: "empty_result" };
}
