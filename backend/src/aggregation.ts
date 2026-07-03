import { ROOMS, type Device, type RoomSummary } from "@office/shared";

/** Power a single device is drawing right now (0 when off). */
export function deviceWatts(device: Device): number {
  return device.status === "on" ? device.watts : 0;
}

/** Total power drawn across the given devices, in watts. */
export function totalWatts(devices: Device[]): number {
  return devices.reduce((sum, device) => sum + deviceWatts(device), 0);
}

/** Per-room breakdown of power and how many devices are on. */
export function roomSummaries(devices: Device[]): RoomSummary[] {
  return ROOMS.map((room) => {
    const inRoom = devices.filter((device) => device.room === room.id);
    return {
      room: room.id,
      name: room.name,
      watts: totalWatts(inRoom),
      devicesOn: inRoom.filter((device) => device.status === "on").length,
      devicesTotal: inRoom.length,
    };
  });
}
