import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

async function getRedirectForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fallback: string
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fallback;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile && ["admin", "super_admin"].includes(profile.role)) {
    return "/admin";
  }
  return fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "recovery"
    | "email"
    | "magiclink"
    | null;
  // Validate next to prevent open redirect — must be a relative internal path
  const rawNext = searchParams.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.includes("://") ? rawNext : "/dashboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/reset-password", origin));
      }
      const dest = await getRedirectForUser(supabase, next);
      return NextResponse.redirect(new URL(dest, origin));
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/reset-password", origin));
      }
      const dest = await getRedirectForUser(supabase, next);
      return NextResponse.redirect(new URL(dest, origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=invalid_link", origin)
  );
}
