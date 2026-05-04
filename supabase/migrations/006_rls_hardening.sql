-- ============================================================
-- RLS Hardening: Close all security gaps
-- ============================================================

-- 1. system_health: only admins can read
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view system_health" ON system_health;
CREATE POLICY "Admins view system_health" ON system_health FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 2. audit_logs: no user access except admin
DROP POLICY IF EXISTS "Users view audit_logs" ON audit_logs;

-- 3. user_bans: users can only see their own ban status
DROP POLICY IF EXISTS "Users view own ban" ON user_bans;
CREATE POLICY "Users view own ban" ON user_bans FOR SELECT
  USING (auth.uid() = user_id);

-- 4. notifications: all authenticated users can read sent notifications
DROP POLICY IF EXISTS "Users view sent notifications" ON notifications;
CREATE POLICY "Users view sent notifications" ON notifications FOR SELECT
  USING (is_sent = true AND auth.uid() IS NOT NULL);

-- 5. app_settings: only general category readable by all, rest admin-only
DROP POLICY IF EXISTS "Public read general settings" ON app_settings;
CREATE POLICY "Public read general settings" ON app_settings FOR SELECT
  USING (category = 'general');

-- 6. api_keys: NEVER readable, only admin ALL
-- Already covered by admin-only policy, but let's be explicit
DROP POLICY IF EXISTS "Users view api_keys" ON api_keys;

-- 7. webhooks: admin-only
DROP POLICY IF EXISTS "Users view webhooks" ON webhooks;

-- 8. email_templates: admin-only
DROP POLICY IF EXISTS "Users view email_templates" ON email_templates;

-- 9. ad_events: block anonymous reads, only admin can read
DROP POLICY IF EXISTS "Anyone can view ad_events" ON ad_events;
CREATE POLICY "Admins view ad_events" ON ad_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 10. Ensure service_role can bypass all RLS
-- This is automatic in Supabase with service_role key, but let's document it
COMMENT ON TABLE system_health IS 'RLS: admin-only. Service role bypasses.';
COMMENT ON TABLE audit_logs IS 'RLS: admin-only. Service role bypasses.';
COMMENT ON TABLE api_keys IS 'RLS: admin-only, no read for anyone else. Service role bypasses.';
COMMENT ON TABLE webhooks IS 'RLS: admin-only. Service role bypasses.';
COMMENT ON TABLE email_templates IS 'RLS: admin-only. Service role bypasses.';
COMMENT ON TABLE app_settings IS 'RLS: general=public, rest=admin. Service role bypasses.';
COMMENT ON TABLE notifications IS 'RLS: sent=authenticated, unsent=admin. Service role bypasses.';
COMMENT ON TABLE user_bans IS 'RLS: own=auth user, all=admin. Service role bypasses.';

-- 11. Revoke public access to all admin tables
REVOKE ALL ON TABLE audit_logs FROM anon, authenticated;
REVOKE ALL ON TABLE api_keys FROM anon, authenticated;
REVOKE ALL ON TABLE webhooks FROM anon, authenticated;
REVOKE ALL ON TABLE email_templates FROM anon, authenticated;
REVOKE ALL ON TABLE app_settings FROM anon, authenticated;
REVOKE ALL ON TABLE system_health FROM anon, authenticated;
REVOKE ALL ON TABLE notifications FROM anon, authenticated;
REVOKE ALL ON TABLE user_bans FROM anon, authenticated;

-- 12. Re-grant limited access
GRANT SELECT ON TABLE notifications TO authenticated;
GRANT SELECT ON TABLE user_bans TO authenticated;
GRANT SELECT ON TABLE app_settings TO anon;
GRANT SELECT ON TABLE app_settings TO authenticated;

-- 13. Ensure anon can only INSERT ad_events (not read)
GRANT INSERT ON TABLE ad_events TO anon;
GRANT INSERT ON TABLE ad_events TO authenticated;
REVOKE SELECT ON TABLE ad_events FROM anon;
