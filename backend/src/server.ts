import { createServer } from "node:http";
import { Server } from "socket.io";
import { SOCKET_EVENTS, type Alert, type OfficeSnapshot } from "@office/shared";
import { createApp } from "./app";
import { OfficeStore } from "./store";

const PORT = Number(process.env.PORT ?? 4000);
const TICK_MS = Number(process.env.SIM_TICK_MS ?? 6000);

const store = new OfficeStore();
const app = createApp(store);
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// Send the current snapshot to a client as soon as it connects, then keep it in
// sync by broadcasting every tick. The store is the single source of truth.
io.on("connection", (socket) => {
  socket.emit(SOCKET_EVENTS.stateUpdate, store.snapshot());
});

store.on("update", (snapshot: OfficeSnapshot) => {
  io.emit(SOCKET_EVENTS.stateUpdate, snapshot);
});

store.on("alert", (alert: Alert) => {
  io.emit(SOCKET_EVENTS.alertNew, alert);
});

store.start(TICK_MS);

httpServer.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT} (sim tick ${TICK_MS}ms)`);
});
