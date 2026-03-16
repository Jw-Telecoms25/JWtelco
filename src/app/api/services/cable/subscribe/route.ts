import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeWithFallback } from "@/lib/providers/router";
import { generateReference } from "@/lib/utils/reference";
import { isValidSmartcardNumber } from "@/lib/utils/validators";
import { assertActiveUser, assertPinToken, AccountBlockedError } from "@/lib/utils/guards";
import { executePurchase, getRolePrice } from "@/lib/services/purchase-executor";
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

    const rl = await checkRateLimit(`purchase:${user.id}`);
    if (!rl.success) return rl.response!;

    const admin = createAdminClient();
    await assertActiveUser(user.id, admin);

    const pinCheck = await assertPinToken(request, user.id, admin);
    if (pinCheck) return pinCheck;

    const body = await request.json();
    const { smartcardNumber, provider: cableProvider, planCode } = body;

    if (!smartcardNumber || !isValidSmartcardNumber(smartcardNumber)) {
      return NextResponse.json({ error: "Invalid smartcard number" }, { status: 400 });
    }
    if (!cableProvider || !["dstv", "gotv", "startimes"].includes(cableProvider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }
    if (!planCode) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Filter by service to prevent plan_code collisions
    const { data: plan } = await admin
      .from("pricing")
      .select("*, services!inner(slug)")
      .eq("plan_code", planCode)
      .eq("enabled", true)
      .eq("services.slug", "cable")
      .single();

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const price = getRolePrice(plan, profile?.role || "user");
    const reference = generateReference("CABLE");
    const idempotencyKey = request.headers.get("x-idempotency-key") || undefined;

    const { response } = await executePurchase({
      admin,
      userId: user.id,
      price,
      costPrice: plan.cost_price,
      type: "cable",
      description: `${cableProvider.toUpperCase()} ${plan.plan_name} - Card: ${smartcardNumber}`,
      reference,
      metadata: { smartcardNumber, provider: cableProvider, planCode, plan_name: plan.plan_name },
      idempotencyKey,
      execute: () =>
        executeWithFallback(
          "cable",
          cableProvider,
          (provider) => provider.subscribeCable({ smartcardNumber, provider: cableProvider, planCode, reference }),
          reference
        ),
    });

    return response;
  } catch (err) {
    if (err instanceof AccountBlockedError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Cable subscription error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
