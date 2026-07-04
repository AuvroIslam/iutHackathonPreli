import cors from "cors";
import express, { type Express } from "express";
import { ROOMS, type RoomId } from "@office/shared";
import { roomSummaries } from "./aggregation";
import type { OfficeStore } from "./store";

const ROOM_IDS = new Set<string>(ROOMS.map((room) => room.id));

function isRoomId(value: string): value is RoomId {
  return ROOM_IDS.has(value);
}

/**
 * Build the REST API over the shared office store. Both the dashboard (for the
 * initial load) and the Discord bot read from these endpoints, so they always
 * reflect the same live state.
 */
export function createApp(store: OfficeStore): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/state", (_req, res) => {
    res.json(store.snapshot());
  });

  app.get("/api/usage", (_req, res) => {
    const snapshot = store.snapshot();
    res.json({
      totalWatts: snapshot.totalWatts,
      todayKwh: snapshot.todayKwh,
      timestamp: snapshot.timestamp,
    });
  });

  app.get("/api/alerts", (_req, res) => {
    res.json({ alerts: store.activeAlerts(), timestamp: store.snapshot().timestamp });
  });

  app.get("/api/room/:room", (req, res) => {
    const { room } = req.params;
    if (!isRoomId(room)) {
      res.status(404).json({ error: `Unknown room: ${room}` });
      return;
    }
    const snapshot = store.snapshot();
    const summary = roomSummaries(snapshot.devices).find((entry) => entry.room === room);
    const devices = snapshot.devices.filter((device) => device.room === room);
    res.json({ room, summary, devices, timestamp: snapshot.timestamp });
  });

  // Demo mode: warp the simulated clock so time-of-day alerts fire on cue.
  app.post("/api/sim/settime", (req, res) => {
    const hour: unknown = req.body?.hour;
    if (typeof hour !== "number" || hour < 0 || hour > 23) {
      res.status(400).json({ error: "Body must be { hour: 0-23 }" });
      return;
    }
    const target = new Date();
    target.setHours(hour, 0, 0, 0);
    store.setTime(target);
    res.json({ ok: true, now: store.snapshot().timestamp });
  });

  app.post("/api/sim/reset", (_req, res) => {
    store.reset();
    res.json({ ok: true, now: store.snapshot().timestamp });
  });

  // "Run demo": behave like normal office hours (churn, no alerts), auto-resets.
  app.post("/api/sim/demo", (_req, res) => {
    const durationMs = 3 * 60 * 1000;
    store.runDemo(durationMs);
    res.json({ ok: true, durationMs, now: store.snapshot().timestamp });
  });

  return app;
}
