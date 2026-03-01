import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processReferralCode } from "@/lib/services/referrals";

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

    // Process referral code if provided
    if (body.referralCode?.trim() && data.user) {
      const admin = createAdminClient();
      await processReferralCode(admin, data.user.id, body.referralCode.trim());
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
