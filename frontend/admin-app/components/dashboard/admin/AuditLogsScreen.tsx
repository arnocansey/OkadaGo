import { ClipboardList, Shield, User, Search } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { AuditLogRecord } from "./types";
import { formatDateTime } from "./utils";
import { useState } from "react";

export type AuditLogsScreenProps = {
  auditLogs: AuditLogRecord[];
  totalAdmins: number;
};

export function AuditLogsScreen({ auditLogs, totalAdmins }: AuditLogsScreenProps) {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const logs = auditLogs;

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
      <AdminPageHeader
        title="Audit Trail"
        subtitle="OkadaGo Accra operator actions — who changed what across Ghana ops."
        actions={
          <div className="admin-screen-toolbar">
            <label className="admin-filter-search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                placeholder="Search actions, entities, actors…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
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
        }
      />

      <AdminKpiRow
        items={[
          { label: "Total Events", value: logs.length, hint: "Admin actions logged", icon: <ClipboardList size={22} />, tone: "yellow" },
          { label: "Entities Affected", value: entities.length, hint: "Resource types", icon: <Shield size={22} />, tone: "green" },
          { label: "Admin Actors", value: totalAdmins, hint: "Active operators", icon: <User size={22} />, tone: "yellow" },
          { label: "Action Types", value: Object.keys(actionCounts).length, hint: "Distinct operations", icon: <ClipboardList size={22} />, tone: "yellow" }
        ]}
      />

      <div className="admin-overview-split">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Audit Event Log</h3>
              <p>{filtered.length} events</p>
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyCard
              title="No audit events yet."
              body="Admin actions will appear here as operators approve riders, review payouts, and resolve Accra incidents."
            />
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
                          <code className="admin-inline-code">{log.action}</code>
                        </td>
                        <td><em className="admin-reference-tag neutral">{log.entity}</em></td>
                        <td>
                          {log.entityId ? (
                            <code className="admin-inline-code">{log.entityId.slice(-12)}</code>
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
              <EmptyCard title="No action data." body="Counts appear after the first audited events." />
            ) : (
              <ul className="admin-summary-list">
                {topActions.map(([action, count]) => (
                  <li key={action}>
                    <code className="admin-inline-code">{action}</code>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </aside>
      </div>
    </div>
  );
}
