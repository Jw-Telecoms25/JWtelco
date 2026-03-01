export async function buyData(params: {
  phone: string;
  network: string;
  planCode: string;
}) {
  const res = await fetch("/api/services/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Data purchase failed");
  }

  return res.json();
}
