export async function getAdminStats() {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function getCustomers(page = 0, limit = 20, search?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  const res = await fetch(`/api/admin/customers?${params}`);
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json();
}

export async function getAdminTransactions(page = 0, limit = 20, filters?: Record<string, string>) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters) Object.entries(filters).forEach(([k, v]) => params.set(k, v));
  const res = await fetch(`/api/admin/transactions?${params}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function updateService(serviceId: string, data: Record<string, unknown>) {
  const res = await fetch("/api/admin/services", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: serviceId, ...data }),
  });
  if (!res.ok) throw new Error("Failed to update service");
  return res.json();
}

export async function updatePricing(pricingId: string, data: Record<string, unknown>) {
  const res = await fetch("/api/admin/pricing", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: pricingId, ...data }),
  });
  if (!res.ok) throw new Error("Failed to update pricing");
  return res.json();
}

export async function sendNotification(data: {
  subject: string;
  message: string;
  target: string;
  userId?: string;
}) {
  const res = await fetch("/api/admin/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to send notification");
  return res.json();
}
