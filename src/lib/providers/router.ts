import { maskawasubProvider, gladtidingsProvider, alrahuzProvider } from "./vtu-reseller";
import type { ResellerProvider } from "./vtu-reseller";
import { vtpassProvider } from "./vtpass";
import type { ProviderResponse } from "./types";
import { logger } from "@/lib/utils/logger";

type ServiceType = "airtime" | "data" | "electricity" | "cable" | "exam_pin";

interface ProviderRoute {
  provider: ResellerProvider;
  networks?: string[];
}

// ── Airtime: Maskawasub primary → VTPass fallback ────────────

const AIRTIME_ROUTES: ProviderRoute[] = [
  { provider: maskawasubProvider },
];

// ── Data: network-specific primary → VTPass fallback ─────────

const DATA_ROUTES: ProviderRoute[] = [
  { provider: gladtidingsProvider, networks: ["mtn"] },
  { provider: alrahuzProvider, networks: ["airtel", "glo", "9mobile"] },
];

// ── Electricity/Cable/Exam: VTPass primary → Maskawasub fallback

// VTPass as a reseller-shaped wrapper for the router
const vtpassAsReseller: ResellerProvider = vtpassProvider as unknown as ResellerProvider;

function getPrimary(serviceType: ServiceType, network: string): ResellerProvider {
  switch (serviceType) {
    case "airtime":
      return AIRTIME_ROUTES[0].provider;
    case "data": {
      const route = DATA_ROUTES.find((r) => !r.networks || r.networks.includes(network));
      return route?.provider || vtpassAsReseller;
    }
    case "electricity":
    case "cable":
    case "exam_pin":
      return vtpassAsReseller;
  }
}

function getFallback(serviceType: ServiceType): ResellerProvider {
  switch (serviceType) {
    case "airtime":
    case "data":
      return vtpassAsReseller;
    case "electricity":
    case "cable":
    case "exam_pin":
      return maskawasubProvider;
  }
}

export async function executeWithFallback(
  serviceType: ServiceType,
  network: string,
  execute: (provider: ResellerProvider) => Promise<ProviderResponse>,
  reference: string
): Promise<ProviderResponse & { provider_used: string }> {
  const primary = getPrimary(serviceType, network);
  const fallback = getFallback(serviceType);

  try {
    const result = await execute(primary);
    if (result.success || result.data?.isPending) {
      return { ...result, provider_used: primary.name };
    }

    if (primary.name !== fallback.name) {
      logger.warn({ primary: primary.name, fallback: fallback.name, reference }, "Primary provider failed, trying fallback");
      const fallbackResult = await execute(fallback);
      return { ...fallbackResult, provider_used: fallback.name };
    }

    return { ...result, provider_used: primary.name };
  } catch (err) {
    logger.error({ primary: primary.name, reference, error: err instanceof Error ? err.message : "Unknown" }, "Primary provider threw");

    if (primary.name !== fallback.name) {
      try {
        const fallbackResult = await execute(fallback);
        return { ...fallbackResult, provider_used: fallback.name };
      } catch (fallbackErr) {
        logger.error({ fallback: fallback.name, reference, error: fallbackErr instanceof Error ? fallbackErr.message : "Unknown" }, "Fallback provider also threw");
      }
    }

    return {
      success: false,
      reference,
      message: `All providers failed for ${serviceType}`,
      data: { error: err instanceof Error ? err.message : "Unknown error" },
      provider_used: primary.name,
    };
  }
}
