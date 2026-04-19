# pHive Bootnode API

Легковесный API для регистрации и открытия списка активных P2P узлов (bootnode discovery).

## Структура

- **`api/bootnode.ts`** - Edge Function на Vercel для регистрации и выдачи списка пиров
- **`vercel.json`** - Конфиг для Domain Fronting (Reverse Proxy)

## Установка

1. **Установите зависимость:**
```bash
npm install @vercel/kv
```

2. **Настройте Vercel KV в Vercel Dashboard:**
   - Перейдите в проект на vercel.com
   - Откройте Storage → KV
   - Создайте новую KV базу
   - Скопируйте переменные окружения и добавьте их в `.env.local`:
   ```
   KV_URL=https://...
   KV_REST_API_URL=https://...
   KV_REST_API_TOKEN=...
   PHIVE_SECRET_KEY=your_secret_token_here
   ```

## Использование

### 1. Регистрация узла (POST)

Сидер отправляет свой адрес на bootnode:

```bash
curl -X POST https://phive-five.vercel.app/api/bootnode \
  -H "Content-Type: application/json" \
  -H "x-phive-auth: your_secret_token_here" \
  -d '{
    "peerId": "QmXxxx...",
    "multiaddr": "/ip4/192.168.1.1/tcp/30333/p2p/QmXxxx..."
  }'
```

**Ответ:**
```json
{ "status": "registered" }
```

### 2. Получение списка пиров (GET)

Новый узел запрашивает список для подключения:

```bash
curl https://phive-five.vercel.app/api/bootnode \
  -H "x-phive-auth: your_secret_token_here"
```

**Ответ:**
```json
{
  "peers": [
    { "peerId": "QmAaa...", "multiaddr": "...", "ip": "1.2.3.4" },
    { "peerId": "QmBbb...", "multiaddr": "...", "ip": "5.6.7.8" },
    ...
  ]
}
```

## Domain Fronting (Reverse Proxy)

В `vercel.json` настроен Reverse Proxy:

```json
{
  "rewrites": [
    {
      "source": "/p2p-relay/:match*",
      "destination": "https://YOUR_HIDDEN_SERVER/:match*"
    }
  ]
}
```

**Что это дает:**
- Провайдер видит: `https://phive-five.vercel.app/p2p-relay/...`
- На самом деле: запрос идет на ваш скрытый сервер
- Реальный IP сервера остается скрыт

**Использование:**
```bash
curl https://phive-five.vercel.app/p2p-relay/ping
# -> Запрос идет на https://YOUR_HIDDEN_SERVER/ping
```

## Безопасность

⚠️ **Важно:**

1. **Изменить `PHIVE_SECRET_KEY`** на сложный токен
2. Использовать HTTPS везде
3. Ограничить количество запросов через Rate Limiting (в Vercel можно через middleware)
4. Регулярно очищать мертвые узлы (сейчас нет автоочистки)

## Следующие шаги

1. Подключить Upstash Redis или Vercel KV
2. Добавить TTL и автоочистку мертвых пиров
3. Реализовать Rate Limiting
4. Добавить логирование и мониторинг
5. Скрыть реальный IP сервера через Domain Fronting

## API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|---------|
| GET   | `/api/bootnode` | Получить список активных пиров |
| POST  | `/api/bootnode` | Зарегистрировать новый узел |
| GET   | `/p2p-relay/:path*` | Domain Fronting прокси |

---

**Документация:** https://phive-five.vercel.app
