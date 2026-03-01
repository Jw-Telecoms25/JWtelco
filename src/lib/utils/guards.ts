import { SupabaseClient } from "@supabase/supabase-js";

export class AccountBlockedError extends Error {
  constructor(message = "Your account is not active") {
    super(message);
    this.name = "AccountBlockedError";
  }
}

export async function assertActiveUser(userId: string, admin: SupabaseClient) {
  const { data } = await admin
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .single();

  if (!data || data.status !== "active") {
    throw new AccountBlockedError();
  }
}
