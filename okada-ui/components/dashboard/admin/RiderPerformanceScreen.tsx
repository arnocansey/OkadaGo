"use client";

import { Bike, CheckCircle, CreditCard, User, XCircle } from "lucide-react";
import { OperationsMap } from "@/components/maps/operations-map";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import type { RideRecord, RiderRecord, AdminRatingRecord } from "./types";

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

type RiderFinancialRow = {
  rider: RiderRecord;
  rideCount: number;
  completedCount: number;
  activeCount: number;
  revenue: number;
  earnings: number;
  commission: number;
  averageRating: number;
  ratingCount: number;
  walletMovement: number;
  payoutTotal: number;
};

type EarningBucket = {
  key: string;
  label: string;
  commission: number;
  trips: number;
  earnings: number;
};

type MapMarker = {
  id: string;
  position: [number, number];
  label: string;
  variant?: "driver" | "default" | "pickup" | "destination";
  permanentLabel?: boolean;
};

type RiderPerformanceScreenProps = {
  rides: RideRecord[];
  completedTrips: RideRecord[];
  activeTrips: RideRecord[];
  requestCancelled: RideRecord[];
  riderRatingAverage: number;
  ratings: AdminRatingRecord[];
  riderEarningBuckets: EarningBucket[];
  riderChartMax: number;
  mapMarkers: MapMarker[];
  topRiderPerformanceRows: RiderFinancialRow[];
  adminCurrency: string;
};

