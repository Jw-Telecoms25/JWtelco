import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeWithFallback } from "@/lib/providers/router";
import { generateReference } from "@/lib/utils/reference";
import { isValidPhone } from "@/lib/utils/validators";
import { assertActiveUser, AccountBlockedError } from "@/lib/utils/guards";
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

    const body = await request.json();
    const { phone, network, planCode } = body;

    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    if (!network || !["mtn", "airtel", "glo", "9mobile"].includes(network)) {
      return NextResponse.json({ error: "Invalid network" }, { status: 400 });
    }
    if (!planCode || typeof planCode !== "string") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const { data: plan } = await admin
      .from("pricing")
      .select("*, services!inner(slug)")
      .eq("plan_code", planCode)
      .eq("enabled", true)
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
    const reference = generateReference("DATA");
    const idempotencyKey = request.headers.get("x-idempotency-key") || undefined;

    const { response } = await executePurchase({
      admin,
      userId: user.id,
      price,
      costPrice: plan.cost_price,
      type: "data",
      description: `${plan.plan_name} to ${phone}`,
      reference,
      metadata: { phone, network, planCode, plan_name: plan.plan_name },
      idempotencyKey,
      execute: () =>
        executeWithFallback(
          "data",
          network,
          (provider) => provider.buyData({ phone, network, planCode, reference }),
          reference
        ),
    });

    return response;
  } catch (err) {
    if (err instanceof AccountBlockedError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Data purchase error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
