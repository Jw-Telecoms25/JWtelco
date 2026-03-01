import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeWithFallback } from "@/lib/providers/router";
import { generateReference } from "@/lib/utils/reference";
import { isValidPhone } from "@/lib/utils/validators";
import { assertActiveUser, AccountBlockedError } from "@/lib/utils/guards";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/utils/logger";
import { notifyPurchaseSuccess, notifyPurchaseRefunded } from "@/lib/notifications/dispatcher";

interface BulkItem {
  phone: string;
  network: string;
  amount: number; // kobo
}

const MAX_ITEMS = 20;
const MIN_AMOUNT = 5000;  // ₦50
const MAX_AMOUNT = 5000000; // ₦50,000

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`bulk:${user.id}`);
    if (!rl.success) return rl.response!;

    const admin = createAdminClient();
    await assertActiveUser(user.id, admin);

    const body = await request.json();
    const { items } = body as { items: BulkItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 });
    }
    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: `Maximum ${MAX_ITEMS} items per batch` }, { status: 400 });
    }

    // Validate all items
    const validNetworks = ["mtn", "airtel", "glo", "9mobile"];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.phone || !isValidPhone(item.phone)) {
        return NextResponse.json({ error: `Item ${i + 1}: invalid phone number` }, { status: 400 });
      }
      if (!item.network || !validNetworks.includes(item.network)) {
        return NextResponse.json({ error: `Item ${i + 1}: invalid network` }, { status: 400 });
      }
      if (!item.amount || item.amount < MIN_AMOUNT || item.amount > MAX_AMOUNT) {
        return NextResponse.json({ error: `Item ${i + 1}: amount must be between ₦50 and ₦50,000` }, { status: 400 });
      }
    }

    // Check total wallet balance
    const totalCost = items.reduce((sum, i) => sum + i.amount, 0);
    const { data: wallet } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!wallet || wallet.balance < totalCost) {
      return NextResponse.json({
        error: "Insufficient wallet balance for bulk purchase",
        required: totalCost,
        available: wallet?.balance || 0,
      }, { status: 400 });
    }

    // Execute purchases sequentially to avoid wallet race conditions
    const results: { index: number; phone: string; status: string; reference: string; error?: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const reference = generateReference("BULK");

      try {
        // Debit wallet
        const { data: txnId, error: walletError } = await admin.rpc("process_wallet_transaction", {
          p_user_id: user.id,
          p_amount: item.amount,
          p_type: "airtime",
          p_description: `${item.network.toUpperCase()} ₦${item.amount / 100} airtime to ${item.phone} (bulk)`,
          p_reference: reference,
          p_metadata: { phone: item.phone, network: item.network, bulk: true, batchIndex: i },
        });

        if (walletError) {
          results.push({ index: i, phone: item.phone, status: "failed", reference, error: "Wallet debit failed" });
          continue;
        }

        // Call provider
        const result = await executeWithFallback(
          "airtime",
          item.network,
          (provider) => provider.buyAirtime({ phone: item.phone, network: item.network, amount: item.amount, reference }),
          reference
        );

        if (result.success) {
          await admin.from("transactions").update({ status: "success" }).eq("id", txnId);
          results.push({ index: i, phone: item.phone, status: "success", reference });
        } else {
          // Refund
          const reversalRef = generateReference("REV");
          await admin.rpc("process_wallet_transaction", {
            p_user_id: user.id,
            p_amount: item.amount,
            p_type: "reversal",
            p_description: `Reversal: bulk airtime failed for ${item.phone}`,
            p_reference: reversalRef,
            p_metadata: { original_reference: reference },
          });
          await admin.from("transactions").update({ status: "failed" }).eq("id", txnId);
          results.push({ index: i, phone: item.phone, status: "failed", reference, error: result.message });
        }
      } catch (err) {
        results.push({ index: i, phone: item.phone, status: "failed", reference, error: "Execution error" });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;

    // Send one summary notification
    if (successCount > 0) {
      notifyPurchaseSuccess(admin, user.id, {
        type: "airtime",
        description: `Bulk airtime: ${successCount}/${items.length} successful`,
        amount: items.filter((_, i) => results[i]?.status === "success").reduce((s, item) => s + item.amount, 0),
        reference: `BULK-${Date.now()}`,
      });
    }

    return NextResponse.json({
      success: true,
      total: items.length,
      successful: successCount,
      failed: items.length - successCount,
      results,
    });
  } catch (err) {
    if (err instanceof AccountBlockedError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Bulk airtime error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
