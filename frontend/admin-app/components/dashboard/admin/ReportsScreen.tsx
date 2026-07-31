import { useMemo, useState } from "react";
import { TrendingUp, Bike, Package, Users, CreditCard, Download, FileSpreadsheet, Map as MapIcon } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { downloadCsv } from "@/lib/export-csv";
import { AdminPageSkeleton } from "./AdminSkeleton";
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
  onServerExport?: (entity: "rides" | "deliveries" | "riders") => void;
  dataLoading?: boolean;
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
  passengerVerifiedCount = 0,
  onServerExport,
  dataLoading = false
}: ReportsScreenProps) {
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const riderCount = ridersTotal ?? riders.length;
  const passengerCount = passengersTotal ?? passengers.length;

  const dailyBuckets30 = buildBuckets(rides, deliveries, 30);
  const dailyBuckets7 = buildBuckets(rides, deliveries, 7);
  const dailyBuckets = buildBuckets(rides, deliveries, rangeDays);

  const demandHeat = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ride of rides) {
      const zone = ride.serviceZone?.name?.trim();
      if (zone) {
        counts.set(zone, (counts.get(zone) ?? 0) + 1);
        continue;
      }
      const lat = parseNumber(ride.pickupLatitude);
      const lng = parseNumber(ride.pickupLongitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
        counts.set("Unmapped", (counts.get("Unmapped") ?? 0) + 1);
        continue;
      }
      // ~1.1km cells around Accra — coarse demand buckets without a map library.
      const cell = `${lat.toFixed(2)},${lng.toFixed(2)}`;
      counts.set(cell, (counts.get(cell) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 24);
  }, [rides]);
  const demandMax = Math.max(1, ...demandHeat.map((cell) => cell.count));

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

  if (dataLoading) {
    return <AdminPageSkeleton variant="dashboard" kpis={4} />;
  }

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Reports"
        subtitle="Rides, deliveries, revenue, and riders across Accra service zones."
        actions={
          <div className="admin-screen-toolbar">
            <select
              className="admin-select-sm"
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value) as 7 | 30 | 90)}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button type="button" className="admin-btn-primary" onClick={exportPlatformSummary}>
              <Download size={14} /> Export Report
            </button>
            {onServerExport ? (
              <button type="button" className="admin-btn-secondary" onClick={() => onServerExport("rides")}>
                <Download size={14} /> Full rides CSV
              </button>
            ) : null}
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
                <p>{rangeDays}-day Accra ride & delivery volume.</p>
              </div>
            </div>
            <div className="admin-reference-legend">
              <span><i className="black" /> Rides</span>
              <span><i className="yellow" /> Deliveries</span>
            </div>
            <div className="admin-reference-bars" style={{ flexWrap: "wrap", gap: 4 }}>
              {dailyBuckets.map((bucket) => {
                const maxRide = Math.max(1, ...dailyBuckets.map((b) => b.rides));
                return (
                <div key={bucket.key} className="admin-reference-bar-day" style={{ minWidth: 20 }}>
                  <div className="admin-reference-bar-track">
                    <i
                      className="rides"
                      style={{
                        height: bucket.rides === 0 ? 0 : `${Math.max(4, (bucket.rides / maxRide) * 100)}%`
                      }}
                    />
                    <i
                      className="completed"
                      style={{
                        height:
                          bucket.deliveries === 0
                            ? 0
                            : `${Math.max(4, (bucket.deliveries / maxRide) * 100)}%`
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 9 }}>{bucket.label}</span>
                </div>
                );
              })}
            </div>
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Demand heatmap</h3>
                <p>Pickup demand by service zone (or coarse GPS cell when zone is missing).</p>
              </div>
              <MapIcon size={18} style={{ color: "var(--text-secondary)" }} />
            </div>
            {demandHeat.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
                No ride pickup data yet to plot demand.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 8
                }}
              >
                {demandHeat.map((cell) => {
                  const intensity = cell.count / demandMax;
                  return (
                    <div
                      key={cell.label}
                      title={`${cell.label}: ${cell.count} rides`}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: "1px solid var(--border-color)",
                        background: `color-mix(in srgb, var(--accent-orange) ${Math.round(intensity * 55)}%, var(--bg-primary))`,
                        minHeight: 72,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                    >
                      <strong style={{ fontSize: 12, color: "var(--text-primary)", wordBreak: "break-word" }}>
                        {cell.label}
                      </strong>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                        {cell.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
