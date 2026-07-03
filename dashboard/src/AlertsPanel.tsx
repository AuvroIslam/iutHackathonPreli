import type { Alert } from "@office/shared";
import { WarningGlyph } from "./ui/Glyphs";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Timestamped list of active anomalies (after-hours, room left on). */
export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <section className="card card--alerts card--ink">
      <div className="card__head">
        <h2 className="card__title">Active Alerts</h2>
        {alerts.length > 0 && (
          <span className="chip chip--amber">
            {alerts.length} Alert{alerts.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="alerts__empty">No active alerts — everything looks fine.</p>
      ) : (
        <div className="alerts">
          {alerts.map((alert) => (
            <div className="alert" key={`${alert.id}-${alert.timestamp}`}>
              <span className="alert__icon">
                <WarningGlyph size={20} />
              </span>
              <span className="alert__msg">{alert.message}</span>
              <span className="alert__time">{formatTime(alert.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
