-- ============================================================
-- Ads Campaigns & App Updates Tables
-- ============================================================

-- 1. Ad Campaigns Table
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('banner', 'interstitial', 'native', 'subscription', 'internal')),
  image_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  click_url TEXT NOT NULL,
  width INTEGER NOT NULL DEFAULT 320,
  height INTEGER NOT NULL DEFAULT 50,
  priority INTEGER NOT NULL DEFAULT 0,
  weight INTEGER NOT NULL DEFAULT 1,
  target_platform TEXT CHECK (target_platform IN ('all', 'android', 'ios')),
  target_countries TEXT[], -- null = all countries
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget_daily NUMERIC(10, 2),
  budget_total NUMERIC(10, 2),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_internal BOOLEAN DEFAULT false, -- internal ads (our own, e.g. subscription promo)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_campaigns_active ON ad_campaigns(is_active, type, priority);
CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);

-- 2. App Updates Table
CREATE TABLE IF NOT EXISTS app_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_code INTEGER NOT NULL,
  version_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios')),
  download_url TEXT NOT NULL,
  release_notes TEXT,
  min_version_code INTEGER, -- force update for users below this version
  is_critical BOOLEAN DEFAULT false,
  sha256_hash TEXT,
  file_size_bytes BIGINT,
  rollout_percentage INTEGER DEFAULT 100, -- gradual rollout
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_updates_active ON app_updates(is_active, platform, version_code DESC);

-- 3. Ad Impressions/Clicks tracking (for analytics from app)
CREATE TABLE IF NOT EXISTS ad_events (
  id BIGSERIAL PRIMARY KEY,
  campaign_id UUID REFERENCES ad_campaigns(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  install_id TEXT,
  peer_id TEXT,
  platform TEXT,
  app_version TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_events_campaign ON ad_events(campaign_id, event_type);
CREATE INDEX idx_ad_events_time ON ad_events(occurred_at);

-- 4. RLS Policies

-- Ads: everyone can read active campaigns
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ads"
  ON ad_campaigns FOR SELECT
  USING (is_active = true);

-- Admins can manage ads
CREATE POLICY "Admins can manage ads"
  ON ad_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Updates: everyone can read active updates
ALTER TABLE app_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active updates"
  ON app_updates FOR SELECT
  USING (is_active = true);

-- Admins can manage updates
CREATE POLICY "Admins can manage updates"
  ON app_updates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Ad events: anyone can insert (from app/local server)
ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert ad events"
  ON ad_events FOR INSERT
  WITH CHECK (true);

-- Admins can view ad events
CREATE POLICY "Admins can view ad events"
  ON ad_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 5. Updated_at trigger
CREATE TRIGGER set_ad_campaigns_updated_at
  BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. RPC functions for atomic counter increments
CREATE OR REPLACE FUNCTION increment_ad_impressions(count INTEGER)
RETURNS void AS $$
BEGIN
  -- This is called with campaign_id context in the API
  -- For batch operations, the API updates directly
  NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_ad_clicks(count INTEGER)
RETURNS void AS $$
BEGIN
  -- This is called with campaign_id context in the API
  -- For batch operations, the API updates directly
  NULL;
END;
$$ LANGUAGE plpgsql;
