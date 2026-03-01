import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReference } from "@/lib/utils/reference";
import { logger } from "@/lib/utils/logger";
import { notifyWalletFunded } from "@/lib/notifications/dispatcher";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    const {
      reference,
      amount,
      status,
      accountNumber,
      senderName,
      sessionId,
    } = body;

    if (status !== "successful" && status !== "success") {
      await admin.from("webhook_events").insert({
        gateway: "aspfiy",
        event_type: status || "unknown",
        payload: body,
        reference: reference || sessionId || "unknown",
        processed: false,
      });
      return NextResponse.json({ received: true });
    }

    const eventRef = sessionId || reference || "";

    const { data: existing } = await admin
      .from("webhook_events")
      .select("id")
      .eq("gateway", "aspfiy")
      .eq("reference", eventRef)
      .eq("processed", true)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({ received: true, message: "Already processed" });
    }

    const lookupRef = reference || accountNumber;
    if (!lookupRef) {
      logger.error({}, "Aspfiy webhook: no reference or accountNumber to look up user");
      return NextResponse.json({ received: true });
    }

    const { data: session } = await admin
      .from("payment_sessions")
      .select("*")
      .eq("gateway", "aspfiy")
      .eq("gateway_reference", lookupRef)
      .single();

    if (!session) {
      logger.error({ detail: lookupRef }, "Aspfiy webhook: no session for reference");
      await admin.from("webhook_events").insert({
        gateway: "aspfiy",
        event_type: "charge.success",
        payload: body,
        reference: eventRef,
        processed: false,
      });
      return NextResponse.json({ received: true });
    }

    if (session.status === "success") {
      return NextResponse.json({ received: true, message: "Already processed" });
    }

    const amountKobo = Math.round((amount || 0) * 100);
    const fundRef = generateReference("FUND");

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
          gateway_reference: eventRef,
          sender_name: senderName,
          account_number: accountNumber,
          amount_naira: amount,
        },
      }
    );

    if (walletError) {
      logger.error({ error: walletError instanceof Error ? walletError.message : "Unknown" }, "Aspfiy webhook: wallet credit failed");
      return NextResponse.json({ error: "Credit failed" }, { status: 500 });
    }

    await admin.from("transactions").update({ status: "success" }).eq("id", txnId);
    await admin.from("payment_sessions").update({ status: "success" }).eq("id", session.id);

    notifyWalletFunded(admin, session.user_id, {
      amount: amountKobo,
      channel: "bank_transfer",
    });

    await admin.from("webhook_events").insert({
      gateway: "aspfiy",
      event_type: "charge.success",
      payload: body,
      reference: eventRef,
      processed: true,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Aspfiy webhook error");
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
