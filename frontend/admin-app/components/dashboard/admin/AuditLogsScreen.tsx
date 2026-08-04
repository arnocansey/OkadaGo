import { ClipboardList, Shield, User, Search, Download, X } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPagination, hasServerPagination, usePagination } from "./ui/AdminPagination";
import type { AuditLogRecord } from "./types";
import { formatDateTime } from "./utils";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 15;

export type AuditLogsScreenProps = {
  auditLogs: AuditLogRecord[];
  totalAdmins: number;
  onServerExport?: () => void;
  dataLoading?: boolean;
  page?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
};

export function AuditLogsScreen({
  auditLogs,
  totalAdmins,
  onServerExport,
  dataLoading = false,
  page,
  totalItems,
  pageSize,
  onPageChange
}: AuditLogsScreenProps) {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const logs = auditLogs;

  const filtered = useMemo(
    () =>
      logs
        .filter((log) => {
          const matchSearch =
            !search ||
            log.action.toLowerCase().includes(search.toLowerCase()) ||
            log.entity.toLowerCase().includes(search.toLowerCase()) ||
            log.actor?.fullName.toLowerCase().includes(search.toLowerCase()) ||
            false;
          const matchEntity = !entityFilter || log.entity === entityFilter;
          return matchSearch && matchEntity;
        })
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [logs, search, entityFilter]
  );

  const effectivePageSize = pageSize ?? PAGE_SIZE;
  const serverPaginated = hasServerPagination({ page, totalItems, pageSize, onPageChange });
  const clientPagination = usePagination(filtered, effectivePageSize);
  const displayItems = serverPaginated ? filtered : clientPagination.paginated;
  const paginationPage = serverPaginated ? page! : clientPagination.page;
  const paginationTotal = serverPaginated ? totalItems! : filtered.length;
  const paginationOnChange = serverPaginated ? onPageChange! : clientPagination.setPage;

  useEffect(() => {
    if (!serverPaginated) clientPagination.setPage(1);
  }, [search, entityFilter, serverPaginated, clientPagination.setPage]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={3} rows={8} cols={5} />;
  }

  const entities = [...new Set(logs.map((l) => l.entity))];

  const actionCounts = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.action] = (acc[log.action] ?? 0) + 1;
    return acc;
  }, {});

  const topActions = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const selectedLog = selectedLogId ? logs.find((l) => l.id === selectedLogId) ?? null : null;

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
            {onServerExport ? (
              <button type="button" className="admin-btn-secondary" onClick={onServerExport}>
                <Download size={14} /> Export full CSV
              </button>
            ) : null}
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
              <p>{filtered.length} events · click a row for the full payload</p>
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
                  {displayItems.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLogId(log.id)}
                        style={{
                          cursor: "pointer",
                          background: selectedLogId === log.id ? "color-mix(in srgb, var(--accent-orange) 8%, transparent)" : undefined
                        }}
                      >
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
              <AdminPagination
                page={paginationPage}
                totalItems={paginationTotal}
                pageSize={effectivePageSize}
                onPageChange={paginationOnChange}
              />
            </div>
          )}
        </article>

        <aside className="admin-sidebar-panel">
          {selectedLog ? (
            <article className="admin-reference-card">
              <div className="admin-reference-cardhead">
                <div>
                  <h3>Event Details</h3>
                  <p>{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <button type="button" className="admin-btn-secondary" onClick={() => setSelectedLogId(null)} aria-label="Close">
                  <X size={14} />
                </button>
              </div>
              <ul className="admin-summary-list">
                <li><span>Action</span><strong><code className="admin-inline-code">{selectedLog.action}</code></strong></li>
                <li><span>Entity</span><strong>{selectedLog.entity}</strong></li>
                <li><span>Entity ID</span><strong><code className="admin-inline-code">{selectedLog.entityId ?? "—"}</code></strong></li>
                <li><span>Actor</span><strong>{selectedLog.actor?.fullName ?? "System"}</strong></li>
                <li><span>Email</span><strong>{selectedLog.actor?.email ?? "—"}</strong></li>
              </ul>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, color: "var(--text-secondary)", marginBottom: 8 }}>
                  Full payload
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-primary)",
                    fontSize: 12,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 360,
                    overflow: "auto",
                    color: "var(--text-primary)"
                  }}
                >
                  {selectedLog.details ? JSON.stringify(selectedLog.details, null, 2) : "No change payload recorded."}
                </pre>
              </div>
            </article>
          ) : (
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
          )}
        </aside>
      </div>
    </div>
  );
}
