import { EventEmitter } from "node:events";
import type { Alert, Device, OfficeSnapshot } from "@office/shared";
import { roomSummaries, totalWatts } from "./aggregation";
import { createInitialDevices } from "./devices";
import { simulateTick } from "./simulator";
import { AlertsEngine } from "./alerts";
import { SimClock } from "./clock";
import { UsageAccumulator } from "./usage";

const round = (value: number, dp: number): number => Number(value.toFixed(dp));

/**
 * In-memory single source of truth for office device state. Holds the devices,
 * the usage accumulator and a clock; advances the simulation on an interval and
 * emits an "update" event with a fresh snapshot after every tick. Both the web
 * dashboard and the Discord bot read from this one store.
 */
export class OfficeStore extends EventEmitter {
  private devices: Device[];
  private readonly usage: UsageAccumulator;
  private readonly alerts = new AlertsEngine();
  private readonly clock = new SimClock();
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(now: Date = new Date()) {
    super();
    this.devices = createInitialDevices(now);
    this.usage = new UsageAccumulator(now);
  }

  snapshot(): OfficeSnapshot {
    return {
      devices: this.devices,
      totalWatts: totalWatts(this.devices),
      rooms: roomSummaries(this.devices),
      todayKwh: round(this.usage.kwh, 3),
      timestamp: this.clock.now().toISOString(),
    };
  }

  /** Integrate usage over the elapsed interval, then advance the simulation. */
  tick(): OfficeSnapshot {
    const now = this.clock.now();
    this.usage.update(this.devices, now);
    this.devices = simulateTick(this.devices, now).devices;
    const { raised } = this.alerts.evaluate(this.devices, now);
    const snapshot = this.snapshot();
    this.emit("update", snapshot);
    for (const alert of raised) {
      this.emit("alert", alert);
    }
    return snapshot;
  }

  /** Alerts currently active (after-hours, room left on). */
  activeAlerts(): Alert[] {
    return this.alerts.list();
  }

  start(intervalMs: number): void {
    this.stop();
    this.timer = setInterval(() => this.tick(), intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  /** Demo mode: warp the simulated clock (e.g. to 10 PM) to trigger alerts. */
  setTime(target: Date): void {
    this.clock.setTo(target);
  }
}
