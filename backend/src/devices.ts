import { DEVICES_PER_ROOM, ROOMS, WATTAGE, type Device, type DeviceType } from "@office/shared";

const TYPE_ORDER: DeviceType[] = ["fan", "light"];

/**
 * Build the initial set of 15 devices (2 fans + 3 lights per room across the
 * 3 rooms = 6 fans + 9 lights). Every device starts off. This array is the
 * single source of truth that the simulator mutates and both interfaces read.
 */
export function createInitialDevices(now: Date = new Date()): Device[] {
  const timestamp = now.toISOString();
  const devices: Device[] = [];

  for (const room of ROOMS) {
    for (const type of TYPE_ORDER) {
      for (let index = 1; index <= DEVICES_PER_ROOM[type]; index++) {
        const typeLabel = type === "fan" ? "Fan" : "Light";
        devices.push({
          id: `${room.id}-${type}-${index}`,
          type,
          label: `${typeLabel} ${index}`,
          room: room.id,
          status: "off",
          watts: WATTAGE[type],
          lastChanged: timestamp,
        });
      }
    }
  }

  return devices;
}
