-- ============================================================
-- Full Admin Panel: Notifications, Settings, Users, Audit Logs
-- ============================================================

-- 1. Notifications Table (system announcements)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  channel TEXT[] DEFAULT ARRAY['in_app'], -- ['in_app', 'email', 'push']
  target TEXT DEFAULT 'all', -- 'all', 'premium', 'banned', 'users'
  admin_id UUID REFERENCES auth.users(id),
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_admin ON notifications(admin_id);
CREATE INDEX idx_notifications_sent ON notifications(is_sent, created_at DESC);

-- 2. App Settings Table (key-value configuration)
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'api', 'smtp', 'webhooks', 'security', 'general', 'email_templates'
  key TEXT NOT NULL,
  value TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, key)
);

CREATE INDEX idx_app_settings_category ON app_settings(category);

-- 3. Audit Logs (who did what)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'created_ad', 'banned_user', 'changed_setting', etc.
  entity TEXT, -- 'ad_campaigns', 'profiles', 'app_settings'
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);

-- 4. User Bans/Blocks
CREATE TABLE IF NOT EXISTS user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  banned_by UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ, -- null = permanent
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_bans_active ON user_bans(user_id, is_active);

-- 5. API Keys (external integrations)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service TEXT NOT NULL, -- 'vercel', 'supabase', 'telegram', 'ton', 'analytics'
  key_value TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT DEFAULT 'POST' CHECK (method IN ('GET', 'POST', 'PUT')),
  headers JSONB DEFAULT '{}',
  events TEXT[] DEFAULT ARRAY['*'], -- ['ad_click', 'user_signup', 'update_download']
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_active ON webhooks(is_active);

-- 7. System Health Checks
CREATE TABLE IF NOT EXISTS system_health (
  id BIGSERIAL PRIMARY KEY,
  component TEXT NOT NULL, -- 'api', 'database', 'p2p_nodes', 'cdn', 'payment'
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'degraded', 'down')),
  latency_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  uptime_percent NUMERIC(5, 2) DEFAULT 100.00,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_health_component ON system_health(component, checked_at DESC);

-- 8. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables TEXT[], -- ['{user_name}', '{reset_link}']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins manage notifications" ON notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins manage app_settings" ON app_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins view audit_logs" ON audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins insert audit_logs" ON audit_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins manage user_bans" ON user_bans FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins manage api_keys" ON api_keys FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins manage webhooks" ON webhooks FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins manage system_health" ON system_health FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins manage email_templates" ON email_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Updated_at triggers
CREATE TRIGGER set_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_webhooks_updated_at BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default settings
INSERT INTO app_settings (category, key, value) VALUES
  ('general', 'app_name', 'Phantom'),
  ('general', 'app_version', '2.4.1'),
  ('general', 'maintenance_mode', 'false'),
  ('general', 'registration_enabled', 'true'),
  ('general', 'max_upload_size_mb', '100'),
  ('smtp', 'host', ''),
  ('smtp', 'port', '587'),
  ('smtp', 'username', ''),
  ('smtp', 'password', ''),
  ('smtp', 'from_email', 'noreply@phantom.ton'),
  ('smtp', 'from_name', 'Phantom Support'),
  ('smtp', 'tls_enabled', 'true'),
  ('security', 'max_login_attempts', '5'),
  ('security', 'session_timeout_hours', '24'),
  ('security', 'password_min_length', '8'),
  ('security', 'require_2fa', 'false'),
  ('security', 'allowed_ip_ranges', '[]'),
  ('webhooks', 'discord_webhook_url', ''),
  ('webhooks', 'telegram_bot_token', ''),
  ('webhooks', 'slack_webhook_url', ''),
  ('analytics', 'tracking_enabled', 'true'),
  ('analytics', 'anonymize_ips', 'true'),
  ('analytics', 'retention_days', '365')
ON CONFLICT (category, key) DO NOTHING;

-- Email templates
INSERT INTO email_templates (name, template_key, subject, body_html, body_text, variables) VALUES
  ('Welcome Email', 'welcome',
   'Добро пожаловать в Phantom! 🎉',
   '<h1>Привет, {user_name}!</h1><p>Спасибо за регистрацию. Начни использовать все функции прямо сейчас.</p><a href="{app_url}">Открыть Phantom</a>',
   'Привет, {user_name}! Спасибо за регистрацию. Перейди по ссылке: {app_url}',
   ARRAY['{user_name}', '{app_url}']),
  ('Password Reset', 'password_reset',
   'Сброс пароля',
   '<h1>Сброс пароля</h1><p>Нажмите кнопку для сброса:</p><a href="{reset_link}">Сбросить пароль</a>',
   'Сброс пароля: {reset_link}',
   ARRAY['{reset_link}']),
  ('Subscription Renewed', 'subscription_renewed',
   'Подписка продлена ✅',
   '<h1>Спасибо!</h1><p>Ваша подписка продлена до {expiry_date}.</p>',
   'Подписка продлена до {expiry_date}',
   ARRAY['{expiry_date}', '{plan_name}']),
  ('Account Banned', 'account_banned',
   'Учетная запись заблокирована',
   '<h1>Аккаунт заблокирован</h1><p>Причина: {ban_reason}</p><p>Обратитесь в поддержку: {support_email}</p>',
   'Аккаунт заблокирован. Причина: {ban_reason}',
   ARRAY['{ban_reason}', '{support_email}'])
ON CONFLICT (template_key) DO NOTHING;

-- System health initial data
INSERT INTO system_health (component, status, latency_ms, uptime_percent) VALUES
  ('api', 'ok', 45, 99.99),
  ('database', 'ok', 12, 99.98),
  ('p2p_nodes', 'ok', null, 97.50),
  ('cdn', 'ok', 8, 99.95),
  ('payment', 'ok', 120, 99.90)
ON CONFLICT DO NOTHING;

-- Sample notification (will be deleted after admin creates real ones)
INSERT INTO notifications (title, message, type, channel, target, is_sent, sent_at) VALUES
  ('Система запущена', 'Админ-панель успешно развернута. Проверьте настройки.', 'info', ARRAY['in_app'], 'admin', true, NOW())
ON CONFLICT DO NOTHING;

-- Audit log entry for setup
INSERT INTO audit_logs (action, entity, details) VALUES
  ('system_init', 'app_settings', '{"message": "Full admin panel initialized"}')
ON CONFLICT DO NOTHING;
