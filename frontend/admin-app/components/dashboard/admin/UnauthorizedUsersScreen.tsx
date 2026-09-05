"use client";

import { useState, useMemo } from "react";
import {
  UserX,
  ShieldAlert,
  AlertTriangle,
  Search,
  Trash2,
  Phone,
  Mail,
  User,
  Bike,
  X,
  Clock
} from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPagination, usePagination } from "./ui/AdminPagination";
import type { UnauthorizedUserRecord } from "./types";
import { formatDateTime } from "./utils";

const PAGE_SIZE = 10;

export type UnauthorizedUsersScreenProps = {
  unauthorizedUsers: UnauthorizedUserRecord[];
  totalUsers?: number;
  dataLoading?: boolean;
  onDeleteUser: (userId: string, reason?: string) => Promise<unknown> | void;
  isDeletingUser?: boolean;
  page?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
};

export function UnauthorizedUsersScreen({
  unauthorizedUsers,
  totalUsers,
  dataLoading = false,
  onDeleteUser,
  isDeletingUser = false,
  page,
  totalItems,
  pageSize,
  onPageChange
}: UnauthorizedUsersScreenProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "PASSENGER" | "RIDER">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<UnauthorizedUserRecord | null>(
    null
  );
  const [deletionReason, setDeletionReason] = useState("");

  const filtered = useMemo(() => {
    return unauthorizedUsers.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && u.accountStatus !== statusFilter) return false;

      if (search) {
        const q = search.toLowerCase();
        const matchName = u.fullName?.toLowerCase().includes(q);
        const matchPhone = u.phoneE164?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchId = u.id?.toLowerCase().includes(q);
        const matchReason = u.unauthorizedReason?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail && !matchId && !matchReason) {
          return false;
        }
      }
      return true;
    });
  }, [unauthorizedUsers, roleFilter, statusFilter, search]);

  const effectivePageSize = pageSize ?? PAGE_SIZE;
  const clientPagination = usePagination(filtered, effectivePageSize);
  const displayItems = page ? filtered : clientPagination.paginated;

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={4} rows={8} cols={6} />;
  }

  // KPIs
  const pendingVerificationCount = unauthorizedUsers.filter(
    (u) => u.accountStatus === "PENDING_VERIFICATION" || !u.isPhoneVerified
  ).length;
  const suspendedCount = unauthorizedUsers.filter(
    (u) => u.accountStatus === "SUSPENDED" || u.accountStatus === "BANNED"
  ).length;
  const unapprovedRidersCount = unauthorizedUsers.filter((u) => u.role === "RIDER").length;

  const handleConfirmDelete = async () => {
    if (!selectedUserToDelete) return;
    try {
      await onDeleteUser(selectedUserToDelete.id, deletionReason || undefined);
      setSelectedUserToDelete(null);
      setDeletionReason("");
    } catch {
      // Handled by toast mutation in parent
    }
  };

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Unauthorized & Suspended Users"
        subtitle="Review unverified registrations, suspended accounts, and unapproved profiles with one-click revocation and deletion."
        actions={
          <div className="admin-screen-toolbar">
            <label className="admin-filter-search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                placeholder="Search name, phone, email, or user ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <select
              className="admin-select-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "ALL" | "PASSENGER" | "RIDER")}
            >
              <option value="ALL">All Roles</option>
              <option value="PASSENGER">Passengers Only</option>
              <option value="RIDER">Riders Only</option>
            </select>

            <select
              className="admin-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>
          </div>
        }
      />

      <AdminKpiRow
        items={[
          {
            label: "Unauthorized Users",
            value: unauthorizedUsers.length,
            hint: "Accounts flagged for review",
            icon: <UserX size={18} />,
            tone: "red"
          },
          {
            label: "Pending Verification",
            value: pendingVerificationCount,
            hint: "Unconfirmed phone/profile",
            icon: <AlertTriangle size={18} />,
            tone: "yellow"
          },
          {
            label: "Suspended / Banned",
            value: suspendedCount,
            hint: "Access currently blocked",
            icon: <ShieldAlert size={18} />,
            tone: "red"
          },
          {
            label: "Unapproved Riders",
            value: unapprovedRidersCount,
            hint: "Pending verification/rejected",
            icon: <Bike size={18} />,
            tone: "neutral"
          }
        ]}
      />

      {/* ── Table Card ── */}
      <article className="admin-reference-card" style={{ marginTop: 16 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>Unauthorized & Flagged Accounts</h3>
            <p>
              {filtered.length} account{filtered.length === 1 ? "" : "s"} requiring administrative
              review or deletion
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyCard
            title="No unauthorized users found."
            body="All current registered users are verified and authorized to use OkadaGo."
          />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Reason / Risk Flag</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background:
                              u.role === "RIDER"
                                ? "color-mix(in srgb, var(--accent-orange) 15%, transparent)"
                                : "color-mix(in srgb, #ef4444 15%, transparent)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 12,
                            color: u.role === "RIDER" ? "var(--accent-orange)" : "#ef4444"
                          }}
                        >
                          {u.fullName?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div>
                          <strong>{u.fullName ?? "Anonymous User"}</strong>
                          <br />
                          <code style={{ fontSize: 10, color: "var(--text-muted)" }}>
                            ID: {u.id.slice(-10)}
                          </code>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`pm-mgmt-badge ${
                          u.role === "RIDER" ? "pm-mgmt-badge-warning" : "pm-mgmt-badge-neutral"
                        }`}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                      >
                        {u.role === "RIDER" ? <Bike size={11} /> : <User size={11} />}
                        {u.role}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <AlertTriangle
                          size={13}
                          style={{ color: "#f59e0b", flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 12, color: "var(--text-primary)" }}>
                          {u.unauthorizedReason}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone size={11} style={{ color: "var(--text-muted)" }} />
                          <span>{u.phoneE164 || "—"}</span>
                        </div>
                        {u.email ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              color: "var(--text-muted)",
                              fontSize: 11
                            }}
                          >
                            <Mail size={10} />
                            <span>{u.email}</span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`pm-mgmt-badge ${
                          u.accountStatus === "BANNED" || u.accountStatus === "SUSPENDED"
                            ? "pm-mgmt-badge-danger"
                            : "pm-mgmt-badge-warning"
                        }`}
                      >
                        {u.accountStatus.replace("_", " ")}
                      </span>
                    </td>

                    <td>
                      <small style={{ color: "var(--text-secondary)" }}>
                        {formatDateTime(u.createdAt)}
                      </small>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        style={{
                          color: "#ef4444",
                          borderColor: "color-mix(in srgb, #ef4444 30%, transparent)",
                          padding: "4px 10px",
                          fontSize: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5
                        }}
                        title={`Delete unauthorized user ${u.fullName}`}
                        onClick={() => {
                          setSelectedUserToDelete(u);
                          setDeletionReason(u.unauthorizedReason || "Unauthorized account");
                        }}
                      >
                        <Trash2 size={13} /> Delete User
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <AdminPagination
              page={page ?? clientPagination.page}
              totalItems={totalItems ?? filtered.length}
              pageSize={effectivePageSize}
              onPageChange={onPageChange ?? clientPagination.setPage}
            />
          </div>
        )}
      </article>

      {/* ── Confirmation Modal ── */}
      {selectedUserToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16
          }}
          onClick={() => setSelectedUserToDelete(null)}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-color)",
              borderRadius: 14,
              maxWidth: 480,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "color-mix(in srgb, #ef4444 15%, transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ef4444"
                  }}
                >
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    Delete Unauthorized User
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                    This action will permanently revoke access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ padding: "4px 8px" }}
                onClick={() => setSelectedUserToDelete(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div
              style={{
                background: "var(--bg-primary)",
                padding: 14,
                borderRadius: 10,
                border: "1px solid var(--border-color)",
                marginBottom: 16,
                fontSize: 13
              }}
            >
              <div style={{ marginBottom: 6 }}>
                <strong>User:</strong> {selectedUserToDelete.fullName}
              </div>
              <div style={{ marginBottom: 6 }}>
                <strong>Role:</strong> {selectedUserToDelete.role}
              </div>
              <div style={{ marginBottom: 6 }}>
                <strong>Phone:</strong> {selectedUserToDelete.phoneE164}
              </div>
              <div style={{ color: "#ef4444", fontSize: 12 }}>
                <strong>Status:</strong> {selectedUserToDelete.unauthorizedReason}
              </div>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>
              Deleting this account will immediately revoke all active mobile & web sessions, set the account status to BANNED, and remove them from operational dispatching.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: "var(--text-secondary)"
                }}
              >
                Reason for Deletion / Audit Trail Note:
              </label>
              <input
                type="text"
                className="admin-input"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  fontSize: 13
                }}
                placeholder="e.g., Unverified spam account, fraudulent registration"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setSelectedUserToDelete(null)}
                disabled={isDeletingUser}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                style={{
                  background: "#ef4444",
                  borderColor: "#dc2626",
                  color: "#fff"
                }}
                onClick={handleConfirmDelete}
                disabled={isDeletingUser}
              >
                {isDeletingUser ? "Deleting Account…" : "Confirm Deletion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
