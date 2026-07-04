import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_EVENTS, type Alert, type OfficeSnapshot } from "@office/shared";
import { BACKEND_URL, apiUrl } from "./backend";

const MAX_ALERTS = 20;

export interface OfficeSocketState {
  snapshot: OfficeSnapshot | null;
  alerts: Alert[];
  connected: boolean;
}

/**
 * Subscribe to the backend's real-time feed. Seeds the alert list from
 * /api/alerts on mount, then keeps the snapshot and alerts live via socket
 * events. The backend remains the single source of truth.
 */
export function useOfficeSocket(): OfficeSocketState {
  const [snapshot, setSnapshot] = useState<OfficeSnapshot | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/alerts"))
      .then((res) => res.json())
      .then((data: { alerts: Alert[] }) => {
        if (!cancelled) {
          setAlerts(data.alerts);
        }
      })
      .catch(() => {
        /* backend not up yet; socket will fill in */
      });

    const socket = BACKEND_URL
      ? io(BACKEND_URL, { transports: ["websocket", "polling"] })
      : io({ transports: ["websocket", "polling"] });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on(SOCKET_EVENTS.stateUpdate, (data: OfficeSnapshot) => setSnapshot(data));
    socket.on(SOCKET_EVENTS.alertNew, (alert: Alert) => {
      setAlerts((prev) =>
        prev.some((existing) => existing.id === alert.id)
          ? prev
          : [alert, ...prev].slice(0, MAX_ALERTS),
      );
    });

    return () => {
      cancelled = true;
      socket.close();
    };
  }, []);

  return { snapshot, alerts, connected };
}