export function RiderPerformanceScreen({
  rides,
  completedTrips,
  activeTrips,
  requestCancelled,
  riderRatingAverage,
  ratings,
  riderEarningBuckets,
  riderChartMax,
  mapMarkers,
  topRiderPerformanceRows,
  adminCurrency
}: RiderPerformanceScreenProps) {
  const riderRatingDistribution = [5, 4, 3, 2, 1].map((score) => ({
    score,
    count: ratings.filter((rating) => Math.round(rating.score) === score).length
  }));

  return (
    <div className="admin-reference-dark admin-rider-subset-page">
      <section className="admin-rider-subset-kpis">
        <article className="admin-dark-kpi">
          <Bike size={22} />
          <span>Total Trips</span>
          <strong>{rides.length}</strong>
          <small>{completedTrips.length} completed trips recorded</small>
        </article>
        <article className="admin-dark-kpi">
          <CheckCircle size={22} />
          <span>Completed Trips</span>
          <strong>{completedTrips.length}</strong>
          <small>{activeTrips.length} currently active</small>
        </article>
        <article className="admin-dark-kpi danger">
          <XCircle size={22} />
          <span>Cancelled Trips</span>
          <strong>{requestCancelled.length}</strong>
          <small>{rides.length === 0 ? "0" : ((requestCancelled.length / rides.length) * 100).toFixed(1)}% cancellation rate</small>
        </article>
        <article className="admin-dark-kpi">
          <User size={22} />
          <span>Acceptance Rate</span>
          <strong>{rides.length === 0 ? "0.0%" : `${((completedTrips.length / rides.length) * 100).toFixed(1)}%`}</strong>
          <small>Completed against total assigned work</small>
        </article>
        <article className="admin-dark-kpi">
          <CreditCard size={22} />
          <span>Average Rating</span>
          <strong>{riderRatingAverage.toFixed(1)}</strong>
          <small>{ratings.length} rating submissions</small>
        </article>
      </section>

      <section className="admin-rider-dashboard-grid performance">
        <article className="admin-dark-card admin-rider-chart-card">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Performance Overview</h3>
              <p>Recent trips, earnings, and commission movement from live ride records.</p>
            </div>
            <span>This month</span>
          </div>
          <div className="admin-rider-bars multi">
            {riderEarningBuckets.map((bucket) => (
              <div key={bucket.key} className="admin-rider-bar-cluster">
                <i className="green" style={{ height: `${Math.max(5, (bucket.trips / riderChartMax) * 100)}%` }} />
                <i className="yellow" style={{ height: `${Math.max(5, (bucket.earnings / riderChartMax) * 100)}%` }} />
                <i className="red" style={{ height: `${Math.max(5, (bucket.commission / riderChartMax) * 100)}%` }} />
                <span>{bucket.label}</span>
              </div>
            ))}
          </div>
          <div className="admin-rider-legend compact">
            <span><i className="green" /> Trips</span>
            <span><i className="yellow" /> Earnings</span>
            <span><i className="red" /> Commission</span>
          </div>
        </article>

        <article className="admin-dark-card admin-rider-map-card">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Performance by Location</h3>
              <p>Online rider coordinates and active service coverage.</p>
            </div>
            <span>{mapMarkers.length} live</span>
          </div>
          <div className="admin-rider-map">
            <OperationsMap
              center={mapMarkers[0]?.position ?? [5.6037, -0.187]}
              zoom={mapMarkers.length > 0 ? 11 : 6}
              markers={mapMarkers}
              emptyTitle="No live rider locations."
              emptyDescription="Rider coordinates will appear as soon as online riders send location updates."
            />
          </div>
        </article>

        <article className="admin-dark-card admin-rider-side-list">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Top Performing Riders</h3>
              <p>Ranked by completed trips and earnings.</p>
            </div>
            <a href="/admin/riders/earnings">View all</a>
          </div>
          {topRiderPerformanceRows.length === 0 ? (
            <EmptyCard title="No riders yet." body="Top performers appear after rider profiles and trips exist." />
          ) : (
            <ul className="admin-rider-ranking">
              {topRiderPerformanceRows.slice(0, 5).map((row, index) => (
                <li key={row.rider.id}>
                  <b>{index + 1}</b>
                  <div>
                    <strong>{row.rider.user.fullName}</strong>
                    <span>{row.completedCount} trips</span>
                  </div>
                  <em>{row.ratingCount === 0 ? "0.0" : row.averageRating.toFixed(1)}</em>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="admin-rider-dashboard-grid lower">
        <article className="admin-dark-card admin-rider-wide-table">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Performance by Metrics</h3>
              <p>Live grouped ride volume, active load, ratings, and earnings by rider.</p>
            </div>
            <a href="/admin/riders/earnings">Open earnings</a>
          </div>
          {topRiderPerformanceRows.length === 0 ? (
            <EmptyCard title="No rider performance yet." body="Performance rows appear after riders are created." />
          ) : (
            <div className="table-wrapper admin-rider-subset-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Total Trips</th>
                    <th>Completed</th>
                    <th>Cancelled</th>
                    <th>Acceptance</th>
                    <th>Rating</th>
                    <th>Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {topRiderPerformanceRows.map((row) => {
                    const cancelled = rides.filter(
                      (ride) => ride.rider?.user.fullName === row.rider.user.fullName && ride.status.toLowerCase() === "cancelled"
                    ).length;
                    const acceptance = row.rideCount === 0 ? 0 : (row.completedCount / row.rideCount) * 100;

                    return (
                      <tr key={row.rider.id}>
                        <td>
                          <strong>{row.rider.user.fullName}</strong>
                          <div>{row.rider.displayCode}</div>
                        </td>
                        <td>{row.rideCount}</td>
                        <td>{row.completedCount}</td>
                        <td>{cancelled}</td>
                        <td>{acceptance.toFixed(1)}%</td>
                        <td>{row.ratingCount === 0 ? "No ratings" : `${row.averageRating.toFixed(1)} (${row.ratingCount})`}</td>
                        <td>{formatMoney(adminCurrency, row.earnings)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="admin-dark-card">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Ratings Distribution</h3>
              <p>Score spread from submitted rider ratings.</p>
            </div>
            <span>{ratings.length} ratings</span>
          </div>
          <div className="admin-rider-donut-wrap">
            <div
              className="admin-rider-donut rating"
              style={{
                background:
                  ratings.length === 0
                    ? "#1f2937"
                    : `conic-gradient(#22c55e 0 ${(riderRatingDistribution[0].count / Math.max(1, ratings.length)) * 100}%, #ffc107 ${(riderRatingDistribution[0].count / Math.max(1, ratings.length)) * 100}% ${((riderRatingDistribution[0].count + riderRatingDistribution[1].count) / Math.max(1, ratings.length)) * 100}%, #3b82f6 ${((riderRatingDistribution[0].count + riderRatingDistribution[1].count) / Math.max(1, ratings.length)) * 100}% 100%)`
              }}
            >
              <div>
                <strong>{ratings.length}</strong>
                <span>Total Ratings</span>
              </div>
            </div>
            <ul className="admin-rider-breakdown-list">
              {riderRatingDistribution.map((item) => (
                <li key={item.score}>
                  <span>{item.score} Stars</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>
    </div>
  );
}
