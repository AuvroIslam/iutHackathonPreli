import { OFFICE_HOURS, type Device, type DeviceStatus } from "@office/shared";

export type Rng = () => number;

export interface SimulateOptions {
  /** Injectable RNG for deterministic tests; defaults to Math.random. */
  rng?: Rng;
  /** Fraction of devices that reconsider their state each tick (0..1). */
  churnRate?: number;
}

const DEFAULT_CHURN_RATE = 0.3;

/**
 * Probability a device should be ON, biased by room and hour of day.
 * Work rooms are busy during office hours and mostly quiet after; the drawing
 * room (a waiting area) is intermittent. A non-zero after-hours chance leaves a
 * few devices on so the alerts engine has something realistic to catch.
 */
function targetOnProbability(device: Device, hour: number): number {
  const officeHours = hour >= OFFICE_HOURS.openHour && hour < OFFICE_HOURS.closeHour;
  if (device.room === "drawing") {
    return officeHours ? 0.35 : 0.05;
  }
  return officeHours ? 0.85 : 0.15;
}

/**
 * Advance the simulation by one tick. Each device independently has a chance to
 * reconsider its on/off state, biased by time of day and room. `lastChanged` is
 * only updated for devices whose status actually flips.
 */
export function simulateTick(
  devices: Device[],
  now: Date,
  options: SimulateOptions = {},
): { devices: Device[]; changed: string[] } {
  const rng = options.rng ?? Math.random;
  const churnRate = options.churnRate ?? DEFAULT_CHURN_RATE;
  const hour = now.getHours();
  const timestamp = now.toISOString();
  const changed: string[] = [];

  const nextDevices = devices.map((device) => {
    if (rng() >= churnRate) {
      return device;
    }
    const desired: DeviceStatus = rng() < targetOnProbability(device, hour) ? "on" : "off";
    if (desired === device.status) {
      return device;
    }
    changed.push(device.id);
    return { ...device, status: desired, lastChanged: timestamp };
  });

  return { devices: nextDevices, changed };
}
