"use client";

import {
  ClipboardList,
  Shield,
  User,
  Search,
  Download,
  X,
  Users,
  Bike,
  Globe,
  Laptop,
  Smartphone,
  CheckCircle2,
  Ban,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPagination, hasServerPagination, usePagination } from "./ui/AdminPagination";
import type { AuditLogRecord, AccessLogRecord } from "./types";
import { formatDateTime } from "./utils";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

export type AuditLogsScreenProps = {
  auditLogs: AuditLogRecord[];
  accessLogs?: AccessLogRecord[];
  totalAdmins: number;
  onServerExport?: () => void;
  dataLoading?: boolean;
  page?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onRevokeSession?: (sessionId: string) => void;
  isRevokingSession?: boolean;
  initialTab?: "all" | "passengers" | "riders" | "admin";
};

type AuditTab = "all" | "passengers" | "riders" | "admin";

function parseDevice(userAgent: string): { label: string; isMobile: boolean } {
  if (!userAgent) return { label: "Unknown Device", isMobile: false };
  const ua = userAgent.toLowerCase();
  const isMobile = ua.includes("mobile") || ua.includes("android") || ua.includes("iphone");
  let os = "Desktop";
  if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) os = "iOS";
  else if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";

  let browser = "";
  if (ua.includes("okadago")) browser = "OkadaGo App";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";

  const label = browser ? `${browser} (${os})` : os;
  return { label, isMobile };
}

