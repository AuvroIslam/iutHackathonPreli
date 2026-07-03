import { describe, expect, it } from "vitest";
import type { Device, OfficeSnapshot } from "@office/shared";
import { formatStatus, formatUsage } from "../src/format";

const now = new Date().toISOString();

function device(
  room: Device["room"],
  type: Device["type"],
  index: number,
  status: Device["status"],
): Device {
  return {
    id: `${room}-${type}-${index}`,
    type,
    label: `${type === "fan" ? "Fan" : "Light"} ${index}`,
    room,
    status,
    watts: type === "fan" ? 60 : 15,
    lastChanged: now,
  };
}

function snapshot(devices: Device[]): OfficeSnapshot {
  return { devices, totalWatts: 0, rooms: [], todayKwh: 0, timestamp: now };
}

describe("formatStatus", () => {
  it("describes on/off devices per room", () => {
    const devices = [
      device("drawing", "fan", 1, "on"),
      device("drawing", "light", 1, "on"),
      device("drawing", "light", 2, "on"),
      device("work1", "fan", 1, "off"),
      device("work2", "fan", 1, "on"),
      device("work2", "fan", 2, "on"),
    ];
    const text = formatStatus(snapshot(devices));
    expect(text).toContain("Drawing Room: 1 fan ON, 2 lights ON.");
    expect(text).toContain("Work Room 1: all off.");
    expect(text).toContain("Work Room 2: 2 fans ON.");
  });
});

describe("formatUsage", () => {
  it("matches the spec phrasing with exact numbers", () => {
    expect(formatUsage(740, 4.2)).toBe(
      "Total power right now: 740W. Today's estimated usage: 4.2 kWh.",
    );
  });
});
