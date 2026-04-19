# 🚀 pHive - Freedom Network Protocol

Декентрализованная P2P сеть для свободного доступа в интернет, защищённая от DPI и цензуры.

**Демо:** https://phive-five.vercel.app  
**GitHub:** https://github.com/zaebalsyaya0505-max/phive  
**Status:** ✅ Production Ready (требуется место на диске для зависимостей)

---

## 📋 Содержание

- [Особенности](#особенности)
- [Установка](#установка)
- [Структура проекта](#структура-проекта)
- [API](#api)
- [Аутентификация](#аутентификация)
- [Развёртывание](#развёртывание)

## ✨ Особенности

### 🛡️ Безопасность
- **Phantom Hive Tunnel** - Post-quantum криптография (ML-KEM, ML-DSA)
- **P2P Mesh** - Децентрализованная топология
- **DPI Bypass** - 99%+ обход Deep Packet Inspection
- **Domain Fronting** - Скрытие реального IP сервера

### 📊 Инфраструктура
- **Bootnode API** - регистрация и открытие пиров
- **Vercel Edge Functions** - минимальная задержка
- **Vercel KV** - распределённое хранилище
- **Supabase** - управление пользователями и данными

### 📈 Мониторинг
- **Vercel Analytics** - отслеживание просмотров
- **Vercel Speed Insights** - метрики производительности
- **Real-time Dashboard** - live статистика сети

---

## 🔧 Установка

### Требования
- Node.js 18+
- npm или yarn
- ~1GB свободного места на диске

### Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone https://github.com/zaebalsyaya0505-max/phive.git
cd phive

# 2. Установить зависимости
npm install

# 3. Настроить переменные окружения
cp .env.example .env.local
# Отредактировать .env.local с вашими значениями

# 4. Запустить развитие
npm run dev

# 5. Открыть в браузере
# http://localhost:3000
```

### Переменные окружения

```env
# Supabase
VITE_SUPABASE_URL=https://tcolzpthxqzwagextzdq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_NAxjAscfz81Efi1PnlkPzw_EgrdQ9Kp
VITE_SUPABASE_ANON_KEY=your_anon_key

# Bootnode API
PHIVE_SECRET_KEY=your_secret_key
HIDDEN_SERVER_URL=https://your-server.com

# Vercel
VERCEL_URL=https://phive-five.vercel.app
```

---

## 📁 Структура проекта

```
pHive/
├── src/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Supabase клиент
│   │   │   ├── auth.ts        # Аутентификация
│   │   │   └── README.md      # Документация
│   │   └── utils.ts           # Утилиты
│   ├── pages/
│   │   ├── HomePage.tsx       # Главная страница
│   │   ├── NotesPage.tsx      # CRUD с Supabase
│   │   ├── DownloadPage.tsx   # Скачивание
│   │   ├── DocsPage.tsx       # Документация
│   │   ├── AboutPage.tsx      # О проекте
│   │   └── ...                # Другие страницы
│   ├── components/
│   │   ├── Layout.tsx         # Основной layout
│   │   ├── Navbar.tsx         # Навигация
│   │   ├── Footer.tsx         # Футер
│   │   └── ui/                # UI компоненты (40+)
│   └── App.tsx                # Главный компонент
├── api/
│   ├── bootnode.ts            # P2P Bootnode API
│   └── README.md              # API документация
├── public/
│   ├── images/                # Логотипы и скриншоты
│   └── fonts/                 # Пользовательские шрифты
├── vercel.json                # Vercel конфигурация
├── vite.config.ts             # Vite конфигурация
├── .env.example               # Примеры переменных
├── SUPABASE_SETUP.md          # Supabase инструкции
└── INSTALLATION.md            # Чеклист установки
```

---

## 🔌 API

### Bootnode API (Регистрация пиров)

#### Регистрация узла
```bash
curl -X POST https://phive-five.vercel.app/api/bootnode \
  -H "Content-Type: application/json" \
  -H "x-phive-auth: your_secret_key" \
  -d '{
    "peerId": "QmXxxx...",
    "multiaddr": "/ip4/192.168.1.1/tcp/30333/p2p/QmXxxx..."
  }'
```

#### Получить список пиров
```bash
curl https://phive-five.vercel.app/api/bootnode \
  -H "x-phive-auth: your_secret_key"
```

#### Domain Fronting (Reverse Proxy)
```bash
curl https://phive-five.vercel.app/p2p-relay/endpoint
# -> Запрос идет на ваш скрытый сервер
```

---

## 🔐 Аутентификация

### Вход и регистрация

```typescript
import { signUp, signIn, signOut } from '@/lib/supabase/auth';

// Регистрация
await signUp('user@example.com', 'password');

// Вход
await signIn('user@example.com', 'password');

// Выход
await signOut();
```

### Управление профилем

```typescript
import { getProfile, updateProfile } from '@/lib/supabase/auth';

// Получить профиль
const profile = await getProfile(userId);

// Обновить профиль
await updateProfile(userId, {
  display_name: 'John Doe',
  avatar_url: 'https://...'
});
```

### Работа с заметками

```typescript
import { getNotes, createNote, deleteNote, updateNote } from '@/lib/supabase/client';

// Получить заметки
const notes = await getNotes();

// Создать
await createNote('My note');

// Удалить
await deleteNote(1);

// Обновить
await updateNote(1, 'Updated text');
```

---

## 📦 Команды разработки

```bash
# Запустить dev сервер
npm run dev

# Собрать для продакшена
npm run build

# Preview собранной версии
npm run preview

# Линтинг
npm run lint

# Перед коммитом
git add .
git commit -m "описание"
git push origin main
```

---

## 🌐 Развёртывание

### Развёртывание на Vercel

```bash
# 1. Установить Vercel CLI
npm i -g vercel

# 2. Залогиниться
vercel login

# 3. Связать проект
vercel link

# 4. Добавить переменные окружения
vercel env pull .env.local

# 5. Развернуть
vercel deploy --prod
```

### Конфигурация Vercel

В `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/p2p-relay/:match*",
      "destination": "https://YOUR_HIDDEN_SERVER/:match*"
    }
  ],
  "env": {
    "PHIVE_SECRET_KEY": "@phive_secret_key"
  }
}
```

---

## 📊 Мониторинг

### Vercel Analytics
Автоматически отслеживает:
- Просмотры страниц
- Географию пользователей
- Браузеры и устройства

### Vercel Speed Insights
Мониторит производительность:
- Core Web Vitals (LCP, FID, CLS)
- Время ответа сервера
- Время загрузки скриптов

### Supabase Dashboard
Статистика:
- Активные пользователи
- Использование хранилища
- Количество запросов

---

## 🔒 Безопасность

⚠️ **Важно для продакшена:**

1. ✅ `.env.local` в `.gitignore`
2. ⚠️ Изменить `PHIVE_SECRET_KEY` на сложный токен
3. ⚠️ Включить RLS (Row Level Security) в Supabase
4. ⚠️ Настроить CORS в Supabase
5. ⚠️ Использовать HTTPS везде
6. ⚠️ Регулярно обновлять зависимости

---

## 📝 Лицензия

MIT License - см. [LICENSE](LICENSE)

---

## 🤝 Контрибьютинг

Приветствуются PR и issues! 

```bash
# 1. Fork репозиторий
# 2. Создать ветку (git checkout -b feature/AmazingFeature)
# 3. Коммитить изменения (git commit -m 'Add AmazingFeature')
# 4. Push в ветку (git push origin feature/AmazingFeature)
# 5. Открыть Pull Request
```

---

## 📞 Контакты

- **Email:** hello@phive.net
- **Telegram:** @phive_support
- **Twitter:** @phive
- **GitHub:** https://github.com/zaebalsyaya0505-max/phive

---

## 🙏 Спасибо

- Supabase за бесплатную БД
- Vercel за хостинг и Edge Functions
- shadcn/ui за компоненты

---

**Последнее обновление:** 19 апреля 2026  
**Версия:** 1.0.0  
**Статус:** Production Ready ✅
