import { Bike, CreditCard, Package, Users } from "lucide-react";
import { OperationsMap } from "@/components/maps/operations-map";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { RideRecord, DeliveryRecord, RiderRecord, PassengerRecord } from "./types";
import { parseNumber, formatDateTime, statusTone } from "./utils";

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
  return (
    <div className="exact-admin-dashboard">
      <AdminPageHeader
        title="Operations dashboard"
        subtitle="Live rides, deliveries, riders, and revenue across service zones."
        actions={
          <section className="admin-date-range-filter" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>From</label>
            <input
              type="date"
              className="admin-input-sm"
              value={dashboardDateRange.from}
              onChange={(e) => onDateRangeChange({ ...dashboardDateRange, from: e.target.value })}
            />
            <label style={{ fontSize: 13, fontWeight: 500 }}>To</label>
            <input
              type="date"
              className="admin-input-sm"
              value={dashboardDateRange.to}
              onChange={(e) => onDateRangeChange({ ...dashboardDateRange, to: e.target.value })}
            />
            {(dashboardDateRange.from || dashboardDateRange.to) && (
              <button
                className="admin-btn-sm"
                onClick={() => onDateRangeChange({ from: "", to: "" })}
                style={{ fontSize: 12, padding: "4px 10px" }}
              >
                Reset
              </button>
            )}
          </section>
        }
      />

      <section className="admin-reference-kpis" aria-label="Admin dashboard metrics">
        {dashboardMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="admin-reference-kpi">
              <div className={`admin-reference-kpi-icon ${metric.tone}`}>
                <Icon size={22} />
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

      <section className="admin-reference-grid-3">
        <article className="admin-reference-card admin-reference-overview">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Overview</h3>
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
                    ? "#eef1f5"
                    : `conic-gradient(#111827 0 ${rideRevenuePercent}%, #ffc107 ${rideRevenuePercent}% 100%)`
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

        <article className="admin-reference-card admin-reference-map-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Live Map</h3>
              <p>{activeRiders.length} riders online.</p>
            </div>
            <a href="/admin/riders">View full map</a>
          </div>
          <div className="admin-reference-map">
            <OperationsMap
              center={mapMarkers[0]?.position ?? [5.6037, -0.187]}
              zoom={mapMarkers.length > 0 ? 11 : 6}
              markers={mapMarkers}
              emptyTitle="No live rider coordinates yet."
              emptyDescription="Online riders with coordinates will appear on this map automatically."
            />
          </div>
        </article>
      </section>

      <section className="admin-reference-lists">
        <article className="admin-reference-card admin-reference-list-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Recent Ride Requests</h3>
              <p>Newest ride records from the backend.</p>
            </div>
            <a href="/admin/requests">View all</a>
          </div>
          {recentRideRequests.length === 0 ? (
            <EmptyCard title="No ride requests yet." body="Ride data will appear here once requests are submitted." />
          ) : (
            <ul className="admin-reference-list">
              {recentRideRequests.map((ride) => (
                <li key={ride.id} className="admin-reference-list-row">
                  <span className={`admin-reference-status-dot ${statusTone(ride.status)}`} />
                  <div>
                    <strong>{ride.passenger.user.fullName}</strong>
                    <small>{ride.pickupAddress} → {ride.destinationAddress}</small>
                  </div>
                  <em className={`admin-reference-tag ${statusTone(ride.status)}`}>{ride.status}</em>
                  <span className="admin-reference-meta">{formatDateTime(ride.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="admin-reference-card admin-reference-list-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Recent Deliveries</h3>
              <p>{deliveries.length} delivery orders total.</p>
            </div>
            <a href="/admin/deliveries">View all</a>
          </div>
          {deliveries.length === 0 ? (
            <EmptyCard title="No deliveries yet." body="Delivery records will appear here." />
          ) : (
            <ul className="admin-reference-list">
              {deliveries.slice(0, 4).map((delivery) => (
                <li key={delivery.id} className="admin-reference-list-row">
                  <span className={`admin-reference-status-dot ${statusTone(delivery.status)}`} />
                  <div>
                    <strong>{delivery.passenger.user.fullName}</strong>
                    <small>{delivery.pickupAddress} → {delivery.dropoffAddress}</small>
                  </div>
                  <em className={`admin-reference-tag ${statusTone(delivery.status)}`}>{delivery.status}</em>
                  <span className="admin-reference-meta">
                    {delivery.finalFee != null
                      ? formatMoney(delivery.currency, parseNumber(delivery.finalFee))
                      : formatMoney(delivery.currency, parseNumber(delivery.estimatedFee))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="admin-reference-card admin-reference-activity-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Live Activity Feed</h3>
              <p>Recent operational events.</p>
            </div>
          </div>
          {liveActivityItems.length === 0 ? (
            <EmptyCard title="No recent activity." body="Platform events will appear here as they happen." />
          ) : (
            <ul className="admin-reference-activity">
              {liveActivityItems.map((item) => {
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

      <section className="admin-reference-stats-row">
        <article className="admin-reference-stat">
          <span>Vehicles Registered</span>
          <strong>{vehicleCount}</strong>
        </article>
        <article className="admin-reference-stat">
          <span>Active Riders</span>
          <strong>{activeRiders.length}</strong>
        </article>
        <article className="admin-reference-stat">
          <span>Delivery Orders</span>
          <strong>{deliveries.length}</strong>
        </article>
        <article className="admin-reference-stat">
          <span>Combined Revenue</span>
          <strong>{formatMoney(adminCurrency, totalDashboardRevenue)}</strong>
        </article>
      </section>
    </div>
  );
}
