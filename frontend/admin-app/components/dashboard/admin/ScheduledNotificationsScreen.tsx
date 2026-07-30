"use client";

import { useState } from "react";
import { Bell, Send, Clock, XCircle, RefreshCw } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import type { OpsJobStatus, ScheduledBroadcastRecord } from "./types";
import { formatDateTime } from "./utils";

export type ScheduledNotification = ScheduledBroadcastRecord;

export type ScheduledNotificationsScreenProps = {
  notifications: ScheduledNotification[];
  ridersCount: number;
  passengersCount: number;
  opsJobStatus?: OpsJobStatus | null;
  onSchedule: (notification: Omit<ScheduledNotification, "id" | "status" | "sentCount" | "createdAt" | "retryCount" | "lastRunAt" | "lastError">) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  isMutating: boolean;
};

export function ScheduledNotificationsScreen({
  notifications,
  ridersCount,
  passengersCount,
  opsJobStatus,
  onSchedule,
  onCancel,
  onRetry,
  isMutating
}: ScheduledNotificationsScreenProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "riders" | "passengers" | "zone">("all");
  const [zone, setZone] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const pendingCount = notifications.filter((n) => n.status === "pending").length;
  const sentCount = notifications.filter((n) => n.status === "sent").length;
  const failedCount = notifications.filter((n) => n.status === "failed").length;
  const lastFinished = opsJobStatus?.broadcasts?.lastFinishedAt;

  const handleSchedule = () => {
    if (!title.trim() || !body.trim() || !scheduledAt) return;
    onSchedule({ title: title.trim(), body: body.trim(), targetAudience: audience, targetZone: zone || undefined, scheduledAt });
    setTitle("");
    setBody("");
    setAudience("all");
    setZone("");
    setScheduledAt("");
  };

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="System Alerts & Broadcasts"
        subtitle="Schedule push alerts and broadcasts for Accra riders and passengers."
      />
      <AdminKpiRow
        items={[
          { label: "Total Notifications", value: notifications.length, hint: "All scheduled messages", icon: <Bell size={22} />, tone: "yellow" },
          { label: "Pending", value: pendingCount, hint: "Awaiting delivery", icon: <Clock size={22} />, tone: "yellow" },
          { label: "Sent", value: sentCount, hint: "Successfully delivered", icon: <Send size={22} />, tone: "green" },
          {
            label: "Failed",
            value: failedCount,
            hint: lastFinished ? `Worker last ran ${formatDateTime(lastFinished)}` : "Delivery errors",
            icon: <XCircle size={22} />,
            tone: "red",
          },
        ]}
      />

      {opsJobStatus?.broadcasts ? (
        <article className="admin-reference-card" style={{ marginBottom: 16 }}>
          <div className="admin-reference-cardhead">
            <div>
              <h3>Broadcast worker</h3>
              <p>
                Due now: {opsJobStatus.broadcasts.pendingDue ?? 0}
                {" · "}
                Failed queue: {opsJobStatus.broadcasts.failed ?? 0}
                {opsJobStatus.broadcasts.lastError
                  ? ` · Last error: ${opsJobStatus.broadcasts.lastError}`
                  : ""}
              </p>
            </div>
          </div>
        </article>
      ) : null}

      <div className="admin-overview-split">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div><h3>Schedule New Notification</h3><p>Queue a push notification for future delivery</p></div>
          </div>
          <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Title</label>
              <input
                type="text"
                className="admin-input-sm"
                style={{ width: "100%" }}
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Body</label>
              <textarea
                className="admin-input-sm"
                style={{ width: "100%", minHeight: 80, resize: "vertical" }}
                placeholder="Notification message body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Target Audience</label>
                <select
                  className="admin-select-sm"
                  style={{ width: "100%" }}
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as typeof audience)}
                >
                  <option value="all">All Users ({ridersCount + passengersCount})</option>
                  <option value="riders">Riders Only ({ridersCount})</option>
                  <option value="passengers">Passengers Only ({passengersCount})</option>
                  <option value="zone">Specific Zone</option>
                </select>
              </div>
              {audience === "zone" && (
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Zone Name</label>
                  <input
                    type="text"
                    className="admin-input-sm"
                    style={{ width: "100%" }}
                    placeholder="e.g. Accra"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>Scheduled Date & Time</label>
              <input
                type="datetime-local"
                className="admin-input-sm"
                style={{ width: "100%" }}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="admin-btn-primary"
              style={{ alignSelf: "flex-start", opacity: isMutating || !title.trim() || !body.trim() || !scheduledAt ? 0.5 : 1, cursor: isMutating || !title.trim() || !body.trim() || !scheduledAt ? "not-allowed" : "pointer" }}
              onClick={handleSchedule}
              disabled={isMutating || !title.trim() || !body.trim() || !scheduledAt}
            >
              {isMutating ? "Scheduling..." : "Schedule Notification"}
            </button>
          </div>
        </article>

        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div><h3>Scheduled Notifications</h3><p>{notifications.length} total</p></div>
          </div>
          {notifications.length === 0 ? (
            <EmptyCard title="No notifications scheduled." body="Schedule your first push notification using the form." />
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Audience</th>
                    <th>Scheduled</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr key={n.id}>
                      <td>
                        <strong>{n.title}</strong>
                        <br />
                        <small style={{ maxWidth: 200, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</small>
                        {n.lastError ? (
                          <>
                            <br />
                            <small style={{ color: "var(--danger, #ef5350)" }}>{n.lastError}</small>
                          </>
                        ) : null}
                      </td>
                      <td>
                        <small style={{ textTransform: "capitalize" }}>{n.targetAudience}</small>
                        {n.targetZone && <><br /><small>{n.targetZone}</small></>}
                      </td>
                      <td>
                        <small>{formatDateTime(n.scheduledAt)}</small>
                        {n.lastRunAt ? (
                          <>
                            <br />
                            <small>Last run {formatDateTime(n.lastRunAt)}</small>
                          </>
                        ) : null}
                      </td>
                      <td>
                        <em className={`admin-reference-tag ${
                          n.status === "sent" ? "success" :
                          n.status === "pending" ? "warning" :
                          n.status === "failed" ? "danger" : "neutral"
                        }`}>
                          {n.status}
                        </em>
                        {n.sentCount != null && <small> · {n.sentCount} recipients</small>}
                        {typeof n.retryCount === "number" && n.retryCount > 0 ? (
                          <small> · retries {n.retryCount}</small>
                        ) : null}
                      </td>
                      <td>
                        <div className="admin-action-row">
                          {n.status === "pending" && (
                            <button
                              type="button"
                              className="admin-select-sm"
                              style={{ fontSize: 11, padding: "4px 8px" }}
                              onClick={() => onCancel(n.id)}
                              disabled={isMutating}
                            >
                              Cancel
                            </button>
                          )}
                          {n.status === "failed" && (
                            <button
                              type="button"
                              className="admin-select-sm"
                              style={{ fontSize: 11, padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}
                              onClick={() => onRetry(n.id)}
                              disabled={isMutating}
                            >
                              <RefreshCw size={12} /> Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
