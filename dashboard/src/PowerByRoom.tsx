import type { OfficeSnapshot } from "@office/shared";

/** Per-room power split as a share of the whole office's current draw. */
export function PowerByRoom({ snapshot }: { snapshot: OfficeSnapshot }) {
  const total = snapshot.totalWatts;

  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">Power by Room</h2>
      </div>

      <div className="byroom">
        {snapshot.rooms.map((room) => {
          const share = total > 0 ? Math.round((room.watts / total) * 100) : 0;
          return (
            <div className="byroom__col" key={room.room}>
              <div className="byroom__name">{room.name}</div>
              <div className="byroom__watts">
                {room.watts} <span className="byroom__unit">W</span>
              </div>
              <div className="track">
                <div className="track__fill" style={{ width: `${share}%` }} />
              </div>
              <div className="byroom__share">
                <strong>{share}%</strong> of total
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
