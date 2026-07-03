import { config } from "./config";

const SYSTEM_PROMPT =
  "You are a warm, friendly office assistant for a small company, chatting with the boss on Discord. " +
  "Rewrite the given facts as a short, natural, conversational reply (1-2 sentences). " +
  "Keep every number and room name exactly as given. No markdown headings, no bullet lists.";

async function callGroq(facts: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.llm.apiKey}`,
    },
    body: JSON.stringify({
      model: config.llm.model || "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: facts },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Groq responded ${res.status}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Groq returned an empty response");
  }
  return text;
}

async function callGemini(facts: string): Promise<string> {
  const model = config.llm.model || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.llm.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: facts }] }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini responded ${res.status}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return text;
}

/**
 * Rephrase factual text into a friendly reply using the configured LLM. Falls
 * back to the raw facts when no provider/key is set or the call fails, so the
 * bot always answers with correct data even without an API key.
 */
export async function humanize(facts: string): Promise<string> {
  if (config.llm.provider === "none" || !config.llm.apiKey) {
    return facts;
  }
  try {
    return config.llm.provider === "groq" ? await callGroq(facts) : await callGemini(facts);
  } catch (error) {
    console.warn("[bot] LLM humanize failed, using template:", (error as Error).message);
    return facts;
  }
}
