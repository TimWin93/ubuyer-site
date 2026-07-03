/**
 * Приёмник лидов из форм-модалок сайта (БЕЗ AI-чата).
 *
 * Первый потребитель — квиз выбора целей (QuizSection): клиент выбирает цели →
 * открывается модалка → оставляет Telegram-ник или телефон → лид уходит
 * менеджерам в тот же TG-чат, что и лиды Анастасии, но МИНУЯ AI-диалог.
 *
 * Фронт: POST /api/form-lead (rewrite в firebase.json → эта функция).
 * Тело: {contact, channel?, goals?, source?} с Content-Type: text/plain
 * (обход CORS-preflight — тот же приём, что в виджете и polki-форме).
 *
 * initializeApp() и admin SDK инициализированы в index.ts — здесь НЕ повторяем.
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

interface FormLeadPayload {
  contact: string;
  channel?: string;
  goals?: string[];
  source?: string;
}

export const formLeadIntake = onRequest(
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

    let body: Partial<FormLeadPayload>;
    try {
      const raw = req.body;
      if (typeof raw === "string") body = JSON.parse(raw);
      else if (raw && typeof raw === "object") body = raw as Partial<FormLeadPayload>;
      else body = {};
    } catch {
      res.status(400).json({ error: "invalid JSON body" });
      return;
    }

    const contact = String(body.contact ?? "").trim().slice(0, 120);
    const channel = String(body.channel ?? "").trim().slice(0, 20);
    const source = String(body.source ?? "form").trim().slice(0, 50);
    const goals = Array.isArray(body.goals)
      ? body.goals.map((g) => String(g).trim().slice(0, 80)).filter(Boolean).slice(0, 10)
      : [];

    if (!contact) {
      res.status(400).json({ error: "contact is required" });
      return;
    }

    const createdAt = new Date().toISOString();

    try {
      const db = getFirestore();
      const docRef = await db.collection("form_leads").add({
        contact,
        channel,
        goals,
        source,
        createdAt,
        receivedAt: FieldValue.serverTimestamp(),
      });

      await sendFormLeadToTelegram(
        { contact, channel, goals, source, docId: docRef.id },
        TELEGRAM_BOT_TOKEN.value(),
        TELEGRAM_LEAD_CHAT_ID.value(),
      );

      res.status(200).json({ ok: true, id: docRef.id });
    } catch (err) {
      console.error("formLeadIntake handler error", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
);

interface TelegramPayload {
  contact: string;
  channel: string;
  goals: string[];
  source: string;
  docId: string;
}

async function sendFormLeadToTelegram(
  payload: TelegramPayload,
  botToken: string,
  chatId: string,
): Promise<void> {
  const text = formatFormLeadMessage(payload);

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

function formatFormLeadMessage(p: TelegramPayload): string {
  const goalsLine = p.goals.length ? p.goals.map(escape).join(", ") : "—";
  const channelLabel =
    p.channel === "phone" ? "телефон" : p.channel === "telegram" ? "Telegram" : p.channel || "—";
  const sourceLabel = p.source === "quiz" ? "квиз выбора целей" : p.source;

  const lines = [
    "🎯 <b>Лид с формы сайта (без чата)</b>",
    "",
    `<b>Контакт:</b> ${escape(p.contact)}  <i>(${escape(channelLabel)})</i>`,
    `<b>Цели:</b> ${goalsLine}`,
    "",
    "<i>Тёплый лид — выбрал цели и оставил контакт напрямую через форму, минуя AI-чат. Написать первым.</i>",
    "",
    `<i>Источник: ${escape(sourceLabel)} · ID: ${p.docId}</i>`,
  ];
  return lines.join("\n");
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
