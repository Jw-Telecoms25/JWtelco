export async function verifyMeter(params: {
  meterNumber: string;
  disco: string;
  meterType: "prepaid" | "postpaid";
}) {
  const res = await fetch("/api/services/electricity/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Meter verification failed");
  }

  return res.json();
}

export async function buyElectricity(params: {
  meterNumber: string;
  disco: string;
  meterType: "prepaid" | "postpaid";
  amount: number; // kobo
}) {
  const res = await fetch("/api/services/electricity/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Electricity purchase failed");
  }

  return res.json();
}
