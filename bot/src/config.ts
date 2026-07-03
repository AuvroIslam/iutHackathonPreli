export type LlmProvider = "none" | "groq" | "gemini";

function readProvider(): LlmProvider {
  const raw = (process.env.LLM_PROVIDER ?? "none").toLowerCase();
  return raw === "groq" || raw === "gemini" ? raw : "none";
}

export const config = {
  discordToken: process.env.DISCORD_TOKEN ?? "",
  alertChannelId: process.env.DISCORD_ALERT_CHANNEL_ID ?? "",
  backendUrl: process.env.BACKEND_URL ?? "http://localhost:4000",
  llm: {
    provider: readProvider(),
    apiKey: process.env.LLM_API_KEY ?? "",
    model: process.env.LLM_MODEL ?? "",
  },
};
