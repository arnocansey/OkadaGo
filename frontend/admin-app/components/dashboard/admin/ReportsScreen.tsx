import { TrendingUp, Bike, Package, Users, CreditCard, Download, FileSpreadsheet } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { downloadCsv } from "@/lib/export-csv";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
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

    const revenue =
      dayRides
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

  const allTimeCommission =
    rides.reduce((s, r) => s + parseNumber(r.platformCommission), 0) +
    deliveries.reduce((s, d) => s + parseNumber(d.platformCommission), 0);

  const completedRides = rides.filter((r) => r.status.toLowerCase() === "completed");
  const cancelledRides = rides.filter((r) => r.status.toLowerCase() === "cancelled");
  const completionRate = rides.length > 0 ? Math.round((completedRides.length / rides.length) * 100) : 0;

  const completedDeliveries = deliveries.filter((d) => d.status.toLowerCase() === "delivered");
  const deliveryCompletionRate =
    deliveries.length > 0 ? Math.round((completedDeliveries.length / deliveries.length) * 100) : 0;

  const onlineRiders = riders.filter((r) => r.onlineStatus);
  const maxRide30 = Math.max(1, ...dailyBuckets30.map((b) => b.rides));

  const platformSummaryRows: (string | number)[][] = [
    [
      "Revenue (Commission)",
      formatMoney(adminCurrency, totalRevenue7d),
      formatMoney(adminCurrency, totalRevenue30d),
      formatMoney(adminCurrency, allTimeCommission)
    ],
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
  ];

  const exportPlatformSummary = () =>
    downloadCsv("platform-summary.csv", ["Metric", "7 Days", "30 Days", "All Time"], platformSummaryRows);

  const export7DayBreakdown = () =>
    downloadCsv(
      "7-day-breakdown.csv",
      ["Date", "Rides", "Deliveries", "Commission (GHS)"],
      dailyBuckets7.map((b) => [b.label, b.rides, b.deliveries, formatMoney(adminCurrency, b.revenue)])
    );

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Reports"
        subtitle="Rides, deliveries, revenue, and riders across Accra service zones."
        actions={
          <div className="admin-screen-toolbar">
            <button type="button" className="admin-btn-primary" onClick={exportPlatformSummary}>
              <Download size={14} /> Export Report
            </button>
          </div>
        }
      />

      <AdminKpiRow
        items={[
          {
            label: "Revenue (7d)",
            value: formatMoney(adminCurrency, totalRevenue7d),
            hint: `${formatMoney(adminCurrency, totalRevenue30d)} last 30 days`,
            icon: <TrendingUp size={22} />,
            tone: "green"
          },
          {
            label: "Rides (7d)",
            value: totalRides7d,
            hint: `${completionRate}% completion rate`,
            icon: <Bike size={22} />,
            tone: "yellow"
          },
          {
            label: "Deliveries (7d)",
            value: totalDeliveries7d,
            hint: `${deliveryCompletionRate}% delivery rate`,
            icon: <Package size={22} />,
            tone: "yellow"
          },
          {
            label: "Registered Users",
            value: riderCount + passengerCount,
            hint: `${passengerCount} passengers · ${riderCount} riders`,
            icon: <Users size={22} />,
            tone: "green"
          }
        ]}
      />

      <ul className="admin-summary-list admin-summary-list--inline">
        <li>
          <span>Passengers</span>
          <strong>
            {passengerCount}{" "}
            <small>
              ({passengerPendingCount} pending · {passengerVerifiedCount} verified)
            </small>
          </strong>
        </li>
        <li>
          <span>Riders</span>
          <strong>
            {riderCount}{" "}
            <small>
              ({riderPendingCount} pending · {riderVerifiedCount} verified)
            </small>
          </strong>
        </li>
        <li>
          <span>Active Riders</span>
          <strong>
            {onlineRiders.length} <small>of {riderCount} registered</small>
          </strong>
        </li>
        <li>
          <span>Verified Accounts</span>
          <strong>
            {passengerVerifiedCount + riderVerifiedCount}{" "}
            <small>({passengerPendingCount + riderPendingCount} still pending)</small>
          </strong>
        </li>
      </ul>

      <div className="admin-overview-split">
        <div className="admin-overview-main">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Ride Volume by Day</h3>
                <p>30-day Accra ride & delivery volume.</p>
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
                      style={{
                        height: bucket.rides === 0 ? 0 : `${Math.max(4, (bucket.rides / maxRide30) * 100)}%`
                      }}
                    />
                    <i
                      className="completed"
                      style={{
                        height:
                          bucket.deliveries === 0
                            ? 0
                            : `${Math.max(4, (bucket.deliveries / maxRide30) * 100)}%`
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 9 }}>{bucket.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Platform Summary</h3>
                <p>Commission and volume in Ghana cedis.</p>
              </div>
              <button type="button" className="admin-btn-secondary" onClick={exportPlatformSummary}>
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
                    <td>{formatMoney(adminCurrency, allTimeCommission)}</td>
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
        </div>

        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Available Reports</h3>
                <p>Export Accra ops datasets as CSV.</p>
              </div>
            </div>
            <div className="admin-report-list">
              <button type="button" className="admin-report-list-item" onClick={exportPlatformSummary}>
                <span className="admin-report-list-icon">
                  <FileSpreadsheet size={18} />
                </span>
                <span className="admin-report-list-copy">
                  <strong>Platform Summary</strong>
                  <small>Commission, rides, deliveries, and verification counts.</small>
                </span>
                <span className="admin-report-list-meta">CSV</span>
              </button>
              <button type="button" className="admin-report-list-item" onClick={export7DayBreakdown}>
                <span className="admin-report-list-icon">
                  <CreditCard size={18} />
                </span>
                <span className="admin-report-list-copy">
                  <strong>7-Day Breakdown</strong>
                  <small>Daily rides, deliveries, and GHS commission.</small>
                </span>
                <span className="admin-report-list-meta">CSV</span>
              </button>
            </div>
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>7-Day Breakdown</h3>
                <p>Recent Accra volume & commission.</p>
              </div>
            </div>
            <ul className="admin-summary-list">
              {dailyBuckets7.map((bucket) => (
                <li key={bucket.key}>
                  <span>{bucket.label}</span>
                  <div>
                    <small>
                      {bucket.rides} rides · {bucket.deliveries} deliveries
                    </small>
                    <strong style={{ marginLeft: 8 }}>
                      {formatMoney(adminCurrency, bucket.revenue)}
                    </strong>
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
