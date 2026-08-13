import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { NotificationData } from "@/lib/push";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  data?: NotificationData | null;
  readAt?: string | null;
  createdAt: string;
};

export function useNotifications(token?: string | null) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api<AppNotification[]>("/notifications?limit=50", { token });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load notifications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unreadCount = items.filter((item) => !item.readAt).length;

  const markRead = useCallback(
    async (notificationId: string) => {
      if (!token) return;
      setItems((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, readAt: item.readAt ?? new Date().toISOString(), status: "READ" } : item,
        ),
      );
      try {
        await api(`/notifications/${notificationId}/read`, { method: "PATCH", token });
      } catch {
        await refresh();
      }
    },
    [token, refresh],
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
        status: "READ",
      })),
    );
    try {
      await api("/notifications/read-all", { method: "POST", token });
    } catch {
      try {
        await api("/notifications/read-all", { method: "PATCH", token });
      } catch {
        // Keep optimistic state unless next manual refresh
      }
    }
  }, [token]);

  return { items, loading, error, unreadCount, refresh, markRead, markAllRead };
}
