import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeWithFallback } from "@/lib/providers/router";
import { generateReference } from "@/lib/utils/reference";
import { isValidMeterNumber } from "@/lib/utils/validators";
import { assertActiveUser, assertPinToken, AccountBlockedError } from "@/lib/utils/guards";
import { DISCOS } from "@/lib/utils/constants";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/utils/logger";
import { notifyPurchaseSuccess, notifyPurchaseRefunded } from "@/lib/notifications/dispatcher";

const VALID_DISCO_IDS = DISCOS.map(d => d.id);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`purchase:${user.id}`);
    if (!rl.success) return rl.response!;

    const admin = createAdminClient();
    await assertActiveUser(user.id, admin);

    const pinCheck = await assertPinToken(request, user.id, admin);
    if (pinCheck) return pinCheck;

    const body = await request.json();
    const { meterNumber, disco, meterType, amount } = body;

    if (!meterNumber || !isValidMeterNumber(meterNumber)) {
      return NextResponse.json({ error: "Invalid meter number" }, { status: 400 });
    }
    if (!disco || !VALID_DISCO_IDS.includes(disco)) {
      return NextResponse.json({ error: "Invalid disco" }, { status: 400 });
    }
    if (!meterType || !["prepaid", "postpaid"].includes(meterType)) {
      return NextResponse.json({ error: "Invalid meter type" }, { status: 400 });
    }
    if (!amount || typeof amount !== "number" || amount < 10000 || amount > 5000000) {
      return NextResponse.json({ error: "Amount must be between ₦100 and ₦50,000" }, { status: 400 });
    }

    const reference = generateReference("ELEC");
    const idempotencyKey = request.headers.get("x-idempotency-key") || undefined;

    if (idempotencyKey) {
      const { data: existing } = await admin
        .from("transactions")
        .select("id, status, reference")
        .eq("idempotency_key", idempotencyKey)
        .single();

      if (existing && (existing.status === "success" || existing.status === "processing")) {
        return NextResponse.json({
          success: true,
          message: "Duplicate request — original transaction returned",
          reference: existing.reference,
          transactionId: existing.id,
          status: existing.status,
          duplicate: true,
        });
      }
    }

    const { data: txnId, error: walletError } = await admin.rpc(
      "process_wallet_transaction",
      {
        p_user_id: user.id,
        p_amount: amount,
        p_type: "electricity",
        p_description: `Electricity ${meterType} - ${disco} - Meter: ${meterNumber}`,
        p_reference: reference,
        p_metadata: { meterNumber, disco, meterType, amount },
      }
    );

    if (walletError) {
      const msg = walletError.message.includes("Insufficient")
        ? "Insufficient wallet balance"
        : "Failed to process payment";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (idempotencyKey && txnId) {
      await admin.from("transactions").update({ idempotency_key: idempotencyKey }).eq("id", txnId);
    }

    const result = await executeWithFallback(
      "electricity",
      disco,
      (provider) => provider.buyElectricity({ meterNumber, disco, meterType, amount, reference }),
      reference
    );

    const isPending = result.data?.isPending === true;

    await admin
      .from("transactions")
      .update({
        status: result.success ? "success" : isPending ? "processing" : "failed",
        metadata: { meterNumber, disco, meterType, amount, provider_used: result.provider_used, providerResponse: result },
      })
      .eq("id", txnId);

    if (!result.success && !isPending) {
      const reversalRef = generateReference("REV");
      await admin.rpc("process_wallet_transaction", {
        p_user_id: user.id,
        p_amount: amount,
        p_type: "reversal",
        p_description: `Reversal for failed electricity: ${reference}`,
        p_reference: reversalRef,
        p_metadata: { original_reference: reference, reason: "provider_failure" },
      });
      await admin.from("transactions").update({ status: "success" }).eq("reference", reversalRef);

      notifyPurchaseRefunded(admin, user.id, {
        type: "electricity",
        description: `Electricity ${meterType} - ${disco} - Meter: ${meterNumber}`,
        amount,
        reference,
      });

      return NextResponse.json(
        { error: "Electricity purchase failed. Your wallet has been refunded." },
        { status: 502 }
      );
    }

    if (isPending) {
      return NextResponse.json({
        success: true,
        status: "processing",
        message: "Your transaction is processing. We'll update you shortly.",
        reference,
        transactionId: txnId,
      });
    }

    notifyPurchaseSuccess(admin, user.id, {
      type: "electricity",
      description: `Electricity ${meterType} - ${disco} - Meter: ${meterNumber}`,
      amount,
      reference,
      token: result.data?.token as string | undefined,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      reference,
      transactionId: txnId,
      token: result.data?.token,
      units: result.data?.units,
    });
  } catch (err) {
    if (err instanceof AccountBlockedError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Electricity purchase error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
