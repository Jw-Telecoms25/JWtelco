import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeWithFallback } from "@/lib/providers/router";
import { generateReference } from "@/lib/utils/reference";
import { assertActiveUser, AccountBlockedError } from "@/lib/utils/guards";
import { getRolePrice } from "@/lib/services/purchase-executor";
import { checkRateLimit } from "@/lib/middleware/rate-limit";

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

    const body = await request.json();
    const { examType, quantity = 1 } = body;

    if (!examType || !["waec", "neco", "nabteb"].includes(examType)) {
      return NextResponse.json({ error: "Invalid exam type" }, { status: 400 });
    }
    if (quantity < 1 || quantity > 5) {
      return NextResponse.json({ error: "Quantity must be 1-5" }, { status: 400 });
    }

    const { data: plans } = await admin
      .from("pricing")
      .select("*")
      .eq("network", examType)
      .eq("enabled", true);

    if (!plans || plans.length === 0) {
      return NextResponse.json({ error: "Exam pin not available" }, { status: 404 });
    }

    const plan = plans[0];

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const unitPrice = getRolePrice(plan, profile?.role || "user");
    const totalPrice = unitPrice * quantity;
    const reference = generateReference("EXAM");

    const { data: txnId, error: walletError } = await admin.rpc(
      "process_wallet_transaction",
      {
        p_user_id: user.id,
        p_amount: totalPrice,
        p_type: "exam_pin",
        p_description: `${examType.toUpperCase()} ${plan.plan_name} x${quantity}`,
        p_reference: reference,
        p_metadata: { examType, quantity, plan_name: plan.plan_name },
      }
    );

    if (walletError) {
      const msg = walletError.message.includes("Insufficient")
        ? "Insufficient wallet balance"
        : "Failed to process payment";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const result = await executeWithFallback(
      "exam_pin",
      examType,
      (provider) => provider.buyExamPin({ examType, quantity, reference }),
      reference
    );

    const isPending = result.data?.isPending === true;
    const profit = result.success ? totalPrice - plan.cost_price * quantity : 0;

    await admin
      .from("transactions")
      .update({
        status: result.success ? "success" : isPending ? "processing" : "failed",
        profit,
        metadata: { examType, quantity, provider_used: result.provider_used, providerResponse: result },
      })
      .eq("id", txnId);

    if (!result.success && !isPending) {
      const reversalRef = generateReference("REV");
      await admin.rpc("process_wallet_transaction", {
        p_user_id: user.id,
        p_amount: totalPrice,
        p_type: "reversal",
        p_description: `Reversal for failed exam pin: ${reference}`,
        p_reference: reversalRef,
        p_metadata: { original_reference: reference, reason: "provider_failure" },
      });
      await admin.from("transactions").update({ status: "success" }).eq("reference", reversalRef);

      return NextResponse.json(
        { error: "Exam pin purchase failed. Your wallet has been refunded." },
        { status: 502 }
      );
    }

    if (isPending) {
      return NextResponse.json({
        success: true,
        message: "Transaction is being processed",
        reference,
        transactionId: txnId,
        status: "processing",
      });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      reference,
      transactionId: txnId,
      pins: result.data?.pins,
    });
  } catch (err) {
    if (err instanceof AccountBlockedError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("Exam pin purchase error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
