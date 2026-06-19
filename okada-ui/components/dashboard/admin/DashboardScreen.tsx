"use client";

import {
  Bike,
  CreditCard,
  Headphones,
  Package,
  Settings,
  Tag,
  User,
  UserPlus,
  Users
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationsMap } from "@/components/maps/operations-map";
import { formatMoney } from "@/lib/currency";
import type { RideRecord } from "./types";

export function DashboardSkeleton() {
  return (
    <div className="exact-admin-dashboard">
      <section className="admin-reference-kpis" aria-label="Loading dashboard metrics">
        {Array.from({ length: 4 }).map((_, i) => (
          <article key={i} className="admin-reference-kpi">
            <Skeleton className="admin-reference-kpi-icon" style={{ width: 44, height: 44 }} />
            <div style={{ flex: 1 }}>
              <Skeleton className="mb-2" style={{ width: 80, height: 12 }} />
              <Skeleton className="mb-2" style={{ width: 64, height: 20 }} />
              <Skeleton style={{ width: 56, height: 10 }} />
            </div>
          </article>
        ))}
      </section>

      <section className="admin-reference-grid-3">
        <article className="admin-reference-card admin-reference-overview">
          <div className="admin-reference-cardhead">
            <div>
              <Skeleton style={{ width: 120, height: 18 }} />
              <Skeleton className="mt-2" style={{ width: 200, height: 12 }} />
            </div>
            <Skeleton style={{ width: 64, height: 14 }} />
          </div>
          <div className="admin-reference-bars" style={{ marginTop: 20 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="admin-reference-bar-day">
                <div className="admin-reference-bar-track">
                  <Skeleton style={{ height: `${30 + Math.random() * 60}%` }} />
                </div>
                <Skeleton style={{ width: 24, height: 10 }} />
              </div>
            ))}
          </div>
        </article>

        <article className="admin-reference-card admin-reference-revenue">
          <div className="admin-reference-cardhead">
            <div>
              <Skeleton style={{ width: 160, height: 18 }} />
              <Skeleton className="mt-2" style={{ width: 140, height: 12 }} />
            </div>
            <Skeleton style={{ width: 64, height: 14 }} />
          </div>
          <div className="admin-reference-revenue-body" style={{ marginTop: 20 }}>
            <Skeleton style={{ width: 120, height: 120, borderRadius: "50%" }} />
            <ul className="admin-reference-revenue-list">
              {[0, 1].map((i) => (
                <li key={i}>
                  <Skeleton style={{ width: 12, height: 12, borderRadius: "50%" }} />
                  <Skeleton style={{ width: 100, height: 14 }} />
                  <Skeleton style={{ width: 60, height: 14 }} />
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="admin-reference-card admin-reference-map-card">
          <div className="admin-reference-cardhead">
            <div>
              <Skeleton style={{ width: 80, height: 18 }} />
              <Skeleton className="mt-2" style={{ width: 100, height: 12 }} />
            </div>
            <Skeleton style={{ width: 80, height: 14 }} />
          </div>
          <Skeleton style={{ width: "100%", height: 200, marginTop: 12, borderRadius: 12 }} />
        </article>
      </section>

      <section className="admin-reference-lists">
        {[0, 1, 2].map((i) => (
          <article key={i} className="admin-reference-card admin-reference-list-card">
            <div className="admin-reference-cardhead">
              <div>
                <Skeleton style={{ width: 140, height: 18 }} />
                <Skeleton className="mt-2" style={{ width: 180, height: 12 }} />
              </div>
              <Skeleton style={{ width: 60, height: 14 }} />
            </div>
            <ul className="admin-reference-request-list">
              {Array.from({ length: 3 }).map((_, j) => (
                <li key={j}>
                  <Skeleton style={{ width: 40, height: 40, borderRadius: "50%" }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton style={{ width: 120, height: 14 }} />
                    <Skeleton className="mt-2" style={{ width: 180, height: 12 }} />
                    <Skeleton className="mt-1" style={{ width: 80, height: 10 }} />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Skeleton style={{ width: 60, height: 14 }} />
                    <Skeleton className="mt-2" style={{ width: 48, height: 18, borderRadius: 999 }} />
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (["completed", "delivered", "paid", "captured", "posted", "approved", "valid"].includes(normalized)) {
    return "success";
  }
  if (["searching", "assigned", "arriving", "arrived", "started", "picked_up", "in_transit", "pending", "requested", "reviewing", "under review", "processing"].includes(normalized)) {
    return "warning";
  }
  if (["failed", "rejected", "cancelled", "reversed", "missing", "expired"].includes(normalized)) {
    return "danger";
  }
  return "neutral";
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type MapMarker = {
  id: string;
  position: [number, number];
  label: string;
  variant: "driver";
};

type WeeklyBucket = {
  key: string;
  label: string;
  rides: number;
  completed: number;
};

type Metric = {
  label: string;
  value: string;
  trend: string;
  icon: typeof Bike;
  tone: string;
};

type ActivityItem = {
  id: string;
  icon: typeof Bike;
  title: string;
  body: string;
  meta: string;
  tone: string;
};

export type DashboardScreenProps = {
  dashboardMetrics: Metric[];
  weeklyRideBuckets: WeeklyBucket[];
  weeklyRideMax: number;
  adminCurrency: string;
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
};

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

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
  vehicleCount
}: DashboardScreenProps) {
  return (
    <div className="exact-admin-dashboard">
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
            <EmptyCard
              title="No ride requests yet."
              body="Ride requests will appear here as soon as passengers start booking."
            />
          ) : (
            <ul className="admin-reference-request-list">
              {recentRideRequests.map((ride) => (
                <li key={ride.id}>
                  <div className="admin-reference-avatar">
                    {ride.passenger.user.fullName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <strong>{ride.passenger.user.fullName}</strong>
                    <span>{ride.pickupAddress} to {ride.destinationAddress}</span>
                    <small>{formatDateTime(ride.createdAt)}</small>
                  </div>
                  <div className="admin-reference-request-money">
                    <strong>{formatMoney(ride.currency, parseNumber(ride.finalFare ?? ride.estimatedFare))}</strong>
                    <span className={`status-chip ${statusTone(ride.status)}`}>{formatEnumLabel(ride.status)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="admin-reference-card admin-reference-list-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Recent Delivery Orders</h3>
              <p>Newest parcel delivery records from the backend.</p>
            </div>
            <a href="/admin/requests">View all</a>
          </div>
          {deliveries.length === 0 ? (
            <EmptyCard
              title="No delivery orders yet."
              body="Delivery orders will appear here once passengers start requesting parcel drops."
            />
          ) : (
            <ul className="admin-reference-request-list">
              {deliveries.slice(0, 5).map((delivery) => (
                <li key={delivery.id}>
                  <div className="admin-reference-avatar">
                    {delivery.passenger.user.fullName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <strong>{delivery.packageDescription}</strong>
                    <span>{delivery.pickupAddress} to {delivery.dropoffAddress}</span>
                    <small>{formatDateTime(delivery.createdAt)}</small>
                  </div>
                  <div className="admin-reference-request-money">
                    <strong>{formatMoney(delivery.currency, parseNumber(delivery.finalFee ?? delivery.estimatedFee))}</strong>
                    <span className={`status-chip ${statusTone(delivery.status)}`}>
                      {formatEnumLabel(delivery.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="admin-reference-card admin-reference-list-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Live Activity</h3>
              <p>Latest operational events from live records.</p>
            </div>
            <a href="/admin/requests">View all</a>
          </div>
          {liveActivityItems.length === 0 ? (
            <EmptyCard
              title="No activity yet."
              body="Ride, rider, and passenger activity will populate this feed automatically."
            />
          ) : (
            <ul className="admin-reference-activity-list">
              {liveActivityItems.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.id}>
                    <div className={`admin-reference-activity-icon ${item.tone}`}>
                      <Icon size={17} />
                    </div>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                      <small>{item.meta}</small>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>

      <section className="admin-reference-card admin-reference-quick-actions">
        <a href="/admin/riders">
          <UserPlus size={18} />
          <span>Add New Rider</span>
        </a>
        <a href="/admin/riders">
          <Bike size={18} />
          <span>Review Vehicles ({vehicleCount})</span>
        </a>
        <a href="/admin/promotions">
          <Tag size={18} />
          <span>Create Promo</span>
        </a>
        <a href="/admin/reports-analytics">
          <Headphones size={18} />
          <span>Reports & Analytics</span>
        </a>
        <a href="/admin/finance">
          <CreditCard size={18} />
          <span>Finance Reports</span>
        </a>
        <a href="/admin/settings">
          <Settings size={18} />
          <span>Locations</span>
        </a>
      </section>
    </div>
  );
}
