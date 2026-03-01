export async function buyAirtime(params: {
  phone: string;
  network: string;
  amount: number; // kobo
}) {
  const res = await fetch("/api/services/airtime", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Airtime purchase failed");
  }

  return res.json();
}
