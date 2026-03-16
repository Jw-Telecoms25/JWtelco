import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/middleware/rate-limit";
import { logger } from "@/lib/utils/logger";
import { createHash, createHmac } from "crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

function isLegacyHash(hash: string): boolean {
  return !hash.startsWith("$2") && /^[0-9a-f]{64}$/.test(hash);
}

function legacyHash(pin: string, userId: string): string {
  return createHash("sha256").update(`${userId}:${pin}`).digest("hex");
}

function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

type PinRpcResult = { status: string; attempts_remaining?: number; locked_until?: string } | null;

function handleLockedOrIncorrect(result: PinRpcResult): NextResponse | null {
  const status = result?.status;
  if (status === "locked") {
    return NextResponse.json(
      { error: "PIN locked due to too many failed attempts. Try again in 30 minutes.", lockedUntil: result?.locked_until },
      { status: 429 }
    );
  }
  if (status !== "ok") {
    return NextResponse.json(
      { error: "Incorrect PIN", attemptsRemaining: result?.attempts_remaining ?? 0 },
      { status: 401 }
    );
  }
  return null;
}

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
      .select("pin_set_at, transaction_pin_hash")
      .eq("id", user.id)
      .single();

    if (profile?.pin_set_at) {
      if (!currentPin) {
        return NextResponse.json({ error: "Current PIN required to change PIN" }, { status: 400 });
      }

      const storedHash = profile.transaction_pin_hash as string | null;

      if (storedHash && !isLegacyHash(storedHash)) {
        const correct = await bcrypt.compare(String(currentPin), storedHash);
        const { data: result } = await admin.rpc("record_pin_attempt", { p_user_id: user.id, p_success: correct });
        const errRes = handleLockedOrIncorrect(result as PinRpcResult);
        if (errRes) return errRes;
      } else {
        const { data: result } = await admin.rpc("check_and_verify_pin", {
          p_user_id: user.id,
          p_pin_hash: legacyHash(String(currentPin), user.id),
        });
        const errRes = handleLockedOrIncorrect(result as PinRpcResult);
        if (errRes) return errRes;
      }
    }

    const newHash = await bcrypt.hash(String(pin), BCRYPT_ROUNDS);
    await admin.rpc("set_transaction_pin", { p_user_id: user.id, p_pin_hash: newHash });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "PIN set error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      .select("pin_set_at, transaction_pin_hash, pin_locked_until")
      .eq("id", user.id)
      .single();

    if (!profile?.pin_set_at) {
      return NextResponse.json({ error: "No PIN set. Please set a transaction PIN first." }, { status: 400 });
    }

    if (profile.pin_locked_until && new Date(profile.pin_locked_until) > new Date()) {
      return NextResponse.json(
        { error: "PIN locked due to too many failed attempts. Try again in 30 minutes.", lockedUntil: profile.pin_locked_until },
        { status: 429 }
      );
    }

    const storedHash = profile.transaction_pin_hash as string | null;
    if (!storedHash) {
      return NextResponse.json({ error: "No PIN set. Please set a transaction PIN first." }, { status: 400 });
    }

    let rpcResult: PinRpcResult;

    if (!isLegacyHash(storedHash)) {
      const correct = await bcrypt.compare(String(pin), storedHash);
      const { data: result } = await admin.rpc("record_pin_attempt", { p_user_id: user.id, p_success: correct });
      rpcResult = result as PinRpcResult;
    } else {
      const { data: result, error: rpcError } = await admin.rpc("check_and_verify_pin", {
        p_user_id: user.id,
        p_pin_hash: legacyHash(String(pin), user.id),
      });
      if (rpcError) {
        logger.error({ error: rpcError.message }, "PIN verify RPC error");
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
      rpcResult = result as PinRpcResult;
    }

    const errRes = handleLockedOrIncorrect(rpcResult);
    if (errRes) return errRes;

    if (isLegacyHash(storedHash)) {
      try {
        const upgradedHash = await bcrypt.hash(String(pin), BCRYPT_ROUNDS);
        await admin.rpc("set_transaction_pin", { p_user_id: user.id, p_pin_hash: upgradedHash });
      } catch (err) {
        logger.warn({ error: err instanceof Error ? err.message : "Unknown" }, "PIN hash upgrade failed");
      }
    }

    const secret = process.env.PIN_TOKEN_SECRET;
    if (!secret) throw new Error("PIN_TOKEN_SECRET environment variable is not set");

    const expires = Math.floor(Date.now() / 1000) + 60;
    const token = createHmac("sha256", secret).update(`${user.id}:${expires}`).digest("hex");

    return NextResponse.json({ token, expires, pinToken: `${token}.${expires}` });
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "PIN verify error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
