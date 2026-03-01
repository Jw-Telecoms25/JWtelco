export async function verifySmartcard(params: {
  smartcardNumber: string;
  provider: string;
}) {
  const res = await fetch("/api/services/cable/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Smartcard verification failed");
  }

  return res.json();
}

export async function subscribeCable(params: {
  smartcardNumber: string;
  provider: string;
  planCode: string;
}) {
  const res = await fetch("/api/services/cable/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Cable subscription failed");
  }

  return res.json();
}
