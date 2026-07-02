"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PassengerAppFrame } from "@/components/passenger/layout/app-frame";
import { paxToast } from "@/components/passenger/lib/toast";
import { SubPageShell } from "@/components/passenger/ui/sub-page-shell";
import { ListRowsSkeleton } from "@/components/passenger/ui/skeletons";
import type { AppNotification } from "@/components/passenger/types";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function NotificationsView() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      requestJson<AppNotification[]>("/notifications?limit=50", { token: session?.token }),
    enabled: Boolean(session?.token)
  });

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      requestJson(`/notifications/${notificationId}/read`, {
        method: "PATCH",
        token: session?.token
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      paxToast.error("Could not update notification", (error as Error).message);
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      requestJson("/notifications/read-all", {
        method: "POST",
        token: session?.token
      }),
    onSuccess: async () => {
      paxToast.success("All notifications marked as read");
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      paxToast.error("Could not mark all as read", (error as Error).message);
    }
  });

  const unreadCount = (notificationsQuery.data ?? []).filter((n) => !n.readAt).length;

  return (
    <PassengerAppFrame>
      <SubPageShell title="Notifications">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm pax-text-secondary">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="pax-btn-secondary !py-2 !text-xs"
              disabled={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          ) : null}
        </div>

        {notificationsQuery.isLoading ? (
          <ListRowsSkeleton count={5} />
        ) : (notificationsQuery.data ?? []).length === 0 ? (
          <div className="pax-empty">
            <Bell size={40} />
            <p className="pax-empty-title">No notifications</p>
            <p className="text-sm">Trip updates and alerts will show up here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {(notificationsQuery.data ?? []).map((notification) => (
              <article
                key={notification.id}
                className={`pax-card p-4 ${notification.readAt ? "opacity-70" : "border-[var(--pax-primary)]/30"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!notification.readAt ? <span className="pax-status-pulse shrink-0" /> : null}
                      <h3 className="truncate font-semibold">{notification.title}</h3>
                    </div>
                    <p className="mt-1 text-sm pax-text-secondary">{notification.body}</p>
                    <p className="mt-2 text-xs pax-text-muted">{formatTime(notification.createdAt)}</p>
                  </div>
                  {!notification.readAt ? (
                    <button
                      type="button"
                      className="shrink-0 text-xs font-semibold pax-text-primary"
                      disabled={markReadMutation.isPending}
                      onClick={() => markReadMutation.mutate(notification.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </SubPageShell>
    </PassengerAppFrame>
  );
}
