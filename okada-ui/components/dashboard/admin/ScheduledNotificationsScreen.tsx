"use client";

import { useState } from "react";
import { Bell, Send, Clock, XCircle } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { formatDateTime } from "./utils";

export type ScheduledNotification = {
  id: string;
  title: string;
  body: string;
  targetAudience: "all" | "riders" | "passengers" | "zone";
  targetZone?: string;
  scheduledAt: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  sentCount?: number;
  createdAt: string;
};

export type ScheduledNotificationsScreenProps = {
  notifications: ScheduledNotification[];
  ridersCount: number;
  passengersCount: number;
  onSchedule: (notification: Omit<ScheduledNotification, "id" | "status" | "sentCount" | "createdAt">) => void;
  onCancel: (id: string) => void;
  isMutating: boolean;
};

export function ScheduledNotificationsScreen({
  notifications,
  ridersCount,
  passengersCount,
  onSchedule,
  onCancel,
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
        title="Notifications"
        subtitle="Schedule broadcast messages to riders, passengers, or a service zone."
      />
      <section className="admin-reference-kpis">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Bell size={22} /></div>
          <div>
            <span>Total Notifications</span>
            <strong>{notifications.length}</strong>
            <small>All scheduled messages</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Clock size={22} /></div>
          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
            <small>Awaiting delivery</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><Send size={22} /></div>
          <div>
            <span>Sent</span>
            <strong>{sentCount}</strong>
            <small>Successfully delivered</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon red"><XCircle size={22} /></div>
          <div>
            <span>Failed</span>
            <strong>{failedCount}</strong>
            <small>Delivery errors</small>
          </div>
        </article>
      </section>

      <div className="admin-screen-grid-2">
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
              className="admin-select-sm"
              style={{ alignSelf: "flex-start", background: "var(--okada-yellow, #f7c600)", color: "#0a0b0d", fontWeight: 600, border: "none", padding: "8px 20px", borderRadius: 8, cursor: isMutating || !title.trim() || !body.trim() || !scheduledAt ? "not-allowed" : "pointer", opacity: isMutating || !title.trim() || !body.trim() || !scheduledAt ? 0.5 : 1 }}
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
                      </td>
                      <td>
                        <small style={{ textTransform: "capitalize" }}>{n.targetAudience}</small>
                        {n.targetZone && <><br /><small>{n.targetZone}</small></>}
                      </td>
                      <td><small>{formatDateTime(n.scheduledAt)}</small></td>
                      <td>
                        <em className={`admin-reference-tag ${
                          n.status === "sent" ? "success" :
                          n.status === "pending" ? "warning" :
                          n.status === "failed" ? "danger" : "neutral"
                        }`}>
                          {n.status}
                        </em>
                        {n.sentCount != null && <small> · {n.sentCount} recipients</small>}
                      </td>
                      <td>
                        {n.status === "pending" && (
                          <button
                            type="button"
                            className="admin-select-sm"
                            style={{ fontSize: 11, padding: "4px 8px" }}
                            onClick={() => onCancel(n.id)}
                          >
                            Cancel
                          </button>
                        )}
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
