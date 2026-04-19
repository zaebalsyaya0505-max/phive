# Supabase Complete Setup Guide

Полная инструкция по интеграции Supabase с аутентификацией и UI компонентами.

## Предоставленные учетные данные

```env
VITE_SUPABASE_URL=https://tcolzpthxqzwagextzdq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_NAxjAscfz81Efi1PnlkPzw_EgrdQ9Kp
```

Эти переменные уже добавлены в `.env.local`.

## Установка (когда будет место на диске)

### 1. Установить Supabase JavaScript клиент

```bash
npm install @supabase/supabase-js
```

### 2. Установить Supabase UI компоненты для React Router

```bash
npx shadcn@latest add @supabase/supabase-client-react-router
```

Это установит:
- Компоненты аутентификации (вход, регистрация, восстановление пароля)
- Управление сессией
- Protected routes (защищённые маршруты)
- Интеграция с React Router

### 3. (Опционально) Установить Agent Skills

```bash
npx skills add supabase/agent-skills
```

Это добавит инструменты для ИИ для работы с Supabase.

## Структура интеграции

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts          # Supabase клиент
│       ├── auth.ts            # Функции аутентификации
│       └── README.md          # Документация
├── pages/
│   ├── NotesPage.tsx          # CRUD операции с заметками
│   ├── AuthPage.tsx           # Аутентификация (будет добавлена)
│   └── ProfilePage.tsx        # Профиль пользователя (будет добавлена)
└── components/
    └── AuthGuard.tsx          # Компонент защиты маршрутов
```

## Доступные функции

### Работа с заметками (уже реализовано)

```typescript
import { getNotes, createNote, deleteNote, updateNote } from '@/lib/supabase/client';

// Получить все заметки
const notes = await getNotes();

// Создать заметку
await createNote('My new note');

// Удалить заметку
await deleteNote(1);

// Обновить заметку
await updateNote(1, 'Updated text');
```

### Аутентификация (будет добавлена после установки)

```typescript
import { signUp, signIn, signOut } from '@/lib/supabase/auth';

// Регистрация
await signUp('user@example.com', 'password');

// Вход
await signIn('user@example.com', 'password');

// Выход
await signOut();
```

## Текущие маршруты

| Маршрут | Компонент | Статус |
|---------|-----------|--------|
| `/` | HomePage | ✅ |
| `/notes` | NotesPage | ✅ Требует Supabase |
| `/auth` | AuthPage | ⏳ Будет добавлена |
| `/profile` | ProfilePage | ⏳ Будет добавлена |
| `/advertise` | AdvertisePage | ✅ |
| `/partners` | PartnersPage | ✅ |
| `/about` | AboutPage | ✅ |
| `/docs` | DocsPage | ✅ |
| `/download` | DownloadPage | ✅ |
| `/contact` | ContactPage | ✅ |
| `/blog` | BlogPage | ✅ |

## Функционал после полной установки

- ✅ Аутентификация (Email/Password, OAuth)
- ✅ Управление профилем
- ✅ Real-time обновления заметок
- ✅ File Storage для аватаров
- ✅ Row Level Security (защита данных)
- ✅ Presigned URLs для файлов

## SQL для инициализации базы

Выполните в Supabase SQL Editor:

```sql
-- Таблица заметок
create table notes (
  id bigint primary key generated always as identity,
  title text not null,
  created_at timestamp default now(),
  user_id uuid references auth.users(id) on delete cascade
);

-- Таблица профилей пользователей
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamp default now()
);

-- Row Level Security для заметок
alter table notes enable row level security;

create policy "Users can read own notes"
on notes for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own notes"
on notes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete own notes"
on notes for delete
to authenticated
using (auth.uid() = user_id);

-- Row Level Security для профилей
alter table profiles enable row level security;

create policy "Users can read own profile"
on profiles for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on profiles for update
to authenticated
using (auth.uid() = id);
```

## Переменные окружения (.env.local)

```env
# Supabase
VITE_SUPABASE_URL=https://tcolzpthxqzwagextzdq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_NAxjAscfz81Efi1PnlkPzw_EgrdQ9Kp

# Bootnode
PHIVE_SECRET_KEY=your_secret_key_here
HIDDEN_SERVER_URL=https://your-server.com
VERCEL_URL=https://phive-five.vercel.app
```

## Проверка подключения

После установки зависимостей, проверьте подключение в NotesPage:

```bash
npm run dev
# Откройте http://localhost:3000/notes
```

Если заметки загружаются - Supabase подключена успешно ✅

## Следующие шаги

1. [ ] Очистить диск (для установки зависимостей)
2. [ ] Выполнить `npm install @supabase/supabase-js`
3. [ ] Выполнить `npx shadcn@latest add @supabase/supabase-client-react-router`
4. [ ] Создать таблицы в Supabase (SQL выше)
5. [ ] Добавить AuthPage компонент
6. [ ] Добавить ProfilePage компонент
7. [ ] Добавить File Storage интеграцию
8. [ ] Настроить Email templates в Supabase

## Полезные ссылки

- [Supabase Docs](https://supabase.com/docs)
- [Supabase UI Components](https://supabase.com/ui)
- [Agent Skills](https://github.com/supabase/agent-skills)
- [React Router Integration](https://supabase.com/docs/reference/javascript/introduction)

## Поддержка

При возникновении ошибок проверьте:
1. Переменные окружения в `.env.local`
2. Настройки CORS в Supabase Dashboard
3. Row Level Security политики
4. Состояние Supabase проекта

---

**Проект:** pHive  
**Дата:** 19 апреля 2026  
**Статус:** Готова база, требуется установка зависимостей
