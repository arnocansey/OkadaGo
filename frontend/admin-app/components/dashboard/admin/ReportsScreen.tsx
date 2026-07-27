import { TrendingUp, Bike, Package, Users, CreditCard, Download } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { downloadCsv } from "@/lib/export-csv";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { RideRecord, DeliveryRecord, RiderRecord, PassengerRecord } from "./types";
import { parseNumber, shortDate } from "./utils";

export type ReportsScreenProps = {
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  riders: RiderRecord[];
  passengers: PassengerRecord[];
  adminCurrency: string;
  ridersTotal?: number;
  passengersTotal?: number;
  riderPendingCount?: number;
  riderVerifiedCount?: number;
  passengerPendingCount?: number;
  passengerVerifiedCount?: number;
};

type DailyBucket = {
  key: string;
  label: string;
  rides: number;
  deliveries: number;
  revenue: number;
};

function buildBuckets(rides: RideRecord[], deliveries: DeliveryRecord[], days: number): DailyBucket[] {
  const now = Date.now();
  const buckets: DailyBucket[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 86400000);
    const key = date.toISOString().slice(0, 10);
    const label = shortDate(date.toISOString());

    const dayRides = rides.filter((r) => r.createdAt.slice(0, 10) === key);
    const dayDeliveries = deliveries.filter((d) => d.createdAt.slice(0, 10) === key);

    const revenue = dayRides
      .filter((r) => r.status.toLowerCase() === "completed")
      .reduce((sum, r) => sum + parseNumber(r.platformCommission), 0) +
      dayDeliveries
        .filter((d) => d.status.toLowerCase() === "delivered")
        .reduce((sum, d) => sum + parseNumber(d.platformCommission), 0);

    buckets.push({ key, label, rides: dayRides.length, deliveries: dayDeliveries.length, revenue });
  }

  return buckets;
}

