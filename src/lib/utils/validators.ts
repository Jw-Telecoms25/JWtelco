export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  // Nigerian phone: 080x, 081x, 070x, 090x, 091x — 11 digits
  return /^0[789][01]\d{8}$/.test(cleaned);
}

export function isValidMeterNumber(meter: string): boolean {
  const cleaned = meter.replace(/\D/g, "");
  return cleaned.length >= 11 && cleaned.length <= 13;
}

export function isValidSmartcardNumber(card: string): boolean {
  const cleaned = card.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 12;
}

export function isValidAmount(amount: number, min = 50, max = 50000): boolean {
  return amount >= min && amount <= max;
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}
