import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = join(__dirname, "..", "knowledge");
const KNOWLEDGE_VERSION = "2026-06-02-short-replies";

let cachedSystemPrompt: string | null = null;

export function buildSystemPrompt(): string {
  if (cachedSystemPrompt) return cachedSystemPrompt;

  const files = readdirSync(KNOWLEDGE_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const sections = files.map((file) => {
    const raw = readFileSync(join(KNOWLEDGE_DIR, file), "utf-8");
    const content = raw.replace(/^﻿/, "");
    return `<!-- FILE: ${file} -->\n${content}`;
  });

  cachedSystemPrompt = `<!-- KNOWLEDGE_VERSION: ${KNOWLEDGE_VERSION} -->\n\n` + sections.join("\n\n---\n\n");
  return cachedSystemPrompt;
}
