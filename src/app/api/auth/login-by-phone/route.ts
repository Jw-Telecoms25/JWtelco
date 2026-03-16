import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/middleware/rate-limit";

const NIGERIAN_PHONE_REGEX = /^0[7-9][01]\d{8}$/;
const FIXED_DELAY_MS = 300;

/**
 * Phone login endpoint — performs full auth server-side.
 * Never exposes the email address mapping to prevent user enumeration.
 * Accepts: { phone, password }
 * Returns: { success, role } or error
 */
export async function POST(request: NextRequest) {
  const start = Date.now();

  const enforceDelay = async () => {
    const elapsed = Date.now() - start;
    if (elapsed < FIXED_DELAY_MS) {
      await new Promise(r => setTimeout(r, FIXED_DELAY_MS - elapsed));
    }
  };

  try {
    // Rate limit by IP — prefer x-real-ip (set by Vercel edge, not spoofable)
    const ip = request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
      "unknown";
    const rl = await checkRateLimit(`login-phone:${ip}`, 5);
    if (!rl.success) {
      await enforceDelay();
      return rl.response!;
    }

    const body = await request.json();
    const rawPhone = typeof body.phone === "string" ? body.phone : "";
    const password = typeof body.password === "string" ? body.password : "";
    const sanitizedPhone = rawPhone.replace(/[^\d]/g, "");

    if (!NIGERIAN_PHONE_REGEX.test(sanitizedPhone) || !password) {
      await enforceDelay();
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const { data: profileData } = await adminClient
      .from("profiles")
      .select("email")
      .eq("phone", sanitizedPhone)
      .limit(1)
      .maybeSingle();

    // Use a dummy email if not found to maintain constant-time response
    const email = profileData?.email || "notfound@jwtelecoms.invalid";

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    await enforceDelay();

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 });
    }

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    return NextResponse.json({ success: true, role: profile?.role ?? "user" });
  } catch {
    await enforceDelay();
    return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 });
  }
}
