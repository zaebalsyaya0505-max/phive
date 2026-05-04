import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { withRateLimit, denyRateLimited } from "../../middleware/rate-limit";

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
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);

  const rate = await withRateLimit(req, res, { max: 500, windowMs: 60000, keyPrefix: "ad-events" });
  if (!rate.allowed) {
    denyRateLimited(res);
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const body = req.body;
    if (!body || (!Array.isArray(body.events) && !body.event_type)) {
      res.status(400).json({ error: "invalid_payload" });
      return;
    }

    const events = Array.isArray(body.events) ? body.events : [body];

    if (events.length > 50) {
      res.status(400).json({ error: "too_many_events", max: 50 });
      return;
    }

    const sb = getSupabase();
    const rowsToInsert = events
      .filter((e: any) => e.campaign_id && e.event_type)
      .map((e: any) => ({
        campaign_id: e.campaign_id,
        event_type: e.event_type,
        install_id: e.install_id || null,
        peer_id: e.peer_id || null,
        platform: e.platform || null,
        app_version: e.app_version || null,
      }));

    if (rowsToInsert.length > 0) {
      const { error } = await sb.from("ad_events").insert(rowsToInsert);
      if (error) {
        console.error("[ad-events] Insert error:", error);
        res.status(500).json({ error: "failed_to_record_events" });
        return;
      }

      const impressions = rowsToInsert.filter((e: any) => e.event_type === "impression").length;
      const clicks = rowsToInsert.filter((e: any) => e.event_type === "click").length;

      if (impressions > 0) {
        await sb.rpc("increment_ad_impressions", { count: impressions });
      }
      if (clicks > 0) {
        await sb.rpc("increment_ad_clicks", { count: clicks });
      }
    }

    res.status(200).json({ status: "ok", recorded: rowsToInsert.length });
  } catch (err) {
    console.error("[ad-events] Error:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
}
