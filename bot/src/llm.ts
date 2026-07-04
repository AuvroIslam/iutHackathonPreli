import { config } from "./config";

const SYSTEM_PROMPT =
  "You are a warm, friendly office assistant for a small company, chatting with the boss on Discord. " +
  "Rephrase the given facts into a friendly, natural reply. " +
  "STRICT RULES: Mention EVERY room and EVERY device state exactly as given — never drop, merge, " +
  "summarise away or omit any room or number. Only use the facts provided; never invent, add or " +
  "guess any rooms, device names, numbers, times, equipment (e.g. PCs, ACs) or people that are not " +
  "in the text, and do not introduce specifics (like room numbers) that were not provided. " +
  "Keep it conversational (one short clause per room is fine) — completeness matters more than " +
  "brevity. Vary your opening and wording every time — never start two replies with the same " +
  "sentence; a preamble is optional, you may lead straight with the first room. When a room is all " +
  "off, say it is off (fans and lights), not merely \"dark\". No markdown headings, no bullet lists.";

// Two worked examples (few-shot) with different openings so the model copies the
// "cover every room with its exact count, conversationally" pattern — and learns
// to vary its phrasing rather than reusing one stock intro.
const EXAMPLE_FACTS_1 =
  "Drawing Room: 1 fan ON, 2 lights ON.\nWork Room 1: all off.\nWork Room 2: 2 fans ON, 3 lights ON.";
const EXAMPLE_REPLY_1 =
  "Here's the office right now, boss — the Drawing Room has 1 fan and 2 lights on, Work Room 1 is " +
  "completely off, and Work Room 2 is busy with 2 fans and 3 lights running.";
const EXAMPLE_FACTS_2 =
  "Drawing Room: all off.\nWork Room 1: 1 fan ON, 3 lights ON.\nWork Room 2: 2 fans ON, 2 lights ON.";
const EXAMPLE_REPLY_2 =
  "The Drawing Room is all switched off, Work Room 1 is running 1 fan and 3 lights, and Work Room 2 " +
  "has 2 fans and 2 lights on.";

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
      temperature: 0.55,
      max_tokens: 220,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: EXAMPLE_FACTS_1 },
        { role: "assistant", content: EXAMPLE_REPLY_1 },
        { role: "user", content: EXAMPLE_FACTS_2 },
        { role: "assistant", content: EXAMPLE_REPLY_2 },
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
 * Rephrase factual text into a friendly reply. Tries OpenAI first, then Groq,
 * then falls back to the raw facts (deterministic template) — so the bot always
 * answers with correct data even when a provider is missing, down or rate-limited.
 */
export async function humanize(facts: string): Promise<string> {
  if (config.openai.apiKey) {
    try {
      return await chatComplete(OPENAI_URL, config.openai.apiKey, config.openai.model, facts);
    } catch (error) {
      console.warn("[bot] OpenAI failed, falling back to Groq:", (error as Error).message);
    }
  }
  if (config.groq.apiKey) {
    try {
      return await chatComplete(GROQ_URL, config.groq.apiKey, config.groq.model, facts);
    } catch (error) {
      console.warn("[bot] Groq failed, using template:", (error as Error).message);
    }
  }
  return facts;
}
