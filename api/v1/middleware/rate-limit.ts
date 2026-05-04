import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

export interface RateLimitConfig {
  max: number;
  windowMs: number;
  keyPrefix: string;
}

const defaultConfig: RateLimitConfig = {
  max: 100,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "rl",
};

export async function withRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  config?: Partial<RateLimitConfig>
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const cfg = { ...defaultConfig, ...config };

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  const key = `${cfg.keyPrefix}:${ip}`;

  try {
    const current = await kv.incr(key);
    if (current === 1) {
      await kv.expire(key, Math.floor(cfg.windowMs / 1000));
    }

    const ttl = await kv.ttl(key);
    const remaining = Math.max(0, cfg.max - current);
    const reset = Date.now() + (ttl || cfg.windowMs / 1000) * 1000;

    res.setHeader("X-RateLimit-Limit", String(cfg.max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.floor(reset / 1000)));

    if (current > cfg.max) {
      return { allowed: false, remaining: 0, reset };
    }

    return { allowed: true, remaining, reset };
  } catch {
    return { allowed: true, remaining: cfg.max, reset: Date.now() + cfg.windowMs };
  }
}

export function denyRateLimited(res: VercelResponse) {
  res.setHeader("Retry-After", "60");
  res.status(429).json({ error: "rate_limit_exceeded", retryAfter: 60 });
}
