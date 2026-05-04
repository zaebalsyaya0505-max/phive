import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const { platform, current_version } = req.query;
    const sb = getSupabase();

    const { data: updates, error } = await sb
      .from("app_updates")
      .select("*")
      .eq("is_active", true)
      .eq("platform", platform || "android")
      .order("version_code", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[updates] Supabase error:", error);
      res.status(500).json({ error: "failed_to_fetch_updates" });
      return;
    }

    const needsUpdate = updates && (!current_version || parseInt(String(current_version)) < updates.version_code);
    const forceUpdate = needsUpdate && updates.min_version_code && parseInt(String(current_version)) < updates.min_version_code;

    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    res.status(200).json({
      has_update: !!needsUpdate,
      force_update: !!forceUpdate,
      update: updates ? {
        version_code: updates.version_code,
        version_name: updates.version_name,
        download_url: updates.download_url,
        release_notes: updates.release_notes,
        is_critical: updates.is_critical,
        sha256_hash: updates.sha256_hash,
        file_size_bytes: updates.file_size_bytes,
      } : null,
      server_timestamp: Date.now(),
    });
  } catch (err) {
    console.error("[updates] Error:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
}
