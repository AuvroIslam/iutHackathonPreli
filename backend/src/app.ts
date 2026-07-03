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

  return app;
}
