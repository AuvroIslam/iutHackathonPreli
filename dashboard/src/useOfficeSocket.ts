import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_EVENTS, type Alert, type OfficeSnapshot } from "@office/shared";
import { BACKEND_URL } from "./backend";

export interface OfficeSocketState {
  snapshot: OfficeSnapshot | null;
  alerts: Alert[];
  connected: boolean;
}

/**
 * Subscribe to the backend's real-time feed. Devices and alerts both come from
 * the same snapshot, so the alerts panel always stays consistent with the
 * device panel. The backend remains the single source of truth.
 */
export function useOfficeSocket(): OfficeSocketState {
  const [snapshot, setSnapshot] = useState<OfficeSnapshot | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = BACKEND_URL
      ? io(BACKEND_URL, { transports: ["websocket", "polling"] })
      : io({ transports: ["websocket", "polling"] });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on(SOCKET_EVENTS.stateUpdate, (data: OfficeSnapshot) => setSnapshot(data));

    return () => {
      socket.close();
    };
  }, []);

  return { snapshot, alerts: snapshot?.alerts ?? [], connected };
}
