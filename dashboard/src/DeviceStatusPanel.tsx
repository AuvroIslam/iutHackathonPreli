import { useState } from "react";
import { ROOMS, type OfficeSnapshot, type RoomId } from "@office/shared";
import { DeviceIcon } from "./ui/DeviceIcon";
import { ChevronGlyph } from "./ui/Glyphs";

/** Live on/off state of all 15 devices, grouped into collapsible rooms. */
export function DeviceStatusPanel({ snapshot }: { snapshot: OfficeSnapshot }) {
  const [open, setOpen] = useState<Record<RoomId, boolean>>({
    drawing: true,
    work1: true,
    work2: true,
  });

  return (
    <section className="card card--devices">
      <div className="card__head">
        <h2 className="card__title">Device Status</h2>
        <span className="chip chip--soft">{snapshot.devices.length} Devices</span>
      </div>

      <div className="dsp">
        {ROOMS.map((room) => {
          const devices = snapshot.devices.filter((d) => d.room === room.id);
          const on = devices.filter((d) => d.status === "on").length;
          const isOpen = open[room.id];
          return (
            <div className="dsp__group" key={room.id}>
              <button
                className="dsp__header"
                onClick={() => setOpen((prev) => ({ ...prev, [room.id]: !prev[room.id] }))}
                aria-expanded={isOpen}
              >
                <span className="dsp__room">{room.name}</span>
                <span className="dsp__count">
                  {on} of {devices.length} on
                </span>
                <ChevronGlyph size={18} className={`dsp__chev ${isOpen ? "is-open" : ""}`} />
              </button>

              {isOpen && (
                <div className="dsp__devices">
                  {devices.map((device) => {
                    const isOn = device.status === "on";
                    return (
                      <div className={`dchip ${isOn ? "is-on" : "is-off"}`} key={device.id}>
                        <DeviceIcon type={device.type} on={isOn} size={20} />
                        <span className="dchip__label">{device.label}</span>
                        <span className="dchip__state">{isOn ? "ON" : "OFF"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
