export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Lead {
  sessionId: string;
  name: string;
  contact: string;
  marketplace: string;
  niche: string;
  volume: string;
  situation: string;
  urgency?: "low" | "medium" | "high";
  createdAt: string;
}

export interface CtaContext {
  source: "pricing" | "quiz" | "hero" | "comparison" | "safety" | "faq" | "generic";
  triggerText?: string;
  sectionId?: string;
}

export interface ChatRequest {
  sessionId: string;
  messages: ChatMessage[];
  ctaContext?: CtaContext;
}

export interface ChatResponse {
  reply: string;
  leadSubmitted: boolean;
  sessionId: string;
}
