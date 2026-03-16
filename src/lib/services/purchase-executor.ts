import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProviderResponse } from "@/lib/providers/types";
import { generateReference } from "@/lib/utils/reference";
import { notifyPurchaseSuccess, notifyPurchaseRefunded } from "@/lib/notifications/dispatcher";
import { creditReferralBonus } from "@/lib/services/referrals";

interface PurchaseParams {
  admin: SupabaseClient;
  userId: string;
  price: number;
  costPrice: number;
  type: string;
  description: string;
  reference: string;
  metadata: Record<string, unknown>;
  idempotencyKey?: string;
  execute: () => Promise<ProviderResponse & { provider_used: string }>;
  buildSuccessResponse?: (txnId: string, result: ProviderResponse & { provider_used: string }) => Record<string, unknown>;
}

interface PurchaseResult {
  response: NextResponse;
  txnId?: string;
  status: "success" | "processing" | "failed";
}

export async function executePurchase(params: PurchaseParams): Promise<PurchaseResult> {
  const { admin, userId, price, costPrice, type, description, reference, metadata, idempotencyKey, execute, buildSuccessResponse } = params;

  if (idempotencyKey) {
    const { data: existing } = await admin
      .from("transactions")
      .select("id, status, reference")
      .eq("idempotency_key", idempotencyKey)
      .eq("user_id", userId)  // Scope to user — prevents IDOR via idempotency key
      .single();

    if (existing) {
      if (existing.status === "success" || existing.status === "processing") {
        return {
          response: NextResponse.json({
            success: true,
            message: "Duplicate request — original transaction returned",
            reference: existing.reference,
            transactionId: existing.id,
            status: existing.status,
            duplicate: true,
          }),
          txnId: existing.id,
          status: existing.status as "success" | "processing",
        };
      }
    }
  }

  const txnMetadata = idempotencyKey
    ? { ...metadata, idempotency_key: idempotencyKey }
    : metadata;

  const { data: txnId, error: walletError } = await admin.rpc(
    "process_wallet_transaction",
    {
      p_user_id: userId,
      p_amount: price,
      p_type: type,
      p_description: description,
      p_reference: reference,
      p_metadata: txnMetadata,
    }
  );

  if (txnId && idempotencyKey) {
    await admin
      .from("transactions")
      .update({ idempotency_key: idempotencyKey })
      .eq("id", txnId);
  }

  if (walletError) {
    const msg = walletError.message.includes("Insufficient")
      ? "Insufficient wallet balance"
      : "Failed to process payment";
    return {
      response: NextResponse.json({ error: msg }, { status: 400 }),
      status: "failed",
    };
  }

  const result = await execute();
  const isPending = result.data?.isPending === true;
  const profit = result.success ? price - costPrice : 0;

  await admin
    .from("transactions")
    .update({
      status: result.success ? "success" : isPending ? "processing" : "failed",
      profit,
      metadata: { ...metadata, provider_used: result.provider_used, providerResponse: result },
    })
    .eq("id", txnId);

  if (!result.success && !isPending) {
    const reversalRef = generateReference("REV");
    await admin.rpc("process_wallet_transaction", {
      p_user_id: userId,
      p_amount: price,
      p_type: "reversal",
      p_description: `Reversal for failed ${type}: ${reference}`,
      p_reference: reversalRef,
      p_metadata: { original_reference: reference, reason: "provider_failure" },
    });
    await admin.from("transactions").update({ status: "success" }).eq("reference", reversalRef);

    notifyPurchaseRefunded(admin, userId, { type, description, amount: price, reference });

    return {
      response: NextResponse.json(
        { error: `${type.replace("_", " ")} purchase failed. Your wallet has been refunded.` },
        { status: 502 }
      ),
      txnId,
      status: "failed",
    };
  }

  if (isPending) {
    return {
      response: NextResponse.json({
        success: true,
        message: "Transaction is being processed",
        reference,
        transactionId: txnId,
        status: "processing",
      }),
      txnId,
      status: "processing",
    };
  }

  const extra = buildSuccessResponse ? buildSuccessResponse(txnId, result) : {};

  notifyPurchaseSuccess(admin, userId, {
    type,
    description,
    amount: price,
    reference,
    token: result.data?.token as string | undefined,
  });

  creditReferralBonus(admin, userId).catch(() => {});

  return {
    response: NextResponse.json({
      success: true,
      message: result.message,
      reference,
      transactionId: txnId,
      ...extra,
    }),
    txnId,
    status: "success",
  };
}

export function getRolePrice(plan: { user_price: number; agent_price: number; vendor_price: number }, role: string): number {
  if (role === "agent") return plan.agent_price;
  if (role === "admin" || role === "super_admin") return plan.vendor_price;
  return plan.user_price;
}
