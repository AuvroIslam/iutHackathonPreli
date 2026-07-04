import "dotenv/config";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { io } from "socket.io-client";
import { SOCKET_EVENTS, type Alert } from "@office/shared";
import { handleCommand } from "./commands";
import { humanize } from "./llm";
import { config } from "./config";

if (!config.discordToken) {
  console.error(
    "[bot] DISCORD_TOKEN is not set. Copy bot/.env.example to bot/.env and add your bot token.",
  );
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (ready) => {
  console.log(`[bot] logged in as ${ready.user.tag}`);
});

client.on(Events.MessageCreate, (message) => {
  if (message.author.bot) {
    return;
  }
  void handleCommand(message.content).then((reply) => {
    if (reply) {
      void message.reply(reply);
    }
  });
});

// Proactive alerts: subscribe to the backend and post to the designated channel.
const socket = io(config.backendUrl, { transports: ["websocket", "polling"] });

socket.on(SOCKET_EVENTS.alertNew, (alert: Alert) => {
  if (!config.alertChannelId) {
    return;
  }
  void (async () => {
    const channel = await client.channels.fetch(config.alertChannelId).catch(() => null);
    if (channel && "send" in channel) {
      const text = await humanize(alert.message);
      await channel.send(`⚠️ ${text}`);
    }
  })();
});

void client.login(config.discordToken);
