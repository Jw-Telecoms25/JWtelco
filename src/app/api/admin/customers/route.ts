import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const search = searchParams.get("search") || "";

    let query = admin
      .from("profiles")
      .select("*, wallets(balance, type)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (search) {
      const sanitized = search.replace(/[%_\\]/g, "\\$&");
      query = query.or(
        `first_name.ilike.%${sanitized}%,last_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`
      );
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error({ error: error instanceof Error ? error.message : "Unknown" }, "Fetch customers error");
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }

    return NextResponse.json({ customers: data, total: count });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action, amount, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (action === "block" || action === "activate" || action === "suspend") {
      const { error } = await admin
        .from("profiles")
        .update({ status: action === "block" ? "blocked" : action === "suspend" ? "suspended" : "active" })
        .eq("id", userId);

      if (error) {
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
      }

      // Audit log
      await admin.from("audit_log").insert({
        admin_id: user.id,
        action: `${action}_user`,
        target_type: "user",
        target_id: userId,
        details: { reason: reason || "" },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "credit" || action === "debit") {
      if (profile.role !== "super_admin") {
        return NextResponse.json(
          { error: "Only super admins can credit/debit wallets" },
          { status: 403 }
        );
      }

      if (!amount || typeof amount !== "number" || amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }

      const type = action === "credit" ? "funding" : "transfer";
      const { generateReference } = await import("@/lib/utils/reference");
      const reference = generateReference(action === "credit" ? "ADM-CR" : "ADM-DB");

      const { error } = await admin.rpc("process_wallet_transaction", {
        p_user_id: userId,
        p_amount: amount,
        p_type: type,
        p_description: `Admin ${action}: ${reason || "No reason provided"}`,
        p_reference: reference,
        p_metadata: { admin_id: user.id, action, reason },
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Mark as success
      await admin
        .from("transactions")
        .update({ status: "success" })
        .eq("reference", reference);

      // Audit log
      await admin.from("audit_log").insert({
        admin_id: user.id,
        action: `${action}_wallet`,
        target_type: "wallet",
        target_id: userId,
        details: { amount, reason, reference },
      });

      return NextResponse.json({ success: true, reference });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Admin customer action error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
