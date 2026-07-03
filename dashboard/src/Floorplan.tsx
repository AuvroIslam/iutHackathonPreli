import { ROOMS, type Device, type OfficeSnapshot, type RoomId } from "@office/shared";
import { ROOM_IMAGES } from "./assets";
import { DeviceIcon } from "./ui/DeviceIcon";

/**
 * Ceiling-fixture positions (% of the room image). Fans sit high on a wide
 * centre line (above the desks); lights spread along a lower band, inset from
 * the walls and clear of the door in the bottom-right corner.
 */
const FAN_SPOTS = [
  { x: 31, y: 23 },
  { x: 69, y: 23 },
];
const LIGHT_SPOTS = [
  { x: 24, y: 72 },
  { x: 50, y: 72 },
  { x: 70, y: 72 },
];

function RoomTile({ room, name, devices }: { room: RoomId; name: string; devices: Device[] }) {
  const lights = devices.filter((d) => d.type === "light");
  const fans = devices.filter((d) => d.type === "fan");

  return (
    <div className="fp-room">
      <img className="fp-room__img" src={ROOM_IMAGES[room]} alt={`${name} top view`} />
      <div className="fp-room__overlay">
        {fans.map((fan, i) => (
          <span
            key={fan.id}
            className="fp-dot"
            style={{ left: `${FAN_SPOTS[i]?.x ?? 50}%`, top: `${FAN_SPOTS[i]?.y ?? 50}%` }}
          >
            <DeviceIcon type="fan" on={fan.status === "on"} size={42} className="fp-icon" />
          </span>
        ))}
        {lights.map((light, i) => (
          <span
            key={light.id}
            className="fp-dot"
            style={{ left: `${LIGHT_SPOTS[i]?.x ?? 50}%`, top: `${LIGHT_SPOTS[i]?.y ?? 70}%` }}
          >
            <DeviceIcon type="light" on={light.status === "on"} size={30} className="fp-icon" />
          </span>
        ))}
      </div>
      <span className="fp-room__label">{name}</span>
    </div>
  );
}

/** Top-view office layout: lights glow and fans spin from live device state. */
export function Floorplan({ snapshot }: { snapshot: OfficeSnapshot }) {
  return (
    <section className="card card--floor">
      <div className="card__head">
        <h2 className="card__title">Office Floorplan</h2>
        <div className="fp-legend">
          <span className="fp-legend__item">
            <DeviceIcon type="light" on size={16} /> Light on
          </span>
          <span className="fp-legend__item">
            <DeviceIcon type="light" on={false} size={16} /> Light off
          </span>
          <span className="fp-legend__item">
            <DeviceIcon type="fan" on size={16} /> Fan running
          </span>
          <span className="fp-legend__item">
            <DeviceIcon type="fan" on={false} size={16} /> Fan off
          </span>
        </div>
      </div>

      <div className="fp-grid">
        {ROOMS.map((room) => (
          <RoomTile
            key={room.id}
            room={room.id}
            name={room.name}
            devices={snapshot.devices.filter((d) => d.room === room.id)}
          />
        ))}
      </div>
    </section>
  );
}
