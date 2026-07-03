import "dotenv/config";
import { handleCommand } from "./commands";

/**
 * Offline harness to exercise the bot's command logic against a running backend
 * without a Discord connection. Usage: `npm run cli -w @office/bot -- status`.
 */
const input = process.argv.slice(2).join(" ") || "status";
const content = input.startsWith("!") ? input : `!${input}`;

handleCommand(content)
  .then((reply) => {
    console.log(reply ?? "(no reply)");
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("error:", (error as Error).message);
    process.exit(1);
  });