export function AuditLogsScreen({
  auditLogs,
  accessLogs = [],
  totalAdmins,
  onServerExport,
  dataLoading = false,
  page,
  totalItems,
  pageSize,
  onPageChange,
  onRevokeSession,
  isRevokingSession = false,
  initialTab = "all"
}: AuditLogsScreenProps) {
  const [activeTab, setActiveTab] = useState<AuditTab>(initialTab);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>("ALL");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "passengers" || tabParam === "riders" || tabParam === "admin" || tabParam === "all") {
        setActiveTab(tabParam as AuditTab);
      }
    }
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const logs = auditLogs;

  // Filtered audit events
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        const actorRole = (log.actor?.role ?? "").toUpperCase();
        if (activeTab === "passengers") {
          const isPassenger = actorRole === "PASSENGER" || log.action.startsWith("PASSENGER_");
          if (!isPassenger) return false;
        } else if (activeTab === "riders") {
          const isRider = actorRole === "RIDER" || log.action.startsWith("RIDER_");
          if (!isRider) return false;
        } else if (activeTab === "admin") {
          const isAdmin = actorRole === "ADMIN" || actorRole === "DISPATCHER" || log.action.startsWith("ADMIN_");
          if (!isAdmin) return false;
        }

        const matchSearch =
          !search ||
          log.action.toLowerCase().includes(search.toLowerCase()) ||
          log.entity.toLowerCase().includes(search.toLowerCase()) ||
          log.actor?.fullName.toLowerCase().includes(search.toLowerCase()) ||
          false;
        const matchEntity = !entityFilter || log.entity === entityFilter;
        return matchSearch && matchEntity;
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [logs, activeTab, search, entityFilter]);

  // Filtered access sessions
  const filteredSessions = useMemo(() => {
    return accessLogs.filter((s) => {
      if (activeTab === "passengers" && s.role !== "PASSENGER") return false;
      if (activeTab === "riders" && s.role !== "RIDER") return false;
      if (activeTab === "admin" && s.role !== "ADMIN" && s.role !== "DISPATCHER") return false;

      if (sessionStatusFilter !== "ALL" && s.status !== sessionStatusFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        const matchName = s.user?.fullName?.toLowerCase().includes(q);
        const matchPhone = s.user?.phoneE164?.toLowerCase().includes(q);
        const matchEmail = s.user?.email?.toLowerCase().includes(q);
        const matchIp = s.ipAddress?.toLowerCase().includes(q);
        const matchCode = s.user?.displayCode?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchIp && !matchCode) {
          return false;
        }
      }
      return true;
    });
  }, [accessLogs, activeTab, sessionStatusFilter, search]);

  const effectivePageSize = pageSize ?? PAGE_SIZE;
  const isAccessTableView = activeTab === "passengers" || activeTab === "riders";

  // Client pagination for sessions and audit logs
  const sessionsPagination = usePagination(filteredSessions, effectivePageSize);
  const serverPaginated = hasServerPagination({ page, totalItems, pageSize, onPageChange });
  const clientPagination = usePagination(filteredLogs, effectivePageSize);

  const displayLogs = serverPaginated ? filteredLogs : clientPagination.paginated;
  const paginationPage = serverPaginated ? page! : clientPagination.page;
  const paginationTotal = serverPaginated ? totalItems! : filteredLogs.length;
  const paginationOnChange = serverPaginated ? onPageChange! : clientPagination.setPage;

  useEffect(() => {
    if (!serverPaginated) clientPagination.setPage(1);
    sessionsPagination.setPage(1);
    setSelectedLogId(null);
    setSelectedSessionId(null);
  }, [search, entityFilter, sessionStatusFilter, activeTab]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={4} rows={8} cols={5} />;
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
  const selectedSession = selectedSessionId
    ? accessLogs.find((s) => s.id === selectedSessionId) ?? null
    : null;

  // Session KPIs
  const activePassengerSessions = accessLogs.filter(
    (s) => s.role === "PASSENGER" && s.status === "ACTIVE"
  ).length;
  const activeRiderSessions = accessLogs.filter(
    (s) => s.role === "RIDER" && s.status === "ACTIVE"
  ).length;

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Audit & Access Trail"
        subtitle="Monitor who is accessing the OkadaGo platform in real time — passengers, riders, and administrative operators."
        actions={
          <div className="admin-screen-toolbar">
            <label className="admin-filter-search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                placeholder={
                  isAccessTableView
                    ? "Search name, phone, IP, or code…"
                    : "Search actions, entities, actors…"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            {isAccessTableView ? (
              <select
                className="admin-select-sm"
                value={sessionStatusFilter}
                onChange={(e) => setSessionStatusFilter(e.target.value)}
              >
                <option value="ALL">All Session States</option>
                <option value="ACTIVE">Active Sessions</option>
                <option value="EXPIRED">Expired</option>
                <option value="REVOKED">Revoked</option>
              </select>
            ) : (
              <select
                className="admin-select-sm"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              >
                <option value="">All entities</option>
                {entities.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            )}

            {onServerExport ? (
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ fontSize: "0.78rem" }}
                onClick={onServerExport}
              >
                <Download size={13} /> Export CSV
              </button>
            ) : null}
          </div>
        }
      />

      <AdminKpiRow
        items={[
          {
            label: "Total Events",
            value: logs.length,
            hint: "Platform actions recorded",
            icon: <ClipboardList size={18} />,
            tone: "yellow"
          },
          {
            label: "Active Passengers",
            value: activePassengerSessions,
            hint: "Live passenger sessions",
            icon: <Users size={18} />,
            tone: "green"
          },
          {
            label: "Active Riders",
            value: activeRiderSessions,
            hint: "Live rider sessions",
            icon: <Bike size={18} />,
            tone: "yellow"
          },
          {
            label: "Admin Operators",
            value: totalAdmins,
            hint: "Platform staff",
            icon: <User size={18} />,
            tone: "neutral"
          }
        ]}
      />

      {/* ── Sub-navigation Tabs ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: 8
        }}
      >
        <button
          type="button"
          className={activeTab === "all" ? "admin-btn-primary" : "admin-btn-ghost"}
          style={{ fontSize: 13, padding: "6px 14px", borderRadius: 8 }}
          onClick={() => setActiveTab("all")}
        >
          <ClipboardList size={14} style={{ marginRight: 6 }} /> All Audit Events ({logs.length})
        </button>
        <button
          type="button"
          className={activeTab === "passengers" ? "admin-btn-primary" : "admin-btn-ghost"}
          style={{ fontSize: 13, padding: "6px 14px", borderRadius: 8 }}
          onClick={() => setActiveTab("passengers")}
        >
          <Users size={14} style={{ marginRight: 6 }} /> Passengers Access & Activity (
          {accessLogs.filter((s) => s.role === "PASSENGER").length})
        </button>
        <button
          type="button"
          className={activeTab === "riders" ? "admin-btn-primary" : "admin-btn-ghost"}
          style={{ fontSize: 13, padding: "6px 14px", borderRadius: 8 }}
          onClick={() => setActiveTab("riders")}
        >
          <Bike size={14} style={{ marginRight: 6 }} /> Riders Access & Activity (
          {accessLogs.filter((s) => s.role === "RIDER").length})
        </button>
        <button
          type="button"
          className={activeTab === "admin" ? "admin-btn-primary" : "admin-btn-ghost"}
          style={{ fontSize: 13, padding: "6px 14px", borderRadius: 8 }}
          onClick={() => setActiveTab("admin")}
        >
          <Shield size={14} style={{ marginRight: 6 }} /> Admin Operations
        </button>
      </div>

      <div className="admin-overview-split">
        {/* ── Main Panel ── */}
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>
                {activeTab === "passengers"
                  ? "Passenger Access Sessions & Activity"
                  : activeTab === "riders"
                  ? "Rider Access Sessions & Activity"
                  : activeTab === "admin"
                  ? "Admin Operator Audit Trail"
                  : "Platform Audit Log"}
              </h3>
              <p>
                {isAccessTableView
                  ? `${filteredSessions.length} sessions recorded · click a row to view IP, device, and profile`
                  : `${filteredLogs.length} events · click a row for the full payload`}
              </p>
            </div>
          </div>

          {/* ── View 1: Access Logs Table (for Passengers or Riders) ── */}
          {isAccessTableView ? (
            filteredSessions.length === 0 ? (
              <EmptyCard
                title={`No ${activeTab} access sessions found.`}
                body="User logins and active sessions will appear here as they connect from the mobile apps or web."
              />
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Device & Client</th>
                      <th>IP Address</th>
                      <th>Last Active</th>
                      <th>Session Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionsPagination.paginated.map((session) => {
                      const dev = parseDevice(session.userAgent);
                      const isSelected = selectedSessionId === session.id;

                      return (
                        <tr
                          key={session.id}
                          onClick={() => {
                            setSelectedSessionId(session.id);
                            setSelectedLogId(null);
                          }}
                          style={{
                            cursor: "pointer",
                            background: isSelected
                              ? "color-mix(in srgb, var(--accent-orange) 8%, transparent)"
                              : undefined
                          }}
                        >
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background:
                                    session.role === "RIDER"
                                      ? "color-mix(in srgb, var(--accent-orange) 15%, transparent)"
                                      : "color-mix(in srgb, #3b82f6 15%, transparent)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 600,
                                  fontSize: 12,
                                  color: session.role === "RIDER" ? "var(--accent-orange)" : "#3b82f6"
                                }}
                              >
                                {session.user?.fullName?.[0]?.toUpperCase() ?? "U"}
                              </div>
                              <div>
                                <strong>{session.user?.fullName ?? "Anonymous User"}</strong>
                                {session.user?.displayCode ? (
                                  <span
                                    style={{
                                      marginLeft: 6,
                                      fontSize: 10,
                                      padding: "1px 5px",
                                      background: "var(--surface-hover)",
                                      borderRadius: 4
                                    }}
                                  >
                                    {session.user.displayCode}
                                  </span>
                                ) : null}
                                <br />
                                <small style={{ color: "var(--text-muted)" }}>
                                  {session.user?.phoneE164 ?? session.user?.email ?? "—"}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {dev.isMobile ? (
                                <Smartphone size={13} style={{ color: "var(--text-secondary)" }} />
                              ) : (
                                <Laptop size={13} style={{ color: "var(--text-secondary)" }} />
                              )}
                              <small>{dev.label}</small>
                            </div>
                          </td>

                          <td>
                            <code className="admin-inline-code">
                              <Globe size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                              {session.ipAddress}
                            </code>
                          </td>

                          <td>
                            <small title={session.lastUsedAt}>
                              {formatDateTime(session.lastUsedAt)}
                            </small>
                          </td>

                          <td>
                            {session.status === "ACTIVE" ? (
                              <span
                                className="pm-mgmt-badge pm-mgmt-badge-success"
                                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                              >
                                <CheckCircle2 size={11} /> Active
                              </span>
                            ) : session.status === "REVOKED" ? (
                              <span
                                className="pm-mgmt-badge pm-mgmt-badge-danger"
                                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                              >
                                <Ban size={11} /> Revoked
                              </span>
                            ) : (
                              <span className="pm-mgmt-badge pm-mgmt-badge-neutral">Expired</span>
                            )}
                          </td>

                          <td>
                            {session.status === "ACTIVE" && onRevokeSession ? (
                              <button
                                type="button"
                                className="admin-btn-secondary"
                                style={{ fontSize: 11, padding: "3px 8px", color: "#ef4444" }}
                                disabled={isRevokingSession}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    window.confirm(
                                      `Revoke active session for ${session.user?.fullName}? They will be immediately logged out.`
                                    )
                                  ) {
                                    onRevokeSession(session.id);
                                  }
                                }}
                              >
                                Revoke
                              </button>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <AdminPagination
                  page={sessionsPagination.page}
                  totalItems={filteredSessions.length}
                  pageSize={effectivePageSize}
                  onPageChange={sessionsPagination.setPage}
                />
              </div>
            )
          ) : (
            /* ── View 2: Audit Logs Table (All or Admin view) ── */
            filteredLogs.length === 0 ? (
              <EmptyCard
                title="No audit events found."
                body="Admin and platform actions will appear here as operators approve riders, review payouts, and resolve Accra incidents."
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
                    {displayLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => {
                          setSelectedLogId(log.id);
                          setSelectedSessionId(null);
                        }}
                        style={{
                          cursor: "pointer",
                          background:
                            selectedLogId === log.id
                              ? "color-mix(in srgb, var(--accent-orange) 8%, transparent)"
                              : undefined
                        }}
                      >
                        <td>
                          <small>{formatDateTime(log.createdAt)}</small>
                        </td>
                        <td>
                          <strong>{log.actor?.fullName ?? "System"}</strong>
                          <br />
                          <small>{log.actor?.email ?? "—"}</small>
                        </td>
                        <td>
                          <code className="admin-inline-code">{log.action}</code>
                        </td>
                        <td>
                          <em className="admin-reference-tag neutral">{log.entity}</em>
                        </td>
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
            )
          )}
        </article>

        {/* ── Sidebar Details Panel ── */}
        <aside className="admin-sidebar-panel">
          {selectedSession ? (
            <article className="admin-reference-card">
              <div className="admin-reference-cardhead">
                <div>
                  <h3>Access Session Details</h3>
                  <p>Recorded {formatDateTime(selectedSession.lastUsedAt)}</p>
                </div>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => setSelectedSessionId(null)}
                  aria-label="Close"
                >
                  <X size={13} />
                </button>
              </div>

              <ul className="admin-summary-list">
                <li>
                  <span>User</span>
                  <strong>{selectedSession.user?.fullName ?? "Anonymous"}</strong>
                </li>
                <li>
                  <span>Role</span>
                  <strong>
                    <span className="pm-mgmt-badge pm-mgmt-badge-neutral">
                      {selectedSession.role}
                    </span>
                  </strong>
                </li>
                <li>
                  <span>Phone</span>
                  <strong>{selectedSession.user?.phoneE164 ?? "—"}</strong>
                </li>
                <li>
                  <span>Email</span>
                  <strong>{selectedSession.user?.email ?? "—"}</strong>
                </li>
                <li>
                  <span>IP Address</span>
                  <strong>
                    <code className="admin-inline-code">{selectedSession.ipAddress}</code>
                  </strong>
                </li>
                <li>
                  <span>Status</span>
                  <strong>{selectedSession.status}</strong>
                </li>
                <li>
                  <span>Created</span>
                  <small>{formatDateTime(selectedSession.createdAt)}</small>
                </li>
                <li>
                  <span>Expires</span>
                  <small>{formatDateTime(selectedSession.expiresAt)}</small>
                </li>
              </ul>

              {selectedSession.user?.profileId ? (
                <div style={{ marginTop: 12 }}>
                  <Link
                    href={
                      selectedSession.role === "PASSENGER"
                        ? `/passengers/${selectedSession.user.profileId}`
                        : `/riders`
                    }
                    className="admin-btn-primary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      textDecoration: "none",
                      fontSize: 12
                    }}
                  >
                    <ExternalLink size={13} /> View Full Profile
                  </Link>
                </div>
              ) : null}

              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                    color: "var(--text-secondary)",
                    marginBottom: 8
                  }}
                >
                  Raw User-Agent Header
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-primary)",
                    fontSize: 11,
                    lineHeight: 1.4,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 180,
                    overflow: "auto",
                    color: "var(--text-primary)"
                  }}
                >
                  {selectedSession.userAgent || "No user-agent string recorded"}
                </pre>
              </div>
            </article>
          ) : selectedLog ? (
            <article className="admin-reference-card">
              <div className="admin-reference-cardhead">
                <div>
                  <h3>Event Details</h3>
                  <p>{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  style={{ fontSize: "0.78rem" }}
                  onClick={() => setSelectedLogId(null)}
                  aria-label="Close"
                >
                  <X size={13} />
                </button>
              </div>
              <ul className="admin-summary-list">
                <li>
                  <span>Action</span>
                  <strong>
                    <code className="admin-inline-code">{selectedLog.action}</code>
                  </strong>
                </li>
                <li>
                  <span>Entity</span>
                  <strong>{selectedLog.entity}</strong>
                </li>
                <li>
                  <span>Entity ID</span>
                  <strong>
                    <code className="admin-inline-code">{selectedLog.entityId ?? "—"}</code>
                  </strong>
                </li>
                <li>
                  <span>Actor</span>
                  <strong>{selectedLog.actor?.fullName ?? "System"}</strong>
                </li>
                <li>
                  <span>Email</span>
                  <strong>{selectedLog.actor?.email ?? "—"}</strong>
                </li>
              </ul>
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.7,
                    color: "var(--text-secondary)",
                    marginBottom: 8
                  }}
                >
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
                  {selectedLog.details
                    ? JSON.stringify(selectedLog.details, null, 2)
                    : "No change payload recorded."}
                </pre>
              </div>
            </article>
          ) : (
            <article className="admin-reference-card">
              <div className="admin-reference-cardhead">
                <div>
                  <h3>Top Actions</h3>
                  <p>Most frequent operations</p>
                </div>
              </div>
              {topActions.length === 0 ? (
                <EmptyCard
                  title="No action data."
                  body="Counts appear after the first audited events."
                />
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
