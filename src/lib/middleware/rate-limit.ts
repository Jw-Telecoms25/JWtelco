import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "jwtelecoms:ratelimit",
  });

  return ratelimit;
}

export async function checkRateLimit(
  identifier: string,
  limitsPerMinute = 10
): Promise<{ success: boolean; response?: NextResponse }> {
  const rl = getRatelimit();

  if (!rl) {
    logger.error({}, "Rate limiter unavailable — Redis not configured. Failing closed.");
    return {
      success: false,
      response: NextResponse.json(
        { error: "Service temporarily unavailable. Please try again." },
        { status: 503 }
      ),
    };
  }

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
}
