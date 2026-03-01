import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Log a provider API call with timing and context.
 */
export function logProviderCall(params: {
  provider: string;
  service: string;
  reference: string;
  userId?: string;
  durationMs: number;
  status: "success" | "failed" | "pending";
  error?: string;
}) {
  const { provider, service, reference, userId, durationMs, status, error } = params;
  const log = { provider, service, reference, userId, durationMs, status, error };

  if (status === "failed") {
    logger.error(log, `Provider call failed: ${provider}/${service}`);
  } else if (status === "pending") {
    logger.warn(log, `Provider call pending: ${provider}/${service}`);
  } else {
    logger.info(log, `Provider call success: ${provider}/${service}`);
  }
}

/**
 * Log a webhook event.
 */
export function logWebhook(params: {
  gateway: string;
  eventType: string;
  eventId: string;
  processed: boolean;
  error?: string;
}) {
  const { gateway, eventType, eventId, processed, error } = params;
  if (error) {
    logger.error({ gateway, eventType, eventId, processed, error }, `Webhook error: ${gateway}`);
  } else {
    logger.info({ gateway, eventType, eventId, processed }, `Webhook processed: ${gateway}`);
  }
}

/**
 * Log a purchase flow event.
 */
export function logPurchase(params: {
  userId: string;
  type: string;
  reference: string;
  amount: number;
  status: "success" | "processing" | "failed";
  provider?: string;
  durationMs?: number;
}) {
  const { status, ...rest } = params;
  if (status === "failed") {
    logger.error({ ...rest, status }, `Purchase failed: ${params.type}`);
  } else {
    logger.info({ ...rest, status }, `Purchase ${status}: ${params.type}`);
  }
}
