import { randomBytes } from "crypto";
import type { ProviderResponse, VerifyResponse } from "./types";

const FETCH_TIMEOUT_MS = 30_000;

const NETWORK_MAP: Record<string, number> = {
  mtn: 1,
  glo: 2,
  "9mobile": 3,
  airtel: 4,
};

// Maskawasub MeterType: 1 = PREPAID, 2 = POSTPAID
const METER_TYPE_MAP: Record<string, number> = {
  prepaid: 1,
  postpaid: 2,
};

interface ResellerConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
}

function generateRequestId(): string {
  return randomBytes(12).toString("hex");
}

async function resellerFetch<T>(
  config: ResellerConfig,
  path: string,
  options: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${config.baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Token ${config.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    let data: T;
    try {
      data = await res.json();
    } catch {
      throw new Error(`${config.name} returned non-JSON response (HTTP ${res.status})`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseResellerResponse(providerName: string, data: any, reference: string): ProviderResponse {
  const status = data?.Status || data?.status || data?.api_response;
  const isSuccess = status === "successful" || status === "success" || status === true;
  const isPending = status === "processing" || status === "pending" || status === "initiated";

  if (isPending) {
    return {
      success: false,
      reference,
      message: `${providerName}: Transaction pending`,
      data: { ...data, isPending: true, provider: providerName },
    };
  }

  return {
    success: isSuccess,
    reference,
    message: isSuccess
      ? data?.api_response_message || data?.message || "Transaction successful"
      : data?.api_response_message || data?.message || data?.response_description || "Transaction failed",
    data: { ...data, provider: providerName },
  };
}

export function createResellerProvider(config: ResellerConfig) {
  return {
    name: config.name,

    async buyAirtime(params: {
      phone: string;
      network: string;
      amount: number;
      reference: string;
    }): Promise<ProviderResponse> {
      const networkId = NETWORK_MAP[params.network];
      if (!networkId) {
        return { success: false, reference: params.reference, message: `Unknown network: ${params.network}`, data: {} };
      }

      const data = await resellerFetch(config, "/topup/", {
        method: "POST",
        body: JSON.stringify({
          network: networkId,
          amount: params.amount,
          mobile_number: params.phone,
          Ported_number: true,
          airtime_type: "VTU",
          request_id: generateRequestId(),
        }),
      });

      return parseResellerResponse(config.name, data, params.reference);
    },

    async buyData(params: {
      phone: string;
      network: string;
      planCode: string;
      reference: string;
    }): Promise<ProviderResponse> {
      const networkId = NETWORK_MAP[params.network];
      if (!networkId) {
        return { success: false, reference: params.reference, message: `Unknown network: ${params.network}`, data: {} };
      }

      const data = await resellerFetch(config, "/data/", {
        method: "POST",
        body: JSON.stringify({
          network: networkId,
          mobile_number: params.phone,
          plan: params.planCode,
          Ported_number: true,
          request_id: generateRequestId(),
        }),
      });

      return parseResellerResponse(config.name, data, params.reference);
    },

    async verifyMeter(params: {
      meterNumber: string;
      disco: string;
      meterType: "prepaid" | "postpaid";
    }): Promise<VerifyResponse> {
      const mtype = METER_TYPE_MAP[params.meterType];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await resellerFetch<any>(
        config,
        `/validatemeter?meternumber=${params.meterNumber}&disconame=${params.disco}&mtype=${mtype}`,
        { method: "GET" }
      );

      const name = data?.Customer_Name || data?.name || data?.customer_name || "";
      return {
        success: !!name,
        customer_name: name,
        customer_address: data?.Address || data?.address || "",
        meter_number: params.meterNumber,
      };
    },

    async buyElectricity(params: {
      meterNumber: string;
      disco: string;
      meterType: "prepaid" | "postpaid";
      amount: number; // kobo
      reference: string;
    }): Promise<ProviderResponse> {
      const amountNaira = params.amount / 100;

      const data = await resellerFetch(config, "/billpayment/", {
        method: "POST",
        body: JSON.stringify({
          disco_name: params.disco,
          amount: amountNaira,
          meter_number: params.meterNumber,
          MeterType: METER_TYPE_MAP[params.meterType],
          request_id: generateRequestId(),
        }),
      });

      return parseResellerResponse(config.name, data, params.reference);
    },

    async verifySmartcard(params: {
      smartcardNumber: string;
      provider: string;
    }): Promise<VerifyResponse> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await resellerFetch<any>(
        config,
        `/validateiuc?smart_card_number=${params.smartcardNumber}&cablename=${params.provider}`,
        { method: "GET" }
      );

      const name = data?.Customer_Name || data?.name || data?.customer_name || "";
      return {
        success: !!name,
        customer_name: name,
        smartcard_number: params.smartcardNumber,
      };
    },

    async subscribeCable(params: {
      smartcardNumber: string;
      provider: string;
      planCode: string;
      reference: string;
    }): Promise<ProviderResponse> {
      const data = await resellerFetch(config, "/cablesub/", {
        method: "POST",
        body: JSON.stringify({
          cablename: params.provider,
          cableplan: params.planCode,
          smart_card_number: params.smartcardNumber,
          request_id: generateRequestId(),
        }),
      });

      return parseResellerResponse(config.name, data, params.reference);
    },

    async buyExamPin(params: {
      examType: string;
      quantity: number;
      reference: string;
    }): Promise<ProviderResponse> {
      const data = await resellerFetch(config, "/epins/", {
        method: "POST",
        body: JSON.stringify({
          exam_type: params.examType,
          quantity: params.quantity,
          request_id: generateRequestId(),
        }),
      });

      return parseResellerResponse(config.name, data, params.reference);
    },

    async checkBalance(): Promise<{ balance: number }> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await resellerFetch<any>(config, "/user/", { method: "GET" });
      return { balance: parseFloat(data?.wallet_balance || data?.user?.wallet_balance || "0") };
    },

    async queryTransaction(txnId: string): Promise<ProviderResponse> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await resellerFetch<any>(config, `/data/${txnId}`, { method: "GET" });
      return parseResellerResponse(config.name, data, txnId);
    },
  };
}

export const maskawasubProvider = createResellerProvider({
  name: "Maskawasub",
  baseUrl: process.env.MASKAWASUB_BASE_URL || "https://www.maskawasub.com/api",
  apiKey: process.env.MASKAWASUB_API_KEY || "",
});

export const gladtidingsProvider = createResellerProvider({
  name: "Gladtidings",
  baseUrl: process.env.GLADTIDINGS_BASE_URL || "https://www.gladtidingsapihub.com/api",
  apiKey: process.env.GLADTIDINGS_API_KEY || "",
});

export const alrahuzProvider = createResellerProvider({
  name: "Alrahuz",
  baseUrl: process.env.ALRAHUZ_BASE_URL || "https://www.alrahuzdata.com/api",
  apiKey: process.env.ALRAHUZ_API_KEY || "",
});

export type ResellerProvider = ReturnType<typeof createResellerProvider>;
