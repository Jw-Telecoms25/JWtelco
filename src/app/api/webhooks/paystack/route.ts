import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/providers/paystack";
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const { reference, amount, customer } = event.data;
  const admin = createAdminClient();

  const { data: session } = await admin
    .from("payment_sessions")
    .select("*")
    .eq("gateway_reference", reference)
    .single();

  if (!session) {
    logger.error({ detail: reference }, "Paystack webhook: no session for reference");
    return NextResponse.json({ received: true });
  }

  if (session.status === "success") {
    return NextResponse.json({ received: true, message: "Already processed" });
  }

  if (session.amount !== amount) {
    logger.error({ detail: { expected: session.amount, got: amount } }, "Paystack webhook: amount mismatch");
    await admin
      .from("payment_sessions")
      .update({ status: "failed" })
      .eq("id", session.id);
    return NextResponse.json({ received: true });
  }

  const userId = session.user_id;

  // Deterministic reference to prevent double-credit
  const fundRef = `FUND-PSK-${reference}`;

  const { data: txnId, error: walletError } = await admin.rpc(
    "process_wallet_transaction",
    {
      p_user_id: userId,
      p_amount: amount,
      p_type: "funding",
      p_description: `Wallet funding via Paystack`,
      p_reference: fundRef,
      p_metadata: {
        gateway: "paystack",
        gateway_reference: reference,
        channel: event.data.channel,
        customer_email: customer?.email,
      },
    }
  );

  if (walletError) {
    // Supabase errors are PostgrestError objects, not Error instances
    if (walletError.message?.includes("duplicate")) {
      return NextResponse.json({ received: true, message: "Already processed" });
    }
    logger.error({ error: walletError.message }, "Paystack webhook: wallet credit failed");
    return NextResponse.json({ error: "Credit failed" }, { status: 500 });
  }

  await admin
    .from("transactions")
    .update({ status: "success" })
    .eq("id", txnId);

  await admin
    .from("payment_sessions")
    .update({ status: "success" })
    .eq("id", session.id);

  // Audit trail
  await admin.from("webhook_events").insert({
    gateway: "paystack",
    event_type: event.event,
    event_id: reference,
    payload: event.data,
    signature_valid: true,
    processed: true,
    processed_at: new Date().toISOString(),
  });

  return NextResponse.json({ received: true });
}
