import type { OfficeSnapshot } from "@office/shared";

/** Full load for one room: 2 fans (60 W) + 3 lights (15 W) = 165 W. */
const ROOM_MAX_WATTS = 165;

/** Total office power plus a per-room breakdown, updated live. */
export function PowerMeter({ snapshot }: { snapshot: OfficeSnapshot }) {
  return (
    <section className="panel">
      <h2 className="panel__title">Power Consumption</h2>
      <div className="meter__total">{snapshot.totalWatts} W</div>
      <p className="meter__sub">Today&apos;s estimated usage: {snapshot.todayKwh} kWh</p>

      {snapshot.rooms.map((room) => (
        <div className="bar" key={room.room}>
          <div className="bar__label">
            <span>{room.name}</span>
            <span>
              {room.watts} W · {room.devicesOn}/{room.devicesTotal} on
            </span>
          </div>
          <div className="bar__track">
            <div
              className="bar__fill"
              style={{ width: `${Math.min(100, (room.watts / ROOM_MAX_WATTS) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </section>
  );
}
