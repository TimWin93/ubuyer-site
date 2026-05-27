/**
 * UBuyer chat-proxy — Yandex Cloud Function
 *
 * Назначение: проксировать POST-запросы из браузера на наш Cloud Run
 * (chat-функция Firebase), отдавая ответ через российский домен
 * `functions.yandexcloud.net`. Это решает блокировку Cloudflare и
 * `*.run.app` у мобильных провайдеров РФ — Яндекс-домены не режутся.
 *
 * Архитектура:
 *   Клиент (РФ без VPN) → https://functions.yandexcloud.net/<id>
 *                       → Cloud Run (chat-36gkdx4msq-uc.a.run.app)
 *                       → Claude API
 *
 * Деплой: код вставляется в редактор Cloud Function через UI
 * https://console.yandex.cloud → Cloud Functions → ubuyer-chat-proxy
 *
 * Параметры функции:
 *   - Среда: nodejs22
 *   - Точка входа: index.handler
 *   - Таймаут: 60 сек
 *   - Память: 128 МБ
 *   - Публичная: да
 */

const TARGET = 'https://chat-36gkdx4msq-uc.a.run.app';

const ALLOWED_ORIGINS = [
  'https://u-buyer.ru',
  'https://www.u-buyer.ru',
  'https://ubuyer-site.web.app',
  'https://ubuyer-site.firebaseapp.com',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];

function corsHeaders(event) {
  const origin = (event.headers && (event.headers.Origin || event.headers.origin)) || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '3600',
    'Vary': 'Origin',
  };
}

exports.handler = async (event) => {
  const method = event.httpMethod || 'GET';

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(event), body: '' };
  }

  if (method === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body: 'UBuyer chat-proxy (Yandex): ok',
    };
  }

  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(event) },
      body: JSON.stringify({ error: 'method_not_allowed' }),
    };
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf-8')
    : (event.body || '');

  const incomingCT = (event.headers && (event.headers['Content-Type'] || event.headers['content-type'])) || 'application/json';

  try {
    const upstream = await fetch(TARGET + '/', {
      method: 'POST',
      headers: { 'Content-Type': incomingCT },
      body: rawBody,
    });

    const text = await upstream.text();

    return {
      statusCode: upstream.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        ...corsHeaders(event),
      },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(event) },
      body: JSON.stringify({ error: 'upstream_failed', message: String(err) }),
    };
  }
};
