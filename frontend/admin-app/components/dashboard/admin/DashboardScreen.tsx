import { Download, Bike, MapPin } from "lucide-react";
import Link from "next/link";
import { OperationsMap } from "@/components/maps/operations-map";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
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
  onDateRangeChange
}: DashboardScreenProps) {
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
    <div className="exact-admin-dashboard">
      <AdminPageHeader
        title="Overview"
        subtitle="Live metrics and fleet status across Accra operations."
        actions={
          <div className="admin-screen-toolbar">
            <label className="admin-btn-ghost">
              From
              <input
                type="date"
                className="admin-input-sm"
                value={dashboardDateRange.from}
                onChange={(e) => onDateRangeChange({ ...dashboardDateRange, from: e.target.value })}
                style={{ marginLeft: 8 }}
              />
            </label>
            <label className="admin-btn-ghost">
              To
              <input
                type="date"
                className="admin-input-sm"
                value={dashboardDateRange.to}
                onChange={(e) => onDateRangeChange({ ...dashboardDateRange, to: e.target.value })}
                style={{ marginLeft: 8 }}
              />
            </label>
            {(dashboardDateRange.from || dashboardDateRange.to) && (
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() => onDateRangeChange({ from: "", to: "" })}
              >
                Reset
              </button>
            )}
            <a className="admin-btn-primary" href="/reports">
              <Download size={14} />
              Export Report
            </a>
          </div>
        }
      />

      <section className="admin-kpi-grid" aria-label="Admin dashboard metrics">
        {dashboardMetrics.slice(0, 4).map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="admin-reference-kpi">
              <div className={`admin-reference-kpi-icon ${metric.tone}`}>
                <Icon size={20} />
              </div>
              <div>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.trend}</small>
              </div>
            </article>
          );
        })}
      </section>

      <section className="admin-overview-split admin-overview-split--fleet">
        <article className="admin-reference-card admin-overview-map">
          <div className="admin-overview-map-head">
            <div className="admin-overview-map-title">
              <MapPin size={18} aria-hidden />
              <div>
                <h3>Live Fleet Map</h3>
                <p>Accra dispatch coverage</p>
              </div>
            </div>
            <div className="admin-overview-map-meta">
              <span className="admin-map-pill">
                <i className="online" /> Online {activeRiders.length}
              </span>
              <span className="admin-map-pill">
                <i className="gps" /> GPS {mapMarkers.length}
              </span>
              <span className="admin-map-pill muted">Vehicles {vehicleCount}</span>
              <Link href="/riders/activity-tracking" className="admin-btn-secondary admin-overview-map-link">
                Open live view
              </Link>
            </div>
          </div>
          <div className="admin-reference-map">
            <OperationsMap
              className="admin-fleet-map"
              basemap="auto"
              emptyPlacement="bottom"
              center={mapMarkers[0]?.position ?? ACCRA_MAP_CENTER}
              zoom={mapMarkers.length > 0 ? ACCRA_MAP_ZOOM_METRO : ACCRA_MAP_ZOOM_CITY}
              markers={mapMarkers}
              emptyTitle="Waiting for Accra GPS pings"
              emptyDescription="Turn a rider online with location on — markers appear here automatically."
            />
          </div>
        </article>

        <article className="admin-reference-card admin-overview-queue">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Active Requests</h3>
              <p>Newest rides and deliveries in the queue.</p>
            </div>
            <a href="/requests">View all</a>
          </div>
          {activeRequests.length === 0 ? (
            <div className="admin-overview-queue-empty">
              <EmptyCard title="No active requests." body="New passenger requests will show up here live." />
            </div>
          ) : (
            <div className="admin-active-requests">
              {activeRequests.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="admin-active-request-item">
                  <div className="admin-active-request-meta">
                    <strong>{item.kind}</strong>
                    <em className={`admin-reference-tag ${statusTone(item.status)}`}>{item.status}</em>
                  </div>
                  <small>{item.title}</small>
                  <div className="admin-active-request-meta">
                    <small>{item.passenger}</small>
                    <small>{item.amount}</small>
                  </div>
                  <small>{formatDateTime(item.createdAt)}</small>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="admin-reference-grid-3">
        <article className="admin-reference-card admin-reference-overview">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Weekly Volume</h3>
              <p>Last 7 days from live ride records.</p>
            </div>
            <span>This week</span>
          </div>
          <div className="admin-reference-legend">
            <span><i className="black" /> Ride requests</span>
            <span><i className="yellow" /> Completed rides</span>
          </div>
          <div className="admin-reference-bars">
            {weeklyRideBuckets.map((bucket) => (
              <div key={bucket.key} className="admin-reference-bar-day">
                <div className="admin-reference-bar-track">
                  <i
                    className="rides"
                    style={{
                      height: bucket.rides === 0 ? 0 : `${Math.max(8, (bucket.rides / weeklyRideMax) * 100)}%`
                    }}
                  />
                  <i
                    className="completed"
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

        <article className="admin-reference-card admin-reference-revenue">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Revenue Overview</h3>
              <p>{formatMoney(adminCurrency, totalDashboardRevenue)} captured.</p>
            </div>
            <span>This week</span>
          </div>
          <div className="admin-reference-revenue-body">
            <div
              className="admin-reference-donut"
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
            <ul className="admin-reference-revenue-list">
              <li>
                <i className="black" />
                <span>Ride Revenue</span>
                <strong>{formatMoney(adminCurrency, rideRevenue)}</strong>
                <small>{rideRevenuePercent}%</small>
              </li>
              <li>
                <i className="yellow" />
                <span>Delivery Revenue</span>
                <strong>{formatMoney(adminCurrency, deliveryRevenue)}</strong>
                <small>{deliveryRevenuePercent}%</small>
              </li>
            </ul>
          </div>
        </article>

        <article className="admin-reference-card admin-reference-activity-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Live Activity</h3>
              <p>Recent operational events.</p>
            </div>
          </div>
          {liveActivityItems.length === 0 ? (
            <EmptyCard title="No recent activity." body="Platform events will appear here as they happen." />
          ) : (
            <ul className="admin-reference-activity">
              {liveActivityItems.slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id} className="admin-reference-activity-row">
                    <div className={`admin-reference-activity-icon ${item.tone}`}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.body}</small>
                    </div>
                    <span className="admin-reference-meta">{item.meta}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
