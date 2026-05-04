import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { withRateLimit, denyRateLimited } from "./middleware/rate-limit.js";

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

interface AdCampaign {
  id: string;
  name: string;
  type: 'banner' | 'interstitial' | 'native' | 'subscription' | 'internal';
  image_url: string | null;
  title: string;
  description: string | null;
  click_url: string;
  width: number;
  height: number;
  priority: number;
  weight: number;
  is_internal: boolean;
  start_date: string | null;
  end_date: string | null;
}

function setSecurityHeaders(res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);

  const rate = await withRateLimit(req, res, { max: 200, windowMs: 60000, keyPrefix: "ads" });
  if (!rate.allowed) {
    denyRateLimited(res);
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const { platform, type, country } = req.query;
    const sb = getSupabase();

    let query = sb
      .from("ad_campaigns")
      .select("id, name, type, image_url, title, description, click_url, width, height, priority, weight, is_internal, start_date, end_date")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("weight", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    if (platform && platform !== "all") {
      query = query.or(`target_platform.is.null,target_platform.eq.all,target_platform.eq.${platform}`);
    }

    const { data: campaigns, error } = await query;

    if (error) {
      console.error("[ads] Supabase error:", error);
      res.status(500).json({ error: "failed_to_fetch_ads" });
      return;
    }

    const filtered = (campaigns || []).filter((c: AdCampaign) => {
      const now = new Date();
      if (c.start_date && new Date(c.start_date) > now) return false;
      if (c.end_date && new Date(c.end_date) < now) return false;
      return true;
    });

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({
      ads: filtered,
      sync_interval: 300000,
      server_timestamp: Date.now(),
    });
  } catch (err) {
    console.error("[ads] Error:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
}
