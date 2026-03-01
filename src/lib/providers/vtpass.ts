import { randomBytes } from "crypto";
import type { VTUProvider, ProviderResponse, VerifyResponse } from "./types";

const BASE_URL = process.env.VTPASS_BASE_URL || "https://sandbox.vtpass.com/api";
const API_KEY = process.env.VTPASS_API_KEY || "";
const SECRET_KEY = process.env.VTPASS_SECRET_KEY || "";
const PUBLIC_KEY = process.env.VTPASS_PUBLIC_KEY || "";
const FETCH_TIMEOUT_MS = 30_000;

function postHeaders(): Record<string, string> {
  return {
    "api-key": API_KEY,
    "secret-key": SECRET_KEY,
    "Content-Type": "application/json",
  };
}

function getHeaders(): Record<string, string> {
  return {
    "api-key": API_KEY,
    "public-key": PUBLIC_KEY,
  };
}

function generateRequestId(prefix: string): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
  const rand = randomBytes(4).toString("hex");
  return `${prefix}${ts}${rand}`;
}

async function vtpassFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`VTPass HTTP ${res.status}: ${res.statusText}`);
    }
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseJSON(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    throw new Error("VTPass returned non-JSON response");
  }
}

/**
 * Map our internal DISCO IDs to VTPass serviceIDs.
 * Most match 1:1 except port-harcourt-electric → portharcourt-electric.
 */
const DISCO_MAP: Record<string, string> = {
  "ikeja-electric": "ikeja-electric",
  "eko-electric": "eko-electric",
  "abuja-electric": "abuja-electric",
  "kano-electric": "kano-electric",
  "port-harcourt-electric": "portharcourt-electric",
  "portharcourt-electric": "portharcourt-electric",
  "ibadan-electric": "ibadan-electric",
  "kaduna-electric": "kaduna-electric",
  "jos-electric": "jos-electric",
  "enugu-electric": "enugu-electric",
  "benin-electric": "benin-electric",
  "yola-electric": "yola-electric",
  "aba-electric": "aba-electric",
};

function mapDisco(disco: string): string {
  return DISCO_MAP[disco] || disco;
}

