"use client";

import { CheckCircle, Clock, Download, Users, XCircle } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import type { PayoutRequestRecord } from "./types";

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

type RiderPayoutsScreenProps = {
  totalRiderPayoutValue: number;
  riderPayoutRequests: PayoutRequestRecord[];
  paidRiderPayouts: PayoutRequestRecord[];
  requestedRiderPayouts: PayoutRequestRecord[];
  failedRiderPayouts: PayoutRequestRecord[];
  riderPayoutMethodSnapshot: [string, number][];
  riderPayoutMethodTotal: number;
  adminCurrency: string;
};

export function RiderPayoutsScreen({
  totalRiderPayoutValue,
  riderPayoutRequests,
  paidRiderPayouts,
  requestedRiderPayouts,
  failedRiderPayouts,
  riderPayoutMethodSnapshot,
  riderPayoutMethodTotal,
  adminCurrency
}: RiderPayoutsScreenProps) {
  return (
    <div className="admin-reference-dark admin-rider-subset-page">
      <section className="admin-rider-subset-kpis">
        <article className="admin-dark-kpi">
          <Download size={22} />
          <span>Total Payouts</span>
          <strong>{formatMoney(adminCurrency, totalRiderPayoutValue)}</strong>
          <small>{riderPayoutRequests.length} payout requests</small>
        </article>
        <article className="admin-dark-kpi">
          <CheckCircle size={22} />
          <span>Successful Payouts</span>
          <strong>{formatMoney(adminCurrency, paidRiderPayouts.reduce((sum, request) => sum + parseNumber(request.amount), 0))}</strong>
          <small>{paidRiderPayouts.length} approved or paid</small>
        </article>
        <article className="admin-dark-kpi">
          <Clock size={22} />
          <span>Pending Payouts</span>
          <strong>{formatMoney(adminCurrency, requestedRiderPayouts.reduce((sum, request) => sum + parseNumber(request.amount), 0))}</strong>
          <small>{requestedRiderPayouts.length} awaiting review</small>
        </article>
        <article className="admin-dark-kpi danger">
          <XCircle size={22} />
          <span>Failed Payouts</span>
          <strong>{formatMoney(adminCurrency, failedRiderPayouts.reduce((sum, request) => sum + parseNumber(request.amount), 0))}</strong>
          <small>{failedRiderPayouts.length} failed, rejected, or cancelled</small>
        </article>
        <article className="admin-dark-kpi">
          <Users size={22} />
          <span>Total Riders Paid</span>
          <strong>{new Set(paidRiderPayouts.map((request) => request.rider.id)).size}</strong>
          <small>Distinct riders with paid requests</small>
        </article>
      </section>

      <section className="admin-rider-dashboard-grid payouts">
        <article className="admin-dark-card admin-rider-wide-table">
          <div className="admin-dark-cardhead">
            <div>
              <h3>All Payouts</h3>
              <p>Rider settlement requests with current finance review state.</p>
            </div>
            <a href="/admin/finance">Manage payouts</a>
          </div>
          {riderPayoutRequests.length === 0 ? (
            <EmptyCard title="No rider payout requests." body="Payout requests will appear here after riders request settlement." />
          ) : (
            <div className="table-wrapper admin-rider-subset-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Payout Method</th>
                    <th>Amount</th>
                    <th>Net Amount</th>
                    <th>Reference ID</th>
                    <th>Status</th>
                    <th>Payout Date</th>
                  </tr>
                </thead>
                <tbody>
                  {riderPayoutRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <strong>{request.rider.user.fullName}</strong>
                        <div>{request.rider.displayCode}</div>
                      </td>
                      <td>{formatEnumLabel(request.method)}</td>
                      <td>{formatMoney(request.currency, parseNumber(request.amount))}</td>
                      <td>{formatMoney(request.currency, parseNumber(request.amount))}</td>
                      <td>{request.id.slice(-12).toUpperCase()}</td>
                      <td><span className={`status-chip ${statusTone(request.status)}`}>{formatEnumLabel(request.status)}</span></td>
                      <td>{request.paidAt ? formatDateTime(request.paidAt) : request.reviewedAt ? formatDateTime(request.reviewedAt) : "Pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="admin-rider-side-stack">
          <article className="admin-dark-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>Payout Methods Breakdown</h3>
                <p>Settlement amount by method.</p>
              </div>
            </div>
            <div className="admin-rider-donut-wrap compact">
              <div
                className="admin-rider-donut small"
                style={{
                  background:
                    riderPayoutMethodTotal === 0
                      ? "#1f2937"
                      : `conic-gradient(#ffc107 0 ${((riderPayoutMethodSnapshot[0]?.[1] ?? 0) / Math.max(1, riderPayoutMethodTotal)) * 100}%, #ef4444 ${((riderPayoutMethodSnapshot[0]?.[1] ?? 0) / Math.max(1, riderPayoutMethodTotal)) * 100}% ${(((riderPayoutMethodSnapshot[0]?.[1] ?? 0) + (riderPayoutMethodSnapshot[1]?.[1] ?? 0)) / Math.max(1, riderPayoutMethodTotal)) * 100}%, #3b82f6 ${(((riderPayoutMethodSnapshot[0]?.[1] ?? 0) + (riderPayoutMethodSnapshot[1]?.[1] ?? 0)) / Math.max(1, riderPayoutMethodTotal)) * 100}% 100%)`
                }}
              >
                <div />
              </div>
              <ul className="admin-rider-breakdown-list">
                {riderPayoutMethodSnapshot.length === 0 ? (
                  <li><span>No method data</span><strong>0</strong></li>
                ) : (
                  riderPayoutMethodSnapshot.map(([method, amount]) => (
                    <li key={method}>
                      <span>{formatEnumLabel(method)}</span>
                      <strong>{formatMoney(adminCurrency, amount)}</strong>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </article>

          <article className="admin-dark-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>Payout Overview</h3>
                <p>Current settlement health.</p>
              </div>
            </div>
            <ul className="admin-rider-breakdown-list loose">
              <li><span>Average payout</span><strong>{formatMoney(adminCurrency, riderPayoutRequests.length === 0 ? 0 : totalRiderPayoutValue / riderPayoutRequests.length)}</strong></li>
              <li><span>Highest payout</span><strong>{formatMoney(adminCurrency, Math.max(0, ...riderPayoutRequests.map((request) => parseNumber(request.amount))))}</strong></li>
              <li><span>Lowest payout</span><strong>{formatMoney(adminCurrency, riderPayoutRequests.length === 0 ? 0 : Math.min(...riderPayoutRequests.map((request) => parseNumber(request.amount))))}</strong></li>
              <li><span>Success rate</span><strong>{riderPayoutRequests.length === 0 ? "0.0%" : `${((paidRiderPayouts.length / riderPayoutRequests.length) * 100).toFixed(1)}%`}</strong></li>
            </ul>
          </article>
        </aside>
      </section>
    </div>
  );
}
