import type { Device, OfficeSnapshot, RoomId, RoomSummary } from "@office/shared";
import { config } from "./config";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${config.backendUrl}${path}`);
  if (!res.ok) {
    throw new Error(`Backend ${path} responded ${res.status}`);
  }
  return (await res.json()) as T;
}

export function getState(): Promise<OfficeSnapshot> {
  return get<OfficeSnapshot>("/api/state");
}

export function getUsage(): Promise<{ totalWatts: number; todayKwh: number; timestamp: string }> {
  return get("/api/usage");
}

export function getRoom(
  room: RoomId,
): Promise<{ room: RoomId; summary?: RoomSummary; devices: Device[] }> {
  return get(`/api/room/${room}`);
}
