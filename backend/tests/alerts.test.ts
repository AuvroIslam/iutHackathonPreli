import { describe, expect, it } from "vitest";
import type { Device } from "@office/shared";
import { createInitialDevices } from "../src/devices";
import { AlertsEngine, detectAlerts } from "../src/alerts";

/** Local-time date so getHours() is timezone-independent in tests. */
const at = (hour: number): Date => new Date(2026, 6, 3, hour, 0, 0);

const withStatus = (devices: Device[], status: "on" | "off"): Device[] =>
  devices.map((device) => ({ ...device, status }));

const roomOnFor = (roomId: string, hoursAgo: number, now: Date): Device[] =>
  createInitialDevices().map((device) =>
    device.room === roomId
      ? {
          ...device,
          status: "on" as const,
          lastChanged: new Date(now.getTime() - hoursAgo * 3_600_000).toISOString(),
        }
      : device,
  );

describe("detectAlerts", () => {
  it("raises after-hours when devices are on outside 9-5", () => {
    const devices = withStatus(createInitialDevices(), "on");
    const alerts = detectAlerts(devices, at(22));
    expect(alerts.some((a) => a.id === "after-hours")).toBe(true);
  });

  it("does not raise after-hours during office hours", () => {
    const devices = withStatus(createInitialDevices(), "on");
    const alerts = detectAlerts(devices, at(11));
    expect(alerts.some((a) => a.id === "after-hours")).toBe(false);
  });

  it("raises room-left-on only when all room devices exceed 2 h", () => {
    const now = at(11);
    expect(detectAlerts(roomOnFor("work2", 3, now), now).some((a) => a.id === "room-left-on:work2")).toBe(
      true,
    );
    expect(detectAlerts(roomOnFor("work2", 1, now), now).some((a) => a.id === "room-left-on:work2")).toBe(
      false,
    );
  });
});

describe("AlertsEngine", () => {
  it("raises each alert once, then re-arms after it clears", () => {
    const engine = new AlertsEngine();
    const onAtNight = withStatus(createInitialDevices(), "on");
    const offDuringDay = withStatus(createInitialDevices(), "off");

    const first = engine.evaluate(onAtNight, at(22));
    expect(first.raised.map((a) => a.id)).toContain("after-hours");

    // Same condition still holds -> active but not re-raised.
    const second = engine.evaluate(onAtNight, at(22));
    expect(second.raised).toEqual([]);
    expect(second.active.map((a) => a.id)).toContain("after-hours");

    // Condition clears -> dropped from active.
    const cleared = engine.evaluate(offDuringDay, at(11));
    expect(cleared.active).toEqual([]);

    // Re-arms and raises again next time it holds.
    const again = engine.evaluate(onAtNight, at(22));
    expect(again.raised.map((a) => a.id)).toContain("after-hours");
  });
});
