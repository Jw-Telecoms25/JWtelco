import { createClient } from "@/lib/supabase/client";

export async function registerUser(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  referralCode?: string;
}) {
  const supabase = createClient();

  const origin = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "https://jwtelecoms.com.ng";

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        first_name: params.firstName,
        last_name: params.lastName,
        phone: params.phone,
        referred_by_code: params.referralCode || undefined,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function loginUser(params: {
  email: string;
  password: string;
}) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (error) throw error;
  return data;
}

export async function resetPassword(email: string) {
  const supabase = createClient();

  // Safe check for SSR; window may not exist
  const origin = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "https://jwtelecoms.com.ng";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?type=recovery`,
  });

  if (error) throw error;
}

/**
 * Login by phone — auth happens server-side, email is never exposed.
 * Returns the user's role on success (for redirect), throws on failure.
 */
export async function loginByPhone(params: { phone: string; password: string }): Promise<{ role: string }> {
  const res = await fetch("/api/auth/login-by-phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: params.phone, password: params.password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Invalid phone number or password");
  return { role: data.role };
}
