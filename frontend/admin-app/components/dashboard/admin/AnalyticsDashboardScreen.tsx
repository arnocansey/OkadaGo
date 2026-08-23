"use client";

import { useState, useMemo } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type { RideRecord, DeliveryRecord, RiderRecord, PassengerRecord, ServiceZoneRecord } from "./types";
import type { AdminFinanceSummary } from "./useAdminFinanceSummary";
import { parseNumber, formatDateTime } from "./utils";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Bike,
  Package,
  Banknote,
  MapPin,
  Clock,
  Target,
  UserCheck,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Zap
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type AnalyticsDashboardScreenProps = {
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  riders: RiderRecord[];
  passengers: PassengerRecord[];
  zones: ServiceZoneRecord[];
  financeSummary: AdminFinanceSummary | null;
  adminCurrency: string;
  dataLoading?: boolean;
  dashboardDateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
};

type ServiceFilter = "all" | "rides" | "deliveries";
type ChartMetric = "revenue" | "trips" | "distance";

const TIME_PRESETS: Array<{ label: string; days: number }> = [
  { label: "7 Days", days: 7 },
  { label: "14 Days", days: 14 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 }
];

/* ── CSS Bar Chart ── */

function BarChart({ data, labels, colors, height = 140 }: { data: number[][]; labels: string[]; colors: string[]; height?: number }) {
  const maxVal = Math.max(1, ...data.flat());
  return (
    <div className="an-chart-body">
      <div className="an-bars" style={{ height }}>
        {labels.map((_, i) => (
          <div key={i} className="an-bar-group">
            {data.map((series, si) => (
              <div
                key={si}
                className="an-bar"
                style={{
                  height: `${Math.max(4, (series[i] / maxVal) * 100)}%`,
                  background: colors[si],
                  opacity: 0.4 + (series[i] / maxVal) * 0.6
                }}
                title={`${labels[i]}: ${series[i].toFixed(0)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="an-bar-labels">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Progress Bar ── */

function ProgressBar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="an-progress">
      <div className="an-progress-track">
        <div className="an-progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {label && <span className="an-progress-label">{label}</span>}
    </div>
  );
}

/* ── Horizontal Stat ── */

function HStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="an-hstat">
      <span className="an-hstat-label">{label}</span>
      <span className="an-hstat-value" style={{ color }}>{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function AnalyticsDashboardScreen({
  rides,
  deliveries,
  riders,
  passengers,
  zones,
  financeSummary,
  adminCurrency,
  dataLoading = false,
  dashboardDateRange,
  onDateRangeChange
}: AnalyticsDashboardScreenProps) {
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [zoneFilter, setZoneFilter] = useState("");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("revenue");

  /* ── Filtered data ── */

  const filteredRides = useMemo(() => {
    let list = rides;
    if (zoneFilter) list = list.filter((r) => r.serviceZone?.id === zoneFilter);
    return list;
  }, [rides, zoneFilter]);

  const filteredDeliveries = useMemo(() => {
    let list = deliveries;
    if (zoneFilter) list = list.filter((d) => d.serviceZone?.id === zoneFilter);
    return list;
  }, [deliveries, zoneFilter]);

  /* ── KPI Calculations ── */

  const kpis = useMemo(() => {
    const totalRides = filteredRides.length;
    const totalDeliveries = filteredDeliveries.length;
    const totalTrips = totalRides + totalDeliveries;
    const completedRides = filteredRides.filter((r) => r.status?.toLowerCase() === "completed");
    const completedDeliveries = filteredDeliveries.filter((d) => d.status?.toLowerCase() === "completed");
    const completedTrips = completedRides.length + completedDeliveries.length;
    const cancelledRides = filteredRides.filter((r) => r.status?.toLowerCase() === "cancelled");
    const cancelledDeliveries = filteredDeliveries.filter((d) => d.status?.toLowerCase() === "cancelled");
    const cancelled = cancelledRides.length + cancelledDeliveries.length;

    const revenue = financeSummary?.revenue.total ?? 0;
    const rideRevenue = financeSummary?.revenue.rides ?? 0;
    const deliveryRevenue = financeSummary?.revenue.deliveries ?? 0;
    const commission = financeSummary?.commission.total ?? 0;
    const riderEarnings = financeSummary?.riderEarningsTotal ?? 0;

    const activeRiders = riders.filter((r) => r.onlineStatus).length;

    const avgFare = completedTrips > 0 ? (rideRevenue + deliveryRevenue) / completedTrips : 0;

    const avgDistance = completedRides.length > 0
      ? completedRides.reduce((s, r) => s + parseNumber(r.actualDistanceKm ?? r.estimatedDistanceKm ?? 0), 0) / completedRides.length
      : 0;

    const cancellationRate = totalTrips > 0 ? (cancelled / totalTrips) * 100 : 0;

    const passengerSet = new Set(filteredRides.map((r) => r.passenger?.user?.fullName).filter(Boolean));
    filteredDeliveries.forEach((d) => {
      const name = d.passenger?.user?.fullName;
      if (name) passengerSet.add(name);
    });
    const uniquePassengers = passengerSet.size;
    const retentionRate = passengers.length > 0 ? Math.min(100, (uniquePassengers / Math.max(1, passengers.length)) * 100) : 0;

    const utilization = riders.length > 0 ? (activeRiders / riders.length) * 100 : 0;

    return {
      totalRides, totalDeliveries, totalTrips,
      completedRides: completedRides.length, completedDeliveries: completedDeliveries.length, completedTrips,
      cancelled, cancellationRate,
      revenue, rideRevenue, deliveryRevenue, commission, riderEarnings,
      activeRiders, utilization,
      avgFare, avgDistance,
      uniquePassengers, retentionRate,
      totalPassengers: passengers.length
    };
  }, [filteredRides, filteredDeliveries, riders, passengers, financeSummary]);

  /* ── Daily chart data ── */

  const dailyData = useMemo(() => {
    if (!financeSummary?.daily) return { labels: [], rides: [], deliveries: [], revenue: [], commission: [] };
    const daily = financeSummary.daily;
    return {
      labels: daily.map((d) => d.key.slice(-5)),
      rides: daily.map((d) => d.rides),
      deliveries: daily.map((d) => d.deliveries),
      revenue: daily.map((d) => d.revenue),
      commission: daily.map((d) => d.commission)
    };
  }, [financeSummary]);

  /* ── Zone breakdown ── */

  const zoneBreakdown = useMemo(() => {
    const counts: Record<string, { rides: number; deliveries: number }> = {};
    filteredRides.forEach((r) => {
      const z = r.serviceZone?.name ?? "Unknown";
      counts[z] = counts[z] || { rides: 0, deliveries: 0 };
      counts[z].rides++;
    });
    filteredDeliveries.forEach((d) => {
      const z = d.serviceZone?.name ?? "Unknown";
      counts[z] = counts[z] || { rides: 0, deliveries: 0 };
      counts[z].deliveries++;
    });
    return Object.entries(counts)
      .map(([zone, data]) => ({ zone, ...data, total: data.rides + data.deliveries }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [filteredRides, filteredDeliveries]);

  const zoneMax = Math.max(1, ...zoneBreakdown.map((z) => z.total));

  /* ── Top riders ── */

  const topRiders = useMemo(() => {
    return (financeSummary?.topRiders ?? []).slice(0, 5);
  }, [financeSummary]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="cards" kpis={4} rows={6} />;
  }

  return (
    <div className="an-mgmt">
      <AdminPageHeader
        title="Analytics Dashboard"
        subtitle="Platform performance metrics, trends, and growth indicators."
      />

      {/* ── Filters ── */}
      <div className="an-filters">
        <div className="an-filter-group">
          <Calendar size={13} />
          {TIME_PRESETS.map((preset) => {
            const to = new Date().toISOString().slice(0, 10);
            const from = new Date(Date.now() - preset.days * 86400000).toISOString().slice(0, 10);
            const isActive = dashboardDateRange.from === from && dashboardDateRange.to === to;
            return (
              <button
                key={preset.label}
                type="button"
                className={`an-filter-chip${isActive ? " active" : ""}`}
                onClick={() => onDateRangeChange({ from, to })}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <div className="an-filter-group">
          <Filter size={13} />
          <select
            className="an-select"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value as ServiceFilter)}
          >
            <option value="all">All Services</option>
            <option value="rides">Rides Only</option>
            <option value="deliveries">Deliveries Only</option>
          </select>
          <select
            className="an-select"
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
          >
            <option value="">All Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── KPI Row 1: Core Metrics ── */}
      <section className="an-kpis">
        <article className="an-kpi an-kpi--revenue">
          <div className="an-kpi-icon"><Banknote size={18} /></div>
          <div className="an-kpi-body">
            <span className="an-kpi-label">Revenue</span>
            <strong className="an-kpi-value">{formatMoney(adminCurrency, kpis.revenue)}</strong>
            <small>{formatMoney(adminCurrency, kpis.commission)} commission</small>
          </div>
        </article>
        <article className="an-kpi an-kpi--trips">
          <div className="an-kpi-icon"><Bike size={18} /></div>
          <div className="an-kpi-body">
            <span className="an-kpi-label">Total Trips</span>
            <strong className="an-kpi-value">{kpis.totalTrips.toLocaleString()}</strong>
            <small>{kpis.completedTrips} completed · {kpis.cancelled} cancelled</small>
          </div>
        </article>
        <article className="an-kpi an-kpi--riders">
          <div className="an-kpi-icon"><Users size={18} /></div>
          <div className="an-kpi-body">
            <span className="an-kpi-label">Active Riders</span>
            <strong className="an-kpi-value">{kpis.activeRiders}</strong>
            <small>{kpis.utilization.toFixed(0)}% utilization</small>
          </div>
        </article>
        <article className="an-kpi an-kpi--passengers">
          <div className="an-kpi-icon"><UserCheck size={18} /></div>
          <div className="an-kpi-body">
            <span className="an-kpi-label">Passengers</span>
            <strong className="an-kpi-value">{kpis.uniquePassengers.toLocaleString()}</strong>
            <small>{kpis.retentionRate.toFixed(0)}% retention</small>
          </div>
        </article>
      </section>

      {/* ── KPI Row 2: Derived Metrics ── */}
      <section className="an-kpis an-kpis--secondary">
        <article className="an-kpi-sm">
          <Target size={15} className="an-kpi-sm-icon" />
          <div>
            <span className="an-kpi-sm-label">Avg Fare</span>
            <strong>{formatMoney(adminCurrency, kpis.avgFare)}</strong>
          </div>
        </article>
        <article className="an-kpi-sm">
          <MapPin size={15} className="an-kpi-sm-icon" />
          <div>
            <span className="an-kpi-sm-label">Avg Distance</span>
            <strong>{kpis.avgDistance.toFixed(1)} km</strong>
          </div>
        </article>
        <article className="an-kpi-sm">
          <Percent size={15} className="an-kpi-sm-icon" />
          <div>
            <span className="an-kpi-sm-label">Cancellation Rate</span>
            <strong className={kpis.cancellationRate > 10 ? "an-text-danger" : ""}>{kpis.cancellationRate.toFixed(1)}%</strong>
          </div>
        </article>
        <article className="an-kpi-sm">
          <Zap size={15} className="an-kpi-sm-icon" />
          <div>
            <span className="an-kpi-sm-label">Rider Earnings</span>
            <strong>{formatMoney(adminCurrency, kpis.riderEarnings)}</strong>
          </div>
        </article>
        <article className="an-kpi-sm">
          <Activity size={15} className="an-kpi-sm-icon" />
          <div>
            <span className="an-kpi-sm-label">Rides / Deliveries</span>
            <strong>{kpis.totalRides} / {kpis.totalDeliveries}</strong>
          </div>
        </article>
      </section>

      {/* ── Charts Row 1: Trend ── */}
      <section className="an-charts-row">
        <article className="an-chart-card an-chart-card--wide">
          <div className="an-chart-header">
            <h3>
              <BarChart3 size={15} />
              {chartMetric === "revenue" ? "Revenue Trend" : chartMetric === "trips" ? "Trips Trend" : "Distance Trend"}
            </h3>
            <div className="an-chart-tabs">
              <button type="button" className={`an-chart-tab${chartMetric === "revenue" ? " active" : ""}`} onClick={() => setChartMetric("revenue")}>Revenue</button>
              <button type="button" className={`an-chart-tab${chartMetric === "trips" ? " active" : ""}`} onClick={() => setChartMetric("trips")}>Trips</button>
              <button type="button" className={`an-chart-tab${chartMetric === "distance" ? " active" : ""}`} onClick={() => setChartMetric("distance")}>Distance</button>
            </div>
          </div>
          {dailyData.labels.length === 0 ? (
            <div className="an-chart-empty"><EmptyCard title="No data" body="Trend data will appear here." /></div>
          ) : chartMetric === "revenue" ? (
            <BarChart
              data={[dailyData.revenue, dailyData.commission]}
              labels={dailyData.labels}
              colors={["#22c55e", "#ff6b00"]}
            />
          ) : chartMetric === "trips" ? (
            <BarChart
              data={[dailyData.rides, dailyData.deliveries]}
              labels={dailyData.labels}
              colors={["#3b82f6", "#a855f7"]}
            />
          ) : (
            <BarChart
              data={[dailyData.rides.map((_, i) => dailyData.rides[i] * kpis.avgDistance)]}
              labels={dailyData.labels}
              colors={["#f59e0b"]}
            />
          )}
          <div className="an-chart-legend">
            {chartMetric === "revenue" && (
              <>
                <span><i style={{ background: "#22c55e" }} /> Revenue</span>
                <span><i style={{ background: "#ff6b00" }} /> Commission</span>
              </>
            )}
            {chartMetric === "trips" && (
              <>
                <span><i style={{ background: "#3b82f6" }} /> Rides</span>
                <span><i style={{ background: "#a855f7" }} /> Deliveries</span>
              </>
            )}
            {chartMetric === "distance" && (
              <span><i style={{ background: "#f59e0b" }} /> Estimated Distance</span>
            )}
          </div>
        </article>

        <article className="an-chart-card">
          <div className="an-chart-header">
            <h3><Users size={15} /> Active Riders</h3>
          </div>
          <div className="an-util-ring">
            <svg viewBox="0 0 100 100" className="an-ring-svg">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="#22c55e"
                strokeWidth="8"
                strokeDasharray={`${kpis.utilization * 2.64} ${264 - kpis.utilization * 2.64}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="an-ring-center">
              <strong>{kpis.utilization.toFixed(0)}%</strong>
              <span>Utilization</span>
            </div>
          </div>
          <div className="an-ring-stats">
            <HStat label="Active" value={`${kpis.activeRiders}`} color="#22c55e" />
            <HStat label="Total" value={`${riders.length}`} color="#6b7280" />
            <HStat label="Suspended" value={`${riders.filter((r) => r.approvalStatus === "SUSPENDED").length}`} color="#ef4444" />
          </div>
        </article>
      </section>

      {/* ── Charts Row 2: Breakdown ── */}
      <section className="an-charts-row">
        <article className="an-chart-card">
          <div className="an-chart-header">
            <h3><MapPin size={15} /> Zone Activity</h3>
          </div>
          {zoneBreakdown.length === 0 ? (
            <div className="an-chart-empty"><EmptyCard title="No zone data" body="" /></div>
          ) : (
            <div className="an-zone-bars">
              {zoneBreakdown.map((z) => (
                <div key={z.zone} className="an-zone-row">
                  <span className="an-zone-name">{z.zone}</span>
                  <div className="an-zone-bar-wrap">
                    <div className="an-zone-bar an-zone-bar--rides" style={{ width: `${(z.rides / zoneMax) * 100}%` }} />
                    <div className="an-zone-bar an-zone-bar--delivery" style={{ width: `${(z.deliveries / zoneMax) * 100}%` }} />
                  </div>
                  <span className="an-zone-count">{z.total}</span>
                </div>
              ))}
            </div>
          )}
          <div className="an-chart-legend">
            <span><i style={{ background: "#3b82f6" }} /> Rides</span>
            <span><i style={{ background: "#a855f7" }} /> Deliveries</span>
          </div>
        </article>

        <article className="an-chart-card">
          <div className="an-chart-header">
            <h3><TrendingUp size={15} /> Top Riders</h3>
          </div>
          {topRiders.length === 0 ? (
            <div className="an-chart-empty"><EmptyCard title="No rider data" body="" /></div>
          ) : (
            <div className="an-top-riders">
              {topRiders.map((r, i) => {
                const maxRev = topRiders[0]?.revenue ?? 1;
                return (
                  <div key={r.riderId} className="an-rider-row">
                    <span className="an-rider-rank">#{i + 1}</span>
                    <div className="an-rider-info">
                      <span className="an-rider-name">{r.name}</span>
                      <span className="an-rider-meta">{r.completedCount} trips · {r.averageRating?.toFixed(1) ?? "—"}★</span>
                    </div>
                    <div className="an-rider-bar-wrap">
                      <div className="an-rider-bar" style={{ width: `${(r.revenue / maxRev) * 100}%` }} />
                    </div>
                    <span className="an-rider-rev">{formatMoney(adminCurrency, r.revenue)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      {/* ── Charts Row 3: Retention + Cancellation ── */}
      <section className="an-charts-row">
        <article className="an-chart-card">
          <div className="an-chart-header">
            <h3><UserCheck size={15} /> Customer Retention</h3>
          </div>
          <div className="an-retention">
            <div className="an-retention-ring">
              <svg viewBox="0 0 100 100" className="an-ring-svg">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeDasharray={`${kpis.retentionRate * 2.64} ${264 - kpis.retentionRate * 2.64}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="an-ring-center">
                <strong>{kpis.retentionRate.toFixed(0)}%</strong>
                <span>Retained</span>
              </div>
            </div>
            <div className="an-retention-stats">
              <HStat label="Active passengers" value={`${kpis.uniquePassengers}`} color="#3b82f6" />
              <HStat label="Total registered" value={`${kpis.totalPassengers}`} color="#6b7280" />
              <HStat label="New this period" value={`${Math.max(0, kpis.totalPassengers - kpis.uniquePassengers)}`} color="#22c55e" />
            </div>
          </div>
        </article>

        <article className="an-chart-card">
          <div className="an-chart-header">
            <h3><Percent size={15} /> Cancellation Rate</h3>
          </div>
          <div className="an-cancel">
            <div className="an-cancel-ring">
              <svg viewBox="0 0 100 100" className="an-ring-svg">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={kpis.cancellationRate > 10 ? "#ef4444" : "#22c55e"}
                  strokeWidth="8"
                  strokeDasharray={`${kpis.cancellationRate * 2.64} ${264 - kpis.cancellationRate * 2.64}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="an-ring-center">
                <strong className={kpis.cancellationRate > 10 ? "an-text-danger" : ""}>{kpis.cancellationRate.toFixed(1)}%</strong>
                <span>Cancelled</span>
              </div>
            </div>
            <div className="an-cancel-stats">
              <HStat label="Total trips" value={`${kpis.totalTrips}`} color="#6b7280" />
              <HStat label="Completed" value={`${kpis.completedTrips}`} color="#22c55e" />
              <HStat label="Cancelled" value={`${kpis.cancelled}`} color="#ef4444" />
            </div>
          </div>
        </article>

        <article className="an-chart-card">
          <div className="an-chart-header">
            <h3><Target size={15} /> Fare Overview</h3>
          </div>
          <div className="an-fare-overview">
            <div className="an-fare-stat">
              <span className="an-fare-stat-label">Average Fare</span>
              <strong className="an-fare-stat-value">{formatMoney(adminCurrency, kpis.avgFare)}</strong>
            </div>
            <div className="an-fare-stat">
              <span className="an-fare-stat-label">Average Distance</span>
              <strong className="an-fare-stat-value">{kpis.avgDistance.toFixed(1)} km</strong>
            </div>
            <div className="an-fare-stat">
              <span className="an-fare-stat-label">Revenue per km</span>
              <strong className="an-fare-stat-value">{kpis.avgDistance > 0 ? formatMoney(adminCurrency, kpis.revenue / (kpis.avgDistance * Math.max(1, kpis.completedRides))) : "—"}</strong>
            </div>
            <div className="an-fare-stat">
              <span className="an-fare-stat-label">Ride Revenue</span>
              <strong className="an-fare-stat-value an-text-blue">{formatMoney(adminCurrency, kpis.rideRevenue)}</strong>
            </div>
            <div className="an-fare-stat">
              <span className="an-fare-stat-label">Delivery Revenue</span>
              <strong className="an-fare-stat-value an-text-purple">{formatMoney(adminCurrency, kpis.deliveryRevenue)}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
