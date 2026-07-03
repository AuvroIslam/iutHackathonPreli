import { ROOMS, type Device, type OfficeSnapshot } from "@office/shared";

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** Factual description of what is on in a room, e.g. "2 fans ON, 3 lights ON". */
function describeRoomDevices(devices: Device[]): string {
  const fansOn = devices.filter((d) => d.type === "fan" && d.status === "on").length;
  const lightsOn = devices.filter((d) => d.type === "light" && d.status === "on").length;
  if (fansOn === 0 && lightsOn === 0) {
    return "all off";
  }
  const parts: string[] = [];
  if (fansOn > 0) {
    parts.push(`${plural(fansOn, "fan")} ON`);
  }
  if (lightsOn > 0) {
    parts.push(`${plural(lightsOn, "light")} ON`);
  }
  return parts.join(", ");
}

/** Whole-office status line, one room per line. */
export function formatStatus(snapshot: OfficeSnapshot): string {
  return ROOMS.map((room) => {
    const devices = snapshot.devices.filter((d) => d.room === room.id);
    return `${room.name}: ${describeRoomDevices(devices)}.`;
  }).join("\n");
}

/** Single-room status line. */
export function formatRoom(name: string, devices: Device[]): string {
  return `${name}: ${describeRoomDevices(devices)}.`;
}

/** Usage summary matching the spec's example phrasing. */
export function formatUsage(totalWatts: number, todayKwh: number): string {
  return `Total power right now: ${totalWatts}W. Today's estimated usage: ${todayKwh} kWh.`;
}
