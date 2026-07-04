import { useEffect, useState } from "react";
import { apiUrl } from "./backend";

const DEMO_SECONDS = 180;

/** Office is "after hours" outside 9 AM–5 PM (local time). */
function isAfterHours(): boolean {
  const h = new Date().getHours();
  return h < 9 || h >= 17;
}

function mmss(total: number): string {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

async function post(path: string, body?: unknown): Promise<void> {
  await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Demo controls.
 * - "Run demo" (only shown after hours): makes the frozen office behave like
 *   normal 9 AM–5 PM — devices toggle, no alerts — for 3 minutes, then auto-resets.
 * - "Warp to 10 PM": freezes the current state and shows its after-hours alerts.
 * - "Reset clock": returns to real time (alerts follow the real hour).
 */
export function DemoControls() {
  const [afterHours, setAfterHours] = useState(isAfterHours);
  const [remaining, setRemaining] = useState(0);
  const running = remaining > 0;

  useEffect(() => {
    const id = setInterval(() => setAfterHours(isAfterHours()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining <= 0) {
      return;
    }
    const id = setTimeout(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const startDemo = () => {
    void post(apiUrl("/api/sim/demo"));
    setRemaining(DEMO_SECONDS);
  };

  const warp = () => {
    void post(apiUrl("/api/sim/settime"), { hour: 22 });
    setRemaining(0);
  };

  const reset = () => {
    void post(apiUrl("/api/sim/reset"));
    setRemaining(0);
  };

  return (
    <div className="demo">
      {afterHours && (
        <button className="btn btn--dark" onClick={startDemo} disabled={running}>
          {running
            ? `Demo running… resets in ${mmss(remaining)}`
            : "▶ Run demo (simulate office hours)"}
        </button>
      )}
      <button className="btn btn--ghost" onClick={warp}>
        Warp to 10 PM
      </button>
      <button className="btn btn--ghost" onClick={reset}>
        Reset clock
      </button>
    </div>
  );
}
