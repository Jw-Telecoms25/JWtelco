import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReference } from "@/lib/utils/reference";
import { logger } from "@/lib/utils/logger";

const CRON_SECRET = process.env.CRON_SECRET || "";
const STALE_MINUTES = 10;
const BATCH_SIZE = 20;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const staleCutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString();

  // Find transactions stuck in "processing" for more than STALE_MINUTES
  const { data: staleTxns, error } = await admin
    .from("transactions")
    .select("id, user_id, type, amount, reference, metadata, updated_at")
    .eq("status", "processing")
    .lt("updated_at", staleCutoff)
    .order("updated_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    logger.error({ error: error.message }, "Reconcile: failed to fetch stale transactions");
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  if (!staleTxns || staleTxns.length === 0) {
    return NextResponse.json({ processed: 0, message: "No stale transactions" });
  }

  let reversed = 0;
  let flagged = 0;
  let errors = 0;

  for (const txn of staleTxns) {
    try {
      const metadata = txn.metadata as Record<string, unknown> | null;
      const providerUsed = (metadata?.provider_used as string) || "";
      const providerResponse = metadata?.providerResponse as Record<string, unknown> | undefined;

      // If no provider was ever called (crash between debit and provider call), auto-reverse
      if (!providerUsed && !providerResponse) {
        const reversalRef = generateReference("REV");
        await admin.rpc("process_wallet_transaction", {
          p_user_id: txn.user_id,
          p_amount: txn.amount,
          p_type: "reversal",
          p_description: `Auto-reversal for orphan ${txn.type}: ${txn.reference}`,
          p_reference: reversalRef,
          p_metadata: { original_reference: txn.reference, reason: "orphan_no_provider_call" },
        });
        await admin.from("transactions").update({ status: "success" }).eq("reference", reversalRef);
        await admin
          .from("transactions")
          .update({ status: "failed", metadata: { ...metadata, reconciled: true, reconcile_reason: "orphan" } })
          .eq("id", txn.id);

        logger.info({ reference: txn.reference, userId: txn.user_id }, "Reconcile: reversed orphan transaction");
        reversed++;
        continue;
      }

      // If provider was called, flag for admin review (the requery cron handles provider checks)
      await admin.from("audit_log").insert({
        admin_id: null,
        action: "stale_transaction_flagged",
        target_type: "transaction",
        target_id: txn.id,
        details: { reference: txn.reference, provider: providerUsed, stale_minutes: STALE_MINUTES },
        actor_type: "cron",
      });

      logger.warn({ reference: txn.reference, provider: providerUsed }, "Reconcile: flagged stale transaction for admin review");
      flagged++;
    } catch (err) {
      logger.error({ reference: txn.reference, error: err instanceof Error ? err.message : "Unknown" }, "Reconcile: error processing transaction");
      errors++;
    }
  }

  return NextResponse.json({
    processed: staleTxns.length,
    reversed,
    flagged,
    errors,
  });
}
