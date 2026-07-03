import { describe, expect, it } from "vitest";
import { createInitialDevices } from "../src/devices";
import { simulateTick, type Rng } from "../src/simulator";

/** Deterministic RNG that replays a fixed sequence, repeating the last value. */
function seededRng(values: number[]): Rng {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)]!;
}

describe("simulateTick", () => {
  it("only updates lastChanged for devices that actually flip", () => {
    const start = new Date("2026-07-03T10:00:00.000Z");
    const devices = createInitialDevices(start);
    const later = new Date("2026-07-03T10:01:00.000Z");

    // Device 0: churn passes (0.0 < churnRate) then desired ON (0.0 < pOn) => flips.
    // Every later device: churn fails (0.99) => untouched.
    const rng = seededRng([0.0, 0.0, 0.99]);
    const { devices: next, changed } = simulateTick(devices, later, { rng });

    expect(changed).toContain(next[0]!.id);
    expect(next[0]!.status).toBe("on");
    expect(next[0]!.lastChanged).toBe(later.toISOString());
    expect(next[1]!.lastChanged).toBe(start.toISOString());
  });

  it("keeps device identity and order stable across ticks", () => {
    const devices = createInitialDevices();
    const { devices: next, changed } = simulateTick(devices, new Date(), { rng: () => 0.99 });
    expect(changed).toEqual([]);
    expect(next.map((d) => d.id)).toEqual(devices.map((d) => d.id));
  });
});
