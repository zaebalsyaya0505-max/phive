-- ============================================================
-- RLS Hardening: Drop ALL existing policies, then recreate safely
-- ============================================================

-- 1. system_health
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage system_health" ON system_health;
DROP POLICY IF EXISTS "Admins view system_health" ON system_health;
DROP POLICY IF EXISTS "Anyone can view system_health" ON system_health;
CREATE POLICY "Admins view system_health" ON system_health FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 2. audit_logs
DROP POLICY IF EXISTS "Admins manage audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins view audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins insert audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Users view audit_logs" ON audit_logs;
CREATE POLICY "Admins manage audit_logs" ON audit_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 3. user_bans
DROP POLICY IF EXISTS "Admins manage user_bans" ON user_bans;
DROP POLICY IF EXISTS "Users view own ban" ON user_bans;
CREATE POLICY "Admins manage user_bans" ON user_bans FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Users view own ban" ON user_bans FOR SELECT
  USING (auth.uid() = user_id);

-- 4. notifications
DROP POLICY IF EXISTS "Admins manage notifications" ON notifications;
DROP POLICY IF EXISTS "Users view sent notifications" ON notifications;
CREATE POLICY "Admins manage notifications" ON notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Users view sent notifications" ON notifications FOR SELECT
  USING (is_sent = true AND auth.uid() IS NOT NULL);

-- 5. app_settings
DROP POLICY IF EXISTS "Admins manage app_settings" ON app_settings;
DROP POLICY IF EXISTS "Public read general settings" ON app_settings;
CREATE POLICY "Admins manage app_settings" ON app_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Public read general settings" ON app_settings FOR SELECT
  USING (category = 'general');

-- 6. api_keys
DROP POLICY IF EXISTS "Admins manage api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users view api_keys" ON api_keys;
CREATE POLICY "Admins manage api_keys" ON api_keys FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 7. webhooks
DROP POLICY IF EXISTS "Admins manage webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users view webhooks" ON webhooks;
CREATE POLICY "Admins manage webhooks" ON webhooks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 8. email_templates
DROP POLICY IF EXISTS "Admins manage email_templates" ON email_templates;
DROP POLICY IF EXISTS "Users view email_templates" ON email_templates;
CREATE POLICY "Admins manage email_templates" ON email_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 9. ad_events
DROP POLICY IF EXISTS "Admins view ad_events" ON ad_events;
DROP POLICY IF EXISTS "Anyone can view ad_events" ON ad_events;
CREATE POLICY "Admins view ad_events" ON ad_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 10. Grant permissions
REVOKE ALL ON TABLE audit_logs FROM anon, authenticated;
REVOKE ALL ON TABLE api_keys FROM anon, authenticated;
REVOKE ALL ON TABLE webhooks FROM anon, authenticated;
REVOKE ALL ON TABLE email_templates FROM anon, authenticated;
REVOKE ALL ON TABLE app_settings FROM anon, authenticated;
REVOKE ALL ON TABLE system_health FROM anon, authenticated;
REVOKE ALL ON TABLE notifications FROM anon, authenticated;
REVOKE ALL ON TABLE user_bans FROM anon, authenticated;

GRANT SELECT ON TABLE notifications TO authenticated;
GRANT SELECT ON TABLE user_bans TO authenticated;
GRANT SELECT ON TABLE app_settings TO anon;
GRANT SELECT ON TABLE app_settings TO authenticated;

GRANT INSERT ON TABLE ad_events TO anon;
GRANT INSERT ON TABLE ad_events TO authenticated;
REVOKE SELECT ON TABLE ad_events FROM anon;
