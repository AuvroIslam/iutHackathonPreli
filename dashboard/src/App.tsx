import { DeviceStatusPanel } from "./DeviceStatusPanel";
import { PowerMeter } from "./PowerMeter";
import { useOfficeSocket } from "./useOfficeSocket";

export function App() {
  const { snapshot, connected } = useOfficeSocket();

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">⚡ Office Energy Monitor</h1>
        <span className={`conn ${connected ? "conn--live" : "conn--down"}`}>
          {connected ? "Live" : "Disconnected"}
        </span>
      </header>

      <main className="app__main">
        {snapshot ? (
          <>
            <PowerMeter snapshot={snapshot} />
            <DeviceStatusPanel snapshot={snapshot} />
          </>
        ) : (
          <p className="muted">Waiting for data…</p>
        )}
      </main>
    </div>
  );
}
