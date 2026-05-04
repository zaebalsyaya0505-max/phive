/**
 * Notifications Endpoint for Android app
 * 
 * GET /api/v1/notifications?platform=android&limit=20
 * Returns sent in-app notifications for users
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { kv } from "@vercel/kv";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

export const config = {
  api: {
    bodyParser: true,
  },
};

function setSecurityHeaders(res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
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

  if (!await rateLimit(req, res, 100, 60000, "notifications")) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const { platform, limit, since } = req.query;
    const sb = getSupabase();

    const limitNum = Math.min(parseInt(String(limit)) || 20, 50);

    let query = sb
      .from("notifications")
      .select("id, title, message, type, channel, target, sent_at, created_at")
      .eq("is_sent", true)
      .order("created_at", { ascending: false })
      .limit(limitNum);

    // Filter by channel
    if (platform) {
      query = query.contains("channel", ["in_app"]);
    }

    // Filter by date
    if (since) {
      query = query.gte("sent_at", String(since));
    }

    const { data, error } = await query;

    if (error) {
      console.error("[notifications] Error:", error);
      res.status(500).json({ error: "failed_to_fetch_notifications" });
      return;
    }

    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
    res.status(200).json({
      notifications: data || [],
      server_timestamp: Date.now(),
    });
  } catch (err) {
    console.error("[notifications] Error:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
}
