import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

const limiterCache = new Map<number, Ratelimit>();

function getRatelimit(limitsPerMinute: number): Ratelimit | null {
  const cached = limiterCache.get(limitsPerMinute);
  if (cached) return cached;

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limitsPerMinute, "60 s"),
    analytics: true,
    prefix: "jwtelecoms:ratelimit",
  });

  limiterCache.set(limitsPerMinute, limiter);
  return limiter;
}

export async function checkRateLimit(
  identifier: string,
  limitsPerMinute = 10
): Promise<{ success: boolean; response?: NextResponse }> {
  const rl = getRatelimit(limitsPerMinute);

  if (!rl) {
    logger.warn({}, "Rate limiter unavailable — Redis not configured");
    return { success: true };
  }

  try {
    const { success, limit, reset, remaining } = await rl.limit(identifier);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return {
        success: false,
        response: NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
              "Retry-After": retryAfter.toString(),
            },
          }
        ),
      };
    }

    return { success: true };
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : "Unknown" }, "Rate limiter error");
    return { success: true };
  }
}
