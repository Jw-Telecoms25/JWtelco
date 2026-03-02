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

export async function lookupEmailByPhone(phone: string): Promise<string | null> {
  const res = await fetch("/api/auth/login-by-phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.email ?? null;
}
