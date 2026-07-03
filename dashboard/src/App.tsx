import { AlertsPanel } from "./AlertsPanel";
import { DemoControls } from "./DemoControls";
import { DeviceStatusPanel } from "./DeviceStatusPanel";
import { Floorplan } from "./Floorplan";
import { HealthCard } from "./HealthCard";
import { OfficeHours } from "./OfficeHours";
import { PowerByRoom } from "./PowerByRoom";
import { PowerMeter } from "./PowerMeter";
import { LOGO } from "./assets";
import { useOfficeSocket } from "./useOfficeSocket";

function lastUpdated(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function App() {
  const { snapshot, alerts, connected } = useOfficeSocket();

  return (
    <div className="app">
      <div className="app__ambient" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">
            <img className="brand__logo" src={LOGO.plug} alt="Office Energy Monitor logo" />
          </span>
          <h1 className="brand__title">Office Energy Monitor</h1>
        </div>

        <div className="topbar__right">
          <DemoControls />
          <span className="updated">Updated {lastUpdated(snapshot?.timestamp)}</span>
          <span className={`conn ${connected ? "conn--live" : "conn--down"}`}>
            <span className="conn__dot" />
            {connected ? "Live" : "Disconnected"}
          </span>
        </div>
      </header>

      {snapshot ? (
        <main className="grid">
          <div className="grid__row grid__row--top">
            <PowerMeter snapshot={snapshot} />
            <PowerByRoom snapshot={snapshot} />
            <OfficeHours snapshot={snapshot} />
          </div>

          <div className="grid__row grid__row--full">
            <Floorplan snapshot={snapshot} />
          </div>

          <div className="grid__row grid__row--full">
            <DeviceStatusPanel snapshot={snapshot} />
          </div>

          <div className="grid__row grid__row--bottom">
            <AlertsPanel alerts={alerts} />
            <HealthCard alerts={alerts} />
          </div>

          <footer className="refbar">
            Reference: Fan = 60 W &nbsp;·&nbsp; Light = 15 W &nbsp;·&nbsp; Max Capacity = 495 W
          </footer>
        </main>
      ) : (
        <main className="grid">
          <p className="waiting">Connecting to the office…</p>
        </main>
      )}
    </div>
  );
}
