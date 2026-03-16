import { NextRequest, NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { verifyPinToken } from "./pin-token";

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
 * Guard: if user has a transaction PIN set, require a valid pin token header.
 * Header: x-pin-token: <hmac_hex>.<unix_expires>
 * Returns null if OK, or a NextResponse to return immediately if the check fails.
 */
export async function assertPinToken(
  request: NextRequest,
  userId: string,
  admin: SupabaseClient
): Promise<NextResponse | null> {
  const { data: profile } = await admin
    .from("profiles")
    .select("pin_set_at")
    .eq("id", userId)
    .single();

  // No PIN set → allow purchase (user hasn't opted into PIN protection yet)
  if (!profile?.pin_set_at) return null;

  const rawToken = request.headers.get("x-pin-token");
  if (!rawToken) {
    return NextResponse.json(
      { error: "Transaction PIN required", code: "PIN_REQUIRED" },
      { status: 403 }
    );
  }

  if (!verifyPinToken(rawToken, userId)) {
    return NextResponse.json(
      { error: "Invalid or expired PIN token", code: "PIN_INVALID" },
      { status: 403 }
    );
  }

  return null;
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
