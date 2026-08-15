import { Download, Bike, MapPin, TrendingUp, Users, Package, DollarSign, Activity, Clock, Star } from "lucide-react";
import Link from "next/link";
import { OperationsMap } from "@/components/maps/operations-map";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type { RideRecord } from "./types";
import { parseNumber, formatDateTime, statusTone, ACCRA_MAP_CENTER, ACCRA_MAP_ZOOM_CITY, ACCRA_MAP_ZOOM_METRO } from "./utils";

type MapMarker = {
  id: string;
  position: [number, number];
  label: string;
  variant: "driver";
};

type ActivityItem = {
  id: string;
  icon: typeof Bike;
  title: string;
  body: string;
  meta: string;
  tone: string;
};

type DashboardMetric = {
  label: string;
  value: string;
  trend: string;
  icon: typeof Bike;
  tone: string;
};

type WeeklyBucket = {
  key: string;
  label: string;
  rides: number;
  completed: number;
};

export type DashboardScreenProps = {
  adminCurrency: string;
  dashboardMetrics: DashboardMetric[];
  weeklyRideBuckets: WeeklyBucket[];
  weeklyRideMax: number;
  totalDashboardRevenue: number;
  rideRevenuePercent: number;
  deliveryRevenuePercent: number;
  rideRevenue: number;
  deliveryRevenue: number;
  activeRiders: { user: { fullName: string } }[];
  mapMarkers: MapMarker[];
  recentRideRequests: RideRecord[];
  deliveries: {
    id: string;
    status: string;
    pickupAddress: string;
    dropoffAddress: string;
    packageDescription: string;
    currency: string;
    finalFee: string | number | null;
    estimatedFee: string | number | null;
    createdAt: string;
    passenger: { user: { fullName: string } };
  }[];
  liveActivityItems: ActivityItem[];
  vehicleCount: number;
  dashboardDateRange: { from: string; to: string };
  onDateRangeChange: (range: { from: string; to: string }) => void;
  dataLoading?: boolean;
};

