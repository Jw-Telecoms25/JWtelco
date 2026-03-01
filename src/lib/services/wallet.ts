export async function fundWallet(amount: number) {
  const res = await fetch("/api/wallet/fund", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }), // amount in kobo
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fund wallet");
  }

  return res.json();
}

export async function getWalletBalance() {
  const res = await fetch("/api/wallet/balance");

  if (!res.ok) {
    throw new Error("Failed to fetch balance");
  }

  return res.json();
}
