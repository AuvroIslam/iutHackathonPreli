/**
 * Bot configuration from env. The LLM humanizer tries OpenAI first, then falls
 * back to Groq, then to deterministic templates — so it always answers, with
 * or without keys. Each provider is enabled simply by setting its API key.
 */
export const config = {
  discordToken: process.env.DISCORD_TOKEN ?? "",
  alertChannelId: process.env.DISCORD_ALERT_CHANNEL_ID ?? "",
  backendUrl: process.env.BACKEND_URL ?? "http://localhost:4000",
  groq: {
    apiKey: process.env.GROQ_API_KEY ?? "",
    model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  },
};
