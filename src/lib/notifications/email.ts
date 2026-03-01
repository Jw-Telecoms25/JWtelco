import { Resend } from "resend";
import { logger } from "@/lib/utils/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "JWTelecoms <onboarding@resend.dev>";

function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
  <div style="background:#0A1128;padding:24px 32px">
    <h1 style="margin:0;color:#00E5A0;font-size:18px;font-weight:700">⚡ JWTelecoms</h1>
  </div>
  <div style="padding:32px">
    <h2 style="margin:0 0 16px;color:#0A1128;font-size:20px">${title}</h2>
    ${body}
  </div>
  <div style="padding:16px 32px;background:#f9fafb;text-align:center">
    <p style="margin:0;color:#9ca3af;font-size:12px">JWTelecoms — Recharge Instantly. Save More.</p>
  </div>
</div>
</body>
</html>`;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      logger.error({ error: error.message, to, subject }, "Email send failed");
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown", to }, "Email send exception");
    return false;
  }
}

export async function sendPurchaseSuccess(
  to: string,
  details: { name: string; type: string; description: string; amount: number; reference: string; token?: string }
): Promise<boolean> {
  const tokenRow = details.token
    ? `<tr><td style="padding:8px 0;color:#6b7280">Token/PIN</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#0A1128;font-family:monospace">${details.token}</td></tr>`
    : "";

  const body = `
    <p style="color:#374151;line-height:1.6">Hi ${details.name},</p>
    <p style="color:#374151;line-height:1.6">Your purchase was successful! Here are the details:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;color:#6b7280">Service</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#0A1128">${details.type}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Details</td><td style="padding:8px 0;text-align:right;color:#0A1128">${details.description}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Amount</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#0A1128">${formatNaira(details.amount)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Reference</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-size:13px;color:#0A1128">${details.reference}</td></tr>
      ${tokenRow}
    </table>
    <div style="background:#ecfdf5;border-radius:8px;padding:12px 16px;margin:16px 0">
      <p style="margin:0;color:#065f46;font-weight:600">✅ Transaction Successful</p>
    </div>`;

  return sendEmail(to, `Purchase Successful — ${details.description}`, baseTemplate("Purchase Successful", body));
}

export async function sendPurchaseRefunded(
  to: string,
  details: { name: string; type: string; description: string; amount: number; reference: string }
): Promise<boolean> {
  const body = `
    <p style="color:#374151;line-height:1.6">Hi ${details.name},</p>
    <p style="color:#374151;line-height:1.6">Your purchase could not be completed. Your wallet has been refunded automatically.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;color:#6b7280">Service</td><td style="padding:8px 0;text-align:right;color:#0A1128">${details.type}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Details</td><td style="padding:8px 0;text-align:right;color:#0A1128">${details.description}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Refunded</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#0A1128">${formatNaira(details.amount)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Reference</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-size:13px;color:#0A1128">${details.reference}</td></tr>
    </table>
    <div style="background:#fef2f2;border-radius:8px;padding:12px 16px;margin:16px 0">
      <p style="margin:0;color:#991b1b;font-weight:600">❌ Purchase Failed — Wallet Refunded</p>
    </div>`;

  return sendEmail(to, `Purchase Failed — Refund Processed`, baseTemplate("Purchase Refunded", body));
}

export async function sendWalletFunded(
  to: string,
  details: { name: string; amount: number; channel: string }
): Promise<boolean> {
  const body = `
    <p style="color:#374151;line-height:1.6">Hi ${details.name},</p>
    <p style="color:#374151;line-height:1.6">Your wallet has been funded successfully.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 0;color:#6b7280">Amount</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#0A1128;font-size:18px">${formatNaira(details.amount)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Channel</td><td style="padding:8px 0;text-align:right;color:#0A1128">${details.channel}</td></tr>
    </table>
    <div style="background:#ecfdf5;border-radius:8px;padding:12px 16px;margin:16px 0">
      <p style="margin:0;color:#065f46;font-weight:600">✅ Wallet Funded</p>
    </div>`;

  return sendEmail(to, `Wallet Funded — ${formatNaira(details.amount)}`, baseTemplate("Wallet Funded", body));
}
