"use client";

import { useMemo } from "react";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { AdminIncidentRecord, EscalationRuleRecord, RiderRecord } from "./types";
import { parseNumber, formatDateTime } from "./utils";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  Users,
  TrendingUp,
  Activity,
  Phone,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type SafetyCenterDashboardProps = {
  incidents: AdminIncidentRecord[];
  escalationRules: EscalationRuleRecord[];
  riders: RiderRecord[];
  dataLoading?: boolean;
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function severityColor(s: string) {
  switch (s.toUpperCase()) {
    case "CRITICAL":
      return "#ef4444";
    case "HIGH":
      return "#f59e0b";
    case "MEDIUM":
      return "#3b82f6";
    case "LOW":
      return "#6b7280";
    default:
      return "#6b7280";
  }
}

function statusColor(s: string) {
  switch (s.toUpperCase()) {
    case "OPEN":
      return "#ef4444";
    case "UNDER_REVIEW":
      return "#f59e0b";
    case "ACTIONED":
      return "#3b82f6";
    case "RESOLVED":
    case "CLOSED":
      return "#22c55e";
    default:
      return "#6b7280";
  }
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function SafetyCenterDashboard({
  incidents,
  escalationRules,
  riders,
  dataLoading = false,
}: SafetyCenterDashboardProps) {
  /* ── Derived data ── */

  const kpis = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter((i) => i.status.toUpperCase() === "OPEN").length;
    const underReview = incidents.filter(
      (i) => i.status.toUpperCase() === "UNDER_REVIEW"
    ).length;
    const resolved = incidents.filter(
      (i) =>
        i.status.toUpperCase() === "RESOLVED" ||
        i.status.toUpperCase() === "CLOSED"
    ).length;
    const totalRules = escalationRules.length;
    const activeRules = escalationRules.filter((r) => r.enabled).length;
    return { total, open, underReview, resolved, totalRules, activeRules };
  }, [incidents, escalationRules]);

  const criticalIncidents = useMemo(
    () =>
      incidents.filter(
        (i) =>
          i.status.toUpperCase() === "OPEN" &&
          i.severity.toUpperCase() === "CRITICAL"
      ),
    [incidents]
  );

  const severityCounts = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const i of incidents) {
      const sev = i.severity.toUpperCase();
      if (sev in counts) counts[sev as keyof typeof counts]++;
    }
    return counts;
  }, [incidents]);

  const maxSeverityCount = useMemo(
    () => Math.max(1, ...Object.values(severityCounts)),
    [severityCounts]
  );

  const recentIncidents = useMemo(
    () =>
      [...incidents]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10),
    [incidents]
  );

  const riderMap = useMemo(() => {
    const map = new Map<string, RiderRecord>();
    for (const r of riders) map.set(r.id, r);
    return map;
  }, [riders]);

  const isEmpty = incidents.length === 0 && escalationRules.length === 0;

  if (dataLoading) {
    return (
      <div className="sc-loading">
        <div className="sc-loading-pulse" />
        <span>Loading safety data…</span>
      </div>
    );
  }

  return (
    <div className="sc-dashboard">
      <AdminPageHeader
        title="Safety Center"
        subtitle="Safety overview, escalation rules, and incident metrics"
      />

      {/* ── Critical Alert Banner ── */}
      {criticalIncidents.length > 0 && (
        <div className="sc-alert-banner">
          <div className="sc-alert-pulse" />
          <AlertTriangle size={18} />
          <span>
            <strong>
              {criticalIncidents.length} critical incident
              {criticalIncidents.length !== 1 ? "s" : ""}
            </strong>{" "}
            require immediate attention
          </span>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <section className="sc-kpi-grid">
        <article className="sc-kpi sc-kpi--total">
          <div className="sc-kpi-icon">
            <ShieldCheck size={18} />
          </div>
          <div className="sc-kpi-body">
            <span className="sc-kpi-label">Total Incidents</span>
            <strong className="sc-kpi-value">{kpis.total}</strong>
          </div>
        </article>

        <article className="sc-kpi sc-kpi--open">
          <div className="sc-kpi-icon">
            <AlertTriangle size={18} />
          </div>
          <div className="sc-kpi-body">
            <span className="sc-kpi-label">Open</span>
            <strong className="sc-kpi-value">{kpis.open}</strong>
          </div>
        </article>

        <article className="sc-kpi sc-kpi--review">
          <div className="sc-kpi-icon">
            <Clock size={18} />
          </div>
          <div className="sc-kpi-body">
            <span className="sc-kpi-label">Under Review</span>
            <strong className="sc-kpi-value">{kpis.underReview}</strong>
          </div>
        </article>

        <article className="sc-kpi sc-kpi--resolved">
          <div className="sc-kpi-icon">
            <CheckCircle size={18} />
          </div>
          <div className="sc-kpi-body">
            <span className="sc-kpi-label">Resolved</span>
            <strong className="sc-kpi-value">{kpis.resolved}</strong>
          </div>
        </article>

        <article className="sc-kpi sc-kpi--rules">
          <div className="sc-kpi-icon">
            <Shield size={18} />
          </div>
          <div className="sc-kpi-body">
            <span className="sc-kpi-label">Escalation Rules</span>
            <strong className="sc-kpi-value">{kpis.totalRules}</strong>
          </div>
        </article>

        <article className="sc-kpi sc-kpi--active">
          <div className="sc-kpi-icon">
            <TrendingUp size={18} />
          </div>
          <div className="sc-kpi-body">
            <span className="sc-kpi-label">Active Rules</span>
            <strong className="sc-kpi-value">{kpis.activeRules}</strong>
          </div>
        </article>
      </section>

      {isEmpty ? (
        <div className="sc-empty">
          <ShieldCheck size={40} />
          <h3>No Safety Data</h3>
          <p>
            No incidents or escalation rules have been recorded yet. Safety
            metrics will appear here once data is available.
          </p>
        </div>
      ) : (
        <>
          {/* ── Incident by Severity ── */}
          <section className="sc-severity-section">
            <h3>
              <Activity size={15} /> Incidents by Severity
            </h3>
            <div className="sc-severity-bars">
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => {
                const count = severityCounts[sev];
                const pct = Math.round((count / maxSeverityCount) * 100);
                return (
                  <div key={sev} className="sc-severity-row">
                    <span className="sc-severity-label">{sev}</span>
                    <div className="sc-severity-track">
                      <div
                        className="sc-severity-fill"
                        style={{
                          width: `${Math.max(count > 0 ? 8 : 0, pct)}%`,
                          background: severityColor(sev),
                        }}
                      />
                    </div>
                    <span className="sc-severity-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Recent Incidents Table ── */}
          <section className="sc-recent-section">
            <h3>
              <Clock size={15} /> Recent Incidents
            </h3>
            {recentIncidents.length === 0 ? (
              <div className="sc-empty-inline">No incidents recorded.</div>
            ) : (
              <div className="sc-table-wrap">
                <table className="sc-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Severity</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Rider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentIncidents.map((inc) => {
                      const riderInfo = inc.rider
                        ? riderMap.get(inc.rider.id)
                        : null;
                      return (
                        <tr key={inc.id}>
                          <td className="sc-cell-time">
                            {formatDateTime(inc.createdAt)}
                          </td>
                          <td>
                            <span
                              className="sc-badge"
                              style={{
                                background: `${severityColor(inc.severity)}18`,
                                color: severityColor(inc.severity),
                              }}
                            >
                              {inc.severity}
                            </span>
                          </td>
                          <td className="sc-cell-type">{inc.category}</td>
                          <td>
                            <span
                              className="sc-badge"
                              style={{
                                background: `${statusColor(inc.status)}18`,
                                color: statusColor(inc.status),
                              }}
                            >
                              {inc.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td>
                            {inc.rider ? (
                              <span className="sc-rider-cell">
                                {inc.rider.user.fullName}
                                <span className="sc-rider-code">
                                  {inc.rider.displayCode}
                                </span>
                              </span>
                            ) : (
                              <span className="sc-no-data">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── Escalation Rules ── */}
          <section className="sc-rules-section">
            <h3>
              <Shield size={15} /> Escalation Rules
            </h3>
            {escalationRules.length === 0 ? (
              <div className="sc-empty-inline">
                No escalation rules configured.
              </div>
            ) : (
              <div className="sc-rules-list">
                {escalationRules.map((rule) => (
                  <article key={rule.id} className="sc-rule-card">
                    <div className="sc-rule-header">
                      <span className="sc-rule-name">{rule.name}</span>
                      <span
                        className={`sc-badge ${
                          rule.enabled ? "sc-badge--active" : "sc-badge--inactive"
                        }`}
                      >
                        {rule.enabled ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="sc-rule-desc">{rule.description}</p>
                    <div className="sc-rule-meta">
                      <span className="sc-rule-condition">
                        Trigger: {rule.triggerCondition}
                      </span>
                      <span className="sc-rule-condition">
                        Threshold: {rule.thresholdHours}h
                      </span>
                      <span className="sc-rule-condition">
                        Action: {rule.action}
                      </span>
                      <span className="sc-rule-condition">
                        Target: {rule.targetRole}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ── Styles ── */}
      <style>{`
        .sc-dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 24px;
          color: #e5e7eb;
          background: #0f1117;
          min-height: 100vh;
        }

        /* Loading */
        .sc-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 24px;
          color: #9ca3af;
        }
        .sc-loading-pulse {
          width: 32px;
          height: 32px;
          border: 3px solid #374151;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: sc-spin 0.8s linear infinite;
        }
        @keyframes sc-spin {
          to { transform: rotate(360deg); }
        }

        /* Alert Banner */
        .sc-alert-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #fca5a5;
          font-size: 13px;
          position: relative;
          overflow: hidden;
        }
        .sc-alert-pulse {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #ef4444;
          animation: sc-pulse-bar 2s ease-in-out infinite;
        }
        @keyframes sc-pulse-bar {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* KPI Grid */
        .sc-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) {
          .sc-kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .sc-kpi-grid { grid-template-columns: 1fr; }
        }
        .sc-kpi {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #1a1d27;
          border: 1px solid #262a36;
          border-radius: 10px;
          transition: border-color 0.15s;
        }
        .sc-kpi:hover {
          border-color: #374151;
        }
        .sc-kpi-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .sc-kpi--total .sc-kpi-icon { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
        .sc-kpi--open .sc-kpi-icon { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
        .sc-kpi--review .sc-kpi-icon { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
        .sc-kpi--resolved .sc-kpi-icon { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
        .sc-kpi--rules .sc-kpi-icon { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
        .sc-kpi--active .sc-kpi-icon { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
        .sc-kpi-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sc-kpi-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9ca3af;
        }
        .sc-kpi-value {
          font-size: 22px;
          font-weight: 700;
          color: #f3f4f6;
          line-height: 1;
        }

        /* Severity Section */
        .sc-severity-section,
        .sc-recent-section,
        .sc-rules-section {
          background: #1a1d27;
          border: 1px solid #262a36;
          border-radius: 10px;
          padding: 20px;
        }
        .sc-severity-section h3,
        .sc-recent-section h3,
        .sc-rules-section h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px;
          font-size: 14px;
          font-weight: 600;
          color: #d1d5db;
        }
        .sc-severity-bars {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sc-severity-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sc-severity-label {
          width: 72px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #9ca3af;
          text-align: right;
        }
        .sc-severity-track {
          flex: 1;
          height: 8px;
          background: #262a36;
          border-radius: 4px;
          overflow: hidden;
        }
        .sc-severity-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease;
        }
        .sc-severity-count {
          width: 28px;
          font-size: 13px;
          font-weight: 600;
          color: #d1d5db;
          text-align: right;
        }

        /* Table */
        .sc-table-wrap {
          overflow-x: auto;
        }
        .sc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .sc-table thead th {
          text-align: left;
          padding: 8px 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #6b7280;
          border-bottom: 1px solid #262a36;
          white-space: nowrap;
        }
        .sc-table tbody tr {
          border-bottom: 1px solid #1f2330;
          transition: background 0.1s;
        }
        .sc-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .sc-table tbody td {
          padding: 10px 12px;
          color: #d1d5db;
          white-space: nowrap;
        }
        .sc-cell-time {
          font-size: 12px;
          color: #9ca3af;
        }
        .sc-cell-type {
          font-weight: 500;
        }
        .sc-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          white-space: nowrap;
        }
        .sc-badge--active {
          background: rgba(34, 197, 94, 0.12);
          color: #22c55e;
        }
        .sc-badge--inactive {
          background: rgba(107, 114, 128, 0.12);
          color: #6b7280;
        }
        .sc-rider-cell {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .sc-rider-code {
          font-size: 11px;
          color: #6b7280;
          font-family: monospace;
        }
        .sc-no-data {
          color: #4b5563;
        }

        /* Rules */
        .sc-rules-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sc-rule-card {
          padding: 14px;
          background: #12141c;
          border: 1px solid #262a36;
          border-radius: 8px;
        }
        .sc-rule-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 6px;
        }
        .sc-rule-name {
          font-size: 13px;
          font-weight: 600;
          color: #f3f4f6;
        }
        .sc-rule-desc {
          margin: 0 0 8px;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.4;
        }
        .sc-rule-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sc-rule-condition {
          font-size: 11px;
          color: #6b7280;
          background: #1a1d27;
          padding: 2px 8px;
          border-radius: 4px;
        }

        /* Empty States */
        .sc-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 60px 24px;
          text-align: center;
          color: #6b7280;
        }
        .sc-empty h3 {
          margin: 0;
          font-size: 16px;
          color: #9ca3af;
        }
        .sc-empty p {
          margin: 0;
          font-size: 13px;
          max-width: 360px;
        }
        .sc-empty-inline {
          padding: 24px;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
