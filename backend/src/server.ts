import { createApp } from "./app";
import { OfficeStore } from "./store";

const PORT = Number(process.env.PORT ?? 4000);
const TICK_MS = Number(process.env.SIM_TICK_MS ?? 2500);

const store = new OfficeStore();
const app = createApp(store);

store.start(TICK_MS);

app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT} (sim tick ${TICK_MS}ms)`);
});
