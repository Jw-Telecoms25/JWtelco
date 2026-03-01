import { createClient } from "@/lib/supabase/client";

export async function registerUser(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        first_name: params.firstName,
        last_name: params.lastName,
        phone: params.phone,
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

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
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
