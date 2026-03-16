import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Helper: get role for an authenticated user
  async function getUserRole(): Promise<string | null> {
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    return data?.role ?? null;
  }

  // Redirect logged-in users away from auth pages
  if (user && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    const role = await getUserRole();
    const url = request.nextUrl.clone();
    url.pathname = role && ["admin", "super_admin"].includes(role) ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Redirect admin users landing on the customer dashboard
  if (user && pathname === "/dashboard") {
    const role = await getUserRole();
    if (role && ["admin", "super_admin"].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // Protect customer-only routes
  const protectedPrefixes = [
    "/dashboard",
    "/wallet",
    "/transactions",
    "/buy",
    "/profile",
    "/notifications",
    "/beneficiaries",
  ];
  if (!user && protectedPrefixes.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const role = await getUserRole();
    if (!role || !["admin", "super_admin"].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
