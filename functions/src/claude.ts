import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./knowledge.js";
import type { ChatMessage } from "./types.js";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 768;

export interface LeadData {
  name: string;
  contact: string;
  marketplace: string;
  niche: string;
  volume: string;
  situation: string;
  urgency?: "low" | "medium" | "high";
}

export interface ClaudeResult {
  fullText: string;
  lead: LeadData | null;
}

export type ClaudeStreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "lead"; data: LeadData }
  | { type: "done"; fullText: string; lead: LeadData | null }
  | { type: "error"; message: string };

const SUBMIT_LEAD_TOOL: Anthropic.Tool = {
  name: "submit_lead",
  description:
    "Вызови этот инструмент ровно один раз — когда клиент дал контакт " +
    "(Telegram-ник вида @username или номер телефона) и согласился, что менеджер " +
    "свяжется. Не вызывай заранее. После вызова — поблагодари клиента " +
    "и подтверди, что менеджер напишет первым в течение ~15 минут.",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Имя клиента, если назвал. Если нет — пустая строка.",
      },
      contact: {
        type: "string",
        description: "Telegram-ник (@username) или телефон. Обязательно.",
      },
      marketplace: {
        type: "string",
        description: "WB, OZON, или 'WB+OZON'. Если не уточнил — пустая строка.",
      },
      niche: {
        type: "string",
        description: "Категория/ниша товаров клиента. Если не назвал — пустая строка.",
      },
      volume: {
        type: "string",
        description:
          "Объём/масштаб: оборот, количество карточек, бюджет — что назвал клиент. " +
          "Если ничего не назвал — пустая строка.",
      },
      situation: {
        type: "string",
        description:
          "Краткое саммари ситуации клиента и его задачи (2-4 предложения) — " +
          "то, что менеджеру нужно знать, чтобы зайти в разговор подготовленным.",
      },
      urgency: {
        type: "string",
        enum: ["low", "medium", "high"],
        description:
          "Оценка срочности: 'high' если клиент сказал 'срочно/горит/" +
          "теряю деньги/бан сегодня/пик через неделю'; 'medium' если есть " +
          "явная задача и интерес; 'low' если просто интересуется без сроков. " +
          "По умолчанию medium.",
      },
    },
    required: ["contact", "situation"],
  },
};

const FALLBACK_AFTER_LEAD =
  "Спасибо! Передал ваш контакт менеджеру. Он напишет вам первым в течение ~15 минут.";

/**
 * Non-streaming вызов Claude: один request → полный ответ.
 * Стрим убран на всех уровнях — он только усложнял систему, а UX-выгоды нет
 * (CORS/SSE через CF/CDN/мобильные сети нестабилен).
 */
export async function askClaude(
  apiKey: string,
  messages: ChatMessage[],
): Promise<ClaudeResult> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: buildSystemPrompt(),
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [SUBMIT_LEAD_TOOL],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  let fullText = "";
  let lead: LeadData | null = null;

  for (const block of response.content) {
    if (block.type === "text") {
      fullText += block.text;
    } else if (block.type === "tool_use" && block.name === "submit_lead") {
      lead = block.input as LeadData;
    }
  }

  // Если был tool_use, но текста нет — отдадим стандартное подтверждение
  if (lead && !fullText.trim()) {
    fullText = FALLBACK_AFTER_LEAD;
  }

  return { fullText: fullText.trim(), lead };
}
