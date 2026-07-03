import { describe, expect, it } from "vitest";
import type { Device } from "@office/shared";
import { createInitialDevices } from "../src/devices";
import { UsageAccumulator } from "../src/usage";

const allOn = (now: Date): Device[] =>
  createInitialDevices(now).map((device) => ({ ...device, status: "on" as const }));

describe("UsageAccumulator", () => {
  it("integrates power over time into kWh (495 W for 1 h = 0.495 kWh)", () => {
    const t0 = new Date("2026-07-03T09:00:00.000Z");
    const usage = new UsageAccumulator(t0);
    usage.update(allOn(t0), new Date("2026-07-03T10:00:00.000Z"));
    expect(usage.kwh).toBeCloseTo(0.495, 5);
  });

  it("resets the counter at the start of a new day", () => {
    const t0 = new Date("2026-07-03T09:00:00.000Z");
    const usage = new UsageAccumulator(t0);
    usage.update(allOn(t0), new Date("2026-07-03T10:00:00.000Z"));
    expect(usage.kwh).toBeGreaterThan(0);
    usage.update(allOn(t0), new Date("2026-07-04T00:30:00.000Z"));
    expect(usage.kwh).toBe(0);
  });
});
