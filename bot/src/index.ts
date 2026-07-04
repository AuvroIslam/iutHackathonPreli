import "dotenv/config";
import { createServer } from "node:http";
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

// A Discord bot has no HTTP surface, but Azure App Service expects something
// listening on its injected PORT or it treats the app as unhealthy and restarts
// it. Expose a tiny health endpoint only when a PORT is provided (i.e. hosted).
if (process.env.PORT) {
  createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("office-energy-bot ok");
  }).listen(Number(process.env.PORT), () => {
    console.log(`[bot] health server listening on :${process.env.PORT}`);
  });
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
