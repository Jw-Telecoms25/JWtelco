import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";
import { notifyWalletFunded } from "@/lib/notifications/dispatcher";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    // Verify webhook signature
    const aspfiySecret = process.env.ASPFIY_WEBHOOK_SECRET;
    if (aspfiySecret) {
      const incomingSecret =
        request.headers.get("x-aspfiy-secret") ||
        request.headers.get("authorization")?.replace("Bearer ", "");

      if (incomingSecret !== aspfiySecret) {
        logger.warn({}, "Aspfiy webhook: invalid or missing signature");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      logger.warn({}, "Aspfiy webhook: ASPFIY_WEBHOOK_SECRET not configured — accepting all requests");
    }

    const signatureValid = !!aspfiySecret;

    const {
      reference,
      amount,
      status,
      accountNumber,
      senderName,
      sessionId,
    } = body;

    const eventRef = sessionId || reference || `aspfiy-${Date.now()}`;

    if (status !== "successful" && status !== "success") {
      await admin.from("webhook_events").insert({
        gateway: "aspfiy",
        event_type: status || "unknown",
        event_id: eventRef,
        payload: body,
        signature_valid: signatureValid,
        processed: false,
      });
      return NextResponse.json({ received: true });
    }

    const { data: existing } = await admin
      .from("webhook_events")
      .select("id")
      .eq("gateway", "aspfiy")
      .eq("event_id", eventRef)
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
        event_id: eventRef,
        payload: body,
        signature_valid: signatureValid,
        processed: false,
      });
      return NextResponse.json({ received: true });
    }

    if (session.status === "success") {
      return NextResponse.json({ received: true, message: "Already processed" });
    }

    const amountKobo = Math.round((amount || 0) * 100);

    // Deterministic reference to prevent double-credit
    const fundRef = `FUND-ASPFIY-${eventRef}`;

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
      // Supabase errors are PostgrestError objects, not Error instances
      if (walletError.message?.includes("duplicate")) {
        return NextResponse.json({ received: true, message: "Already processed" });
      }
      logger.error({ error: walletError.message }, "Aspfiy webhook: wallet credit failed");
      return NextResponse.json({ error: "Credit failed" }, { status: 500 });
    }

    await admin.from("transactions").update({ status: "success" }).eq("id", txnId);
    await admin.from("payment_sessions").update({ status: "success" }).eq("id", session.id);

    notifyWalletFunded(admin, session.user_id, {
      amount: amountKobo,
      channel: "bank_transfer",
    });

    // Audit trail
    await admin.from("webhook_events").insert({
      gateway: "aspfiy",
      event_type: "charge.success",
      event_id: eventRef,
      payload: body,
      signature_valid: signatureValid,
      processed: true,
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Aspfiy webhook error");
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
