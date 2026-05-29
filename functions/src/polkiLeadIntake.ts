/**
 * Polki landing — приёмник лидов.
 *
 * Фронт: src/components/polki/PolkiLeadForm.astro → POST /api/polki-lead
 * (через rewrite в firebase.json).
 *
 * Что делает:
 *   1. Валидирует payload {name, contact, product?, source}
 *   2. Пишет лид в Firestore коллекцию `polki_leads`
 *   3. Шлёт уведомление в TG-группу менеджеров через того же
 *      `@ubuyer2026bot` что и виджет Анастасии
 *
 * PDF не отдаём — фронт сам сразу показывает прямую ссылку на
 * `/polki/polki-gid.pdf` после успешного submit (моментально, ноль ожидания).
 * Менеджер потом пишет лиду первым (стандартная воронка UBuyer).
 *
 * App.initializeApp() и admin SDK инициализированы в index.ts — здесь
 * НЕ вызываем повторно, просто пользуемся getFirestore().
 */
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
const TELEGRAM_LEAD_CHAT_ID = defineSecret("TELEGRAM_LEAD_CHAT_ID");

const ALLOWED_ORIGINS = [
  "https://u-buyer.ru",
  "https://www.u-buyer.ru",
  "https://ubuyer-site.web.app",
  "https://ubuyer-site.firebaseapp.com",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
  "http://localhost:3000",
];

interface PolkiLeadPayload {
  name: string;
  contact: string;
  product?: string;
  source?: string;
}

export const polkiLeadIntake = onRequest(
  {
    region: "us-central1",
    cors: ALLOWED_ORIGINS,
    invoker: "public",
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_LEAD_CHAT_ID],
    timeoutSeconds: 30,
    memory: "256MiB",
    maxInstances: 5,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Фронт шлёт Content-Type: text/plain чтобы избежать CORS preflight
    // (тот же приём что в виджете Анастасии). Парсим вручную.
    let body: Partial<PolkiLeadPayload>;
    try {
      const raw = req.body;
      if (typeof raw === "string") body = JSON.parse(raw);
      else if (raw && typeof raw === "object") body = raw as Partial<PolkiLeadPayload>;
      else body = {};
    } catch {
      res.status(400).json({ error: "invalid JSON body" });
      return;
    }

    const name = String(body.name ?? "").trim().slice(0, 120);
    const contact = String(body.contact ?? "").trim().slice(0, 120);
    const product = String(body.product ?? "").trim().slice(0, 500);
    const source = String(body.source ?? "polki-landing").slice(0, 50);

    if (!name || !contact) {
      res.status(400).json({ error: "name and contact are required" });
      return;
    }

    const createdAt = new Date().toISOString();

    try {
      const db = getFirestore();
      const docRef = await db.collection("polki_leads").add({
        name,
        contact,
        product,
        source,
        createdAt,
        receivedAt: FieldValue.serverTimestamp(),
      });

      // Уведомление менеджерам
      await sendPolkiLeadToTelegram(
        { name, contact, product, source, docId: docRef.id },
        TELEGRAM_BOT_TOKEN.value(),
        TELEGRAM_LEAD_CHAT_ID.value(),
      );

      res.status(200).json({ ok: true, id: docRef.id });
    } catch (err) {
      console.error("polkiLeadIntake handler error", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
);

interface TelegramPayload {
  name: string;
  contact: string;
  product: string;
  source: string;
  docId: string;
}

async function sendPolkiLeadToTelegram(
  payload: TelegramPayload,
  botToken: string,
  chatId: string,
): Promise<void> {
  const text = formatPolkiLeadMessage(payload);

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
    const errBody = await res.text();
    throw new Error(`Telegram API ${res.status}: ${errBody}`);
  }
}

function formatPolkiLeadMessage(p: TelegramPayload): string {
  const lines = [
    "📥 <b>Лид с лендинга «Полки»</b>",
    "",
    `<b>Имя:</b> ${escape(p.name)}`,
    `<b>Контакт:</b> ${escape(p.contact)}`,
    `<b>Товар на WB:</b> ${escape(p.product) || "—"}`,
    "",
    "<i>Скачал PDF про полки конкурентов. Тёплый лид — был на лендинге, прочитал, оставил контакт.</i>",
    "",
    `<i>Источник: ${escape(p.source)} · ID: ${p.docId}</i>`,
  ];
  return lines.join("\n");
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
