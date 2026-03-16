import { maskawasubProvider, gladtidingsProvider, alrahuzProvider } from "./vtu-reseller";
import type { ResellerProvider } from "./vtu-reseller";
import { vtpassProvider } from "./vtpass";
import type { ProviderResponse } from "./types";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/utils/logger";

async function checkProviderHealthy(providerName: string, serviceType: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("provider_health")
      .select("is_healthy")
      .eq("provider_name", providerName)
      .eq("service_type", serviceType)
      .single();
    return data?.is_healthy !== false; // Default healthy if no record
  } catch {
    return true; // Default healthy on error
  }
}

async function recordProviderResult(providerName: string, serviceType: string, success: boolean): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.rpc("update_provider_health", {
      p_provider: providerName,
      p_service_type: serviceType,
      p_success: success,
    });
  } catch {
    // Non-critical — don't fail the purchase
  }
}

type ServiceType = "airtime" | "data" | "electricity" | "cable" | "exam_pin";

interface ProviderRoute {
  provider: ResellerProvider;
  networks?: string[];
}

const AIRTIME_ROUTES: ProviderRoute[] = [
  { provider: maskawasubProvider },
];

const DATA_ROUTES: ProviderRoute[] = [
  { provider: gladtidingsProvider, networks: ["mtn"] },
  { provider: alrahuzProvider, networks: ["airtel", "glo", "9mobile"] },
];

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

  const primaryHealthy = await checkProviderHealthy(primary.name, serviceType);
  if (!primaryHealthy && primary.name !== fallback.name) {
    logger.warn({ primary: primary.name, fallback: fallback.name, reference }, "Circuit breaker: primary unhealthy, routing to fallback");
    try {
      const fallbackResult = await execute(fallback);
      await recordProviderResult(fallback.name, serviceType, fallbackResult.success || !!fallbackResult.data?.isPending);
      return { ...fallbackResult, provider_used: fallback.name };
    } catch (err) {
      await recordProviderResult(fallback.name, serviceType, false);
      return {
        success: false,
        reference,
        message: `All providers failed for ${serviceType}`,
        data: { error: err instanceof Error ? err.message : "Unknown error" },
        provider_used: fallback.name,
      };
    }
  }

  try {
    const result = await execute(primary);
    const ok = result.success || !!result.data?.isPending;
    await recordProviderResult(primary.name, serviceType, ok);

    if (ok) {
      return { ...result, provider_used: primary.name };
    }

    if (primary.name !== fallback.name) {
      logger.warn({ primary: primary.name, fallback: fallback.name, reference }, "Primary provider failed, trying fallback");
      const fallbackResult = await execute(fallback);
      await recordProviderResult(fallback.name, serviceType, fallbackResult.success || !!fallbackResult.data?.isPending);
      return { ...fallbackResult, provider_used: fallback.name };
    }

    return { ...result, provider_used: primary.name };
  } catch (err) {
    await recordProviderResult(primary.name, serviceType, false);
    logger.error({ primary: primary.name, reference, error: err instanceof Error ? err.message : "Unknown" }, "Primary provider threw");

    if (primary.name !== fallback.name) {
      try {
        const fallbackResult = await execute(fallback);
        await recordProviderResult(fallback.name, serviceType, fallbackResult.success || !!fallbackResult.data?.isPending);
        return { ...fallbackResult, provider_used: fallback.name };
      } catch (fallbackErr) {
        await recordProviderResult(fallback.name, serviceType, false);
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
