"use client";

import { CheckCircle, Clock, FileText, Users, XCircle } from "lucide-react";
import { EmptyCard } from "./EmptyCard";

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

type RiderDocumentRow = {
  id: string;
  riderName: string;
  displayCode: string;
  documentType: string;
  documentNumber: string;
  status: string;
  issueDate: string | undefined;
  expiryDate: string;
  daysLeft: string;
};

type RiderDocumentStats = {
  total: number;
  compliant: number;
  expiringSoon: number;
  expired: number;
  missing: number;
};

type RiderDocumentsScreenProps = {
  riderDocumentRows: RiderDocumentRow[];
  riderDocumentStats: RiderDocumentStats;
};

export function RiderDocumentsScreen({
  riderDocumentRows,
  riderDocumentStats
}: RiderDocumentsScreenProps) {
  return (
    <div className="admin-reference-dark admin-rider-subset-page">
      <section className="admin-rider-subset-kpis">
        <article className="admin-dark-kpi">
          <Users size={22} />
          <span>Total Riders</span>
          <strong>{riderDocumentStats.total}</strong>
          <small>All registered riders</small>
        </article>
        <article className="admin-dark-kpi">
          <CheckCircle size={22} />
          <span>Compliant</span>
          <strong>{riderDocumentStats.compliant}</strong>
          <small>Ready by current live fields</small>
        </article>
        <article className="admin-dark-kpi">
          <Clock size={22} />
          <span>Expiring Soon</span>
          <strong>{riderDocumentStats.expiringSoon}</strong>
          <small>Needs document-expiry backend data</small>
        </article>
        <article className="admin-dark-kpi danger">
          <XCircle size={22} />
          <span>Expired</span>
          <strong>{riderDocumentStats.expired}</strong>
          <small>Needs document-expiry backend data</small>
        </article>
        <article className="admin-dark-kpi">
          <FileText size={22} />
          <span>Missing Documents</span>
          <strong>{riderDocumentStats.missing}</strong>
          <small>Missing profile, vehicle, zone, or location data</small>
        </article>
      </section>

      <section className="admin-dark-card">
        <div className="admin-dark-cardhead">
          <div>
            <h3>Rider document readiness</h3>
            <p>Operational readiness table based on live rider records. No dummy document uploads are shown.</p>
          </div>
          <a href="/admin/riders/verification">Open verification</a>
        </div>

        {riderDocumentRows.length === 0 ? (
          <EmptyCard
            title="No rider documents yet."
            body="Document readiness will appear here as soon as rider profiles exist."
          />
        ) : (
          <div className="table-wrapper admin-rider-subset-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Document Type</th>
                  <th>Document Number</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {riderDocumentRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.riderName}</strong>
                      <div>{row.displayCode}</div>
                    </td>
                    <td>{row.documentType}</td>
                    <td>{row.documentNumber}</td>
                    <td>{row.issueDate ? formatDateTime(row.issueDate) : "Not available"}</td>
                    <td>{row.expiryDate}</td>
                    <td>
                      <span className={`status-chip ${statusTone(row.status)}`}>{row.status}</span>
                    </td>
                    <td>{row.daysLeft}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
