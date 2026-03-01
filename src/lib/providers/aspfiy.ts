const BASE_URL = "https://api.aspfiy.com";
const SECRET_KEY = process.env.ASPFIY_SECRET_KEY || "";
const FETCH_TIMEOUT_MS = 15_000;

interface AspfiyResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T;
}

interface ReservedAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode?: string;
  reference: string;
}

async function aspfiyFetch<T>(path: string, options: RequestInit): Promise<AspfiyResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
      throw new Error(data.message || `Aspfiy HTTP ${res.status}`);
    }
    return data as AspfiyResponse<T>;
  } finally {
    clearTimeout(timeout);
  }
}

export async function reserveAccount(params: {
  email: string;
  reference: string;
  firstName: string;
  lastName: string;
  phone: string;
  webhookUrl: string;
}): Promise<AspfiyResponse<ReservedAccount>> {
  return aspfiyFetch<ReservedAccount>("/reserve-paga/", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function reserveDynamicAccount(params: {
  reference: string;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  amount: number;
}): Promise<AspfiyResponse<ReservedAccount>> {
  return aspfiyFetch<ReservedAccount>("/reserve-dynamic-account/", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
