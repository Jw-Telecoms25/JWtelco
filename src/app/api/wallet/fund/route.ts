import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateReference } from "@/lib/utils/reference";
import { initializeTransaction } from "@/lib/providers/paystack";
import { assertActiveUser, AccountBlockedError } from "@/lib/utils/guards";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`fund:${user.id}`);
    if (!rl.success) return rl.response!;

    const admin = createAdminClient();
    await assertActiveUser(user.id, admin);

    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== "number" || amount < 10000 || amount > 100_000_000) {
      return NextResponse.json(
        { error: "Amount must be between ₦100 and ₦1,000,000" },
        { status: 400 }
      );
    }

    const reference = generateReference("FUND");
    const origin = request.headers.get("origin") || request.nextUrl.origin;
    const callback_url = `${origin}/wallet?reference=${reference}`;

    const paystack = await initializeTransaction({
      email: user.email!,
      amount,
      reference,
      callback_url,
      metadata: { user_id: user.id, source: "wallet_funding" },
    });

    await admin.from("payment_sessions").insert({
      user_id: user.id,
      gateway: "paystack",
      gateway_reference: reference,
      amount,
      status: "pending",
      authorization_url: paystack.data.authorization_url,
    });

    return NextResponse.json({
      authorization_url: paystack.data.authorization_url,
      access_code: paystack.data.access_code,
      reference,
    });
  } catch (err) {
    if (err instanceof AccountBlockedError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    // Never leak internal error messages to client
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Fund initialization error");
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
