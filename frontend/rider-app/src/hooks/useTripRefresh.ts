import { useEffect } from "react";

type WsLike = { isConnected: () => boolean };

export function useTripRefresh(
  refresh: () => Promise<void>,
  ws: WsLike,
  intervalMs = 10000,
) {
  useEffect(() => {
    const timer = setInterval(() => {
      if (!ws.isConnected()) {
        void refresh();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [refresh, ws, intervalMs]);
}
