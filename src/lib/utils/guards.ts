import { SupabaseClient } from "@supabase/supabase-js";

export class AccountBlockedError extends Error {
  constructor(message = "Your account is not active") {
    super(message);
    this.name = "AccountBlockedError";
  }
}

export class InsufficientRoleError extends Error {
  constructor(message = "You do not have permission to perform this action") {
    super(message);
    this.name = "InsufficientRoleError";
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

/**
 * Asserts that the user has one of the allowed roles.
 * Returns the user's role for further checks if needed.
 */
export async function requireRole(
  userId: string,
  admin: SupabaseClient,
  allowedRoles: string[]
): Promise<string> {
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!data || !allowedRoles.includes(data.role)) {
    throw new InsufficientRoleError();
  }

  return data.role;
}
