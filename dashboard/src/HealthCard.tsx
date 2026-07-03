import type { Alert } from "@office/shared";
import { CHECK_MARK } from "./assets";
import { WarningGlyph } from "./ui/Glyphs";

/** At-a-glance system health: all clear, or a count of what needs attention. */
export function HealthCard({ alerts }: { alerts: Alert[] }) {
  const clear = alerts.length === 0;

  return (
    <section className={`card card--health ${clear ? "is-clear" : "is-warn"}`}>
      <span className="health__badge">
        {clear ? (
          <span className="health__check">
            <img src={CHECK_MARK} alt="" />
          </span>
        ) : (
          <WarningGlyph size={30} />
        )}
      </span>
      <div className="health__text">
        <div className="health__title">
          {clear ? "All clear" : `${alerts.length} active alert${alerts.length === 1 ? "" : "s"}`}
        </div>
        <div className="health__sub">
          {clear ? "Everything looks fine right now." : "Something in the office needs a look."}
        </div>
      </div>
    </section>
  );
}
