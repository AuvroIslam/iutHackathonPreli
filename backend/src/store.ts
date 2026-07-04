import { EventEmitter } from "node:events";
import {
  CONTINUOUS_ON_HOURS,
  OFFICE_HOURS,
  ROOMS,
  type Alert,
  type Device,
  type OfficeSnapshot,
  type RoomId,
} from "@office/shared";
import { roomSummaries, totalWatts } from "./aggregation";
import { createInitialDevices } from "./devices";
import { simulateTick } from "./simulator";
import { AlertsEngine } from "./alerts";
import { SimClock } from "./clock";
import { UsageAccumulator } from "./usage";

const round = (value: number, dp: number): number => Number(value.toFixed(dp));

// Occasionally, during office hours, a whole room gets "left on" — every device
// on and held that way — so that after 2 h it naturally trips the room-left-on
// alert (rather than that case never occurring). A different room is picked each
// time and it resumes normal use afterward, so nothing is permanently static.
// Tune: higher start = more frequent events, higher end = shorter events.
const LEAVE_ON_START_CHANCE = 0.006;
const LEAVE_ON_END_CHANCE = 0.03;

/**
 * Realistic starting mix so the office is never blank at startup — most work
 * devices on, the drawing room intermittent. If the process happens to start
 * after hours, these become the "left on" devices the alerts engine catches
 * (rather than an all-off office that nothing would ever switch on again).
 */
function seedInitialDevices(now: Date): Device[] {
  return createInitialDevices(now).map((device) => {
    const pOn = device.room === "drawing" ? 0.3 : 0.7;
    return Math.random() < pOn ? { ...device, status: "on" as const } : device;
  });
}

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
  private demoTimer: ReturnType<typeof setTimeout> | undefined;
  private leftOn: { room: RoomId; since: number } | null = null;

  constructor(now: Date = new Date()) {
    super();
    this.devices = seedInitialDevices(now);
    this.usage = new UsageAccumulator(now);
  }

  snapshot(): OfficeSnapshot {
    return {
      devices: this.devices,
      totalWatts: totalWatts(this.devices),
      rooms: roomSummaries(this.devices),
      todayKwh: round(this.usage.kwh, 3),
      alerts: this.alerts.list(),
      timestamp: this.clock.now().toISOString(),
    };
  }

  /** Integrate usage over the elapsed interval, then advance the simulation. */
  tick(): OfficeSnapshot {
    const now = this.clock.now();
    this.usage.update(this.devices, now);
    this.updateLeftOnRoom(now);
    const prev = this.devices;
    const next = simulateTick(prev, now).devices;
    const left = this.leftOn;
    // While a room is "left on", keep it fully on (frozen) so it can reach the
    // 2-hour threshold; every other room churns normally.
    this.devices = left ? next.map((d, i) => (d.room === left.room ? prev[i] : d)) : next;
    return this.refresh();
  }

  private isOfficeHours(now: Date): boolean {
    const h = now.getHours();
    return h >= OFFICE_HOURS.openHour && h < OFFICE_HOURS.closeHour;
  }

  /**
   * Randomly leave a whole room fully on during office hours, then later let it
   * resume normal use — so the "room on > 2 h" case genuinely occurs in the
   * data. A new room is chosen each time; nothing is permanently pinned.
   */
  private updateLeftOnRoom(now: Date): void {
    if (!this.isOfficeHours(now)) {
      return;
    }
    if (this.leftOn) {
      const hoursOn = (now.getTime() - this.leftOn.since) / 3_600_000;
      if (hoursOn > CONTINUOUS_ON_HOURS + 0.5 && Math.random() < LEAVE_ON_END_CHANCE) {
        this.leftOn = null;
      }
      return;
    }
    if (Math.random() < LEAVE_ON_START_CHANCE) {
      const room = ROOMS[Math.floor(Math.random() * ROOMS.length)].id;
      const timestamp = now.toISOString();
      this.devices = this.devices.map((device) =>
        device.room === room ? { ...device, status: "on", lastChanged: timestamp } : device,
      );
      this.leftOn = { room, since: now.getTime() };
    }
  }

  /**
   * Evaluate alerts on the current state and broadcast a snapshot, without
   * advancing the simulation. Used by tick(), and by demo mode so a warped /
   * staged state is reflected on the dashboard and bot immediately.
   */
  refresh(): OfficeSnapshot {
    const now = this.clock.now();
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
    this.stopDemoTimer();
  }

  /**
   * "Warp to 10 PM" — warp the clock to `target` and re-broadcast immediately.
   * Both behaviour (frozen vs churning) and alerts follow the resulting hour, so
   * warping to 10 PM freezes the current state and shows its after-hours alerts.
   */
  setTime(target: Date): OfficeSnapshot {
    this.stopDemoTimer();
    return this.applyClock(target);
  }

  /**
   * "Run demo" — only offered after hours. Warp the clock to midday so the office
   * behaves exactly like normal 9 AM–5 PM (devices churn, no alerts), then
   * automatically return to real time after `durationMs`.
   */
  runDemo(durationMs: number): void {
    this.stopDemoTimer();
    const midday = new Date();
    midday.setHours(12, 0, 0, 0);
    this.applyClock(midday);
    this.demoTimer = setTimeout(() => this.reset(), durationMs);
  }

  /**
   * "Reset clock" — cancel any running demo and return to real time. Alerts then
   * follow the real hour (shown after hours, hidden during 9 AM–5 PM).
   */
  reset(): OfficeSnapshot {
    this.stopDemoTimer();
    return this.applyClock(null);
  }

  /** Apply a clock warp (or reset when null), resync usage, and broadcast. */
  private applyClock(target: Date | null): OfficeSnapshot {
    if (target) {
      this.clock.setTo(target);
    } else {
      this.clock.reset();
    }
    this.usage.resync(this.clock.now());
    return this.refresh();
  }

  private stopDemoTimer(): void {
    if (this.demoTimer) {
      clearTimeout(this.demoTimer);
      this.demoTimer = undefined;
    }
  }
}
