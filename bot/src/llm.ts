import { config } from "./config";

const SYSTEM_PROMPT =
  "You are a warm, friendly office assistant for a small company, chatting with the boss on Discord. " +
  "Rephrase the given facts into a friendly, natural reply. " +
  "STRICT RULES: Mention EVERY room and EVERY device state exactly as given — never drop, merge, " +
  "summarise away or omit any room or number. Only use the facts provided; never invent, add or " +
  "guess any rooms, device names, numbers, times, equipment (e.g. PCs, ACs) or people that are not " +
  "in the text, and do not introduce specifics (like room numbers) that were not provided. " +
  "Keep it conversational (one short clause per room is fine) — completeness matters more than " +
  "brevity. No markdown headings, no bullet lists.";

/**
 * Call an OpenAI-compatible chat-completions endpoint (Groq and OpenAI share
 * the same request/response shape) and return the assistant's text.
 */
async function chatComplete(
  url: string,
  apiKey: string,
  model: string,
  facts: string,
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: facts },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("empty response");
  }
  return text;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Rephrase factual text into a friendly reply. Tries Groq first, then OpenAI,
 * then falls back to the raw facts (deterministic template) — so the bot always
 * answers with correct data even when a provider is missing, down or rate-limited.
 */
export async function humanize(facts: string): Promise<string> {
  if (config.groq.apiKey) {
    try {
      return await chatComplete(GROQ_URL, config.groq.apiKey, config.groq.model, facts);
    } catch (error) {
      console.warn("[bot] Groq failed, falling back to OpenAI:", (error as Error).message);
    }
  }
  if (config.openai.apiKey) {
    try {
      return await chatComplete(OPENAI_URL, config.openai.apiKey, config.openai.model, facts);
    } catch (error) {
      console.warn("[bot] OpenAI failed, using template:", (error as Error).message);
    }
  }
  return facts;
}
