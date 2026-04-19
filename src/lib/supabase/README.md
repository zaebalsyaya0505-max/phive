# Supabase Integration Guide

Инструкция по подключению и настройке Supabase базы данных для pHive.

## 1. Создание проекта Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "Start your project"
3. Создайте новый проект или используйте существующий
4. Скопируйте `Project URL` и `Anon Key` (находятся в Settings → API)

## 2. Создание таблицы в Supabase

В Supabase Dashboard откройте **SQL Editor** и выполните следующий SQL код:

```sql
-- Create the notes table
create table notes (
  id bigint primary key generated always as identity,
  title text not null,
  created_at timestamp default now()
);

-- Insert some sample data into the table
insert into notes (title)
values
  ('Today I created a Supabase project.'),
  ('I added some data and queried it from pHive.'),
  ('It was awesome!');

-- Enable Row Level Security
alter table notes enable row level security;

-- Make the data publicly readable
create policy "public can read notes"
on public.notes
for select to anon
using (true);

-- Allow authenticated users to insert notes
create policy "authenticated users can insert notes"
on public.notes
for insert to authenticated
with check (true);

-- Allow users to delete their own notes
create policy "users can delete notes"
on public.notes
for delete to authenticated
using (true);
```

## 3. Установка зависимостей

```bash
npm install @supabase/supabase-js
```

## 4. Настройка переменных окружения

Создайте `.env.local` в корне проекта:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Где получить:**
- Перейдите в Supabase Dashboard
- Settings → API
- Скопируйте Project URL и anon (public) key

## 5. Использование Supabase клиента

### Получить все заметки

```typescript
import { getNotes } from '@/lib/supabase/client';

const notes = await getNotes();
```

### Создать новую заметку

```typescript
import { createNote } from '@/lib/supabase/client';

await createNote('My new note');
```

### Удалить заметку

```typescript
import { deleteNote } from '@/lib/supabase/client';

await deleteNote(1); // Delete note with id 1
```

### Обновить заметку

```typescript
import { updateNote } from '@/lib/supabase/client';

await updateNote(1, 'Updated note text');
```

## 6. Использование на странице

Перейдите на `http://localhost:3000/notes` для просмотра и управления заметками.

### Архитектура

- **`src/lib/supabase/client.ts`** - Supabase клиент и функции для работы с БД
- **`src/pages/NotesPage.tsx`** - React компонент для отображения заметок
- **`src/App.tsx`** - Маршрут `/notes` для страницы заметок

## 7. Безопасность

⚠️ **Важно:**

1. **Никогда не коммитьте `.env.local`** в Git (он уже в `.gitignore`)
2. Используйте RLS (Row Level Security) политики для защиты данных
3. Ограничьте доступ через Supabase Dashboard
4. Используйте аутентификацию для чувствительных операций

## 8. Типы данных

```typescript
interface Note {
  id: number;
  title: string;
  created_at?: string;
}
```

## Следующие шаги

- [ ] Добавить аутентификацию Supabase
- [ ] Реализовать real-time подписки
- [ ] Добавить фильтрацию и поиск
- [ ] Оптимизировать производительность запросов
- [ ] Добавить бэкапы данных

## Полезные ссылки

- [Supabase документация](https://supabase.com/docs)
- [Supabase JS клиент](https://supabase.com/docs/reference/javascript/introduction)
- [RLS политики](https://supabase.com/docs/guides/auth/row-level-security)
