# 📋 pHive Installation Checklist

Статус установки и настройки Supabase интеграции.

## ✅ Завершено

- [x] Структура проекта (Vite + React + TypeScript)
- [x] Supabase клиент (`src/lib/supabase/client.ts`)
- [x] Функции работы с заметками (CRUD)
- [x] React компонент для заметок (`NotesPage.tsx`)
- [x] Маршрут `/notes` в приложении
- [x] Переменные окружения (`.env.local`)
- [x] Bootnode API (`api/bootnode.ts`)
- [x] Domain Fronting конфиг (`vercel.json`)
- [x] Vercel Analytics интеграция
- [x] Vercel Speed Insights интеграция
- [x] pHive брендинг (заменено Phantom → pHive везде)

## ⏳ Требует установки зависимостей

Эти пункты зависят от наличия места на диске для `npm install`:

- [ ] `npm install @supabase/supabase-js`
  - Требуется для: Аутентификация, работа с БД
  - Размер: ~2MB

- [ ] `npx shadcn@latest add @supabase/supabase-client-react-router`
  - Требуется для: UI компоненты аутентификации
  - Включает: Вход, регистрация, восстановление пароля

- [ ] `npm install @vercel/kv` (Bootnode API)
  - Требуется для: Регистрация P2P узлов
  - Размер: ~1MB

- [ ] `npx skills add supabase/agent-skills` (опционально)
  - Требуется для: ИИ инструменты для работы с Supabase

## 🔧 Готовые модули

### Аутентификация (`src/lib/supabase/auth.ts`)
```typescript
- signUp()           // Регистрация
- signIn()           // Вход
- signOut()          // Выход
- getCurrentUser()   // Текущий пользователь
- onAuthStateChange()// Отслеживание изменений
- resetPassword()    // Восстановление пароля
- updatePassword()   // Изменить пароль
- getProfile()       // Получить профиль
- updateProfile()    // Обновить профиль
```

### Заметки (`src/lib/supabase/client.ts`)
```typescript
- getNotes()         // Получить все заметки
- createNote()       // Создать заметку
- deleteNote()       // Удалить заметку
- updateNote()       // Обновить заметку
```

## 📁 Структура файлов

```
src/
├── lib/supabase/
│   ├── client.ts      ✅ Готов
│   ├── auth.ts        ✅ Готов (ждёт npm install)
│   └── README.md      ✅ Документация
├── pages/
│   ├── NotesPage.tsx  ✅ Готов (требует Supabase)
│   ├── AuthPage.tsx   ⏳ Будет добавлена
│   └── ProfilePage.tsx⏳ Будет добавлена
api/
├── bootnode.ts        ✅ Готов (требует @vercel/kv)
└── README.md          ✅ Документация

.env.local            ✅ Готов
SUPABASE_SETUP.md     ✅ Документация
```

## 🚀 Быстрый старт

### 1. Убедиться в переменных окружения
```bash
# Проверить .env.local
cat .env.local
```

### 2. Когда будет место на диске - установить зависимости
```bash
npm install @supabase/supabase-js
npx shadcn@latest add @supabase/supabase-client-react-router
npm install @vercel/kv
```

### 3. Запустить приложение
```bash
npm run dev
# Откройте http://localhost:3000/notes
```

### 4. Создать таблицы в Supabase (если нужны)
Выполнить SQL из `SUPABASE_SETUP.md`

## 📊 Текущий размер проекта

```
node_modules/        ~700MB (требуется место)
src/                 ~100KB
api/                 ~50KB
.env.local           ~300B
Всего исходников     ~150KB
```

## 🔐 Безопасность

⚠️ **Важно:**

1. `.env.local` уже в `.gitignore` ✅
2. Publishable Key видна в коде (это нормально) ✅
3. Требуется Change Supabase Secret Key перед продакшеном ⚠️
4. Требуется Enable RLS на всех таблицах ⚠️

## 📞 Поддержка

Если есть проблемы:

1. Проверьте переменные окружения в `.env.local`
2. Откройте Supabase Dashboard → Project Settings
3. Посмотрите логи в Browser Console (F12)
4. Проверьте Supabase SQL Error Logs

## 🎯 Следующие шаги

1. Очистить диск (примерно 1GB свободного места)
2. Выполнить все команды `npm install`
3. Протестировать на `http://localhost:3000/notes`
4. Запустить `npm run build` для продакшена
5. Развернуть на Vercel: `vercel deploy --prod`

---

**Проект:** pHive  
**Последний обновление:** 19 апреля 2026  
**Версия:** 1.0.0
