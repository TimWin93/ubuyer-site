const BOT_TOKEN = import.meta.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.TELEGRAM_CHAT_ID;

export interface LeadData {
  name: string;
  contact: string;
  niche?: string;
  goal?: string;
  volume?: string;
  source?: string;
}

export async function sendLeadToTelegram(lead: LeadData): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    throw new Error('Telegram credentials not configured');
  }

  const lines = [
    '🆕 *Новая заявка с сайта UBuyer*',
    '',
    `👤 Имя: ${lead.name}`,
    `📱 Контакт: ${lead.contact}`,
    lead.niche ? `🏷 Ниша: ${lead.niche}` : null,
    lead.goal ? `🎯 Задача: ${lead.goal}` : null,
    lead.volume ? `📦 Объём: ${lead.volume}` : null,
    lead.source ? `📍 Источник: ${lead.source}` : null,
  ].filter(Boolean).join('\n');

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: lines, parse_mode: 'Markdown' }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram API error: ${err}`);
  }
}
