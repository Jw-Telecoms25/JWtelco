import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { notifyWalletFunded } from "@/lib/notifications/dispatcher";

/**
 * Aspfiy signature: x-wiaxy-signature = MD5(secret_key) — static per-merchant, not per-request.
 * Source: https://aspfiy.readme.io/reference/webhooks
 */
function verifyAspfiySignature(request: NextRequest, secretKey: string): boolean {
  const incoming = request.headers.get("x-wiaxy-signature");
  if (!incoming) return false;
  const expected = createHash("md5").update(secretKey).digest("hex");
  return incoming === expected;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    // Layer 1: URL path token — attacker who doesn't know the URL gets 404, not 401
    // Register webhook as: https://jwtelecoms.vercel.app/api/webhooks/aspfiy?t=<ASPFIY_WEBHOOK_TOKEN>
    const webhookToken = process.env.ASPFIY_WEBHOOK_TOKEN;
    if (webhookToken) {
      const providedToken = request.nextUrl.searchParams.get("t");
      if (providedToken !== webhookToken) {
        // Return 404 — do not reveal that this endpoint exists
        return new NextResponse(null, { status: 404 });
      }
    }

    // Layer 2: x-wiaxy-signature header = MD5(secret_key)
    const secretKey = process.env.ASPFIY_SECRET_KEY;
    if (!secretKey) {
      logger.error({}, "Aspfiy webhook: ASPFIY_SECRET_KEY not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const signatureValid = verifyAspfiySignature(request, secretKey);
    if (!signatureValid) {
      logger.warn({}, "Aspfiy webhook: invalid or missing x-wiaxy-signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only process payment notifications — ignore disbursements etc.
    // Note: Aspfiy docs have a typo "PAYMENT_NOTIFIFICATION" (double-F) — handle both
    const event = body?.event;
    const isPaymentEvent = event === "PAYMENT_NOTIFICATION" || event === "PAYMENT_NOTIFIFICATION";
    if (!isPaymentEvent) {
      await admin.from("webhook_events").insert({
        gateway: "aspfiy",
        event_type: event || "unknown",
        event_id: `aspfiy-${Date.now()}`,
        payload: body,
        signature_valid: true,
        processed: false,
      });
      return NextResponse.json({ received: true });
    }

    const data = body?.data;
    const txnRef = data?.reference;
    const accountNumber = data?.account?.account_number;
    const amountNaira = typeof data?.amount === "number" ? data.amount : parseFloat(data?.amount || "0");
    const senderName =
      `${data?.payer?.first_name || ""} ${data?.payer?.last_name || ""}`.trim() || "Unknown";

    if (!txnRef || !accountNumber || amountNaira <= 0) {
      logger.error({ txnRef, accountNumber, amountNaira }, "Aspfiy webhook: missing required fields");
      await admin.from("webhook_events").insert({
        gateway: "aspfiy",
        event_type: "PAYMENT_NOTIFICATION",
        event_id: txnRef || `aspfiy-${Date.now()}`,
        payload: body,
        signature_valid: true,
        processed: false,
      });
      return NextResponse.json({ received: true });
    }

    const { data: existing } = await admin
      .from("webhook_events")
      .select("id")
      .eq("gateway", "aspfiy")
      .eq("event_id", txnRef)
      .eq("processed", true)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({ received: true, message: "Already processed" });
    }

    const { data: session } = await admin
      .from("payment_sessions")
      .select("*")
      .eq("gateway", "aspfiy")
      .eq("gateway_reference", accountNumber)
      .limit(1)
      .single();

    if (!session) {
      logger.error({ accountNumber }, "Aspfiy webhook: no session for account number");
      await admin.from("webhook_events").insert({
        gateway: "aspfiy",
        event_type: "PAYMENT_NOTIFICATION",
        event_id: txnRef,
        payload: body,
        signature_valid: true,
        processed: false,
      });
      return NextResponse.json({ received: true });
    }

    // Aspfiy sends amount in Naira — convert to kobo for internal storage
    // ASSUMPTION: amount is Naira. If payments look 100x wrong, flip this.
    const amountKobo = Math.round(amountNaira * 100);

    const fundRef = `FUND-ASPFIY-${txnRef}`;

    const { data: txnId, error: walletError } = await admin.rpc(
      "process_wallet_transaction",
      {
        p_user_id: session.user_id,
        p_amount: amountKobo,
        p_type: "funding",
        p_description: `Wallet funding via bank transfer`,
        p_reference: fundRef,
        p_metadata: {
          gateway: "aspfiy",
          aspfiy_reference: txnRef,
          account_number: accountNumber,
          sender_name: senderName,
          amount_naira: amountNaira,
        },
      }
    );

    if (walletError) {
      if (walletError.message?.includes("duplicate")) {
        return NextResponse.json({ received: true, message: "Already processed" });
      }
      logger.error({ error: walletError.message }, "Aspfiy webhook: wallet credit failed");
      return NextResponse.json({ error: "Credit failed" }, { status: 500 });
    }

    await admin.from("transactions").update({ status: "success" }).eq("id", txnId);
    // NOTE: do NOT mark payment_session as "success" — virtual accounts receive unlimited payments

    notifyWalletFunded(admin, session.user_id, {
      amount: amountKobo,
      channel: "bank_transfer",
    });

    await admin.from("webhook_events").insert({
      gateway: "aspfiy",
      event_type: "PAYMENT_NOTIFICATION",
      event_id: txnRef,
      payload: body,
      signature_valid: true,
      processed: true,
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Aspfiy webhook error");
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
