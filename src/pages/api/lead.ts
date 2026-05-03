import type { APIRoute } from 'astro';
import { sendLeadToTelegram } from '@/lib/telegram';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();

    const lead = {
      name: String(data.get('name') ?? ''),
      contact: String(data.get('contact') ?? ''),
      niche: data.get('niche') ? String(data.get('niche')) : undefined,
      goal: data.get('goal') ? String(data.get('goal')) : undefined,
      volume: data.get('volume') ? String(data.get('volume')) : undefined,
      source: request.headers.get('referer') ?? undefined,
    };

    if (!lead.name || !lead.contact) {
      return new Response(JSON.stringify({ error: 'Имя и контакт обязательны' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await sendLeadToTelegram(lead);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('lead API error:', err);
    return new Response(JSON.stringify({ error: 'Внутренняя ошибка сервера' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
