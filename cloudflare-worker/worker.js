/**
 * UBuyer chat-proxy — Cloudflare Worker
 *
 * Назначение: проксировать запросы из браузера клиента (на u-buyer.ru)
 * на нашу Cloud Function в Google Cloud Run, скрывая Google-домены
 * (которые могут быть заблокированы РКН) за нашим собственным
 * поддоменом ai.u-buyer.ru (или другим, привязанным к Worker'у).
 *
 * Архитектура:
 *   Клиент → https://ai.u-buyer.ru → Cloudflare Worker → Cloud Run
 *
 * Поддерживает:
 *   - POST с JSON body
 *   - SSE streaming (response.body передаётся как stream)
 *   - CORS preflight (OPTIONS)
 *   - Query параметры (cache-busting)
 */

const TARGET_ORIGIN = 'https://chat-36gkdx4msq-uc.a.run.app';

const ALLOWED_ORIGINS = [
  'https://u-buyer.ru',
  'https://www.u-buyer.ru',
  'https://ubuyer-site.web.app',
  'https://ubuyer-site.firebaseapp.com',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '3600',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    // Health-check
    const url = new URL(request.url);
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response('UBuyer chat-proxy: ok', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Прокси на Cloud Run — отдаём всё включая body и заголовки
    const targetUrl = TARGET_ORIGIN + url.pathname + url.search;

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': request.headers.get('Content-Type') || 'application/json',
        },
        body: request.body,
        // @ts-ignore: duplex обязательно для streaming в Cloudflare Workers
        duplex: 'half',
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: 'upstream_failed',
          message: err instanceof Error ? err.message : String(err),
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        },
      );
    }

    // ВАЖНО: буферизуем стрим целиком вместо chunked-проксирования.
    // РФ-провайдеры с DPI режут длинные SSE-соединения через Cloudflare —
    // короткий POST с готовым телом проходит, long-poll виснет.
    // Цена: теряем UX "печатает по словам", но чат работает у всех без VPN.
    const fullBody = await upstreamResponse.text();

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', upstreamResponse.headers.get('Content-Type') || 'text/event-stream; charset=utf-8');
    responseHeaders.set('Cache-Control', 'no-cache, no-transform');
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      responseHeaders.set(key, value);
    }

    return new Response(fullBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
