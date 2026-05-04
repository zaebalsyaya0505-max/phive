-- 008_notifications_anon_read.sql
-- Разрешить анонимное чтение отправленных in_app уведомлений

-- Анонимное чтение для in_app каналов
DROP POLICY IF EXISTS "Anonymous read sent in_app notifications" ON notifications;
CREATE POLICY "Anonymous read sent in_app notifications" ON notifications
  FOR SELECT
  USING (is_sent = true AND 'in_app' = ANY(channel));

-- Остальные политики (админские) остаются без изменений
