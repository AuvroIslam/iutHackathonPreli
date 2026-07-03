# Office Energy Monitor — "Lights, Fans, Discord"

Monitor a small office's lights and fans (electricity usage) through a **live web dashboard** and a **Discord bot**, both backed by a **single shared backend** that is the one source of truth for device state.

> Techathon Nationals & Rover Summit — Preliminary Round submission.

## Status

🚧 **In progress.** Planning and specs are done; implementation is underway.

- 📄 Full build spec: [`prd.md`](./prd.md)
- 📄 Problem statement (v1.2): [`Hackathon Problem Statement (Preliminary Round) v1.2.md`](./Hackathon%20Problem%20Statement%20%28Preliminary%20Round%29%20v1.2.md)

## The office (fixed)

3 rooms — Drawing Room, Work Room 1, Work Room 2. Each room has **2 fans + 3 lights = 5 devices**, so **15 devices total** (6 fans + 9 lights). Reference wattages: fan = 60 W, light = 15 W.

## Planned architecture

```
[Simulated Device Layer] → [Backend API] → [ Web Dashboard ] && [ Discord Bot ]
```

The simulator and device state live **only in the backend**. The dashboard (real-time, no refresh) and the Discord bot both read from it, so they always reflect the same reality.

## Planned stack

- **Backend:** Node.js + TypeScript, Express (REST) + Socket.IO (real-time push), in-memory simulator + alerts + usage accumulator.
- **Dashboard:** React + Vite + TypeScript.
- **Bot:** discord.js, with an LLM (Gemini/Groq free tier) for friendly replies and a template fallback.

## Repository layout (planned)

```
backend/     # Express + Socket.IO + simulator + alerts + usage
dashboard/   # React + Vite
bot/         # discord.js
docs/        # system diagram, Wokwi schematic, screenshots
prd.md       # product requirements / build spec
```

## Getting started

Setup and run instructions (backend, dashboard, bot) will be added here as each component lands. See [`prd.md`](./prd.md) for the full plan in the meantime.
