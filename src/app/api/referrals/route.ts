import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Get user's referral code
    const { data: profile } = await admin
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    // Count referred users
    const { count: totalReferred } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", user.id);

    // Total bonus earned
    const { data: bonuses } = await admin
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "referral_bonus")
      .eq("status", "success");

    const totalBonusKobo = (bonuses || []).reduce((sum, b) => sum + b.amount, 0);

    return NextResponse.json({
      referralCode: profile?.referral_code || "",
      totalReferred: totalReferred || 0,
      totalBonusKobo,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
