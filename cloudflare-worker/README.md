# Cloudflare Worker — UBuyer chat-proxy

Прокси-Worker для AI-Анастасии. Скрывает Google-домены (которые блокируются
РКН) за нашим поддоменом `ai.u-buyer.ru`.

## Зачем

- `*.web.app` и `*.run.app` могут быть заблокированы РКН у части провайдеров
- Свой поддомен через Cloudflare Worker — не зависит от Google и работает у всех
- Бесплатно до 100 000 запросов/день (у нас ~200/день)

## Архитектура

```
Клиент (РФ без VPN)
       ↓
   https://ai.u-buyer.ru   ← Cloudflare Worker (наш проксирующий слой)
       ↓
   Cloud Run chat-функция (us-central1)
       ↓
   Claude API
```

## Файлы

- `worker.js` — код Worker'а, копировать в Cloudflare UI

## Деплой через Cloudflare UI (один раз, ~10 минут)

### Шаг 1 — Создать Worker

1. Зайти: https://dash.cloudflare.com/
2. Слева в меню → **Workers & Pages** → **Create application** → **Create Worker**
3. Имя: `ubuyer-chat-proxy`
4. **Deploy** (с дефолтным "Hello world" — пока неважно)

### Шаг 2 — Вставить код

1. После deploy → **Edit code** (или Quick edit)
2. Удалить весь дефолтный код
3. Скопировать всё содержимое `worker.js` и вставить
4. **Save and deploy**

### Шаг 3 — Привязать поддомен

1. В Worker → **Settings** → **Triggers** *(или Domains & Routes)*
2. **Add Custom Domain**
3. Ввести: `ai.u-buyer.ru`
4. **Add** → Cloudflare автоматически:
   - Создаст DNS-запись CNAME для `ai`
   - Выпустит SSL-сертификат
   - Привяжет к Worker'у

### Шаг 4 — Проверить

Через 1-2 минуты в браузере открыть:
```
https://ai.u-buyer.ru/
```
Должно вернуть текст: `UBuyer chat-proxy: ok`

### Шаг 5 — Переключить виджет

Это делает Клод после того как Worker заработает:
- Меняет `CHAT_ENDPOINT` в виджете на `https://ai.u-buyer.ru`
- Убирает fallback-chain (больше не нужен)
- Deploy hosting

## Бесплатные лимиты

- 100 000 запросов в день
- 10ms CPU time на запрос (нам нужно <1ms — мы только проксируем)
- 1 Worker в бесплатном плане — нам хватит

При выходе за лимиты — Workers Paid $5/мес (10M запросов).
