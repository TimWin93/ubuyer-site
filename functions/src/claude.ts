import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "./knowledge.js";
import type { ChatMessage, CtaContext } from "./types.js";

function formatCtaContext(ctx: CtaContext): string {
  const lines = [
    "=== КОНТЕКСТ ПЕРЕХОДА С САЙТА ===",
    `Клиент пришёл с блока: ${ctx.source}`,
  ];
  if (ctx.triggerText) lines.push(`Кликнул: "${ctx.triggerText}"`);
  if (ctx.sectionId) lines.push(`Секция #${ctx.sectionId}`);
  lines.push(
    "",
    "Учти это в первом ответе. НЕ говори «вижу вы смотрели X» — звучит навязчиво.",
    "Плавно подведи к теме секции с конкретной пользой для клиента.",
  );
  return lines.join("\n");
}

const MODEL = "claude-haiku-4-5-20251001";
// 500 токенов = ~330 слов. 400 иногда обрезает в нишах с регуляторкой
// (БАД, детское, электроника) — там нужно упомянуть документы. Длинные
// простыни всё равно не нужны — в промпте инструкция держаться 3-4 абзацев.
const MAX_TOKENS = 500;

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
    "Вызови этот инструмент РОВНО ОДИН РАЗ И ТОЛЬКО когда клиент уже " +
    "прислал в чате свой контакт (Telegram-ник вида @username ИЛИ номер " +
    "телефона). " +
    "❌ НЕ вызывай tool если клиент только спросил «как связаться» или " +
    "согласился оставить контакт, но ещё не назвал @ник или номер. " +
    "❌ НЕ вызывай tool с пустым полем contact — это спам менеджерам. " +
    "✅ Вызывай только когда в последнем сообщении клиента есть конкретный " +
    "@username или цифры телефона. После вызова — поблагодари клиента и " +
    "подтверди, что менеджер напишет первым в течение ~15 минут.",
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
  ctaContext?: CtaContext,
): Promise<ClaudeResult> {
  const client = new Anthropic({ apiKey });

  // Первый блок — стабильный (кэшируется), второй — динамический контекст
  // конкретного перехода с сайта (если есть). Кэш Anthropic держится на
  // первом блоке, доп. контекст добавляется без инвалидации.
  const systemBlocks: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: buildSystemPrompt(),
      cache_control: { type: "ephemeral" },
    },
  ];
  if (ctaContext) {
    systemBlocks.push({
      type: "text",
      text: formatCtaContext(ctaContext),
    });
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    // Сниженная температура = стабильный тон. Дефолт 1.0 даёт разброс
    // «иногда экспертно, иногда плывёт» — 0.5 убирает плавание, но
    // оставляет вариативность формулировок.
    temperature: 0.5,
    system: systemBlocks,
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

  // Защита от ложного submit_lead: Claude иногда вызывает tool без получения
  // контакта (например когда клиент сам спросил «как связаться»). Без contact
  // лид не имеет смысла для менеджера. Игнорируем такой вызов.
  if (lead) {
    const contact = (lead.contact ?? "").trim();
    const looksLikeContact =
      /@[a-z0-9_]{3,}/i.test(contact) ||           // Telegram-ник
      /[+\d][\d\s\-()]{6,}/.test(contact) ||         // номер телефона
      /\b\w+@[\w.-]+\.\w+\b/i.test(contact);         // email на всякий
    if (!looksLikeContact) {
      console.warn("submit_lead called without valid contact — ignoring", {
        contactValue: contact,
      });
      lead = null;
    }
  }

  // Если был tool_use, но текста нет — отдадим стандартное подтверждение
  if (lead && !fullText.trim()) {
    fullText = FALLBACK_AFTER_LEAD;
  }

  return { fullText: fullText.trim(), lead };
}
