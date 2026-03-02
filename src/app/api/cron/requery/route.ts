import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { maskawasubProvider } from "@/lib/providers/vtu-reseller";
import { generateReference } from "@/lib/utils/reference";
import { logger } from "@/lib/utils/logger";

const CRON_SECRET = process.env.CRON_SECRET || "";
const MAX_AGE_HOURS = 24;
const BATCH_SIZE = 20;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000).toISOString();

  const { data: pendingTxns, error } = await admin
    .from("transactions")
    .select("id, user_id, type, amount, reference, metadata, created_at")
    .eq("status", "processing")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    logger.error({ error: error instanceof Error ? error.message : "Unknown" }, "Requery: failed to fetch pending transactions");
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  if (!pendingTxns || pendingTxns.length === 0) {
    return NextResponse.json({ processed: 0, message: "No pending transactions" });
  }

  let resolved = 0;
  let stillPending = 0;
  let errors = 0;

  for (const txn of pendingTxns) {
    try {
      const result = await requeryTransaction(txn);

      if (result.status === "success") {
        await admin
          .from("transactions")
          .update({ status: "success", metadata: { ...txn.metadata, requery_result: result } })
          .eq("id", txn.id);
        resolved++;
      } else if (result.status === "failed") {
        await admin
          .from("transactions")
          .update({ status: "failed", metadata: { ...txn.metadata, requery_result: result } })
          .eq("id", txn.id);

        // Reverse wallet debit
        const reversalRef = generateReference("REV");
        await admin.rpc("process_wallet_transaction", {
          p_user_id: txn.user_id,
          p_amount: txn.amount,
          p_type: "reversal",
          p_description: `Auto-reversal for failed ${txn.type}: ${txn.reference}`,
          p_reference: reversalRef,
          p_metadata: { original_reference: txn.reference, reason: "requery_confirmed_failure" },
        });
        await admin.from("transactions").update({ status: "success" }).eq("reference", reversalRef);
        resolved++;
      } else {
        stillPending++;
      }
    } catch (err) {
      logger.error({ error: err instanceof Error ? err.message : "Unknown", reference: txn.reference }, "Requery failed");
      errors++;
    }
  }

  return NextResponse.json({
    processed: pendingTxns.length,
    resolved,
    stillPending,
    errors,
  });
}

interface PendingTxn {
  id: string;
  type: string;
  reference: string;
  metadata: Record<string, unknown>;
}

async function requeryTransaction(
  txn: PendingTxn
): Promise<{ status: "success" | "failed" | "pending"; raw?: unknown }> {
  const providerUsed = (txn.metadata?.provider_used as string) || "";
  const providerResponse = txn.metadata?.providerResponse as Record<string, unknown> | undefined;

  // VTPass requery
  if (providerUsed === "vtpass" || providerUsed.startsWith("VTPass")) {
    const requestId =
      (providerResponse?.data as Record<string, unknown>)?.vtpass_request_id as string ||
      (providerResponse?.vtpass_request_id as string);

    if (!requestId) {
      return { status: "pending" };
    }

    return await requeryVtpass(requestId);
  }

  // Sub-reseller requery (Maskawasub, Gladtidings, Alrahuz)
  const txnIdFromProvider =
    (providerResponse?.data as Record<string, unknown>)?.id as string ||
    (providerResponse?.id as string);

  if (txnIdFromProvider) {
    return await requeryReseller(providerUsed, txnIdFromProvider);
  }

  return { status: "pending" };
}

async function requeryVtpass(requestId: string): Promise<{ status: "success" | "failed" | "pending"; raw?: unknown }> {
  try {
    const BASE_URL = process.env.VTPASS_BASE_URL || "https://sandbox.vtpass.com/api";
    const res = await fetch(`${BASE_URL}/requery`, {
      method: "POST",
      headers: {
        "api-key": process.env.VTPASS_API_KEY || "",
        "secret-key": process.env.VTPASS_SECRET_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ request_id: requestId }),
    });

    const data = await res.json();
    const txStatus = data.content?.transactions?.status;

    if (txStatus === "delivered") return { status: "success", raw: data };
    if (txStatus === "failed") return { status: "failed", raw: data };
    return { status: "pending", raw: data };
  } catch {
    return { status: "pending" };
  }
}

async function requeryReseller(
  providerName: string,
  txnId: string
): Promise<{ status: "success" | "failed" | "pending"; raw?: unknown }> {
  try {
    // All sub-resellers use the same queryTransaction pattern
    const result = await maskawasubProvider.queryTransaction(txnId);

    if (result.success) return { status: "success", raw: result };
    if (result.data?.isPending) return { status: "pending", raw: result };
    return { status: "failed", raw: result };
  } catch {
    return { status: "pending" };
  }
}
