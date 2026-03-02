import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/providers/paystack";
import { logger } from "@/lib/utils/logger";
import { notifyWalletFunded } from "@/lib/notifications/dispatcher";

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference");
    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: session } = await admin
      .from("payment_sessions")
      .select("*")
      .eq("gateway_reference", reference)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (session.status === "success") {
      return NextResponse.json({ status: "success", message: "Wallet funded successfully" });
    }

    const paystack = await verifyTransaction(reference);

    if (paystack.data.status !== "success") {
      return NextResponse.json({
        status: paystack.data.status,
        message: paystack.data.status === "abandoned" ? "Payment was cancelled" : "Payment not completed",
      });
    }

    if (paystack.data.amount !== session.amount) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Deterministic reference to prevent double-credit on concurrent calls
    const fundRef = `FUND-PSK-${reference}`;
    const { data: txnId, error: walletError } = await admin.rpc(
      "process_wallet_transaction",
      {
        p_user_id: user.id,
        p_amount: session.amount,
        p_type: "funding",
        p_description: `Wallet funding via Paystack`,
        p_reference: fundRef,
        p_metadata: {
          gateway: "paystack",
          gateway_reference: reference,
          channel: paystack.data.channel,
        },
      }
    );

    if (walletError) {
      // Supabase errors are PostgrestError objects, not Error instances
      if (walletError.message?.includes("duplicate")) {
        return NextResponse.json({ status: "success", message: "Wallet funded successfully" });
      }
      logger.error({ error: walletError.message }, "Fund verify: wallet credit failed");
      return NextResponse.json({ error: "Failed to credit wallet" }, { status: 500 });
    }

    await admin.from("transactions").update({ status: "success" }).eq("id", txnId);
    await admin.from("payment_sessions").update({ status: "success" }).eq("id", session.id);

    notifyWalletFunded(admin, user.id, {
      amount: session.amount,
      channel: paystack.data.channel || "card",
    });

    return NextResponse.json({ status: "success", message: "Wallet funded successfully" });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Fund verify error");
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
