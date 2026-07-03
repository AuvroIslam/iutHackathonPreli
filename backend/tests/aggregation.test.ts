import { describe, expect, it } from "vitest";
import type { Device } from "@office/shared";
import { createInitialDevices } from "../src/devices";
import { roomSummaries, totalWatts } from "../src/aggregation";

const allOn = (devices: Device[]): Device[] =>
  devices.map((device) => ({ ...device, status: "on" as const }));

describe("device seed", () => {
  it("creates exactly 15 devices (6 fans + 9 lights)", () => {
    const devices = createInitialDevices();
    expect(devices).toHaveLength(15);
    expect(devices.filter((d) => d.type === "fan")).toHaveLength(6);
    expect(devices.filter((d) => d.type === "light")).toHaveLength(9);
  });

  it("gives every device a unique id", () => {
    const ids = createInitialDevices().map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("starts every device off", () => {
    expect(createInitialDevices().every((d) => d.status === "off")).toBe(true);
  });
});

describe("power aggregation", () => {
  it("draws 0 W when everything is off", () => {
    expect(totalWatts(createInitialDevices())).toBe(0);
  });

  it("draws 495 W at full load (6*60 + 9*15)", () => {
    expect(totalWatts(allOn(createInitialDevices()))).toBe(495);
  });

  it("breaks full load down to 165 W per room, 5 devices on", () => {
    const rooms = roomSummaries(allOn(createInitialDevices()));
    expect(rooms).toHaveLength(3);
    for (const room of rooms) {
      expect(room.watts).toBe(165);
      expect(room.devicesOn).toBe(5);
      expect(room.devicesTotal).toBe(5);
    }
  });
});