export function ReportsScreen({
  rides,
  deliveries,
  riders,
  passengers,
  adminCurrency,
  ridersTotal,
  passengersTotal,
  riderPendingCount = 0,
  riderVerifiedCount = 0,
  passengerPendingCount = 0,
  passengerVerifiedCount = 0
}: ReportsScreenProps) {
  const riderCount = ridersTotal ?? riders.length;
  const passengerCount = passengersTotal ?? passengers.length;

  const dailyBuckets30 = buildBuckets(rides, deliveries, 30);
  const dailyBuckets7 = buildBuckets(rides, deliveries, 7);

  const totalRevenue7d = dailyBuckets7.reduce((sum, b) => sum + b.revenue, 0);
  const totalRides7d = dailyBuckets7.reduce((sum, b) => sum + b.rides, 0);
  const totalDeliveries7d = dailyBuckets7.reduce((sum, b) => sum + b.deliveries, 0);

  const totalRevenue30d = dailyBuckets30.reduce((sum, b) => sum + b.revenue, 0);
  const totalRides30d = dailyBuckets30.reduce((sum, b) => sum + b.rides, 0);
  const totalDeliveries30d = dailyBuckets30.reduce((sum, b) => sum + b.deliveries, 0);

  const completedRides = rides.filter((r) => r.status.toLowerCase() === "completed");
  const cancelledRides = rides.filter((r) => r.status.toLowerCase() === "cancelled");
  const completionRate = rides.length > 0 ? Math.round((completedRides.length / rides.length) * 100) : 0;

  const completedDeliveries = deliveries.filter((d) => d.status.toLowerCase() === "delivered");
  const deliveryCompletionRate = deliveries.length > 0 ? Math.round((completedDeliveries.length / deliveries.length) * 100) : 0;

  const onlineRiders = riders.filter((r) => r.onlineStatus);

  const maxRide30 = Math.max(1, ...dailyBuckets30.map((b) => b.rides));

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Reports"
        subtitle="Aggregate platform performance data across rides, revenue, riders, and passengers over time."
      />

      <section className="admin-reference-kpis">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><TrendingUp size={22} /></div>
          <div>
            <span>Revenue (7d)</span>
            <strong>{formatMoney(adminCurrency, totalRevenue7d)}</strong>
            <small>{formatMoney(adminCurrency, totalRevenue30d)} last 30 days</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Bike size={22} /></div>
          <div>
            <span>Rides (7d)</span>
            <strong>{totalRides7d}</strong>
            <small>{completionRate}% completion rate</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Package size={22} /></div>
          <div>
            <span>Deliveries (7d)</span>
            <strong>{totalDeliveries7d}</strong>
            <small>{deliveryCompletionRate}% delivery rate</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><Users size={22} /></div>
          <div>
            <span>Registered Users</span>
            <strong>{riderCount + passengerCount}</strong>
            <small>{passengerCount} passengers · {riderCount} riders</small>
          </div>
        </article>
      </section>

      <section className="admin-reference-kpis" style={{ marginTop: 12 }}>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Users size={22} /></div>
          <div>
            <span>Passengers</span>
            <strong>{passengerCount}</strong>
            <small>{passengerPendingCount} pending · {passengerVerifiedCount} verified</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><Bike size={22} /></div>
          <div>
            <span>Riders</span>
            <strong>{riderCount}</strong>
            <small>{riderPendingCount} pending · {riderVerifiedCount} verified</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><Users size={22} /></div>
          <div>
            <span>Active Riders</span>
            <strong>{onlineRiders.length}</strong>
            <small>of {riderCount} registered</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><CreditCard size={22} /></div>
          <div>
            <span>Verified Accounts</span>
            <strong>{passengerVerifiedCount + riderVerifiedCount}</strong>
            <small>{passengerPendingCount + riderPendingCount} still pending</small>
          </div>
        </article>
      </section>

      {/* 30-day trend */}
      <article className="admin-reference-card" style={{ marginBottom: 16 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>30-Day Ride & Delivery Volume</h3>
            <p>Daily combined trip volume over the last 30 days.</p>
          </div>
        </div>
        <div className="admin-reference-legend">
          <span><i className="black" /> Rides</span>
          <span><i className="yellow" /> Deliveries</span>
        </div>
        <div className="admin-reference-bars" style={{ flexWrap: "wrap", gap: 4 }}>
          {dailyBuckets30.map((bucket) => (
            <div key={bucket.key} className="admin-reference-bar-day" style={{ minWidth: 20 }}>
              <div className="admin-reference-bar-track">
                <i
                  className="rides"
                  style={{ height: bucket.rides === 0 ? 0 : `${Math.max(4, (bucket.rides / maxRide30) * 100)}%` }}
                />
                <i
                  className="completed"
                  style={{ height: bucket.deliveries === 0 ? 0 : `${Math.max(4, (bucket.deliveries / maxRide30) * 100)}%` }}
                />
              </div>
              <span style={{ fontSize: 9 }}>{bucket.label}</span>
            </div>
          ))}
        </div>
      </article>

      <div className="admin-screen-grid-2">
        {/* Performance table */}
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div><h3>Platform Summary</h3></div>
            <button
              className="admin-select-sm"
              onClick={() =>
                downloadCsv(
                  "platform-summary.csv",
                  ["Metric", "7 Days", "30 Days", "All Time"],
                  [
                    ["Revenue (Commission)", formatMoney(adminCurrency, totalRevenue7d), formatMoney(adminCurrency, totalRevenue30d), formatMoney(adminCurrency, rides.reduce((s, r) => s + parseNumber(r.platformCommission), 0) + deliveries.reduce((s, d) => s + parseNumber(d.platformCommission), 0))],
                    ["Ride Requests", totalRides7d, totalRides30d, rides.length],
                    ["Delivery Orders", totalDeliveries7d, totalDeliveries30d, deliveries.length],
                    ["Completed Rides", "—", "—", completedRides.length],
                    ["Cancelled Rides", "—", "—", cancelledRides.length],
                    ["Completion Rate", "—", "—", `${completionRate}%`],
                    ["Total Riders", "—", "—", riderCount],
                    ["Total Passengers", "—", "—", passengerCount],
                    ["Pending Riders", "—", "—", riderPendingCount],
                    ["Verified Riders", "—", "—", riderVerifiedCount],
                    ["Pending Passengers", "—", "—", passengerPendingCount],
                    ["Verified Passengers", "—", "—", passengerVerifiedCount]
                  ]
                )
              }
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>7 Days</th>
                  <th>30 Days</th>
                  <th>All Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Revenue (Commission)</td>
                  <td>{formatMoney(adminCurrency, totalRevenue7d)}</td>
                  <td>{formatMoney(adminCurrency, totalRevenue30d)}</td>
                  <td>{formatMoney(adminCurrency, rides.reduce((s, r) => s + parseNumber(r.platformCommission), 0) + deliveries.reduce((s, d) => s + parseNumber(d.platformCommission), 0))}</td>
                </tr>
                <tr>
                  <td>Ride Requests</td>
                  <td>{totalRides7d}</td>
                  <td>{totalRides30d}</td>
                  <td>{rides.length}</td>
                </tr>
                <tr>
                  <td>Delivery Orders</td>
                  <td>{totalDeliveries7d}</td>
                  <td>{totalDeliveries30d}</td>
                  <td>{deliveries.length}</td>
                </tr>
                <tr>
                  <td>Completed Rides</td>
                  <td>—</td>
                  <td>—</td>
                  <td>{completedRides.length}</td>
                </tr>
                <tr>
                  <td>Cancelled Rides</td>
                  <td>—</td>
                  <td>—</td>
                  <td>{cancelledRides.length}</td>
                </tr>
                <tr>
                  <td>Completion Rate</td>
                  <td>—</td>
                  <td>—</td>
                  <td>{completionRate}%</td>
                </tr>
                <tr>
                  <td>Total Riders</td>
                  <td>—</td>
                  <td>—</td>
                  <td>{riderCount}</td>
                </tr>
                <tr>
                  <td>Verified Riders</td>
                  <td>—</td>
                  <td>—</td>
                  <td>{riderVerifiedCount}</td>
                </tr>
                <tr>
                  <td>Pending Riders</td>
                  <td>—</td>
                  <td>—</td>
                  <td>{riderPendingCount}</td>
                </tr>
                <tr>
                  <td>Total Passengers</td>
                  <td>—</td>
                  <td>—</td>
                  <td>{passengerCount}</td>
                </tr>
                <tr>
                  <td>Verified Passengers</td>
                  <td>—</td>
                  <td>—</td>
                  <td>{passengerVerifiedCount}</td>
                </tr>
                <tr>
                  <td>Pending Passengers</td>
                  <td>—</td>
                  <td>—</td>
                  <td>{passengerPendingCount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div><h3>7-Day Breakdown</h3></div>
            </div>
            <ul className="admin-summary-list">
              {dailyBuckets7.map((bucket) => (
                <li key={bucket.key}>
                  <span>{bucket.label}</span>
                  <div>
                    <small>{bucket.rides} rides · {bucket.deliveries} deliveries</small>
                    <strong style={{ marginLeft: 8 }}>{formatMoney(adminCurrency, bucket.revenue)}</strong>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </div>
    </div>
  );
}
