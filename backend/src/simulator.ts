import { OFFICE_HOURS, type Device, type DeviceStatus } from "@office/shared";

export type Rng = () => number;

export interface SimulateOptions {
  /** Injectable RNG for deterministic tests; defaults to Math.random. */
  rng?: Rng;
  /** Fraction of devices that reconsider their state each tick (0..1). */
  churnRate?: number;
}

const DEFAULT_CHURN_RATE = 0.15;

/**
 * Probability a device is ON during office hours, by room. Work rooms are busy;
 * the drawing room (a waiting area) is only intermittently used.
 */
function officeHoursOnProbability(device: Device): number {
  return device.room === "drawing" ? 0.35 : 0.85;
}

/**
 * Advance the simulation by one tick.
 *
 * During office hours (9 AM–5 PM by the clock) people come and go, so devices
 * churn on/off. Outside office hours the office is empty — nobody is there to
 * switch anything on or off — so the state is **frozen**: whatever was left on
 * stays on (the anomaly the alerts catch) and off stays off. `lastChanged` only
 * updates when a device actually flips.
 */
export function simulateTick(
  devices: Device[],
  now: Date,
  options: SimulateOptions = {},
): { devices: Device[]; changed: string[] } {
  const hour = now.getHours();
  const officeHours = hour >= OFFICE_HOURS.openHour && hour < OFFICE_HOURS.closeHour;

  // After hours: frozen — the office stays exactly as it was left.
  if (!officeHours) {
    return { devices, changed: [] };
  }

  const rng = options.rng ?? Math.random;
  const churnRate = options.churnRate ?? DEFAULT_CHURN_RATE;
  const timestamp = now.toISOString();
  const changed: string[] = [];

  const nextDevices = devices.map((device) => {
    if (rng() >= churnRate) {
      return device;
    }
    const desired: DeviceStatus = rng() < officeHoursOnProbability(device) ? "on" : "off";
    if (desired === device.status) {
      return device;
    }
    changed.push(device.id);
    return { ...device, status: desired, lastChanged: timestamp };
  });

  return { devices: nextDevices, changed };
}
