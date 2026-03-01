import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";

const VALID_TYPES = ["airtime", "data", "electricity", "cable", "exam_pin"];

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
    const { data, error } = await admin
      .from("beneficiaries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error({ error: error.message }, "Fetch beneficiaries error");
      return NextResponse.json({ error: "Failed to fetch beneficiaries" }, { status: 500 });
    }

    return NextResponse.json({ beneficiaries: data });
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

    const body = await request.json();
    const { label, serviceType, identifier, network, metadata } = body;

    if (!label || typeof label !== "string" || label.length > 50) {
      return NextResponse.json({ error: "Label is required (max 50 chars)" }, { status: 400 });
    }
    if (!serviceType || !VALID_TYPES.includes(serviceType)) {
      return NextResponse.json({ error: "Invalid service type" }, { status: 400 });
    }
    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json({ error: "Identifier is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check limit — max 50 beneficiaries per user
    const { count } = await admin
      .from("beneficiaries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= 50) {
      return NextResponse.json({ error: "Maximum 50 beneficiaries allowed" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("beneficiaries")
      .insert({
        user_id: user.id,
        label: label.trim(),
        service_type: serviceType,
        identifier: identifier.trim(),
        network: network?.trim() || null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This beneficiary already exists" }, { status: 409 });
      }
      logger.error({ error: error.message }, "Create beneficiary error");
      return NextResponse.json({ error: "Failed to create beneficiary" }, { status: 500 });
    }

    return NextResponse.json({ beneficiary: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Beneficiary ID required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("beneficiaries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      logger.error({ error: error.message }, "Delete beneficiary error");
      return NextResponse.json({ error: "Failed to delete beneficiary" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
