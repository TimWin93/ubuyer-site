# Yandex Cloud Function — UBuyer chat-proxy

Прокси-функция для AI-Анастасии. Скрывает Cloud Run за российским
доменом `functions.yandexcloud.net` — единственный путь, надёжно
работающий у всех клиентов в РФ без VPN.

## Зачем именно Yandex

Перепробованные альтернативы (см. `СТАТУС.md`):

- **Прямой Cloud Run (`*.run.app`)** — блочится у части РФ-провайдеров
- **Firebase Hosting (`*.web.app`)** — блочится у части РФ-провайдеров
- **Cloudflare Worker (`ai.u-buyer.ru`)** — GET проходит, но POST с
  ожиданием ответа 5-15 сек обрывается у мобильных операторов
  (`fetch failed: Load failed` на iOS)
- **Firebase Hosting custom-domain rewrite (`/api/chat`)** — не
  пробрасывается через Fastly-based custom domain
- **Yandex Cloud Functions** — стабильно работает у всех ✅

## Архитектура

```
Клиент (РФ, без VPN)
       ↓
   https://functions.yandexcloud.net/d4ee9o608pangl2m3fii
       ↓ (Yandex проксирует server-to-server)
   https://chat-36gkdx4msq-uc.a.run.app/  (Cloud Run, Google)
       ↓
   Claude Haiku 4.5
```

`*.run.app` блочится для пользователя, но **не** для server-to-server из
Yandex Cloud (исходящий трафик из Yandex к Google работает).

## Файлы

- `index.js` — код функции, вставляется в редактор Yandex Cloud Console

## Параметры функции

- **ID:** `d4ee9o608pangl2m3fii`
- **Имя:** `ubuyer-chat-proxy`
- **Среда выполнения:** nodejs22
- **Точка входа:** `index.handler`
- **Таймаут:** 60 сек
- **Память:** 128 МБ
- **Публичная:** да (без авторизации)
- **URL:** https://functions.yandexcloud.net/d4ee9o608pangl2m3fii
- **Каталог:** `default` (`b1g3r2c9l4r99s7o5mhn`)
- **Облако:** `cloud-timur-karimov93` (`b1g4ft9ebrm0ae15bpjp`)

## Деплой обновлений

Yandex CLI здесь не настроен — обновляем через Web UI:

1. https://console.yandex.cloud → **Cloud Functions** → `ubuyer-chat-proxy`
2. **Редактор** (слева)
3. Скопировать содержимое `index.js` → вставить в редактор поверх старого
4. **Создать версию**
5. Yandex автоматически переключит трафик на новую версию

## Стоимость

Бесплатный тариф: 1 млн вызовов/мес + 10 ГБ-часов памяти.
У нас ~200 запросов/день → ~6 000/мес = в 165 раз ниже лимита.

Стартовый грант 4 000 ₽ до 26.07.2026 (с запасом покрывает всё).
