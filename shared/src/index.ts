/**
 * Shared domain types and constants for the office energy monitor.
 * Defined once here and imported by the backend, dashboard and bot so all
 * three always speak the same shape.
 */

export type DeviceType = "fan" | "light";
export type RoomId = "drawing" | "work1" | "work2";
export type DeviceStatus = "on" | "off";

export interface Device {
  /** Stable unique id, e.g. "work1-fan-1". */
  id: string;
  type: DeviceType;
  /** Human label within its room, e.g. "Fan 1", "Light 3". */
  label: string;
  room: RoomId;
  status: DeviceStatus;
  /** Rated power draw in watts when the device is on. */
  watts: number;
  /** ISO timestamp of the last status change. */
  lastChanged: string;
}

export interface RoomSummary {
  room: RoomId;
  name: string;
  /** Power currently drawn by this room, in watts. */
  watts: number;
  devicesOn: number;
  devicesTotal: number;
}

/** A full snapshot of office state — the payload both interfaces render. */
export interface OfficeSnapshot {
  devices: Device[];
  totalWatts: number;
  rooms: RoomSummary[];
  todayKwh: number;
  /** Currently active alerts, so the dashboard stays consistent with devices. */
  alerts: Alert[];
  timestamp: string;
}

/** Rated wattage per device type (fan 60 W, light 15 W). */
export const WATTAGE: Record<DeviceType, number> = {
  fan: 60,
  light: 15,
};

/** Devices present in every room. */
export const DEVICES_PER_ROOM: Record<DeviceType, number> = {
  fan: 2,
  light: 3,
};

/** The three fixed rooms, in display order. */
export const ROOMS: ReadonlyArray<{ id: RoomId; name: string }> = [
  { id: "drawing", name: "Drawing Room" },
  { id: "work1", name: "Work Room 1" },
  { id: "work2", name: "Work Room 2" },
];

/** Office hours (local), used by the alerts engine. */
export const OFFICE_HOURS = { openHour: 9, closeHour: 17 } as const;

/** Hours a room must be fully on before it raises a "left on" alert. */
export const CONTINUOUS_ON_HOURS = 2;

export type AlertType = "after-hours" | "room-left-on";

export interface Alert {
  /** Stable de-duplication key, e.g. "after-hours" or "room-left-on:work2". */
  id: string;
  type: AlertType;
  room?: RoomId;
  message: string;
  /** ISO timestamp of when the alert was first raised. */
  timestamp: string;
}

/** Socket.IO event names shared by the backend, dashboard and bot. */
export const SOCKET_EVENTS = {
  stateUpdate: "state:update",
  alertNew: "alert:new",
} as const;
