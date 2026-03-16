import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(`admin:${user.id}`, 30);
    if (!rl.success) return rl.response!;

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [usersRes, walletsRes, txnCountRes, txnSumRes, revenueRes] =
      await Promise.all([
        admin
          .from("profiles")
          .select("id", { count: "exact", head: true }),
        admin
          .from("wallets")
          .select("balance")
          .eq("type", "main"),
        admin
          .from("transactions")
          .select("id", { count: "exact", head: true }),
        admin
          .from("transactions")
          .select("amount")
          .eq("status", "success")
          .neq("type", "funding")
          .neq("type", "reversal"),
        admin
          .from("transactions")
          .select("profit")
          .eq("status", "success"),
      ]);

    const totalUsers = usersRes.count || 0;
    const totalWalletBalance = (walletsRes.data || []).reduce(
      (sum, w) => sum + (w.balance || 0),
      0
    );
    const totalTransactions = txnCountRes.count || 0;
    const totalSalesVolume = (txnSumRes.data || []).reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const totalRevenue = (revenueRes.data || []).reduce(
      (sum, t) => sum + (t.profit || 0),
      0
    );

    return NextResponse.json({
      totalUsers,
      totalWalletBalance,
      totalTransactions,
      totalSalesVolume,
      totalRevenue,
    });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Admin stats error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
