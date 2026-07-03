import { ROOMS, type OfficeSnapshot } from "@office/shared";

/** Live on/off state of all 15 devices, grouped by room. */
export function DeviceStatusPanel({ snapshot }: { snapshot: OfficeSnapshot }) {
  return (
    <section className="panel">
      <h2 className="panel__title">Device Status</h2>
      <div className="rooms">
        {ROOMS.map((room) => {
          const devices = snapshot.devices.filter((device) => device.room === room.id);
          return (
            <div key={room.id}>
              <h3 className="room__name">{room.name}</h3>
              <div className="devices">
                {devices.map((device) => (
                  <span
                    key={device.id}
                    className={`device ${device.status === "on" ? "device--on" : ""}`}
                    title={`${device.label} — ${device.status.toUpperCase()}`}
                  >
                    <span className="device__dot" />
                    {device.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
