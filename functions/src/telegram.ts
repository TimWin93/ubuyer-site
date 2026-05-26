import type { Lead } from "./types.js";

export async function sendLeadToTelegram(
  lead: Lead,
  botToken: string,
  chatId: string,
): Promise<void> {
  const text = formatLeadMessage(lead);

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API ${res.status}: ${body}`);
  }
}

function formatLeadMessage(lead: Lead): string {
  const lines = [
    "🔥 <b>Новый лид от AI-менеджера</b>",
    "",
    `<b>Имя:</b> ${escape(lead.name) || "—"}`,
    `<b>Контакт:</b> ${escape(lead.contact)}`,
    `<b>Маркетплейс:</b> ${escape(lead.marketplace) || "—"}`,
    `<b>Ниша:</b> ${escape(lead.niche) || "—"}`,
    `<b>Объём:</b> ${escape(lead.volume) || "—"}`,
    "",
    "<b>Ситуация:</b>",
    escape(lead.situation),
    "",
    `<i>session: ${lead.sessionId}</i>`,
  ];
  return lines.join("\n");
}

function escape(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
