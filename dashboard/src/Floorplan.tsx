import { ROOMS, type OfficeSnapshot } from "@office/shared";

const ROOM_W = 260;
const ROOM_H = 300;
const ROOM_GAP = 30;
const ROOM_Y = 10;

const LIGHT_X = [60, 130, 200];
const LIGHT_Y = 100;
const FAN_X = [95, 175];
const FAN_Y = 215;

function FanIcon({ cx, cy, on }: { cx: number; cy: number; on: boolean }) {
  return (
    <g className={`fp-fan ${on ? "fp-fan--on" : ""}`}>
      {[0, 120, 240].map((deg) => (
        <ellipse
          key={deg}
          className="fp-fan-blade"
          cx={cx}
          cy={cy - 10}
          rx={5}
          ry={10}
          transform={`rotate(${deg} ${cx} ${cy})`}
        />
      ))}
      <circle className="fp-fan-hub" cx={cx} cy={cy} r={3.5} />
    </g>
  );
}

/**
 * Top-view office layout. Lights glow when ON and fans spin when running,
 * reflecting the live device state straight from the snapshot.
 */
export function Floorplan({ snapshot }: { snapshot: OfficeSnapshot }) {
  const onIds = new Set(
    snapshot.devices.filter((device) => device.status === "on").map((device) => device.id),
  );
  const isOn = (id: string): boolean => onIds.has(id);

  const totalW = ROOMS.length * ROOM_W + (ROOMS.length - 1) * ROOM_GAP;

  return (
    <section className="panel">
      <h2 className="panel__title">Office Layout (Top View)</h2>
      <svg
        className="fp"
        viewBox={`0 0 ${totalW} ${ROOM_H + 2 * ROOM_Y}`}
        role="img"
        aria-label="Office floorplan with live device states"
      >
        {ROOMS.map((room, roomIndex) => {
          const ox = roomIndex * (ROOM_W + ROOM_GAP);
          return (
            <g key={room.id} transform={`translate(${ox}, 0)`}>
              <rect className="fp-room" x={0} y={ROOM_Y} width={ROOM_W} height={ROOM_H} rx={10} />
              <text className="fp-room-label" x={ROOM_W / 2} y={ROOM_Y + 26} textAnchor="middle">
                {room.name}
              </text>

              {LIGHT_X.map((lx, i) => (
                <g key={`light-${i}`}>
                  <circle
                    className={`fp-light ${isOn(`${room.id}-light-${i + 1}`) ? "fp-light--on" : ""}`}
                    cx={lx}
                    cy={LIGHT_Y}
                    r={11}
                  />
                  <text className="fp-dev-label" x={lx} y={LIGHT_Y + 26} textAnchor="middle">
                    L{i + 1}
                  </text>
                </g>
              ))}

              {FAN_X.map((fx, i) => (
                <g key={`fan-${i}`}>
                  <FanIcon cx={fx} cy={FAN_Y} on={isOn(`${room.id}-fan-${i + 1}`)} />
                  <text className="fp-dev-label" x={fx} y={FAN_Y + 30} textAnchor="middle">
                    F{i + 1}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
      </svg>

      <div className="fp-legend">
        <span>
          <i className="fp-legend-dot fp-legend-dot--on" /> Light on
        </span>
        <span>
          <i className="fp-legend-dot" /> Light off
        </span>
        <span>🌀 Fan spins when running</span>
      </div>
    </section>
  );
}
