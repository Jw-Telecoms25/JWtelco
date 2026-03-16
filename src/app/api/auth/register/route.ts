import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processReferralCode } from "@/lib/services/referrals";
import { checkRateLimit } from "@/lib/middleware/rate-limit";

const NIGERIAN_PHONE_REGEX = /^0[7-9][01]\d{8}$/;

interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  referralCode?: string;
}

function validateInput(body: RegisterBody): string | null {
  if (!body.firstName?.trim()) return "First name is required";
  if (!body.lastName?.trim()) return "Last name is required";

  if (!body.email?.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return "Invalid email format";
  }

  if (!body.phone?.trim()) return "Phone number is required";
  const sanitizedPhone = body.phone.replace(/\s/g, "");
  if (!NIGERIAN_PHONE_REGEX.test(sanitizedPhone)) {
    return "Invalid Nigerian phone number format";
  }

  if (!body.password) return "Password is required";
  if (body.password.length < 8) {
    return "Password must be at least 8 characters";
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP — prefer x-real-ip (set by Vercel edge, not spoofable)
    const ip = request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ||
      "unknown";
    const rl = await checkRateLimit(`register:${ip}`, 5);
    if (!rl.success) return rl.response!;

    const body = (await request.json()) as RegisterBody;

    const validationError = validateInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: body.email.trim().toLowerCase(),
      password: body.password,
      options: {
        data: {
          first_name: body.firstName.trim(),
          last_name: body.lastName.trim(),
          phone: body.phone.replace(/\s/g, ""),
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (body.referralCode?.trim() && data.user) {
      const admin = createAdminClient();
      await processReferralCode(admin, data.user.id, body.referralCode.trim());
    }

    // Return minimal response; never expose internal auth metadata
    return NextResponse.json({
      message: data.session ? "Registration successful" : "Check your email to confirm your account",
      userId: data.user?.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
