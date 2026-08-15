"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X, Users, Wifi, Clock, Shield, Star, MapPin, Phone, Calendar } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPagination, hasServerPagination } from "./ui/AdminPagination";
import type { RiderRecord } from "./types";
import { parseNumber, formatDateTime } from "./utils";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type RidersManagementScreenProps = {
  riders: RiderRecord[];
  ridersTotal: number;
  activeRiders: RiderRecord[];
  suspendedRiders: RiderRecord[];
  userStats?: {
    riders: { total: number; pending: number; verified: number; suspended: number };
  } | null;
  ridersPage: number;
  listPageSize: number;
  onRidersPageChange: (page: number) => void;
  dataLoading?: boolean;
};

type FilterKey = "all" | "online" | "offline" | "pending" | "active" | "suspended" | "deactivated";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function riderOverallStatus(rider: RiderRecord): string {
  const account = (rider.user.accountStatus ?? "").toLowerCase();
  const approval = (rider.approvalStatus ?? "").toUpperCase();
  if (account === "suspended" || account === "banned" || account === "blocked" || approval === "SUSPENDED") return "suspended";
  if (account === "deactivated" || account === "inactive") return "deactivated";
  if (approval === "PENDING") return "pending";
  if (rider.onlineStatus) return "online";
  return "offline";
}

function riderVerificationBadge(status: string | undefined): { label: string; tone: string } {
  const s = (status ?? "").toUpperCase();
  if (s === "APPROVED") return { label: "Verified", tone: "success" };
  if (s === "PENDING") return { label: "Pending", tone: "warning" };
  if (s === "REJECTED") return { label: "Rejected", tone: "danger" };
  if (s === "SUSPENDED") return { label: "Suspended", tone: "danger" };
  return { label: "Unknown", tone: "neutral" };
}

function riderStatusBadge(status: string): { label: string; tone: string } {
  if (status === "online") return { label: "Online", tone: "online" };
  if (status === "offline") return { label: "Offline", tone: "offline" };
  if (status === "pending") return { label: "Pending", tone: "warning" };
  if (status === "active") return { label: "Active", tone: "success" };
  if (status === "suspended") return { label: "Suspended", tone: "danger" };
  if (status === "deactivated") return { label: "Deactivated", tone: "neutral" };
  return { label: status, tone: "neutral" };
}

/* ── Component ────────────────────────────────────────────────────────────── */

