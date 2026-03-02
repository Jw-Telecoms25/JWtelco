import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPurchaseSuccess, sendPurchaseRefunded, sendWalletFunded } from "./email";
import { formatNaira } from "@/lib/utils/format";
import { logger } from "@/lib/utils/logger";

interface UserInfo {
  email: string;
  first_name: string;
  notification_preferences: { sms: boolean; email: boolean; push: boolean };
}

async function getUser(admin: SupabaseClient, userId: string): Promise<UserInfo | null> {
  const { data } = await admin
    .from("profiles")
    .select("email, first_name, notification_preferences")
    .eq("id", userId)
    .single();
  return data;
}

/** Fire-and-forget notification — never throws, never blocks */
export function notifyPurchaseSuccess(
  admin: SupabaseClient,
  userId: string,
  details: { type: string; description: string; amount: number; reference: string; token?: string }
): void {
  (async () => {
    try {
      const user = await getUser(admin, userId);
      if (!user) return;

      if (user.notification_preferences?.email !== false) {
        await sendPurchaseSuccess(user.email, { name: user.first_name, ...details });
      }

      // In-app notification
      await admin.from("notifications").insert({
        user_id: userId,
        subject: "Purchase Successful",
        message: `Your ${details.type} purchase was successful: ${details.description}`,
        target: "user",
      });
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : "Unknown", userId }, "Notification dispatch failed (purchase success)");
    }
  })();
}

export function notifyPurchaseRefunded(
  admin: SupabaseClient,
  userId: string,
  details: { type: string; description: string; amount: number; reference: string }
): void {
  (async () => {
    try {
      const user = await getUser(admin, userId);
      if (!user) return;

      if (user.notification_preferences?.email !== false) {
        await sendPurchaseRefunded(user.email, { name: user.first_name, ...details });
      }

      await admin.from("notifications").insert({
        user_id: userId,
        subject: "Purchase Failed — Refunded",
        message: `Your ${details.type} purchase failed. ${formatNaira(details.amount)} has been refunded to your wallet.`,
        target: "user",
      });
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : "Unknown", userId }, "Notification dispatch failed (purchase refund)");
    }
  })();
}

export function notifyWalletFunded(
  admin: SupabaseClient,
  userId: string,
  details: { amount: number; channel: string }
): void {
  (async () => {
    try {
      const user = await getUser(admin, userId);
      if (!user) return;

      if (user.notification_preferences?.email !== false) {
        await sendWalletFunded(user.email, { name: user.first_name, ...details });
      }

      await admin.from("notifications").insert({
        user_id: userId,
        subject: "Wallet Funded",
        message: `Your wallet was funded with ${formatNaira(details.amount)} via ${details.channel}.`,
        target: "user",
      });
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : "Unknown", userId }, "Notification dispatch failed (wallet funded)");
    }
  })();
}

