import { createHmac, timingSafeEqual } from "crypto";

export function verifyPinToken(rawToken: string, userId: string): boolean {
  const dot = rawToken.lastIndexOf(".");
  if (dot === -1) return false;

  const sig = rawToken.slice(0, dot);
  const expiresStr = rawToken.slice(dot + 1);
  const expires = parseInt(expiresStr, 10);

  if (isNaN(expires) || Math.floor(Date.now() / 1000) > expires) return false;

  const secret = process.env.PIN_TOKEN_SECRET;
  if (!secret) throw new Error("PIN_TOKEN_SECRET environment variable is not set");
  const expected = createHmac("sha256", secret)
    .update(`${userId}:${expires}`)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
