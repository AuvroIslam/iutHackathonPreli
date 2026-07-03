import { AlertsPanel } from "./AlertsPanel";
import { DemoControls } from "./DemoControls";
import { DeviceStatusPanel } from "./DeviceStatusPanel";
import { Floorplan } from "./Floorplan";
import { PowerMeter } from "./PowerMeter";
import { useOfficeSocket } from "./useOfficeSocket";

export function App() {
  const { snapshot, alerts, connected } = useOfficeSocket();

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">⚡ Office Energy Monitor</h1>
        <span className={`conn ${connected ? "conn--live" : "conn--down"}`}>
          {connected ? "Live" : "Disconnected"}
        </span>
      </header>

      <main className="app__main">
        <DemoControls />
        {snapshot ? (
          <>
            <Floorplan snapshot={snapshot} />
            <PowerMeter snapshot={snapshot} />
            <AlertsPanel alerts={alerts} />
            <DeviceStatusPanel snapshot={snapshot} />
          </>
        ) : (
          <p className="muted">Waiting for data…</p>
        )}
      </main>
    </div>
  );
}
