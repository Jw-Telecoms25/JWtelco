import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/middleware/rate-limit";

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

    const { data, error } = await admin
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    return NextResponse.json({ notifications: data });
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

    const body = await request.json();
    const { subject, message, target, userId } = body;

    if (!subject || !message || !target) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["all", "user", "agents", "admins"].includes(target)) {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    if (target === "user" && !userId) {
      return NextResponse.json({ error: "User ID required for user target" }, { status: 400 });
    }

    // Strip HTML tags and enforce length limits — prevent stored XSS via notification content
    const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "").trim();
    const safeSubject = stripHtml(String(subject)).slice(0, 200);
    const safeMessage = stripHtml(String(message)).slice(0, 2000);

    if (!safeSubject || !safeMessage) {
      return NextResponse.json({ error: "Subject and message must not be empty after sanitization" }, { status: 400 });
    }

    const { error } = await admin.from("notifications").insert({
      subject: safeSubject,
      message: safeMessage,
      target,
      user_id: target === "user" ? userId : null,
    });

    if (error) {
      return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
    }

    await admin.from("audit_log").insert({
      admin_id: user.id,
      action: "send_notification",
      target_type: "notification",
      target_id: target === "user" ? userId : target,
      details: { subject, target },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
