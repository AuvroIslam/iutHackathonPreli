import type { Alert } from "@office/shared";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Timestamped list of active anomalies (after-hours, room left on). */
export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <section className="panel">
      <h2 className="panel__title">Active Alerts</h2>
      {alerts.length === 0 ? (
        <p className="alerts__empty">No alerts — everything looks fine. ✅</p>
      ) : (
        <div className="alerts">
          {alerts.map((alert) => (
            <div className="alert" key={`${alert.id}-${alert.timestamp}`}>
              <span className="alert__icon">⚠️</span>
              <div>
                <div>{alert.message}</div>
                <div className="alert__time">{formatTime(alert.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