export const vtpassProvider: VTUProvider = {
  name: "vtpass",

  // ── Electricity ──────────────────────────────────────────────

  async verifyMeter({ meterNumber, disco, meterType }): Promise<VerifyResponse> {
    const serviceID = mapDisco(disco);
    const res = await vtpassFetch(`${BASE_URL}/merchant-verify`, {
      method: "POST",
      headers: postHeaders(),
      body: JSON.stringify({
        billersCode: meterNumber,
        serviceID,
        type: meterType,
      }),
    });

    const data = await parseJSON(res);

    if (data.code !== "000" || data.content?.WrongBillersCode) {
      return {
        success: false,
        customer_name: "",
        meter_number: meterNumber,
      };
    }

    return {
      success: true,
      customer_name: data.content?.Customer_Name || "",
      customer_address: data.content?.Address || "",
      meter_number: meterNumber,
    };
  },

  async buyElectricity({ meterNumber, disco, meterType, amount, reference }): Promise<ProviderResponse> {
    const serviceID = mapDisco(disco);
    const requestId = generateRequestId("ELEC");
    const amountNaira = amount / 100; // convert kobo → naira for VTPass

    const res = await vtpassFetch(`${BASE_URL}/pay`, {
      method: "POST",
      headers: postHeaders(),
      body: JSON.stringify({
        request_id: requestId,
        serviceID,
        billersCode: meterNumber,
        variation_code: meterType,
        amount: amountNaira,
        phone: "08000000000",
      }),
    });

    const data = await parseJSON(res);
    const txStatus = data.content?.transactions?.status;

    if (data.code !== "000" || txStatus === "failed") {
      return {
        success: false,
        reference,
        message: data.response_description || "Electricity purchase failed",
        data: { vtpass_request_id: requestId, raw: data },
      };
    }

    // Handle pending/delivered
    if (txStatus === "delivered") {
      return {
        success: true,
        reference,
        message: "Electricity token generated successfully",
        data: {
          token: data.token || data.purchased_code || "",
          units: data.units || "",
          vtpass_request_id: requestId,
          vtpass_transaction_id: data.content?.transactions?.transactionId,
          exchange_reference: data.exchangeReference || "",
        },
      };
    }

    return {
      success: false,
      reference,
      message: "Transaction pending",
      data: { vtpass_request_id: requestId, status: "pending", raw: data, isPending: true },
    };
  },

  // ── Cable TV ─────────────────────────────────────────────────

  async verifySmartcard({ smartcardNumber, provider }): Promise<VerifyResponse> {
    const res = await vtpassFetch(`${BASE_URL}/merchant-verify`, {
      method: "POST",
      headers: postHeaders(),
      body: JSON.stringify({
        billersCode: smartcardNumber,
        serviceID: provider,
      }),
    });

    const data = await parseJSON(res);

    if (data.code !== "000") {
      return {
        success: false,
        customer_name: "",
        smartcard_number: smartcardNumber,
      };
    }

    return {
      success: true,
      customer_name: data.content?.Customer_Name || "",
      smartcard_number: smartcardNumber,
    };
  },

  async subscribeCable({ smartcardNumber, provider, planCode, reference }): Promise<ProviderResponse> {
    // First, look up the variation amount from VTPass
    const variationsRes = await vtpassFetch(
      `${BASE_URL}/service-variations?serviceID=${provider}`,
      { method: "GET", headers: getHeaders() }
    );
    const variationsData = await parseJSON(variationsRes);
    const variation = variationsData.content?.variations?.find(
      (v: { variation_code: string }) => v.variation_code === planCode
    );

    const amount = variation?.variation_amount || 0;
    const requestId = generateRequestId("CABLE");

    const res = await vtpassFetch(`${BASE_URL}/pay`, {
      method: "POST",
      headers: postHeaders(),
      body: JSON.stringify({
        request_id: requestId,
        serviceID: provider,
        billersCode: smartcardNumber,
        variation_code: planCode,
        amount,
        phone: "08000000000",
        subscription_type: "change",
        quantity: 1,
      }),
    });

    const data = await parseJSON(res);
    const txStatus = data.content?.transactions?.status;

    if (data.code !== "000" || txStatus === "failed") {
      return {
        success: false,
        reference,
        message: data.response_description || "Cable subscription failed",
        data: { vtpass_request_id: requestId, raw: data },
      };
    }

    if (txStatus === "delivered") {
      return {
        success: true,
        reference,
        message: `${provider.toUpperCase()} subscription successful`,
        data: {
          vtpass_request_id: requestId,
          vtpass_transaction_id: data.content?.transactions?.transactionId,
        },
      };
    }

    return {
      success: false,
      reference,
      message: "Transaction pending",
      data: { vtpass_request_id: requestId, status: "pending", raw: data, isPending: true },
    };
  },

  // ── Airtime (fallback for sub-resellers) ────────────────────

  async buyAirtime({ phone, network, amount, reference }): Promise<ProviderResponse> {
    const networkMap: Record<string, string> = {
      mtn: "mtn", airtel: "airtel", glo: "glo", "9mobile": "etisalat",
    };
    const serviceID = networkMap[network];
    if (!serviceID) {
      return { success: false, reference, message: `Unknown network: ${network}` };
    }

    const requestId = generateRequestId("AIR");
    const amountNaira = amount / 100;

    const res = await vtpassFetch(`${BASE_URL}/pay`, {
      method: "POST",
      headers: postHeaders(),
      body: JSON.stringify({
        request_id: requestId,
        serviceID,
        amount: amountNaira,
        phone,
      }),
    });

    const data = await parseJSON(res);
    const txStatus = data.content?.transactions?.status;

    if (data.code !== "000" || txStatus === "failed") {
      return {
        success: false, reference,
        message: data.response_description || "Airtime purchase failed",
        data: { vtpass_request_id: requestId, raw: data },
      };
    }

    if (txStatus === "delivered") {
      return {
        success: true, reference,
        message: "Airtime sent successfully",
        data: { vtpass_request_id: requestId, vtpass_transaction_id: data.content?.transactions?.transactionId },
      };
    }

    return {
      success: false, reference,
      message: "Transaction pending",
      data: { vtpass_request_id: requestId, isPending: true, raw: data },
    };
  },

  // ── Data (fallback for sub-resellers) ──────────────────────

  async buyData({ phone, network, planCode, reference }): Promise<ProviderResponse> {
    const networkMap: Record<string, string> = {
      mtn: "mtn-data", airtel: "airtel-data", glo: "glo-data", "9mobile": "etisalat-data",
    };
    const serviceID = networkMap[network];
    if (!serviceID) {
      return { success: false, reference, message: `Unknown network: ${network}` };
    }

    const requestId = generateRequestId("DATA");

    const res = await vtpassFetch(`${BASE_URL}/pay`, {
      method: "POST",
      headers: postHeaders(),
      body: JSON.stringify({
        request_id: requestId,
        serviceID,
        billersCode: phone,
        variation_code: planCode,
        phone,
      }),
    });

    const data = await parseJSON(res);
    const txStatus = data.content?.transactions?.status;

    if (data.code !== "000" || txStatus === "failed") {
      return {
        success: false, reference,
        message: data.response_description || "Data purchase failed",
        data: { vtpass_request_id: requestId, raw: data },
      };
    }

    if (txStatus === "delivered") {
      return {
        success: true, reference,
        message: "Data plan activated successfully",
        data: { vtpass_request_id: requestId, vtpass_transaction_id: data.content?.transactions?.transactionId },
      };
    }

    return {
      success: false, reference,
      message: "Transaction pending",
      data: { vtpass_request_id: requestId, isPending: true, raw: data },
    };
  },

  // ── Exam Pins ──────────────────────────────────────────────

  async buyExamPin({ examType, quantity, reference }): Promise<ProviderResponse> {
    const serviceMap: Record<string, string> = {
      waec: "waec", neco: "neco",
    };
    const serviceID = serviceMap[examType];
    if (!serviceID) {
      return { success: false, reference, message: `Unsupported exam type: ${examType}` };
    }

    const requestId = generateRequestId("EXAM");

    const res = await vtpassFetch(`${BASE_URL}/pay`, {
      method: "POST",
      headers: postHeaders(),
      body: JSON.stringify({
        request_id: requestId,
        serviceID,
        variation_code: `${serviceID}-resultchecker`,
        quantity,
        phone: "08000000000",
      }),
    });

    const data = await parseJSON(res);
    const txStatus = data.content?.transactions?.status;

    if (data.code !== "000" || txStatus === "failed") {
      return {
        success: false, reference,
        message: data.response_description || "Exam pin purchase failed",
        data: { vtpass_request_id: requestId, raw: data },
      };
    }

    if (txStatus === "delivered") {
      const pins = data.cards?.map((card: { Pin: string; Serial: string }) => ({
        pin: card.Pin,
        serial: card.Serial,
      })) || [];

      return {
        success: true, reference,
        message: `${quantity} ${examType.toUpperCase()} pin(s) generated`,
        data: { pins, examType, vtpass_request_id: requestId },
      };
    }

    return {
      success: false, reference,
      message: "Transaction pending",
      data: { vtpass_request_id: requestId, isPending: true, raw: data },
    };
  },
};
