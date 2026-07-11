import { ClipboardList, Shield, User, Search } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import type { AuditLogRecord } from "./types";
import { formatDateTime } from "./utils";
import { useState } from "react";

export type AuditLogsScreenProps = {
  auditLogs: AuditLogRecord[];
  totalAdmins: number;
};

const AUDIT_SAMPLE: AuditLogRecord[] = [
  {
    id: "audit-1",
    action: "UPDATE_PAYOUT_STATUS",
    entity: "PayoutRequest",
    entityId: "pr-abc123",
    details: { action: "mark_paid", status: "PAID" },
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actor: { id: "adm-1", fullName: "Admin User", email: "admin@okadago.com", role: "admin" }
  },
  {
    id: "audit-2",
    action: "CREATE_ADMIN_ACCOUNT",
    entity: "AdminAccount",
    entityId: "adm-new",
    details: { email: "ops@okadago.com" },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    actor: { id: "adm-1", fullName: "Admin User", email: "admin@okadago.com", role: "admin" }
  },
  {
    id: "audit-3",
    action: "RESOLVE_INCIDENT",
    entity: "Incident",
    entityId: "inc-xyz",
    details: { status: "RESOLVED" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    actor: { id: "adm-1", fullName: "Admin User", email: "admin@okadago.com", role: "admin" }
  }
];

export function AuditLogsScreen({ auditLogs, totalAdmins }: AuditLogsScreenProps) {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  // Use provided audit logs or sample if empty
  const logs = auditLogs.length > 0 ? auditLogs : AUDIT_SAMPLE;

  const filtered = logs.filter((log) => {
    const matchSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase()) ||
      log.actor?.fullName.toLowerCase().includes(search.toLowerCase()) ||
      false;
    const matchEntity = !entityFilter || log.entity === entityFilter;
    return matchSearch && matchEntity;
  });

  const entities = [...new Set(logs.map((l) => l.entity))];

  const actionCounts = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.action] = (acc[log.action] ?? 0) + 1;
    return acc;
  }, {});

  const topActions = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="exact-admin-screen">
      <section className="admin-reference-kpis">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><ClipboardList size={22} /></div>
          <div>
            <span>Total Events</span>
            <strong>{logs.length}</strong>
            <small>Admin actions logged</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><Shield size={22} /></div>
          <div>
            <span>Entities Affected</span>
            <strong>{entities.length}</strong>
            <small>Resource types</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><User size={22} /></div>
          <div>
            <span>Admin Actors</span>
            <strong>{totalAdmins}</strong>
            <small>Active operators</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><ClipboardList size={22} /></div>
          <div>
            <span>Action Types</span>
            <strong>{Object.keys(actionCounts).length}</strong>
            <small>Distinct operations</small>
          </div>
        </article>
      </section>

      <div className="admin-filter-bar">
        <Search size={14} />
        <input
          type="text"
          className="admin-search-input"
          placeholder="Search actions, entities, actors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-select-sm"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
        >
          <option value="">All entities</option>
          {entities.map((entity) => (
            <option key={entity} value={entity}>{entity}</option>
          ))}
        </select>
      </div>

      <div className="admin-screen-grid-2">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Audit Event Log</h3>
              <p>{filtered.length} events</p>
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyCard title="No audit events found." body="Admin actions will be logged here when backend audit endpoints are connected." />
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Entity ID</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice()
                    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
                    .map((log) => (
                      <tr key={log.id}>
                        <td><small>{formatDateTime(log.createdAt)}</small></td>
                        <td>
                          <strong>{log.actor?.fullName ?? "System"}</strong>
                          <br />
                          <small>{log.actor?.email ?? "—"}</small>
                        </td>
                        <td>
                          <code style={{ fontSize: 11, background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>
                            {log.action}
                          </code>
                        </td>
                        <td><em className="admin-reference-tag neutral">{log.entity}</em></td>
                        <td>
                          {log.entityId ? (
                            <code style={{ fontSize: 11 }}>{log.entityId.slice(-12)}</code>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {log.details ? (
                            <small>{JSON.stringify(log.details).slice(0, 60)}</small>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>Top Actions</h3><p>Most frequent operations</p></div>
            </div>
            {topActions.length === 0 ? (
              <EmptyCard title="No action data." body="" />
            ) : (
              <ul className="admin-summary-list">
                {topActions.map(([action, count]) => (
                  <li key={action}>
                    <code style={{ fontSize: 11 }}>{action}</code>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>Integration Note</h3></div>
            </div>
            <div style={{ padding: "8px 0", fontSize: 13 }}>
              <p>Connect <code>/admin/audit-logs</code> to enable live audit tracking.</p>
              <p style={{ marginTop: 8 }}>Current display includes sample data for UI demonstration.</p>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
