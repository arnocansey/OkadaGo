"use client";

import { CalendarDays, CheckCircle, Clock, ShieldAlert, XCircle } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import type { RiderRecord } from "./types";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (["completed", "delivered", "paid", "captured", "posted", "approved", "valid"].includes(normalized)) {
    return "success";
  }
  if (
    [
      "searching",
      "assigned",
      "arriving",
      "arrived",
      "started",
      "picked_up",
      "in_transit",
      "pending",
      "requested",
      "reviewing",
      "under review",
      "processing"
    ].includes(normalized)
  ) {
    return "warning";
  }
  if (["failed", "rejected", "cancelled", "reversed", "missing", "expired"].includes(normalized)) {
    return "danger";
  }
  return "neutral";
}

type RiderVerificationRow = {
  rider: RiderRecord;
  verificationStatus: string;
  hasVehicle: boolean;
  hasZone: boolean;
  hasContact: boolean;
  appliedAt: string | undefined;
};

type RiderVerificationStats = {
  pending: number;
  approved: number;
  rejected: number;
  underReview: number;
  today: number;
};

type RiderVerificationScreenProps = {
  riderVerificationRows: RiderVerificationRow[];
  riderVerificationStats: RiderVerificationStats;
};

export function RiderVerificationScreen({
  riderVerificationRows,
  riderVerificationStats
}: RiderVerificationScreenProps) {
  return (
    <div className="admin-reference-dark admin-rider-subset-page">
      <section className="admin-rider-subset-kpis">
        <article className="admin-dark-kpi">
          <Clock size={22} />
          <span>Pending Verification</span>
          <strong>{riderVerificationStats.pending}</strong>
          <small>Missing required profile inputs</small>
        </article>
        <article className="admin-dark-kpi">
          <CheckCircle size={22} />
          <span>Approved</span>
          <strong>{riderVerificationStats.approved}</strong>
          <small>Vehicle, zone, and contact ready</small>
        </article>
        <article className="admin-dark-kpi danger">
          <XCircle size={22} />
          <span>Rejected</span>
          <strong>{riderVerificationStats.rejected}</strong>
          <small>Blocked, suspended, or rejected accounts</small>
        </article>
        <article className="admin-dark-kpi">
          <ShieldAlert size={22} />
          <span>Under Review</span>
          <strong>{riderVerificationStats.underReview}</strong>
          <small>Partially complete rider profile</small>
        </article>
        <article className="admin-dark-kpi">
          <CalendarDays size={22} />
          <span>Verification Today</span>
          <strong>{riderVerificationStats.today}</strong>
          <small>Riders created today</small>
        </article>
      </section>

      <section className="admin-rider-verification-layout">
        <article className="admin-dark-card admin-rider-queue-card">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Verification Queue</h3>
              <p>Live rider records sorted by newest profile first.</p>
            </div>
            <span>{riderVerificationRows.length} riders</span>
          </div>
          {riderVerificationRows.length === 0 ? (
            <EmptyCard
              title="No riders in verification."
              body="Rider applications will appear here after riders are created."
            />
          ) : (
            <div className="admin-rider-queue-list">
              {riderVerificationRows
                .slice()
                .sort((left, right) => Date.parse(right.appliedAt ?? "") - Date.parse(left.appliedAt ?? ""))
                .map((row) => (
                  <article key={row.rider.id} className="admin-rider-queue-item">
                    <div className="exact-avatar">
                      {row.rider.user.fullName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <strong>{row.rider.user.fullName}</strong>
                      <span>{row.rider.displayCode}</span>
                      <small>{row.appliedAt ? `Applied ${formatDateTime(row.appliedAt)}` : "Application date unavailable"}</small>
                    </div>
                    <span className={`status-chip ${statusTone(row.verificationStatus)}`}>
                      {row.verificationStatus}
                    </span>
                  </article>
                ))}
            </div>
          )}
        </article>

        <article className="admin-dark-card admin-rider-review-card">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Verification Readiness</h3>
              <p>Checks are derived from the live rider profile until document upload endpoints are available.</p>
            </div>
            <a href="/admin/riders/documents">Open documents</a>
          </div>

          {riderVerificationRows.length === 0 ? (
            <EmptyCard
              title="No rider profile selected."
              body="Create a rider first to inspect verification readiness."
            />
          ) : (
            <div className="table-wrapper admin-rider-subset-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Contact</th>
                    <th>Vehicle</th>
                    <th>Zone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riderVerificationRows.map((row) => (
                    <tr key={row.rider.id}>
                      <td>
                        <strong>{row.rider.user.fullName}</strong>
                        <div>{row.rider.displayCode}</div>
                      </td>
                      <td>
                        <span className={`status-chip ${row.hasContact ? "success" : "warning"}`}>
                          {row.hasContact ? "Available" : "Missing"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-chip ${row.hasVehicle ? "success" : "warning"}`}>
                          {row.rider.vehicle?.plateNumber ?? "Missing"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-chip ${row.hasZone ? "success" : "warning"}`}>
                          {row.rider.serviceZone?.name ?? "Missing"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-chip ${statusTone(row.verificationStatus)}`}>
                          {row.verificationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
