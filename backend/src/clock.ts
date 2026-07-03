/**
 * A clock that can be warped forward or back for demo mode, so alerts (which
 * depend on the time of day) can be triggered on cue during a live demo without
 * waiting for real office hours to pass.
 */
export class SimClock {
  private offsetMs = 0;

  /** Current simulated time. */
  now(): Date {
    return new Date(Date.now() + this.offsetMs);
  }

  /** Warp the simulated clock so `now()` returns `target`. */
  setTo(target: Date): void {
    this.offsetMs = target.getTime() - Date.now();
  }

  /** Return to real time. */
  reset(): void {
    this.offsetMs = 0;
  }
}
