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
    // Look up referrer
    const { data: referrer } = await admin
      .from("profiles")
      .select("id")
      .eq("referral_code", referralCode.toUpperCase())
      .single();

    if (!referrer) {
      logger.warn({ referralCode }, "Invalid referral code");
      return false;
    }

    // Don't let user refer themselves
    if (referrer.id === newUserId) return false;

    // Set referred_by on new user
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
    // Check if user was referred
    const { data: profile } = await admin
      .from("profiles")
      .select("referred_by")
      .eq("id", userId)
      .single();

    if (!profile?.referred_by) return;

    // Check if bonus was already credited (look for existing referral_bonus transaction)
    const { data: existing } = await admin
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "referral_bonus")
      .limit(1)
      .single();

    if (existing) return; // Already credited

    // Check this is their first successful non-funding, non-reversal transaction
    const { count } = await admin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "success")
      .in("type", ["airtime", "data", "electricity", "cable", "exam_pin"]);

    // Only credit on first purchase (count should be 1 — the one that just completed)
    if ((count ?? 0) > 1) return;

    // Credit referee
    await admin.rpc("process_wallet_transaction", {
      p_user_id: userId,
      p_amount: REFERRAL_BONUS_KOBO,
      p_type: "referral_bonus",
      p_description: "Referral bonus — welcome reward",
      p_reference: `REF-BONUS-${userId.slice(0, 8)}-${Date.now()}`,
      p_metadata: { bonus_type: "referee", referrer_id: profile.referred_by },
    });

    // Credit referrer
    await admin.rpc("process_wallet_transaction", {
      p_user_id: profile.referred_by,
      p_amount: REFERRAL_BONUS_KOBO,
      p_type: "referral_bonus",
      p_description: "Referral bonus — your invite made a purchase",
      p_reference: `REF-BONUS-${profile.referred_by.slice(0, 8)}-${Date.now()}`,
      p_metadata: { bonus_type: "referrer", referee_id: userId },
    });

    logger.info({ userId, referrerId: profile.referred_by }, "Referral bonuses credited");
  } catch (err) {
    // Non-critical — don't fail the purchase
    logger.error({ error: err instanceof Error ? err.message : "Unknown", userId }, "Credit referral bonus error");
  }
}
