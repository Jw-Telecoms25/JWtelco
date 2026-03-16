import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/utils/logger";

const REFERRAL_BONUS_KOBO = 10000; // ₦100 for both referrer and referee

/**
 * Process referral code after signup.
 * Called from the handle_new_user trigger data, or from an API after signup.
 */
export async function processReferralCode(
  admin: SupabaseClient,
  newUserId: string,
  referralCode: string
): Promise<boolean> {
  try {
    const { data: referrer } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", referralCode.toUpperCase())
      .single();

    if (!referrer) {
      logger.warn({ referralCode }, "Invalid referral code");
      return false;
    }

    if (referrer.id === newUserId) return false;

    await admin
      .from("profiles")
      .update({ referred_by: referrer.id })
      .eq("id", newUserId);

    return true;
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Process referral code error");
    return false;
  }
}

/**
 * Credit referral bonus to both users on referee's first purchase.
 * Call this after a successful purchase — it checks internally if it's the first one.
 */
export async function creditReferralBonus(
  admin: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("referred_by")
      .eq("id", userId)
      .single();

    if (!profile?.referred_by) return;

    const { data: existing } = await admin
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "referral_bonus")
      .limit(1)
      .single();

    if (existing) return;

    const { count } = await admin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "success")
      .in("type", ["airtime", "data", "electricity", "cable", "exam_pin"]);

    if ((count ?? 0) > 1) return;

    // Deterministic references — idempotent even if called concurrently
    // The unique constraint on (reference) in transactions will reject duplicates
    const refereeRef = `REF-BONUS-REFEREE-${userId.slice(0, 8)}`;
    const referrerRef = `REF-BONUS-REFERRER-${profile.referred_by.slice(0, 8)}-${userId.slice(0, 8)}`;

    // Credit referee (unique index on this reference prevents double-credit)
    await admin.rpc("process_wallet_transaction", {
      p_user_id: userId,
      p_amount: REFERRAL_BONUS_KOBO,
      p_type: "referral_bonus",
      p_description: "Referral bonus — welcome reward",
      p_reference: refereeRef,
      p_metadata: { bonus_type: "referee", referrer_id: profile.referred_by },
    });

    // Credit referrer (unique reference prevents double-credit even on concurrent calls)
    await admin.rpc("process_wallet_transaction", {
      p_user_id: profile.referred_by,
      p_amount: REFERRAL_BONUS_KOBO,
      p_type: "referral_bonus",
      p_description: "Referral bonus — your invite made a purchase",
      p_reference: referrerRef,
      p_metadata: { bonus_type: "referrer", referee_id: userId },
    });

    logger.info({ userId, referrerId: profile.referred_by }, "Referral bonuses credited");
  } catch (err) {
    // Non-critical — don't fail the purchase
    logger.error({ error: err instanceof Error ? err.message : "Unknown", userId }, "Credit referral bonus error");
  }
}
