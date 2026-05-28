import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { askClaude } from "./claude.js";
import { sendLeadToTelegram } from "./telegram.js";
import type { ChatRequest, Lead } from "./types.js";

initializeApp();

const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");
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

export const chat = onRequest(
  {
    region: "us-central1",
    cors: ALLOWED_ORIGINS,
    invoker: "public",
    secrets: [ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_LEAD_CHAT_ID],
    timeoutSeconds: 120,
    memory: "512MiB",
    maxInstances: 10,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Парсим body вручную: фронт шлёт Content-Type: text/plain (чтобы
    // обойти CORS preflight на iOS Safari), Firebase auto-parser даёт строку.
    let body: Partial<ChatRequest>;
    try {
      const raw = req.body;
      if (typeof raw === "string") body = JSON.parse(raw);
      else if (raw && typeof raw === "object") body = raw as Partial<ChatRequest>;
      else body = {};
    } catch {
      res.status(400).json({ error: "invalid JSON body" });
      return;
    }

    if (!body?.sessionId || !Array.isArray(body.messages) || body.messages.length === 0) {
      res.status(400).json({ error: "sessionId and messages are required" });
      return;
    }

    const sessionId = body.sessionId;
    const messages = body.messages;
    const ctaContext = body.ctaContext;

    // Простой non-streaming вызов Claude: один request → полный ответ → JSON.
    // Никакого стриминга ни внутри, ни снаружи — система максимально предсказуемая.
    try {
      const { fullText, lead: leadData } = await askClaude(
        ANTHROPIC_API_KEY.value(),
        messages,
        ctaContext,
      );

      const lead: Lead | null = leadData
        ? { sessionId, ...leadData, createdAt: new Date().toISOString() }
        : null;

      const allMessages = [...messages, { role: "assistant" as const, content: fullText }];

      if (lead) {
        const wasNew = await saveLeadIfNew(lead, allMessages);
        if (wasNew) {
          await sendLeadToTelegram(
            lead,
            TELEGRAM_BOT_TOKEN.value(),
            TELEGRAM_LEAD_CHAT_ID.value(),
          );
        } else {
          console.log(`Lead for session ${sessionId} already exists, skipping Telegram notification`);
        }
      }

      await logConversation(sessionId, allMessages, lead !== null);

      res.status(200).json({
        reply: fullText,
        leadSubmitted: lead !== null,
      });
    } catch (err) {
      console.error("chat handler error", err);
      res.status(500).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
);

/** Возвращает true, если лид был создан впервые. False — если уже существовал. */
async function saveLeadIfNew(
  lead: Lead,
  fullDialog: { role: "user" | "assistant"; content: string }[],
): Promise<boolean> {
  const db = getFirestore();
  const leadRef = db.collection("leads").doc(lead.sessionId);

  const existing = await leadRef.get();
  if (existing.exists) {
    await leadRef.update({ dialog: fullDialog, updatedAt: FieldValue.serverTimestamp() });
    return false;
  }

  await leadRef.set({
    ...lead,
    dialog: fullDialog,
    createdAt: FieldValue.serverTimestamp(),
  });
  return true;
}

async function logConversation(
  sessionId: string,
  allMessages: { role: "user" | "assistant"; content: string }[],
  leadSubmitted: boolean,
): Promise<void> {
  const db = getFirestore();
  await db.collection("conversations").doc(sessionId).set(
    {
      sessionId,
      messages: allMessages,
      leadSubmitted,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
