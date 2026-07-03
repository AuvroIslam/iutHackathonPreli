import { OFFICE_HOURS, type OfficeSnapshot } from "@office/shared";
import { OFFICE_HOUR_BG } from "./assets";
import { ClockGlyph } from "./ui/Glyphs";

/**
 * Office-hours status, driven by the simulated clock in the snapshot so the
 * demo time-warp is reflected here too. The night cityscape reinforces the
 * "after hours" state that the alerts engine keys off.
 */
export function OfficeHours({ snapshot }: { snapshot: OfficeSnapshot }) {
  const hour = new Date(snapshot.timestamp).getHours();
  const open = hour >= OFFICE_HOURS.openHour && hour < OFFICE_HOURS.closeHour;

  return (
    <section
      className={`card card--hours ${open ? "is-open" : "is-closed"}`}
      style={{ backgroundImage: `url(${OFFICE_HOUR_BG})` }}
    >
      <div className="hours__scrim" />
      <div className="hours__content">
        <div className="card__head">
          <h2 className="card__title card__title--onDark">Office Hours</h2>
          <span className="chip chip--glass chip--icon">
            <ClockGlyph size={16} />
          </span>
        </div>
        <div className="hours__range">9:00 AM – 5:00 PM</div>
        <div className={`hours__status ${open ? "is-open" : "is-closed"}`}>
          <span className="hours__dot" />
          {open ? "Office is currently open" : "Office is currently closed"}
        </div>
      </div>
    </section>
  );
}
