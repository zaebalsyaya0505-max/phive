import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { kv } from "@vercel/kv";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const config = {
  api: {
    bodyParser: true,
  },
};

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

function setSecurityHeaders(res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

async function rateLimit(
  req: VercelRequest,
  res: VercelResponse,
  max: number,
  windowMs: number,
  prefix: string
): Promise<boolean> {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "unknown";
  const key = `${prefix}:${ip}`;
  try {
    const current = await kv.incr(key);
    if (current === 1) await kv.expire(key, Math.floor(windowMs / 1000));
    const remaining = Math.max(0, max - current);
    const reset = Date.now() + (await kv.ttl(key) || windowMs / 1000) * 1000;
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.floor(reset / 1000)));
    if (current > max) {
      res.setHeader("Retry-After", "60");
      res.status(429).json({ error: "rate_limit_exceeded" });
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);

  if (!await rateLimit(req, res, 30, 60000, "ton-verify")) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const { address, proof, domain, timestamp } = req.body || {};

    if (!address || !proof || !proof.payload || !proof.signature) {
      res.status(400).json({ error: "missing_required_fields" });
      return;
    }

    if (timestamp && Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
      res.status(400).json({ error: "proof_expired" });
      return;
    }

    const sb = getSupabase();

    const normalizedAddress = address.toLowerCase().trim();

    const { data: profile } = await sb
      .from("profiles")
      .select("id, ton_public_key, is_premium, role")
      .eq("ton_address", normalizedAddress)
      .single();

    if (profile) {
      res.status(200).json({
        verified: true,
        profile: {
          id: profile.id,
          ton_address: normalizedAddress,
          is_premium: profile.is_premium,
          role: profile.role,
        },
      });
    } else {
      res.status(200).json({
        verified: true,
        profile: null,
        message: "wallet_verified_no_profile",
      });
    }
  } catch (err) {
    console.error("[ton-verify] Error:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
}
