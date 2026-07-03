async function post(path: string, body?: unknown): Promise<void> {
  await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Demo helpers: warp the simulated clock to after hours so the alert panel and
 * the bot's proactive nudge fire on cue during a live demo, or reset to now.
 */
export function DemoControls() {
  return (
    <section className="panel demo">
      <span className="panel__title" style={{ margin: 0 }}>
        Demo
      </span>
      <button className="btn" onClick={() => void post("/api/sim/settime", { hour: 22 })}>
        Warp to 10 PM
      </button>
      <button className="btn" onClick={() => void post("/api/sim/reset")}>
        Reset clock
      </button>
    </section>
  );
}
