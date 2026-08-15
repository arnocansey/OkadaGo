"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X, Users, UserCheck, UserPlus, Shield, Crown, Phone, Star, Calendar } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPagination, hasServerPagination } from "./ui/AdminPagination";
import type { PassengerRecord, RideRecord } from "./types";
import { parseNumber, formatDateTime } from "./utils";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type PassengersManagementScreenProps = {
  passengers: PassengerRecord[];
  passengersTotal: number;
  rides: RideRecord[];
  userStats?: {
    passengers: { total: number; pending: number; verified: number };
  } | null;
  passengersPage: number;
  listPageSize: number;
  onPassengersPageChange: (page: number) => void;
  dataLoading?: boolean;
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function accountStatusBadge(status: string | undefined): { label: string; tone: string } {
  const s = (status ?? "").toLowerCase();
  if (s === "active") return { label: "Active", tone: "success" };
  if (s === "suspended" || s === "banned" || s === "blocked") return { label: "Suspended", tone: "danger" };
  if (s === "deactivated") return { label: "Deactivated", tone: "neutral" };
  return { label: "Active", tone: "success" };
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function PassengersManagementScreen({
  passengers,
  passengersTotal,
  rides,
  userStats,
  passengersPage,
  listPageSize,
  onPassengersPageChange,
  dataLoading = false
}: PassengersManagementScreenProps) {
  const [search, setSearch] = useState("");

  const passengerStats = useMemo(() => {
    const active = passengers.filter((p) => (p.user.accountStatus ?? "active").toLowerCase() === "active").length;
    const suspended = passengers.filter((p) => {
      const s = (p.user.accountStatus ?? "").toLowerCase();
      return s === "suspended" || s === "banned" || s === "blocked";
    }).length;
    const today = new Date().toISOString().slice(0, 10);
    const newToday = passengers.filter((p) => p.createdAt?.slice(0, 10) === today).length;
    const highValue = passengers.filter((p) => {
      const pRides = rides.filter((r) => r.passenger?.user?.fullName === p.user.fullName);
      return pRides.length >= 10;
    }).length;
    return { active, suspended, newToday, highValue };
  }, [passengers, rides]);

  const kpis = useMemo(() => [
    { label: "Total Passengers", value: passengersTotal || passengers.length, icon: Users, tone: "info" as const },
    { label: "Active", value: passengerStats.active, icon: UserCheck, tone: "success" as const },
    { label: "New Today", value: passengerStats.newToday, icon: UserPlus, tone: "accent" as const },
    { label: "Suspended", value: passengerStats.suspended, icon: Shield, tone: "danger" as const },
    { label: "High-Value", value: passengerStats.highValue, icon: Crown, tone: "warning" as const }
  ], [passengersTotal, passengers, passengerStats]);

  const enriched = useMemo(() => {
    return passengers.map((p) => {
      const pRides = rides.filter((r) => r.passenger?.user?.fullName === p.user.fullName);
      const completedRides = pRides.filter((r) => r.status.toLowerCase() === "completed");
      const totalSpending = completedRides.reduce((sum, r) => sum + parseNumber(r.finalFare), 0);
      const status = accountStatusBadge(p.user.accountStatus);
      return { ...p, tripCount: completedRides.length, totalSpending, status };
    });
  }, [passengers, rides]);

  const filtered = useMemo(() => {
    if (!search.trim()) return enriched;
    const q = search.toLowerCase();
    return enriched.filter(
      (p) =>
        p.user.fullName?.toLowerCase().includes(q) ||
        p.user.phoneE164?.toLowerCase().includes(q) ||
        p.user.email?.toLowerCase().includes(q) ||
        p.referralCode?.toLowerCase().includes(q)
    );
  }, [enriched, search]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={5} rows={10} cols={7} />;
  }

  return (
    <div className="pm-mgmt">
      <AdminPageHeader
        title="Passengers"
        subtitle={`Manage ${passengersTotal || passengers.length} passengers across the platform.`}
      />

      {/* ── KPI Cards ── */}
      <section className="pm-mgmt-kpis">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className={`pm-mgmt-kpi pm-mgmt-kpi-${kpi.tone}`}>
              <div className="pm-mgmt-kpi-icon">
                <Icon size={18} />
              </div>
              <div className="pm-mgmt-kpi-body">
                <span className="pm-mgmt-kpi-label">{kpi.label}</span>
                <strong className="pm-mgmt-kpi-value">{kpi.value}</strong>
              </div>
            </article>
          );
        })}
      </section>

      {/* ── Search ── */}
      <div className="pm-mgmt-toolbar">
        <div className="pm-mgmt-search">
          <Search size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, or referral code..."
          />
          {search && (
            <button type="button" className="pm-mgmt-search-clear" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="pm-mgmt-table-wrap">
        {filtered.length === 0 ? (
          <div className="pm-mgmt-empty">
            <EmptyCard title="No passengers found" body="Try adjusting your search query." />
          </div>
        ) : (
          <table className="pm-mgmt-table">
            <thead>
              <tr>
                <th>Passenger Name</th>
                <th>Phone</th>
                <th>Trips</th>
                <th>Spending</th>
                <th>Account Status</th>
                <th>Registered</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="pm-mgmt-name">{p.user.fullName}</span>
                  </td>
                  <td>
                    <span className="pm-mgmt-phone"><Phone size={11} /> {p.user.phoneE164}</span>
                  </td>
                  <td>
                    <span className="pm-mgmt-trips">{p.tripCount}</span>
                  </td>
                  <td>
                    <span className="pm-mgmt-spending">
                      {p.totalSpending > 0 ? (
                        <>GH₵ {p.totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                      ) : (
                        <span className="pm-mgmt-muted">—</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className={`pm-mgmt-badge pm-mgmt-badge-${p.status.tone}`}>
                      {p.status.label}
                    </span>
                  </td>
                  <td>
                    <span className="pm-mgmt-date">{formatDateTime(p.createdAt ?? "")}</span>
                  </td>
                  <td>
                    <Link href={`/passengers/${p.id}`} className="pm-mgmt-view">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {hasServerPagination({ page: passengersPage, totalItems: passengersTotal, onPageChange: onPassengersPageChange }) && (
        <AdminPagination
          page={passengersPage}
          totalItems={passengersTotal}
          pageSize={listPageSize}
          onPageChange={onPassengersPageChange}
        />
      )}
    </div>
  );
}
