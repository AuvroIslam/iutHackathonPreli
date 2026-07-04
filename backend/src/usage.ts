import type { Device } from "@office/shared";
import { totalWatts } from "./aggregation";

const MS_PER_HOUR = 3_600_000;

/** UTC calendar day, used to reset the counter at midnight. */
function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Accumulates today's energy usage by integrating the current power draw over
 * elapsed time. Call `update` with the devices that were active during the
 * interval (i.e. before applying this tick's changes), then read `kwh`.
 */
export class UsageAccumulator {
  private wattHours = 0;
  private lastAt: Date;
  private dayKey: string;

  constructor(now: Date = new Date()) {
    this.lastAt = now;
    this.dayKey = dayKey(now);
  }

  update(devices: Device[], now: Date): void {
    if (dayKey(now) !== this.dayKey) {
      this.wattHours = 0;
      this.dayKey = dayKey(now);
      this.lastAt = now;
    }
    const hours = Math.max(0, (now.getTime() - this.lastAt.getTime()) / MS_PER_HOUR);
    this.wattHours += totalWatts(devices) * hours;
    this.lastAt = now;
  }

  /**
   * Move the integration anchor to `now` without accumulating. Called when the
   * demo clock is warped, so a time jump doesn't add a spurious chunk of usage.
   */
  resync(now: Date): void {
    this.lastAt = now;
  }

  /** Energy used so far today, in kilowatt-hours. */
  get kwh(): number {
    return this.wattHours / 1000;
  }
}