export function RidersManagementScreen({
  riders,
  ridersTotal,
  activeRiders,
  suspendedRiders,
  userStats,
  ridersPage,
  listPageSize,
  onRidersPageChange,
  dataLoading = false
}: RidersManagementScreenProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const pendingCount = userStats?.riders.pending ?? riders.filter((r) => (r.approvalStatus ?? "").toUpperCase() === "PENDING").length;

  const kpis = useMemo(() => [
    { label: "Total Riders", value: ridersTotal || riders.length, icon: Users, tone: "info" as const },
    { label: "Online", value: activeRiders.length, icon: Wifi, tone: "success" as const },
    { label: "Pending Verification", value: pendingCount, icon: Clock, tone: "warning" as const },
    { label: "Suspended", value: suspendedRiders.length, icon: Shield, tone: "danger" as const },
    {
      label: "Top Riders",
      value: riders.filter((r) => (r.approvalStatus ?? "").toUpperCase() === "APPROVED" && r.onlineStatus).length,
      icon: Star,
      tone: "accent" as const
    }
  ], [ridersTotal, riders, activeRiders, suspendedRiders, pendingCount]);

  const filtered = useMemo(() => {
    let list = riders;

    if (filter !== "all") {
      list = list.filter((r) => {
        const status = riderOverallStatus(r);
        if (filter === "online") return status === "online";
        if (filter === "offline") return status === "offline";
        if (filter === "pending") return status === "pending";
        if (filter === "active") return status === "online" || status === "offline";
        if (filter === "suspended") return status === "suspended";
        if (filter === "deactivated") return status === "deactivated";
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.user.fullName?.toLowerCase().includes(q) ||
          r.displayCode?.toLowerCase().includes(q) ||
          r.user.phoneE164?.toLowerCase().includes(q) ||
          r.city?.toLowerCase().includes(q) ||
          r.serviceZone?.name?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [riders, filter, search]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={5} rows={10} cols={9} />;
  }

  return (
    <div className="rd-mgmt">
      <AdminPageHeader
        title="Riders"
        subtitle={`Manage ${ridersTotal} riders across the platform.`}
      />

      {/* ── KPI Cards ── */}
      <section className="rd-mgmt-kpis">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className={`rd-mgmt-kpi rd-mgmt-kpi-${kpi.tone}`}>
              <div className="rd-mgmt-kpi-icon">
                <Icon size={18} />
              </div>
              <div className="rd-mgmt-kpi-body">
                <span className="rd-mgmt-kpi-label">{kpi.label}</span>
                <strong className="rd-mgmt-kpi-value">{kpi.value}</strong>
              </div>
            </article>
          );
        })}
      </section>

      {/* ── Filters + Search ── */}
      <div className="rd-mgmt-toolbar">
        <div className="rd-mgmt-filters">
          {(["all", "online", "offline", "pending", "active", "suspended", "deactivated"] as FilterKey[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`rd-mgmt-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "online" ? "Online" : f === "offline" ? "Offline" : f === "pending" ? "Pending" : f === "active" ? "Active" : f === "suspended" ? "Suspended" : "Deactivated"}
            </button>
          ))}
        </div>
        <div className="rd-mgmt-search">
          <Search size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, phone, city, or zone..."
          />
          {search && (
            <button type="button" className="rd-mgmt-search-clear" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rd-mgmt-table-wrap">
        {filtered.length === 0 ? (
          <div className="rd-mgmt-empty">
            <EmptyCard title="No riders found" body="Try adjusting your search or filter." />
          </div>
        ) : (
          <table className="rd-mgmt-table">
            <thead>
              <tr>
                <th>Rider Name</th>
                <th>Rider ID</th>
                <th>Phone</th>
                <th>Rating</th>
                <th>Trips</th>
                <th>Earnings</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rider) => {
                const status = riderOverallStatus(rider);
                const badge = riderStatusBadge(status);
                const verification = riderVerificationBadge(rider.approvalStatus);
                const rating = rider.ratingAverage != null ? parseNumber(rider.ratingAverage) : null;
                const trips = rider.completedTrips ?? null;
                const earnings = rider.totalEarnings != null ? parseNumber(rider.totalEarnings) : null;

                return (
                  <tr key={rider.id}>
                    <td>
                      <span className="rd-mgmt-name">{rider.user.fullName}</span>
                    </td>
                    <td>
                      <code className="rd-mgmt-id">{rider.displayCode}</code>
                    </td>
                    <td>
                      <span className="rd-mgmt-phone">
                        <Phone size={11} /> {rider.user.phoneE164}
                      </span>
                    </td>
                    <td>
                      <span className="rd-mgmt-rating">
                        {rating != null ? (
                          <>
                            <Star size={11} className="rd-mgmt-star" />
                            {rating.toFixed(1)}
                          </>
                        ) : (
                          <span className="rd-mgmt-muted">—</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className="rd-mgmt-trips">
                        {trips != null ? trips.toLocaleString() : <span className="rd-mgmt-muted">—</span>}
                      </span>
                    </td>
                    <td>
                      <span className="rd-mgmt-earnings">
                        {earnings != null && earnings > 0 ? (
                          <>GH₵ {earnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                        ) : (
                          <span className="rd-mgmt-muted">—</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={`rd-mgmt-badge rd-mgmt-badge-${badge.tone}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      <span className={`rd-mgmt-badge rd-mgmt-badge-${verification.tone}`}>
                        {verification.label}
                      </span>
                    </td>
                    <td>
                      <span className="rd-mgmt-date">{formatDateTime(rider.createdAt ?? "")}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {hasServerPagination({ page: ridersPage, totalItems: ridersTotal, onPageChange: onRidersPageChange }) && (
        <AdminPagination
          page={ridersPage}
          totalItems={ridersTotal}
          pageSize={listPageSize}
          onPageChange={onRidersPageChange}
        />
      )}
    </div>
  );
}
