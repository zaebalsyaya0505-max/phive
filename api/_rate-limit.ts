import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

async function withRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  config: { max: number; windowMs: number; keyPrefix: string }
): Promise<boolean> {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  const key = `${config.keyPrefix}:${ip}`;

  try {
    const current = await kv.incr(key);
    if (current === 1) {
      await kv.expire(key, Math.floor(config.windowMs / 1000));
    }

    const ttl = await kv.ttl(key);
    const remaining = Math.max(0, config.max - current);
    const reset = Date.now() + (ttl || config.windowMs / 1000) * 1000;

    res.setHeader("X-RateLimit-Limit", String(config.max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.floor(reset / 1000)));

    if (current > config.max) {
      res.setHeader("Retry-After", "60");
      res.status(429).json({ error: "rate_limit_exceeded" });
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

function setSecurityHeaders(res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}
