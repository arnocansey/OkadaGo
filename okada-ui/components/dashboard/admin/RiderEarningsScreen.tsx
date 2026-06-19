"use client";

import { Bike, CreditCard, Download, FileText, Users } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import type { RiderRecord } from "./types";

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

type RiderEarningsScreenProps = {
  riderFinancialRows: RiderFinancialRow[];
  totalRiderGrossRevenue: number;
  totalRiderEarnings: number;
  totalRiderCommission: number;
  totalRiderPayoutValue: number;
  riderEarningBuckets: EarningBucket[];
  riderChartMax: number;
  adminCurrency: string;
};

export function RiderEarningsScreen({
  riderFinancialRows,
  totalRiderGrossRevenue,
  totalRiderEarnings,
  totalRiderCommission,
  totalRiderPayoutValue,
  riderEarningBuckets,
  riderChartMax,
  adminCurrency
}: RiderEarningsScreenProps) {
  return (
    <div className="admin-reference-dark admin-rider-subset-page">
      <section className="admin-rider-subset-kpis">
        <article className="admin-dark-kpi">
          <CreditCard size={22} />
          <span>Total Earnings</span>
          <strong>{formatMoney(adminCurrency, totalRiderGrossRevenue)}</strong>
          <small>Gross completed rider trip value</small>
        </article>
        <article className="admin-dark-kpi">
          <Bike size={22} />
          <span>Trip Earnings</span>
          <strong>{formatMoney(adminCurrency, totalRiderEarnings)}</strong>
          <small>Completed fares minus commission</small>
        </article>
        <article className="admin-dark-kpi">
          <FileText size={22} />
          <span>Total Commissions</span>
          <strong>-{formatMoney(adminCurrency, totalRiderCommission)}</strong>
          <small>Platform share from rider trips</small>
        </article>
        <article className="admin-dark-kpi">
          <Users size={22} />
          <span>Earned Riders</span>
          <strong>{riderFinancialRows.filter((row) => row.earnings > 0).length}</strong>
          <small>Have completed earnings</small>
        </article>
        <article className="admin-dark-kpi">
          <Download size={22} />
          <span>Net Earnings</span>
          <strong>{formatMoney(adminCurrency, totalRiderEarnings)}</strong>
          <small>All rider payout requests</small>
        </article>
      </section>

      <section className="admin-rider-dashboard-grid earnings">
        <article className="admin-dark-card admin-rider-chart-card">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Earnings Overview</h3>
              <p>Trip earnings and commission trend from completed rides.</p>
            </div>
            <span>This month</span>
          </div>
          <div className="admin-rider-bars multi">
            {riderEarningBuckets.map((bucket) => (
              <div key={bucket.key} className="admin-rider-bar-cluster">
                <i className="yellow" style={{ height: `${Math.max(5, (bucket.earnings / riderChartMax) * 100)}%` }} />
                <i className="green" style={{ height: `${Math.max(5, (bucket.trips / riderChartMax) * 100)}%` }} />
                <i className="red" style={{ height: `${Math.max(5, (bucket.commission / riderChartMax) * 100)}%` }} />
                <span>{bucket.label}</span>
              </div>
            ))}
          </div>
          <div className="admin-rider-legend compact">
            <span><i className="yellow" /> Trip Earnings</span>
            <span><i className="green" /> Trips</span>
            <span><i className="red" /> Commission</span>
          </div>
        </article>

        <article className="admin-dark-card">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Earnings Breakdown</h3>
              <p>Current split between rider earnings and platform commission.</p>
            </div>
          </div>
          <div className="admin-rider-donut-wrap">
            <div
              className="admin-rider-donut"
              style={{
                background:
                  totalRiderGrossRevenue === 0
                    ? "#1f2937"
                    : `conic-gradient(#ffc107 0 ${(totalRiderEarnings / Math.max(1, totalRiderGrossRevenue)) * 100}%, #ef4444 ${(totalRiderEarnings / Math.max(1, totalRiderGrossRevenue)) * 100}% 100%)`
              }}
            >
              <div>
                <strong>{formatMoney(adminCurrency, totalRiderGrossRevenue)}</strong>
                <span>Total Earnings</span>
              </div>
            </div>
            <ul className="admin-rider-breakdown-list">
              <li><span>Trip earnings</span><strong>{formatMoney(adminCurrency, totalRiderEarnings)}</strong></li>
              <li><span>Commissions</span><strong>-{formatMoney(adminCurrency, totalRiderCommission)}</strong></li>
              <li><span>Payout requested</span><strong>{formatMoney(adminCurrency, totalRiderPayoutValue)}</strong></li>
            </ul>
          </div>
        </article>

        <article className="admin-dark-card admin-rider-side-list">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Top Earning Riders</h3>
              <p>Sorted by net estimated earnings.</p>
            </div>
            <a href="/admin/riders/wallet">Wallet</a>
          </div>
          <ul className="admin-rider-ranking">
            {riderFinancialRows
              .slice()
              .sort((left, right) => right.earnings - left.earnings)
              .slice(0, 5)
              .map((row, index) => (
                <li key={row.rider.id}>
                  <b>{index + 1}</b>
                  <div>
                    <strong>{row.rider.user.fullName}</strong>
                    <span>{row.completedCount} trips</span>
                  </div>
                  <em>{formatMoney(adminCurrency, row.earnings)}</em>
                </li>
              ))}
          </ul>
        </article>
      </section>

      <section className="admin-dark-card">
        <div className="admin-dark-cardhead">
          <div>
            <h3>Earnings Summary</h3>
            <p>Grouped estimated earnings from completed rides.</p>
          </div>
          <a href="/admin/riders/payouts">Open payouts</a>
        </div>
        {riderFinancialRows.length === 0 ? (
          <EmptyCard title="No rider earnings yet." body="Earnings appear after rider profiles and completed trips exist." />
        ) : (
          <div className="table-wrapper admin-rider-subset-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Completed Trips</th>
                  <th>Gross Revenue</th>
                  <th>Commission</th>
                  <th>Net Earnings</th>
                  <th>Payout Requests</th>
                </tr>
              </thead>
              <tbody>
                {riderFinancialRows.map((row) => (
                  <tr key={row.rider.id}>
                    <td>
                      <strong>{row.rider.user.fullName}</strong>
                      <div>{row.rider.displayCode}</div>
                    </td>
                    <td>{row.completedCount}</td>
                    <td>{formatMoney(adminCurrency, row.revenue)}</td>
                    <td>-{formatMoney(adminCurrency, row.commission)}</td>
                    <td>{formatMoney(adminCurrency, row.earnings)}</td>
                    <td>{formatMoney(adminCurrency, row.payoutTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
