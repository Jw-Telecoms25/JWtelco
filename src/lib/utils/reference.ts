import { randomBytes } from "crypto";

export function generateReference(type: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(6).toString("hex").toUpperCase();
  return `JWT-${type.toUpperCase()}-${timestamp}-${random}`;
}