export function DashboardScreen({
  dashboardMetrics,
  weeklyRideBuckets,
  weeklyRideMax,
  adminCurrency,
  totalDashboardRevenue,
  rideRevenuePercent,
  deliveryRevenuePercent,
  rideRevenue,
  deliveryRevenue,
  activeRiders,
  mapMarkers,
  recentRideRequests,
  deliveries,
  liveActivityItems,
  vehicleCount,
  dashboardDateRange,
  onDateRangeChange,
  dataLoading = false
}: DashboardScreenProps) {
  if (dataLoading) {
    return <AdminPageSkeleton variant="dashboard" kpis={4} />;
  }

  const kpiCards = [
    {
      label: "Total Revenue",
      value: formatMoney(adminCurrency, totalDashboardRevenue),
      trend: `${rideRevenuePercent}% rides · ${deliveryRevenuePercent}% deliveries`,
      icon: DollarSign,
      tone: "success"
    },
    {
      label: "Active Rides",
      value: dashboardMetrics.find((m) => m.label.includes("Active"))?.value ?? "0",
      trend: "Live right now",
      icon: Bike,
      tone: "info"
    },
    {
      label: "Active Riders",
      value: `${activeRiders.length}`,
      trend: `of ${vehicleCount} registered`,
      icon: Users,
      tone: "warning"
    },
    {
      label: "Active Passengers",
      value: dashboardMetrics.find((m) => m.label.includes("Passenger"))?.value ?? "0",
      trend: "Currently riding",
      icon: Activity,
      tone: "accent"
    }
  ];

  const activeRequests = [
    ...recentRideRequests.slice(0, 4).map((ride) => ({
      id: ride.id,
      kind: "Ride" as const,
      title: `${ride.pickupAddress} → ${ride.destinationAddress}`,
      passenger: ride.passenger.user.fullName,
      status: ride.status,
      createdAt: ride.createdAt,
      amount: formatMoney(ride.currency || adminCurrency, parseNumber(ride.finalFare ?? ride.estimatedFare))
    })),
    ...deliveries.slice(0, 2).map((delivery) => ({
      id: delivery.id,
      kind: "Delivery" as const,
      title: `${delivery.pickupAddress} → ${delivery.dropoffAddress}`,
      passenger: delivery.passenger.user.fullName,
      status: delivery.status,
      createdAt: delivery.createdAt,
      amount:
        delivery.finalFee != null
          ? formatMoney(delivery.currency || adminCurrency, parseNumber(delivery.finalFee))
          : formatMoney(delivery.currency || adminCurrency, parseNumber(delivery.estimatedFee))
    }))
  ].slice(0, 6);

  return (
    <div className="ops-dashboard">
      {/* ── Top bar ── */}
      <div className="ops-dashboard-header">
        <div>
          <h1 className="ops-dashboard-title">Dashboard</h1>
          <p className="ops-dashboard-subtitle">Real-time overview of OkadaGo platform operations</p>
        </div>
        <div className="ops-dashboard-actions">
          <label className="ops-date-input">
            <span>From</span>
            <input
              type="date"
              value={dashboardDateRange.from}
              onChange={(e) => onDateRangeChange({ ...dashboardDateRange, from: e.target.value })}
            />
          </label>
          <label className="ops-date-input">
            <span>To</span>
            <input
              type="date"
              value={dashboardDateRange.to}
              onChange={(e) => onDateRangeChange({ ...dashboardDateRange, to: e.target.value })}
            />
          </label>
          {(dashboardDateRange.from || dashboardDateRange.to) && (
            <button
              type="button"
              className="ops-btn-ghost"
              onClick={() => onDateRangeChange({ from: "", to: "" })}
            >
              Reset
            </button>
          )}
          <a className="ops-btn-export" href="/reports">
            <Download size={14} />
            Export
          </a>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <section className="ops-kpi-row">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className={`ops-kpi-card ops-kpi-${kpi.tone}`}>
              <div className="ops-kpi-icon">
                <Icon size={20} />
              </div>
              <div className="ops-kpi-body">
                <span className="ops-kpi-label">{kpi.label}</span>
                <strong className="ops-kpi-value">{kpi.value}</strong>
                <small className="ops-kpi-trend">{kpi.trend}</small>
              </div>
            </article>
          );
        })}
      </section>

      {/* ── Main split: Map + Activity Feed ── */}
      <section className="ops-main-split">
        {/* Live Operations Map */}
        <article className="ops-card ops-map-card">
          <div className="ops-card-header">
            <div className="ops-card-header-left">
              <MapPin size={16} />
              <div>
                <h3>Live Operations Map</h3>
                <p>Fleet positions across Accra</p>
              </div>
            </div>
            <div className="ops-map-meta">
              <span className="ops-pill ops-pill-online">
                <i className="ops-dot-green" /> Online {activeRiders.length}
              </span>
              <span className="ops-pill">
                <i className="ops-dot-blue" /> GPS {mapMarkers.length}
              </span>
              <span className="ops-pill ops-pill-muted">Vehicles {vehicleCount}</span>
              <Link href="/riders/activity-tracking" className="ops-btn-sm">
                Live View
              </Link>
            </div>
          </div>
          <div className="ops-map-container">
            <OperationsMap
              className="ops-fleet-map"
              basemap="auto"
              emptyPlacement="bottom"
              center={ACCRA_MAP_CENTER}
              zoom={mapMarkers.length > 0 ? ACCRA_MAP_ZOOM_METRO : ACCRA_MAP_ZOOM_CITY}
              markers={mapMarkers}
              showFitAll
              emptyTitle="Waiting for GPS pings"
              emptyDescription="Riders will appear here when they go online."
            />
          </div>
        </article>

        {/* Real-Time Activity Feed */}
        <article className="ops-card ops-activity-card">
          <div className="ops-card-header">
            <div className="ops-card-header-left">
              <Activity size={16} />
              <div>
                <h3>Activity Feed</h3>
                <p>Live platform events</p>
              </div>
            </div>
            <span className="ops-live-badge">
              <i className="ops-pulse" /> Live
            </span>
          </div>
          {liveActivityItems.length === 0 ? (
            <div className="ops-empty-state">
              <EmptyCard title="No recent activity" body="Events will appear here in real time." />
            </div>
          ) : (
            <ul className="ops-activity-list">
              {liveActivityItems.slice(0, 8).map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id} className="ops-activity-item">
                    <div className={`ops-activity-icon ops-activity-${item.tone}`}>
                      <Icon size={14} />
                    </div>
                    <div className="ops-activity-content">
                      <strong>{item.title}</strong>
                      <small>{item.body}</small>
                    </div>
                    <span className="ops-activity-time">{item.meta}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>

      {/* ── Bottom row: Revenue, Ride Volume, Delivery Volume ── */}
      <section className="ops-bottom-split">
        {/* Revenue Analytics */}
        <article className="ops-card ops-revenue-card">
          <div className="ops-card-header">
            <div className="ops-card-header-left">
              <DollarSign size={16} />
              <div>
                <h3>Revenue Analytics</h3>
                <p>{formatMoney(adminCurrency, totalDashboardRevenue)} total captured</p>
              </div>
            </div>
          </div>
          <div className="ops-revenue-body">
            <div
              className="ops-revenue-donut"
              style={{
                background:
                  totalDashboardRevenue === 0
                    ? "var(--bg-surface-2)"
                    : `conic-gradient(var(--text-primary) 0 ${rideRevenuePercent}%, var(--accent-yellow) ${rideRevenuePercent}% 100%)`
              }}
            >
              <div>
                <span>Total</span>
                <strong>{formatMoney(adminCurrency, totalDashboardRevenue)}</strong>
              </div>
            </div>
            <ul className="ops-revenue-list">
              <li>
                <i className="ops-dot-dark" />
                <span>Ride Revenue</span>
                <strong>{formatMoney(adminCurrency, rideRevenue)}</strong>
                <small>{rideRevenuePercent}%</small>
              </li>
              <li>
                <i className="ops-dot-yellow" />
                <span>Delivery Revenue</span>
                <strong>{formatMoney(adminCurrency, deliveryRevenue)}</strong>
                <small>{deliveryRevenuePercent}%</small>
              </li>
            </ul>
          </div>
        </article>

        {/* Ride Volume */}
        <article className="ops-card ops-volume-card">
          <div className="ops-card-header">
            <div className="ops-card-header-left">
              <Bike size={16} />
              <div>
                <h3>Ride Volume</h3>
                <p>Last 7 days from live records</p>
              </div>
            </div>
          </div>
          <div className="ops-volume-legend">
            <span><i className="ops-bar-dark" /> Requests</span>
            <span><i className="ops-bar-yellow" /> Completed</span>
          </div>
          <div className="ops-volume-bars">
            {weeklyRideBuckets.map((bucket) => (
              <div key={bucket.key} className="ops-volume-day">
                <div className="ops-volume-track">
                  <i
                    className="ops-bar-rides"
                    style={{
                      height: bucket.rides === 0 ? 0 : `${Math.max(8, (bucket.rides / weeklyRideMax) * 100)}%`
                    }}
                  />
                  <i
                    className="ops-bar-completed"
                    style={{
                      height:
                        bucket.completed === 0
                          ? 0
                          : `${Math.max(8, (bucket.completed / weeklyRideMax) * 100)}%`
                    }}
                  />
                </div>
                <span>{bucket.label}</span>
              </div>
            ))}
          </div>
        </article>

        {/* Delivery Volume */}
        <article className="ops-card ops-volume-card">
          <div className="ops-card-header">
            <div className="ops-card-header-left">
              <Package size={16} />
              <div>
                <h3>Delivery Volume</h3>
                <p>Cargo and package deliveries</p>
              </div>
            </div>
          </div>
          <div className="ops-delivery-stats">
            <div className="ops-delivery-stat">
              <span className="ops-delivery-stat-value">{deliveries.length}</span>
              <span className="ops-delivery-stat-label">Total Deliveries</span>
            </div>
            <div className="ops-delivery-stat">
              <span className="ops-delivery-stat-value">
                {deliveries.filter((d) => d.status === "completed" || d.status === "delivered").length}
              </span>
              <span className="ops-delivery-stat-label">Completed</span>
            </div>
            <div className="ops-delivery-stat">
              <span className="ops-delivery-stat-value">
                {deliveries.filter((d) => d.status === "in_transit" || d.status === "picked_up").length}
              </span>
              <span className="ops-delivery-stat-label">In Transit</span>
            </div>
          </div>
          <div className="ops-delivery-list">
            {deliveries.slice(0, 4).map((delivery) => (
              <div key={delivery.id} className="ops-delivery-item">
                <div className="ops-delivery-item-header">
                  <em className={`ops-status-tag ops-status-${statusTone(delivery.status)}`}>
                    {delivery.status}
                  </em>
                  <small>{formatDateTime(delivery.createdAt)}</small>
                </div>
                <small className="ops-delivery-route">
                  {delivery.pickupAddress} → {delivery.dropoffAddress}
                </small>
              </div>
            ))}
            {deliveries.length === 0 && (
              <div className="ops-empty-inline">No deliveries yet</div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
