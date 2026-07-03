import { getRoom, getState, getUsage } from "./api";
import { formatRoom, formatStatus, formatUsage } from "./format";
import { humanize } from "./llm";
import { resolveRoom } from "./rooms";

/**
 * Route a raw message to a reply. Returns null for non-commands (so the bot
 * stays quiet). All answers come from the live backend, then get humanized.
 */
export async function handleCommand(content: string): Promise<string | null> {
  const trimmed = content.trim();
  if (!trimmed.startsWith("!")) {
    return null;
  }
  const [rawCmd, ...rest] = trimmed.slice(1).split(/\s+/);
  const command = (rawCmd ?? "").toLowerCase();
  const arg = rest.join(" ");

  try {
    switch (command) {
      case "status": {
        return await humanize(formatStatus(await getState()));
      }
      case "usage": {
        const usage = await getUsage();
        return await humanize(formatUsage(usage.totalWatts, usage.todayKwh));
      }
      case "room": {
        const roomId = resolveRoom(arg);
        if (!roomId) {
          return "I don't recognise that room. Try `!room drawing`, `!room work1`, or `!room work2`.";
        }
        const data = await getRoom(roomId);
        return await humanize(formatRoom(data.summary?.name ?? roomId, data.devices));
      }
      case "help": {
        return "I can help you keep an eye on the office! Try `!status`, `!room work1`, or `!usage`.";
      }
      default:
        return null;
    }
  } catch (error) {
    console.warn("[bot] command failed:", (error as Error).message);
    return "Sorry, I couldn't reach the office sensors right now — try again in a moment.";
  }
}
