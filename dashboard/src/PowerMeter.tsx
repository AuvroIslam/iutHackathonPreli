import type { OfficeSnapshot } from "@office/shared";
import { LOGO } from "./assets";

/** Whole-office ceiling: 6 fans (60 W) + 9 lights (15 W) = 495 W. */
const MAX_WATTS = 495;

/** Hero card: total office power against capacity, plus today's energy. */
export function PowerMeter({ snapshot }: { snapshot: OfficeSnapshot }) {
  const pct = Math.min(100, (snapshot.totalWatts / MAX_WATTS) * 100);

  return (
    <section className="card card--power card--ink">
      <div className="card__head">
        <h2 className="card__title">Total Office Power</h2>
        <span className="logo-badge">
          <img src={LOGO.lightning} alt="" />
        </span>
      </div>

      <div className="power__readout">
        <span className="power__value">{snapshot.totalWatts}</span>
        <span className="power__unit">W</span>
      </div>
      <p className="power__max">of {MAX_WATTS} W max</p>

      <div className="track track--lg">
        <div className="track__fill" style={{ width: `${pct}%` }} />
        <span className="track__caption">
          {snapshot.totalWatts} / {MAX_WATTS} W
        </span>
      </div>

      <div className="power__foot">
        <span className="logo-badge">
          <img src={LOGO.lightning} alt="" />
        </span>
        <div>
          <div className="power__foot-label">Today&apos;s usage</div>
          <div className="power__foot-value">{snapshot.todayKwh} kWh</div>
        </div>
      </div>
    </section>
  );
}
