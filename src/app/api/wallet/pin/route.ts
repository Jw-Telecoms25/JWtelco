import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/utils/logger";
import { createHash, createHmac } from "crypto";

// PIN hashed as SHA-256(userId:pin) — userId acts as salt, no bcrypt needed for numeric PINs
function hashPin(pin: string, userId: string): string {
  return createHash("sha256").update(`${userId}:${pin}`).digest("hex");
}

function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

/**
 * GET /api/wallet/pin — check if user has set a PIN
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("pin_set_at")
      .eq("id", user.id)
      .single();

    return NextResponse.json({ hasPin: !!profile?.pin_set_at });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "PIN check error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/wallet/pin — set or change transaction PIN
 * Body: { pin: string, currentPin?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await checkRateLimit(`pin-set:${user.id}`, 5);
    if (!rl.success) return rl.response!;

    const body = await request.json();
    const { pin, currentPin } = body;

    if (!isValidPin(String(pin))) {
      return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("pin_set_at")
      .eq("id", user.id)
      .single();

    // If changing an existing PIN, verify current PIN — hash never leaves DB
    if (profile?.pin_set_at) {
      if (!currentPin) {
        return NextResponse.json({ error: "Current PIN required to change PIN" }, { status: 400 });
      }
      const currentHash = hashPin(String(currentPin), user.id);
      const { data: result } = await admin.rpc("check_and_verify_pin", {
        p_user_id: user.id,
        p_pin_hash: currentHash,
      });
      const status = (result as { status: string } | null)?.status;
      if (status === "locked") {
        return NextResponse.json({ error: "PIN is temporarily locked. Try again later." }, { status: 429 });
      }
      if (status !== "ok") {
        const remaining = (result as { attempts_remaining?: number } | null)?.attempts_remaining ?? 0;
        return NextResponse.json(
          { error: "Current PIN is incorrect", attemptsRemaining: remaining },
          { status: 401 }
        );
      }
    }

    const newHash = hashPin(String(pin), user.id);
    await admin.rpc("set_transaction_pin", {
      p_user_id: user.id,
      p_pin_hash: newHash,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "PIN set error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/wallet/pin — verify PIN before a purchase
 * Body: { pin: string }
 * Returns a short-lived token (60s) purchase routes must validate via x-pin-token header.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await checkRateLimit(`pin-verify:${user.id}`, 10);
    if (!rl.success) return rl.response!;

    const body = await request.json();
    const { pin } = body;

    if (!isValidPin(String(pin))) {
      return NextResponse.json({ error: "Invalid PIN format" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("pin_set_at")
      .eq("id", user.id)
      .single();

    if (!profile?.pin_set_at) {
      return NextResponse.json({ error: "No PIN set. Please set a transaction PIN first." }, { status: 400 });
    }

    // Atomic verify + lockout via DB function — stored hash never reaches JS layer
    const inputHash = hashPin(String(pin), user.id);
    const { data: result, error: rpcError } = await admin.rpc("check_and_verify_pin", {
      p_user_id: user.id,
      p_pin_hash: inputHash,
    });

    if (rpcError) {
      logger.error({ error: rpcError.message }, "PIN verify RPC error");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const status = (result as { status: string } | null)?.status;

    if (status === "locked") {
      const lockedUntil = (result as { locked_until?: string } | null)?.locked_until;
      return NextResponse.json(
        { error: "PIN locked due to too many failed attempts. Try again in 30 minutes.", lockedUntil },
        { status: 429 }
      );
    }

    if (status !== "ok") {
      const remaining = (result as { attempts_remaining?: number } | null)?.attempts_remaining ?? 0;
      return NextResponse.json(
        { error: "Incorrect PIN", attemptsRemaining: remaining },
        { status: 401 }
      );
    }

    const expires = Math.floor(Date.now() / 1000) + 60;
    const secret = process.env.PIN_TOKEN_SECRET || "fallback-pin-secret";
    const token = createHmac("sha256", secret)
      .update(`${user.id}:${expires}`)
      .digest("hex");

    return NextResponse.json({ token, expires, pinToken: `${token}.${expires}` });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "PIN verify error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
