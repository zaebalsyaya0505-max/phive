-- 007_auto_create_profile.sql
-- Автоматически создает профиль при регистрации нового пользователя

-- Функция создания профиля
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, login, ton_address, is_premium, role, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'login', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'ton_address', NULL),
    false,
    'user',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на вставку в auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Для уже существующих пользователей — создаём профили если их нет
INSERT INTO public.profiles (id, login, ton_address, is_premium, role, created_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'login', au.email),
  COALESCE(au.raw_user_meta_data->>'ton_address', NULL),
  false,
  'user',
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
