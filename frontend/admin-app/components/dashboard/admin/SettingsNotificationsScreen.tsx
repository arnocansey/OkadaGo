"use client";

import Link from "next/link";
import { Bell, ShieldAlert } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { AdminIncidentRecord, ScheduledBroadcastRecord } from "./types";
import { formatDateTime, formatEnumLabel } from "./utils";

export type SettingsNotificationsScreenProps = {
  dataLoading?: boolean;
  broadcasts?: ScheduledBroadcastRecord[];
  openSosCount?: number;
  recentIncidents?: AdminIncidentRecord[];
};

export function SettingsNotificationsScreen({
  dataLoading = false,
  broadcasts = [],
  openSosCount = 0,
  recentIncidents = []
}: SettingsNotificationsScreenProps) {
  if (dataLoading) {
    return <div className="exact-admin-screen"><EmptyCard title="Loading notification overview…" body="" /></div>;
  }

  const pending = broadcasts.filter((b) => b.status === "pending").length;

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Notification settings"
        subtitle="Overview of scheduled broadcasts and recent safety alerts. Manage campaigns from Notifications."
        actions={
          <Link href="/notifications" className="admin-btn-primary">
            Open notifications
          </Link>
        }
      />

      <AdminKpiRow
        items={[
          { label: "Broadcasts", value: broadcasts.length, hint: "Scheduled campaigns", icon: <Bell size={22} />, tone: "yellow" },
          { label: "Pending send", value: pending, hint: "Awaiting delivery window", icon: <Bell size={22} />, tone: "yellow" },
          { label: "Open SOS", value: openSosCount, hint: "Needs ops attention", icon: <ShieldAlert size={22} />, tone: "red" }
        ]}
      />

      <div className="admin-screen-grid-2">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Recent broadcasts</h3>
              <p>Live from scheduled broadcast store</p>
            </div>
          </div>
          {broadcasts.length === 0 ? (
            <EmptyCard title="No broadcasts yet." body="Schedule one from the Notifications screen." />
          ) : (
            <ul className="admin-summary-list">
              {broadcasts.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <span>
                    <strong>{item.title}</strong>
                    <br />
                    <small>{formatDateTime(item.scheduledAt)} · {item.targetAudience}</small>
                  </span>
                  <em className="admin-reference-tag neutral">{formatEnumLabel(item.status)}</em>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Recent incidents</h3>
              <p>Safety signal feed</p>
            </div>
          </div>
          {recentIncidents.length === 0 ? (
            <EmptyCard title="No recent incidents." body="" />
          ) : (
            <ul className="admin-summary-list">
              {recentIncidents.slice(0, 8).map((item) => (
                <li key={item.id}>
                  <span>
                    <strong>{item.reporter.fullName}</strong>
                    <br />
                    <small>{formatEnumLabel(item.category)} · {formatDateTime(item.createdAt)}</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </div>
  );
}
