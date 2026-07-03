# PRD — "Lights, Fans, Discord" Office Energy Monitor

> Product Requirements Document for the Techathon Nationals & Rover Summit preliminary challenge (Okkhor Technology / IUT Robotics Society): *"Lights, Fans, Discord: The Boss's Big Idea."*

## Context
The boss wants to stop paying for lights and fans left running after everyone goes home. The ask: a system that lets **anyone monitor the office's electrical devices and electricity usage** through both a **live web dashboard** and a **Discord bot**, backed by **one shared source of truth**. There is no physical hardware — device state is **simulated but dynamic**. Deliverables also include a **system diagram** and a **Wokwi electrical schematic**.

**Confirmed technical decisions:** Node/TypeScript full-stack · Gemini/Groq free-tier LLM for the bot (with a deterministic template fallback) · Wokwi for the schematic.

---

## 1. How this product wins each rubric line
| Criterion | Weight | How we win it |
|---|---|---|
| Working web dashboard, real-time data | 20% | Socket.IO push; zero-refresh live device panel + power meter; values visibly ticking during the demo |
| Working Discord bot on real simulated data | 10% | Bot reads the **same backend** REST/WS; `!status` / `!room` / `!usage` return computed live values, never hardcoded |
| Dashboard visuals & UX | 10% | Top-view office floorplan with **glowing lights + spinning fans** (bonus), clean room cards, animated power meter |
| Clear, correct system diagram | 15% | Single-source-of-truth data-flow diagram in Excalidraw/draw.io (**not Mermaid**), committed to the repo |
| Sensible circuit schematic | 15% | Wokwi ESP32 one-room representative circuit + pin-mapping table + electrical reasoning |
| Demo & dummy-data simulation quality | 15% | Occupancy- and time-of-day-aware simulator + tight, scripted <3-min video |
| Documented codebase & commits | 15% | Monorepo, thorough README, conventional commits, feature branches, one-command run |

Every section below traces back to one of these rows — no criterion left unaddressed.

---

## 2. Goals & non-goals
**Goals**
- One backend = one source of truth for all 15 devices.
- Live dashboard that updates **without a manual page refresh**.
- Discord bot that answers from **real simulated data** in a friendly, human tone.
- Proactive after-hours alert pushed to a Discord channel.
- Correct system diagram + sensible Wokwi schematic.
- Clean, public, well-documented repo with a meaningful commit history.

**Non-goals**
- Real hardware (simulation only).
- Device *control* / toggling from the UI — the spec is **monitoring** (optional stretch, not required).
- Authentication, multi-tenant, or role management.
- Long-term historical database beyond what "today's usage" requires.

## 3. Users
- **The Boss** *(primary)* — wants an at-a-glance dashboard and a quick Discord remote to ask "is anything still on?" without opening a browser.
- **Employees** — occasionally query the bot; receive the proactive "you left stuff on" nudge.

