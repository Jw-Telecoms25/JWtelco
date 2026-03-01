import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const serviceId = searchParams.get("serviceId");

    let query = admin
      .from("pricing")
      .select("*, services(name, slug)")
      .order("network")
      .order("user_price", { ascending: true });

    if (serviceId) query = query.eq("service_id", serviceId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch pricing" }, { status: 500 });
    }

    return NextResponse.json({ pricing: data });
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

    if (profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can modify pricing" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Pricing ID required" }, { status: 400 });
    }

    const allowed = [
      "plan_name", "user_price", "agent_price", "vendor_price",
      "cost_price", "enabled", "validity",
    ];
    const safeUpdates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) safeUpdates[key] = updates[key];
    }

    const { error } = await admin
      .from("pricing")
      .update(safeUpdates)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
    }

    await admin.from("audit_log").insert({
      admin_id: user.id,
      action: "update_pricing",
      target_type: "pricing",
      target_id: id,
      details: safeUpdates,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    if (profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can create pricing" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { service_id, plan_name, plan_code, network, user_price, agent_price, vendor_price, cost_price, validity } = body;

    if (!service_id || !plan_name || !plan_code || user_price == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("pricing")
      .insert({
        service_id,
        plan_name,
        plan_code,
        network,
        user_price,
        agent_price: agent_price ?? user_price,
        vendor_price: vendor_price ?? user_price,
        cost_price: cost_price ?? user_price,
        validity,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create pricing" }, { status: 500 });
    }

    await admin.from("audit_log").insert({
      admin_id: user.id,
      action: "create_pricing",
      target_type: "pricing",
      target_id: data.id,
      details: body,
    });

    return NextResponse.json({ success: true, pricing: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
