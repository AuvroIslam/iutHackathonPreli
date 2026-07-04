import { OFFICE_HOURS, type Device, type DeviceStatus } from "@office/shared";

export type Rng = () => number;

export interface SimulateOptions {
  /** Injectable RNG for deterministic tests; defaults to Math.random. */
  rng?: Rng;
  /** Fraction of devices that reconsider their state each tick (0..1). */
  churnRate?: number;
}

const DEFAULT_CHURN_RATE = 0.15;

// After hours a "forgotten" on-device has this small chance to be switched off
// each time it is reconsidered — low, so devices left on persist (and can trip
// the >2h "room left on" alert), while the occasional one flicks off for realism.
const AFTER_HOURS_TURN_OFF_CHANCE = 0.08;

/**
 * Probability a device is ON during office hours, by room. Work rooms are busy;
 * the drawing room (a waiting area) is only intermittently used. After hours is
 * handled separately in {@link simulateTick} — nothing powers on by itself once
 * everyone has left.
 */
function officeHoursOnProbability(device: Device): number {
  return device.room === "drawing" ? 0.35 : 0.85;
}

/**
 * Advance the simulation by one tick. Each device has a chance to reconsider its
 * state. During office hours people come and go, so devices churn on/off. After
 * hours nobody arrives to switch anything on: off devices stay off, and devices
 * left on are "forgotten" — they mostly stay on (keeping their original
 * `lastChanged`, so a fully-on room can eventually trip the 2-hour alert), with
 * the occasional one switched off by someone heading out. `lastChanged` is only
 * updated for devices whose status actually flips.
 */
export function simulateTick(
  devices: Device[],
  now: Date,
  options: SimulateOptions = {},
): { devices: Device[]; changed: string[] } {
  const rng = options.rng ?? Math.random;
  const churnRate = options.churnRate ?? DEFAULT_CHURN_RATE;
  const hour = now.getHours();
  const officeHours = hour >= OFFICE_HOURS.openHour && hour < OFFICE_HOURS.closeHour;
  const timestamp = now.toISOString();
  const changed: string[] = [];

  const nextDevices = devices.map((device) => {
    if (rng() >= churnRate) {
      return device;
    }

    let desired: DeviceStatus;
    if (officeHours) {
      desired = rng() < officeHoursOnProbability(device) ? "on" : "off";
    } else if (device.status === "on") {
      // Forgotten-on: mostly stays on, occasionally switched off on the way out.
      desired = rng() < AFTER_HOURS_TURN_OFF_CHANCE ? "off" : "on";
    } else {
      // Off stays off after hours — nothing turns on by itself.
      desired = "off";
    }

    if (desired === device.status) {
      return device;
    }
    changed.push(device.id);
    return { ...device, status: desired, lastChanged: timestamp };
  });

  return { devices: nextDevices, changed };
}