## 4. Fixed domain facts (from the spec, v1.2 corrected)
- **3 rooms:** Drawing Room, Work Room 1, Work Room 2.
- **Each room:** 2 fans + 3 lights = **5 devices/room** → **15 devices total** (6 fans + 9 lights).
- **Reference wattages:** fan = 60 W, light = 15 W (config constants; all totals are computed live). Max office draw = 6×60 + 9×15 = **495 W** (so the spec's 740 W `!usage` example is illustrative only).

> **Note on the v1.2 document:** the email correction and page 1 give the authoritative figure — **5 devices/room, 15 devices total**. Page 1 is now fixed, but the doc still contains stale "18 devices" references on pages 2 and 3, and the floorplan summary on page 6 still reads "Total Devices: 18." These are un-updated errors. We build to **15** (2 fans + 3 lights per room × 3 rooms = 6 fans + 9 lights).
- **Office hours:** 9 AM – 5 PM.
- **Alert rules:** (a) any device ON after office hours; (b) a room where **all devices have been ON continuously > 2 hours**.
- Alerts must be **timestamped**. Dashboard and bot must reflect the **same live data**.

## 5. Architecture — single source of truth
The **Simulation Engine + State Store live only in the backend**. The dashboard and the bot never keep their own copy — they read from the backend. This is exactly the required `[Simulated Device Layer] → [Backend API] → [Web UI] && [Discord Bot]` shape.

```
            +-------------------------------------------------+
            |                 BACKEND (Node/TS)               |
            |                                                 |
 [Wokwi/    |  Simulation Engine --> State Store (in-memory,  |
  ESP32     |  (mutates 15          |  the ONE source of      |
  concept]..>  devices on a tick)   |  truth) --> Usage       |
            |                       |       accumulator (kWh) |
            |                       v                         |
            |            Alerts Engine (rule checks each tick)|
            |            /                          \         |
            |  REST /api (state, room, usage)      Socket.IO  |
            +----|---------------------------|---------|------+
                 |                           |         |
          (query)                    (push, no refresh)|(alert events)
                 |                           |         |
          +------v-------+          +--------v----+  +-v------------+
          | Discord Bot  |          | React       |  | Discord Bot  |
          | (discord.js) |          | Dashboard   |  | posts LLM    |
          | !status/!room|          | (Vite)      |  | alert to     |
          | !usage (LLM) |          | floorplan   |  | channel      |
          +--------------+          +-------------+  +--------------+
```
> The final deliverable diagram will be drawn in **Excalidraw / draw.io** (the spec forbids Mermaid). This ASCII sketch is a reference for the same flow.

## 6. Tech stack
- **Backend:** Node.js + TypeScript, **Express** (REST) + **Socket.IO** (real-time push). Simulator, alerts engine, and usage accumulator are internal modules of this one process.
- **Dashboard:** **React + Vite + TypeScript**, `socket.io-client`; CSS keyframes / Framer Motion for fan spin and light glow.
- **Bot:** **discord.js** as a separate process → calls backend REST and subscribes to Socket.IO `alert` events.
- **LLM:** **Gemini or Groq free tier** to humanize responses and alert messages, with a **deterministic template fallback** when no API key is present (so the demo never breaks).
- **Repo:** npm/pnpm workspaces monorepo.

## 7. Data model
```ts
type Device = {
  id: string;              // "work1-fan-1"
  type: "fan" | "light";
  label: string;           // "Fan 1"
  room: "drawing" | "work1" | "work2";
  status: "on" | "off";
  watts: number;           // 60 (fan) / 15 (light); contributes 0 when off
  lastChanged: string;     // ISO timestamp — set only when status actually flips
};
```
**Derived values (never stored twice):**
- `totalWatts = Σ(status === "on" ? watts : 0)`
- `perRoomWatts[room]`
- `todayKwh` from the usage accumulator.

## 8. Simulation engine *(demo & data quality — 15%)*
- **Tick every 2–3 s.** Each tick probabilistically flips some devices, weighted for realism:
  - **Time-of-day aware:** during 9–5 the work rooms are mostly ON; after 5 PM most turn OFF, but a *deliberate* few stay ON so the after-hours alert can fire.
  - **Occupancy pattern:** Drawing Room (waiting area) is mostly OFF/intermittent; Work Rooms are busier during hours.
  - Update `lastChanged` **only** when a device actually flips.
- **Demo-mode / time-warp:** an env flag or `POST /api/sim/settime` fast-forwards the simulated clock (e.g. to ~10 PM) so alerts fire on cue during the 3-minute video.
- **Usage accumulator:** each tick adds `Σwatts × Δt` to a daily Wh counter, exposed as kWh.

## 9. Backend API
**REST** (used by the bot and for debugging):
| Endpoint | Returns |
|---|---|
| `GET /api/state` | All 15 devices + total W + per-room W + today's kWh |
| `GET /api/room/:room` | One room's devices + summary |
| `GET /api/usage` | Current total W + today's estimated kWh |
| `GET /api/alerts` | Active + recent alerts (timestamped) |
| `POST /api/sim/settime` | Demo-mode: set the simulated clock |

**Socket.IO events** (used by the dashboard and bot):
- `state:update` — snapshot (full or diff) each tick → drives the zero-refresh UI.
- `alert:new` — pushes to the dashboard alert panel **and** the bot channel post.

## 10. Web dashboard *(20% real-time + 10% visuals)*
- **Live Device Status Panel** — all 15 devices grouped by room (5 per room); each clearly identified ("Fan 1", "Light 3") with an on/off indicator; updates live via `state:update`, no refresh.
- **Live Power Meter** — large total-Watts readout + animated gauge/bar; per-room breakdown; today's kWh; all live.
- **Active Alerts Panel** — timestamped list of anomalies (after-hours ON; room all-ON > 2 h).
- **Bonus floorplan (top view)** — recreate the doc's office layout; **lights glow when ON, fans spin (CSS animation) when running**; per-room heat by load. This is the visual wow-factor for the UX score and bonus points.
- **"Live" connection indicator** so judges can see it's genuinely streaming.

## 11. Discord bot *(10%)*
| Command | Behavior |
|---|---|
| `!status` | Whole-office summary — e.g. "Drawing Room: 1 fan ON, 2 lights ON. Work Room 1: all off. Work Room 2: 2 fans ON, 3 lights ON." |
| `!room <name>` | One room's status; accepts aliases (`work1`, `wr1`, "Work Room 1") |
| `!usage` | "Total power right now: X W. Today's estimated usage: Y kWh." |

- All answers are computed from `GET /api/...` — **never hardcoded or random**. The LLM rewrites the computed facts into a warm, human sentence; the template fallback covers a missing key or rate limit.
- **Bonus proactive alert:** the bot subscribes to `alert:new`, generates a friendly nudge via the LLM, and posts it to a designated channel — e.g. *"⚠️ Hey! Work Room 2 still has 2 fans and 3 lights ON and it's 10 PM. Did someone forget to leave?"*

## 12. Alerts engine
Runs each tick inside the backend:
- **Rule A — after-hours:** current time outside 9–5 **and** any device ON.
- **Rule B — room left running:** any room where all 5 devices are ON **and** each `lastChanged` is > 2 h ago.
- **Deduplicate:** fire once per condition; re-arm only after the condition clears (don't spam every tick).
- Emit `alert:new` with `{ room, message, timestamp }`.

## 13. Hardware / electrical schematic — Wokwi *(15%)*
A **representative one-room** circuit (2 fans + 3 lights = 5 devices) — physically sensible; no need to wire all 15.
- **Controller:** ESP32 (WiFi lets it "publish" device states to the backend, matching the data-flow story).
- **Devices modeled:** 3 LEDs = lights, 2 DC motors (via a driver) = fans. In a real deployment these are AC loads behind relays; the ESP32 reads each relay's aux/opto feedback as a **digital state input** and reads **aggregate current** via an **ACS712** on the ADC to estimate power.

**Pin mapping (representative):**
| Signal | ESP32 pin | Direction | Purpose |
|---|---|---|---|
| Light 1 state | GPIO 25 | input | on/off sense |
| Light 2 state | GPIO 26 | input | on/off sense |
| Light 3 state | GPIO 27 | input | on/off sense |
| Fan 1 state | GPIO 32 | input | on/off sense |
| Fan 2 state | GPIO 33 | input | on/off sense |
| Room current | GPIO 34 (ADC1) | analog in | ACS712 → derive watts |
| Power | 3V3 / GND | — | sensor + logic rails |

**Electrical reasoning to document in the README:**
- Opto-isolation between the AC sense side and the ESP32 logic.
- ACS712 sits at ~2.5 V at 0 A; scale the ADC reading to amps, then `W = V_line × I`.
- Pull-downs on the state inputs to avoid floating pins.
- Motors need a driver + flyback diode — never drive them directly from an ESP32 GPIO.
- Deliver the schematic **in Wokwi** (screenshot + shareable link) plus this reasoning.

## 14. Repo, docs & commits *(15%)*
This criterion rewards a repo a judge can clone, understand, and run in minutes — and a commit history that reads like a build log. Concrete requirements below.

### 14.1 Repository structure
```
office-energy-monitor/
  backend/            # Express + Socket.IO + simulator + alerts + usage accumulator
    src/
      devices.ts      # 15-device seed + Device type (single source of truth)
      simulator.ts    # tick engine (time-of-day / occupancy aware)
      alerts.ts       # after-hours + room-left-on rules
      usage.ts        # kWh accumulator
      server.ts       # REST routes + Socket.IO wiring
    tests/            # unit tests (see 14.4)
  dashboard/          # React + Vite
    src/components/    # DevicePanel, PowerMeter, AlertsPanel, Floorplan
  bot/                # discord.js (commands + alert subscriber + LLM helper)
  docs/               # system-diagram.(png|excalidraw), wokwi-schematic.png, screenshots
  .env.example        # every var, no real secrets
  .gitignore          # node_modules, .env, build output
  README.md           # root: setup + run for all three, architecture, demo-mode
  package.json        # workspaces + root scripts (dev, lint, test)
```

### 14.2 README (root) — required sections
- **What it is** + a screenshot/GIF of the live dashboard.
- **Architecture** — embed `docs/system-diagram.png` and one paragraph on the single-source-of-truth flow.
- **Quick start** — prerequisites, `npm install`, then **one command** to run everything (`npm run dev` via workspaces/`concurrently`), plus how to run each package alone.
- **Configuration** — table of env vars (`DISCORD_TOKEN`, `DISCORD_ALERT_CHANNEL_ID`, `LLM_API_KEY`, `LLM_PROVIDER`, `BACKEND_URL`, `PORT`, `SIM_TICK_MS`); note LLM key is optional (template fallback).
- **Demo mode** — how to time-warp the clock to trigger alerts (§7).
- **Discord bot setup** — how to create the app, invite it, required intents/permissions.
- **Hardware schematic** — embed `docs/wokwi-schematic.png` + Wokwi link + the electrical reasoning (§13).
- **Project structure** + **scripts reference** (dev/build/lint/test).

### 14.3 Commit & branch discipline (this is literally scored)
- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, scoped where useful — e.g. `feat(backend): add after-hours alert rule`, `feat(dashboard): live power meter via socket`, `docs(readme): add demo-mode instructions`.
- **Small, frequent, buildable commits** — one logical change each; every commit should leave the repo runnable. Avoid a single "final project" mega-commit (a red flag to judges).
- **Branch per feature** → PR/merge into `main` (even solo — shows process). Suggested: `feat/simulator`, `feat/dashboard-panels`, `feat/discord-bot`, `feat/alerts`.
- Spread commits across the build timeline so history mirrors the §16 build order.

### 14.4 Code quality & hygiene
- **TypeScript strict mode** across all three packages; shared `Device`/event types (a `shared/` module or duplicated type kept in sync) so backend, dashboard, and bot speak the same shape.
- **ESLint + Prettier** with a root `npm run lint`; no unused/dead code.
- **Modular, single-responsibility files** (see 14.1) — no god-file.
- **Config via env, never hardcoded** secrets/tokens; `.env` git-ignored, `.env.example` committed.
- **Error handling**: bot degrades to template replies if the LLM/backend fails; dashboard shows a "disconnected" state and auto-reconnects the socket.
- Root `.gitignore` excludes `node_modules/`, `.env`, and build artifacts.

### 14.5 Minimal but meaningful tests
A few focused unit tests demonstrate rigor and protect the demo:
- `usage`: power total = Σ(on-device watts); e.g. all-on = 495 W.
- `alerts`: Rule A fires outside 9–5 with any device on; Rule B fires only when all 5 room devices exceed 2 h; both **de-duplicate** and re-arm on clear.
- `simulator`: a device's `lastChanged` updates **only** on an actual status flip.
Wire them to `npm test` and mention the command in the README.

## 15. Demo video script (<3 min)
1. **(20 s)** Problem + one-line architecture (show the diagram).
2. **(60 s)** Dashboard live: point out the ticking device panel, power meter, and floorplan glow/spin — no refresh.
3. **(40 s)** Discord: run `!status`, `!room work2`, `!usage`; show the friendly replies match the dashboard.
4. **(30 s)** Trigger demo-mode time-warp → after-hours alert appears on the dashboard **and** the bot posts a proactive nudge.
5. **(10 s)** Repo + wrap.

## 16. Build order
1. Backend state store + simulator + REST →
2. Socket.IO push →
3. Dashboard panels (live) →
4. Discord bot commands →
5. Alerts engine + proactive post →
6. Floorplan visual polish →
7. Wokwi schematic + Excalidraw diagram →
8. README + demo recording.

## 17. Risks & mitigations
| Risk | Mitigation |
|---|---|
| LLM key / rate limit fails mid-demo | Deterministic template fallback keeps replies working |
| Alert timing in a 3-min video | Demo-mode time-warp guarantees it fires on cue |
| "Data is hardcoded" scrutiny | Bot always hits `/api`; show it side-by-side with the dashboard |
| Diagram rule violation | Use Excalidraw / draw.io — never Mermaid |

---

## Acceptance checklist (Definition of Done)
- [ ] 15 devices across 3 rooms (6 fans + 9 lights), dynamic state, one backend source of truth.
- [ ] Dashboard: live device panel, live power meter + per-room breakdown, timestamped alerts — all without refresh.
- [ ] Bonus floorplan with glowing lights + spinning fans.
- [ ] Bot: `!status`, `!room`, `!usage` from real data + friendly tone + proactive alert.
- [ ] System diagram (non-Mermaid) + Wokwi schematic with pin map, committed to repo.
- [ ] Public repo, clear README, conventional commit history.
- [ ] <3-min demo video showing dashboard, bot, and data flow.
