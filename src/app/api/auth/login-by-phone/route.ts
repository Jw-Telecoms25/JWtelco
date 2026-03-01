import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const NIGERIAN_PHONE_REGEX = /^0[7-9][01]\d{8}$/;
const FIXED_DELAY_MS = 300;

export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    const body = await request.json();
    const rawPhone = typeof body.phone === "string" ? body.phone : "";
    const sanitizedPhone = rawPhone.replace(/[^\d]/g, "");

    let email: string | null = null;

    if (NIGERIAN_PHONE_REGEX.test(sanitizedPhone)) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("profiles")
        .select("email")
        .eq("phone", sanitizedPhone)
        .limit(1)
        .maybeSingle();

      email = data?.email || null;
    }

    const elapsed = Date.now() - start;
    if (elapsed < FIXED_DELAY_MS) {
      await new Promise(r => setTimeout(r, FIXED_DELAY_MS - elapsed));
    }

    return NextResponse.json({ email });
  } catch {
    const elapsed = Date.now() - start;
    if (elapsed < FIXED_DELAY_MS) {
      await new Promise(r => setTimeout(r, FIXED_DELAY_MS - elapsed));
    }

    return NextResponse.json({ email: null });
  }
}
