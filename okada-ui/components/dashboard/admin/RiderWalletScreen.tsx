"use client";

import { Bike, CheckCircle, Clock, CreditCard, Download, FileText, ShieldAlert } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import type { PayoutRequestRecord, WalletTransactionRecord } from "./types";

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return 0;
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (["completed", "delivered", "paid", "captured", "posted", "approved", "valid"].includes(normalized)) {
    return "success";
  }
  if (
    [
      "searching",
      "assigned",
      "arriving",
      "arrived",
      "started",
      "picked_up",
      "in_transit",
      "pending",
      "requested",
      "reviewing",
      "under review",
      "processing"
    ].includes(normalized)
  ) {
    return "warning";
  }
  if (["failed", "rejected", "cancelled", "reversed", "missing", "expired"].includes(normalized)) {
    return "danger";
  }
  return "neutral";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

type RiderWalletScreenProps = {
  riderWalletAvailableBalance: number;
  totalRiderEarnings: number;
  totalRiderPayoutValue: number;
  riderPayoutRequests: PayoutRequestRecord[];
  requestedRiderPayouts: PayoutRequestRecord[];
  riderWalletLockedBalance: number;
  riderWalletTransactions: WalletTransactionRecord[];
  adminCurrency: string;
};

export function RiderWalletScreen({
  riderWalletAvailableBalance,
  totalRiderEarnings,
  totalRiderPayoutValue,
  riderPayoutRequests,
  requestedRiderPayouts,
  riderWalletLockedBalance,
  riderWalletTransactions,
  adminCurrency
}: RiderWalletScreenProps) {
  return (
    <div className="admin-reference-dark admin-rider-subset-page">
      <section className="admin-rider-subset-kpis">
        <article className="admin-dark-kpi">
          <CreditCard size={22} />
          <span>Wallet Balance</span>
          <strong>{formatMoney(adminCurrency, riderWalletAvailableBalance)}</strong>
          <small>Estimated available balance from posted movement</small>
        </article>
        <article className="admin-dark-kpi">
          <CheckCircle size={22} />
          <span>Total Earnings</span>
          <strong>{formatMoney(adminCurrency, totalRiderEarnings)}</strong>
          <small>Completed trips minus commission</small>
        </article>
        <article className="admin-dark-kpi">
          <Download size={22} />
          <span>Total Payouts</span>
          <strong>{formatMoney(adminCurrency, totalRiderPayoutValue)}</strong>
          <small>{riderPayoutRequests.length} rider requests</small>
        </article>
        <article className="admin-dark-kpi">
          <Clock size={22} />
          <span>Pending Payouts</span>
          <strong>{formatMoney(adminCurrency, requestedRiderPayouts.reduce((sum, request) => sum + parseNumber(request.amount), 0))}</strong>
          <small>{requestedRiderPayouts.length} transactions</small>
        </article>
        <article className="admin-dark-kpi">
          <ShieldAlert size={22} />
          <span>Locked Balance</span>
          <strong>{formatMoney(adminCurrency, riderWalletLockedBalance)}</strong>
          <small>Under review or held</small>
        </article>
      </section>

      <section className="admin-rider-dashboard-grid wallet">
        <article className="admin-dark-card">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Wallet Actions</h3>
              <p>Operational shortcuts for rider settlement review.</p>
            </div>
          </div>
          <div className="admin-rider-action-list">
            <a href="/admin/riders/payouts"><Download size={16} /><span><strong>Cash Out</strong><small>Review rider payout requests</small></span></a>
            <a href="/admin/finance"><CreditCard size={16} /><span><strong>Add Funds</strong><small>Open platform finance ledger</small></span></a>
            <a href="/admin/riders/wallet"><FileText size={16} /><span><strong>Transaction History</strong><small>View rider wallet movement</small></span></a>
            <a href="/admin/riders/earnings"><Bike size={16} /><span><strong>Earnings Summary</strong><small>View earnings breakdown</small></span></a>
          </div>
        </article>

        <article className="admin-dark-card">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Balance Breakdown</h3>
              <p>Available, pending, locked, and bonus movement.</p>
            </div>
          </div>
          <div className="admin-rider-donut-wrap">
            <div
              className="admin-rider-donut"
              style={{
                background:
                  riderWalletAvailableBalance + riderWalletLockedBalance === 0
                    ? "#1f2937"
                    : `conic-gradient(#ffc107 0 ${(riderWalletAvailableBalance / Math.max(1, riderWalletAvailableBalance + riderWalletLockedBalance)) * 100}%, #8b5cf6 ${(riderWalletAvailableBalance / Math.max(1, riderWalletAvailableBalance + riderWalletLockedBalance)) * 100}% 100%)`
              }}
            >
              <div>
                <strong>{formatMoney(adminCurrency, riderWalletAvailableBalance)}</strong>
                <span>Total Balance</span>
              </div>
            </div>
            <ul className="admin-rider-breakdown-list">
              <li><span>Available Balance</span><strong>{formatMoney(adminCurrency, riderWalletAvailableBalance)}</strong></li>
              <li><span>Pending Balance</span><strong>{formatMoney(adminCurrency, requestedRiderPayouts.reduce((sum, request) => sum + parseNumber(request.amount), 0))}</strong></li>
              <li><span>Locked Balance</span><strong>{formatMoney(adminCurrency, riderWalletLockedBalance)}</strong></li>
              <li><span>Bonus Balance</span><strong>{formatMoney(adminCurrency, 0)}</strong></li>
            </ul>
          </div>
        </article>

        <article className="admin-dark-card admin-rider-side-list">
          <div className="admin-dark-cardhead">
            <div>
              <h3>Latest Payout Source</h3>
              <p>Recent rider wallet activity.</p>
            </div>
            <a href="/admin/finance">View all</a>
          </div>
          {riderWalletTransactions.length === 0 ? (
            <EmptyCard title="No earnings yet." body="Rider wallet activity will appear after transactions are posted." />
          ) : (
            <ul className="admin-rider-activity-list">
              {riderWalletTransactions.slice(0, 4).map((transaction) => (
                <li key={transaction.id}>
                  <span>{formatEnumLabel(transaction.type)}</span>
                  <strong>{formatMoney(transaction.currency, parseNumber(transaction.amount))}</strong>
                  <em className={`status-chip ${statusTone(transaction.status)}`}>{formatEnumLabel(transaction.status)}</em>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="admin-dark-card">
        <div className="admin-dark-cardhead">
          <div>
            <h3>Transaction History</h3>
            <p>Admin payment ledger filtered to rider wallet owners.</p>
          </div>
          <a href="/admin/finance">Open full finance</a>
        </div>
        {riderWalletTransactions.length === 0 ? (
          <EmptyCard title="No rider wallet transactions." body="Wallet movement will appear after rider ledger records are posted." />
        ) : (
          <div className="table-wrapper admin-rider-subset-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Type</th>
                  <th>Direction</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {riderWalletTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <strong>{transaction.wallet.user.fullName}</strong>
                      <div>{transaction.wallet.user.riderProfile?.displayCode ?? "Rider wallet"}</div>
                    </td>
                    <td>{formatEnumLabel(transaction.type)}</td>
                    <td>{formatEnumLabel(transaction.direction)}</td>
                    <td>{formatMoney(transaction.currency, parseNumber(transaction.amount))}</td>
                    <td><span className={`status-chip ${statusTone(transaction.status)}`}>{formatEnumLabel(transaction.status)}</span></td>
                    <td>{transaction.reference}</td>
                    <td>{formatDateTime(transaction.createdAt)}</td>
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
