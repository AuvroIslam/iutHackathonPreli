import {
  CONTINUOUS_ON_HOURS,
  OFFICE_HOURS,
  ROOMS,
  type Alert,
  type Device,
} from "@office/shared";

function hoursSince(iso: string, now: Date): number {
  return (now.getTime() - new Date(iso).getTime()) / 3_600_000;
}

/** Human summary of which rooms/devices are on, e.g. "Work Room 2 (1 fan, 2 lights)". */
function summarizeOn(devices: Device[]): string {
  const parts: string[] = [];
  for (const room of ROOMS) {
    const on = devices.filter((device) => device.room === room.id && device.status === "on");
    if (on.length === 0) {
      continue;
    }
    const fans = on.filter((device) => device.type === "fan").length;
    const lights = on.filter((device) => device.type === "light").length;
    const bits: string[] = [];
    if (fans > 0) {
      bits.push(`${fans} fan${fans === 1 ? "" : "s"}`);
    }
    if (lights > 0) {
      bits.push(`${lights} light${lights === 1 ? "" : "s"}`);
    }
    parts.push(`${room.name} (${bits.join(", ")})`);
  }
  return parts.join(", ");
}

/**
 * Pure detection of every alert condition that currently holds, given the live
 * devices and the current time. Timestamps are set to `now`; the engine below
 * preserves the original timestamp for alerts that persist across ticks.
 */
export function detectAlerts(devices: Device[], now: Date): Alert[] {
  const alerts: Alert[] = [];
  const timestamp = now.toISOString();
  const hour = now.getHours();
  const afterHours = hour < OFFICE_HOURS.openHour || hour >= OFFICE_HOURS.closeHour;

  // Rule A: anything left on outside office hours.
  const onCount = devices.filter((device) => device.status === "on").length;
  if (afterHours && onCount > 0) {
    alerts.push({
      id: "after-hours",
      type: "after-hours",
      message: `${onCount} device${onCount === 1 ? "" : "s"} still on after office hours — ${summarizeOn(devices)}.`,
      timestamp,
    });
  }

  // Rule B: a room where every device has been on continuously for > 2 hours.
  for (const room of ROOMS) {
    const inRoom = devices.filter((device) => device.room === room.id);
    if (inRoom.length === 0) {
      continue;
    }
    const allOn = inRoom.every((device) => device.status === "on");
    const allOverThreshold = inRoom.every(
      (device) => hoursSince(device.lastChanged, now) >= CONTINUOUS_ON_HOURS,
    );
    if (allOn && allOverThreshold) {
      alerts.push({
        id: `room-left-on:${room.id}`,
        type: "room-left-on",
        room: room.id,
        message: `All ${inRoom.length} devices in ${room.name} have been on for over ${CONTINUOUS_ON_HOURS} hours.`,
        timestamp,
      });
    }
  }

  return alerts;
}

/**
 * Stateful wrapper around {@link detectAlerts}. Tracks which alerts are already
 * active so each condition is raised once (not every tick) and re-arms after it
 * clears. Returns the full active list plus only the newly-raised alerts.
 */
export class AlertsEngine {
  private readonly active = new Map<string, Alert>();

  evaluate(devices: Device[], now: Date): { active: Alert[]; raised: Alert[] } {
    const current = detectAlerts(devices, now);
    const currentIds = new Set(current.map((alert) => alert.id));
    const raised: Alert[] = [];

    for (const alert of current) {
      if (!this.active.has(alert.id)) {
        this.active.set(alert.id, alert);
        raised.push(alert);
      }
    }

    for (const id of [...this.active.keys()]) {
      if (!currentIds.has(id)) {
        this.active.delete(id);
      }
    }

    return { active: [...this.active.values()], raised };
  }

  list(): Alert[] {
    return [...this.active.values()];
  }
}
