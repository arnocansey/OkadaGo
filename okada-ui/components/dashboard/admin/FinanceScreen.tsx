"use client";

import { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { Bike, CreditCard, Package } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import type {
  PayoutRequestRecord,
  WalletTransactionRecord
} from "./types";

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

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type FinanceDailyBucket = {
  key: string;
  label: string;
  revenue: number;
  commission: number;
};

type PayoutDailyBucket = {
  key: string;
  label: string;
  revenue: number;
  commission: number;
  payouts: number;
};

type FinanceScreenProps = {
  adminCurrency: string;
  totalRevenue: number;
  rideRevenue: number;
  deliveryRevenue: number;
  totalCommission: number;
  completedTripsLength: number;
  completedDeliveriesLength: number;
  payoutOutflow: number;
  paidPayoutRequestsLength: number;
  platformNetProfit: number;
  profitMargin: number;
  postedWalletVolume: number;
  pendingPayoutValue: number;
  payoutHoldBalance: number;
  recentFinanceTransactions: WalletTransactionRecord[];
  financeDailyBuckets: FinanceDailyBucket[];
  financeDailyMax: number;
  payoutDailyBuckets: PayoutDailyBucket[];
  payoutDailyMax: number;
  rideRevenuePercent: number;
  deliveryRevenuePercent: number;
  totalDashboardRevenue: number;
  paymentMethodSnapshot: [string, number][];
  paymentMethodTotal: number;
  walletTransactions: WalletTransactionRecord[];
  walletTransactionsQuery: UseQueryResult<WalletTransactionRecord[], Error>;
  payoutRequests: PayoutRequestRecord[];
  payoutRequestsQuery: UseQueryResult<PayoutRequestRecord[], Error>;
  payoutRejectionReasons: Record<string, string>;
  setPayoutRejectionReasons: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  payoutReviewMutation: UseMutationResult<
    unknown,
    Error,
    {
      payoutRequestId: string;
      action: "mark_reviewing" | "approve" | "mark_processing" | "mark_paid" | "reject";
      rejectionReason?: string;
    }
  >;
  transactionStatusFilter: string;
  setTransactionStatusFilter: (value: string) => void;
  transactionTypeFilter: string;
  setTransactionTypeFilter: (value: string) => void;
  payoutStatusFilter: string;
  setPayoutStatusFilter: (value: string) => void;
  ratingRiderFilter: string;
  setRatingRiderFilter: (value: string) => void;
  ratingRideFilter: string;
  setRatingRideFilter: (value: string) => void;
  ratingFromDateFilter: string;
  setRatingFromDateFilter: (value: string) => void;
  ratingToDateFilter: string;
  setRatingToDateFilter: (value: string) => void;
};

export function FinanceScreen({
  adminCurrency,
  totalRevenue,
  rideRevenue,
  deliveryRevenue,
  totalCommission,
  completedTripsLength,
  completedDeliveriesLength,
  payoutOutflow,
  paidPayoutRequestsLength,
  platformNetProfit,
  profitMargin,
  postedWalletVolume,
  pendingPayoutValue,
  payoutHoldBalance,
  recentFinanceTransactions,
  financeDailyBuckets,
  financeDailyMax,
  payoutDailyBuckets,
  payoutDailyMax,
  rideRevenuePercent,
  deliveryRevenuePercent,
  totalDashboardRevenue,
  paymentMethodSnapshot,
  paymentMethodTotal,
  walletTransactions,
  walletTransactionsQuery,
  payoutRequests,
  payoutRequestsQuery,
  payoutRejectionReasons,
  setPayoutRejectionReasons,
  payoutReviewMutation,
  transactionStatusFilter,
  setTransactionStatusFilter,
  transactionTypeFilter,
  setTransactionTypeFilter,
  payoutStatusFilter,
  setPayoutStatusFilter,
  ratingRiderFilter,
  setRatingRiderFilter,
  ratingRideFilter,
  setRatingRideFilter,
  ratingFromDateFilter,
  setRatingFromDateFilter,
  ratingToDateFilter,
  setRatingToDateFilter
}: FinanceScreenProps) {
  return (
    <div className="admin-finance-dashboard">
      <section className="admin-finance-kpis" aria-label="Finance metrics">
        <article className="admin-finance-kpi">
          <div className="admin-finance-kpi-icon yellow">
            <CreditCard size={21} />
          </div>
          <span>Total Revenue</span>
          <strong>{formatMoney(adminCurrency, totalRevenue)}</strong>
          <small>{completedTripsLength} completed rides</small>
        </article>
        <article className="admin-finance-kpi">
          <div className="admin-finance-kpi-icon yellow">
            <Bike size={21} />
          </div>
          <span>Rides Revenue</span>
          <strong>{formatMoney(adminCurrency, rideRevenue)}</strong>
          <small>{formatMoney(adminCurrency, totalCommission)} commission</small>
        </article>
        <article className="admin-finance-kpi">
          <div className="admin-finance-kpi-icon yellow">
            <Package size={21} />
          </div>
          <span>Food Revenue</span>
          <strong>{formatMoney(adminCurrency, 0)}</strong>
          <small>No food order endpoint wired</small>
        </article>
        <article className="admin-finance-kpi">
          <div className="admin-finance-kpi-icon yellow">
            <Package size={21} />
          </div>
          <span>Delivery Revenue</span>
          <strong>{formatMoney(adminCurrency, deliveryRevenue)}</strong>
          <small>{completedDeliveriesLength} delivered orders</small>
        </article>
        <article className="admin-finance-kpi">
          <div className="admin-finance-kpi-icon purple">
            <CreditCard size={21} />
          </div>
          <span>Total Payouts</span>
          <strong>{formatMoney(adminCurrency, payoutOutflow)}</strong>
          <small>{paidPayoutRequestsLength} paid requests</small>
        </article>
        <article className="admin-finance-kpi">
          <div className="admin-finance-kpi-icon green">
            <Bike size={21} />
          </div>
          <span>Net Profit</span>
          <strong>{formatMoney(adminCurrency, platformNetProfit)}</strong>
          <small>{profitMargin.toFixed(1)}% profit margin</small>
        </article>
      </section>

      <section className="admin-finance-grid-main">
        <article className="admin-finance-card admin-finance-revenue-chart">
          <div className="admin-finance-cardhead">
            <div>
              <h3>Revenue Overview</h3>
              <p>Completed ride revenue and platform commission over the last 10 days.</p>
            </div>
            <span>This week</span>
          </div>
          <div className="admin-finance-legend">
            <span><i className="yellow" /> Total revenue</span>
            <span><i className="blue" /> Platform commission</span>
            <span><i className="green" /> Food revenue</span>
            <span><i className="purple" /> Delivery revenue</span>
          </div>
          <div className="admin-finance-chart">
            {financeDailyBuckets.map((bucket) => (
              <div key={bucket.key} className="admin-finance-chart-day">
                <div className="admin-finance-chart-bars">
                  <i
                    className="yellow"
                    style={{
                      height:
                        bucket.revenue === 0
                          ? 0
                          : `${Math.max(8, (bucket.revenue / financeDailyMax) * 100)}%`
                    }}
                  />
                  <i
                    className="blue"
                    style={{
                      height:
                        bucket.commission === 0
                          ? 0
                          : `${Math.max(8, (bucket.commission / financeDailyMax) * 100)}%`
                    }}
                  />
                  <i className="green" style={{ height: 0 }} />
                  <i className="purple" style={{ height: 0 }} />
                </div>
                <span>{bucket.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-finance-card admin-finance-breakdown">
          <div className="admin-finance-cardhead">
            <div>
              <h3>Revenue Breakdown</h3>
              <p>Revenue split by currently wired business line.</p>
            </div>
          </div>
          <div className="admin-finance-breakdown-body">
            <div
              className="admin-finance-donut"
              style={{
                background:
                  totalDashboardRevenue === 0
                    ? "#1f2937"
                    : `conic-gradient(#ffc107 0 ${rideRevenuePercent}%, #22c55e ${rideRevenuePercent}% ${rideRevenuePercent}%, #6d5dfc ${rideRevenuePercent}% 100%)`
              }}
            >
              <div>
                <span>Total</span>
                <strong>{formatMoney(adminCurrency, totalDashboardRevenue)}</strong>
              </div>
            </div>
            <ul className="admin-finance-breakdown-list">
              <li>
                <i className="yellow" />
                <span>Rides Revenue</span>
                <strong>{formatMoney(adminCurrency, rideRevenue)}</strong>
                <small>{rideRevenuePercent}%</small>
              </li>
              <li>
                <i className="green" />
                <span>Food Revenue</span>
                <strong>{formatMoney(adminCurrency, 0)}</strong>
                <small>0%</small>
              </li>
              <li>
                <i className="purple" />
                <span>Delivery Revenue</span>
                <strong>{formatMoney(adminCurrency, deliveryRevenue)}</strong>
                <small>{deliveryRevenuePercent}%</small>
              </li>
            </ul>
          </div>
        </article>

        <aside className="admin-finance-side-stack">
          <article className="admin-finance-card">
            <div className="admin-finance-cardhead">
              <div>
                <h3>Wallet Summary</h3>
                <p>Admin-visible wallet and payout movement.</p>
              </div>
              <a href="/admin/finance">View all</a>
            </div>
            <div className="admin-finance-wallet-main">
              <span>OkadaGo Wallet Volume</span>
              <strong>{formatMoney(adminCurrency, postedWalletVolume)}</strong>
            </div>
            <div className="admin-finance-wallet-grid">
              <div>
                <span>Pending payouts</span>
                <strong>{formatMoney(adminCurrency, pendingPayoutValue)}</strong>
              </div>
              <div>
                <span>Hold balance</span>
                <strong>{formatMoney(adminCurrency, payoutHoldBalance)}</strong>
              </div>
            </div>
          </article>

          <article className="admin-finance-card">
            <div className="admin-finance-cardhead">
              <div>
                <h3>Recent Transactions</h3>
                <p>Latest wallet transactions from the backend.</p>
              </div>
              <a href="#finance-ledger">View all</a>
            </div>
            {walletTransactionsQuery.isLoading ? (
              <div className="status-chip warning">Loading transactions</div>
            ) : walletTransactionsQuery.isError ? (
              <EmptyCard
                title="Could not load transactions."
                body={walletTransactionsQuery.error.message}
              />
            ) : recentFinanceTransactions.length === 0 ? (
              <EmptyCard
                title="No wallet transactions yet."
                body="Wallet top-ups, commissions, payouts, and reversals will appear here."
              />
            ) : (
              <ul className="admin-finance-transaction-list">
                {recentFinanceTransactions.map((transaction) => (
                  <li key={transaction.id}>
                    <div>
                      <strong>{transaction.description ?? formatEnumLabel(transaction.type)}</strong>
                      <span>{transaction.wallet.user.fullName}</span>
                    </div>
                    <span className={parseNumber(transaction.amount) < 0 ? "debit" : "credit"}>
                      {formatMoney(transaction.currency, transaction.amount)}
                    </span>
                    <em className={`status-chip ${statusTone(transaction.status)}`}>
                      {formatEnumLabel(transaction.status)}
                    </em>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="admin-finance-card">
            <div className="admin-finance-cardhead">
              <div>
                <h3>Expenses Summary</h3>
                <p>Expense tracking is not exposed by the backend yet.</p>
              </div>
              <span>This month</span>
            </div>
            <EmptyCard
              title="No expenses endpoint is wired."
              body="Once expenses or invoices are added to the API, this panel can show real operational costs."
            />
          </article>
        </aside>
      </section>

      <section className="admin-finance-grid-lower">
        <article className="admin-finance-card">
          <div className="admin-finance-cardhead">
            <div>
              <h3>Payout Overview</h3>
              <p>Paid payout volume over the same 10-day window.</p>
            </div>
            <span>This week</span>
          </div>
          <div className="admin-finance-payout-bars">
            {payoutDailyBuckets.map((bucket) => (
              <div key={bucket.key}>
                <i
                  style={{
                    height:
                      bucket.payouts === 0
                        ? 0
                        : `${Math.max(8, (bucket.payouts / payoutDailyMax) * 100)}%`
                  }}
                />
                <span>{bucket.label}</span>
              </div>
            ))}
          </div>
          <div className="admin-finance-progress-list">
            <div>
              <span>Paid payouts</span>
              <strong>{formatMoney(adminCurrency, payoutOutflow)}</strong>
            </div>
            <div>
              <span>Pending payout queue</span>
              <strong>{formatMoney(adminCurrency, pendingPayoutValue)}</strong>
            </div>
          </div>
        </article>

        <article className="admin-finance-card">
          <div className="admin-finance-cardhead">
            <div>
              <h3>Payment Methods</h3>
              <p>Grouped from linked payment and wallet transaction data.</p>
            </div>
            <a href="#finance-ledger">View all</a>
          </div>
          {paymentMethodSnapshot.length === 0 ? (
            <EmptyCard
              title="No payment method volume yet."
              body="Payment method totals will appear after wallet transactions are recorded."
            />
          ) : (
            <div className="table-wrapper admin-finance-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Revenue</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethodSnapshot.map(([method, amount]) => (
                    <tr key={method}>
                      <td>{formatEnumLabel(method)}</td>
                      <td>{formatMoney(adminCurrency, amount)}</td>
                      <td>
                        {paymentMethodTotal > 0
                          ? `${((amount / paymentMethodTotal) * 100).toFixed(1)}%`
                          : "0%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td>{formatMoney(adminCurrency, paymentMethodTotal)}</td>
                    <td>100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="admin-finance-card admin-finance-controls">
        <div className="admin-finance-cardhead">
          <div>
            <h3>Finance Filters</h3>
            <p>Filter wallet movement, payout requests, and rating verification records.</p>
          </div>
        </div>
        <div className="exact-admin-payment-filters">
          <div className="field-group">
            <label className="field-label">Wallet transaction status</label>
            <select
              className="select"
              value={transactionStatusFilter}
              onChange={(event) => setTransactionStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="POSTED">Posted</option>
              <option value="REVERSED">Reversed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Wallet transaction type</label>
            <select
              className="select"
              value={transactionTypeFilter}
              onChange={(event) => setTransactionTypeFilter(event.target.value)}
            >
              <option value="">All types</option>
              <option value="TOP_UP">Top up</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="COMMISSION">Commission</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
              <option value="REFUND">Refund</option>
              <option value="BONUS">Bonus</option>
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Payout request status</label>
            <select
              className="select"
              value={payoutStatusFilter}
              onChange={(event) => setPayoutStatusFilter(event.target.value)}
            >
              <option value="">All payout statuses</option>
              <option value="REQUESTED">Requested</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="APPROVED">Approved</option>
              <option value="PROCESSING">Processing</option>
              <option value="PAID">Paid</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Rating rider profile ID</label>
            <input
              className="input"
              value={ratingRiderFilter}
              onChange={(event) => setRatingRiderFilter(event.target.value)}
              placeholder="Filter by rider profile CUID"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Rating ride ID</label>
            <input
              className="input"
              value={ratingRideFilter}
              onChange={(event) => setRatingRideFilter(event.target.value)}
              placeholder="Filter by ride CUID"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Ratings from date</label>
            <input
              className="input"
              type="date"
              value={ratingFromDateFilter}
              onChange={(event) => setRatingFromDateFilter(event.target.value)}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Ratings to date</label>
            <input
              className="input"
              type="date"
              value={ratingToDateFilter}
              onChange={(event) => setRatingToDateFilter(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section id="finance-ledger" className="admin-finance-grid-ledgers">
        <article className="admin-finance-card">
          <div className="admin-finance-cardhead">
            <div>
              <h3>Wallet Transaction Ledger</h3>
              <p>Live wallet movement across top-ups, commissions, withdrawals, and reversals.</p>
            </div>
          </div>
          {walletTransactionsQuery.isLoading ? (
            <div className="status-chip warning">Loading wallet transactions</div>
          ) : walletTransactionsQuery.isError ? (
            <EmptyCard
              title="Wallet transactions could not be loaded."
              body={walletTransactionsQuery.error.message}
            />
          ) : walletTransactions.length === 0 ? (
            <EmptyCard
              title="No wallet transactions found."
              body="Top-ups, payouts, and settlement movement will appear here as soon as they happen."
            />
          ) : (
            <div className="table-wrapper admin-finance-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Wallet</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Reference</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {walletTransactions
                    .slice()
                    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
                    .map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <div className="exact-admin-transaction-user">
                            <strong>{transaction.wallet.user.fullName}</strong>
                            <span>{transaction.wallet.user.phoneE164}</span>
                          </div>
                        </td>
                        <td>{formatEnumLabel(transaction.wallet.type)}</td>
                        <td>{formatEnumLabel(transaction.type)}</td>
                        <td>
                          <span className={`status-chip ${statusTone(transaction.status)}`}>
                            {formatEnumLabel(transaction.status)}
                          </span>
                        </td>
                        <td>{formatMoney(transaction.currency, transaction.amount)}</td>
                        <td>{transaction.reference}</td>
                        <td>{formatDateTime(transaction.createdAt)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="admin-finance-card">
          <div className="admin-finance-cardhead">
            <div>
              <h3>Payout Review Queue</h3>
              <p>Approve, process, pay, or reject rider payout requests.</p>
            </div>
          </div>
          {payoutRequestsQuery.isLoading ? (
            <div className="status-chip warning">Loading payout requests</div>
          ) : payoutRequestsQuery.isError ? (
            <EmptyCard
              title="Payout requests could not be loaded."
              body={payoutRequestsQuery.error.message}
            />
          ) : payoutRequests.length === 0 ? (
            <EmptyCard
              title="No payout requests yet."
              body="Rider withdrawals will appear here once riders start requesting payouts."
            />
          ) : (
            <div className="exact-admin-payout-list">
              {payoutRequests.map((request) => (
                <article key={request.id} className="exact-admin-payout-card">
                  <div className="exact-admin-payout-head">
                    <div>
                      <strong>{request.rider.user.fullName}</strong>
                      <span>{request.rider.displayCode} - {request.destinationLabel}</span>
                    </div>
                    <span className={`status-chip ${statusTone(request.status)}`}>
                      {formatEnumLabel(request.status)}
                    </span>
                  </div>

                  <div className="exact-admin-payout-metrics">
                    <span>{formatMoney(request.currency, request.amount)}</span>
                    <span>{formatEnumLabel(request.method)}</span>
                    <span>{formatDateTime(request.requestedAt)}</span>
                  </div>

                  {["REQUESTED", "REVIEWING", "APPROVED", "PROCESSING"].includes(request.status) ? (
                    <>
                      <div className="field-group exact-admin-payout-reason">
                        <label className="field-label">Rejection note</label>
                        <input
                          className="input"
                          value={payoutRejectionReasons[request.id] ?? ""}
                          onChange={(event) =>
                            setPayoutRejectionReasons((current) => ({
                              ...current,
                              [request.id]: event.target.value
                            }))
                          }
                          placeholder="Optional reason if you reject this payout"
                        />
                      </div>

                      <div className="button-row exact-admin-payout-actions">
                        {request.status === "REQUESTED" ? (
                          <button
                            className="button button-secondary"
                            type="button"
                            disabled={payoutReviewMutation.isPending}
                            onClick={() =>
                              payoutReviewMutation.mutate({
                                payoutRequestId: request.id,
                                action: "mark_reviewing"
                              })
                            }
                          >
                            Review
                          </button>
                        ) : null}

                        {["REQUESTED", "REVIEWING"].includes(request.status) ? (
                          <button
                            className="button"
                            type="button"
                            disabled={payoutReviewMutation.isPending}
                            onClick={() =>
                              payoutReviewMutation.mutate({
                                payoutRequestId: request.id,
                                action: "approve"
                              })
                            }
                          >
                            Approve
                          </button>
                        ) : null}

                        {request.status === "APPROVED" ? (
                          <button
                            className="button button-secondary"
                            type="button"
                            disabled={payoutReviewMutation.isPending}
                            onClick={() =>
                              payoutReviewMutation.mutate({
                                payoutRequestId: request.id,
                                action: "mark_processing"
                              })
                            }
                          >
                            Mark processing
                          </button>
                        ) : null}

                        {["APPROVED", "PROCESSING"].includes(request.status) ? (
                          <button
                            className="button"
                            type="button"
                            disabled={payoutReviewMutation.isPending}
                            onClick={() =>
                              payoutReviewMutation.mutate({
                                payoutRequestId: request.id,
                                action: "mark_paid"
                              })
                            }
                          >
                            Mark paid
                          </button>
                        ) : null}

                        <button
                          className="button button-secondary"
                          type="button"
                          disabled={payoutReviewMutation.isPending}
                          onClick={() =>
                            payoutReviewMutation.mutate({
                              payoutRequestId: request.id,
                              action: "reject",
                              rejectionReason: payoutRejectionReasons[request.id]
                            })
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </>
                  ) : null}
                </article>
              ))}
            </div>
          )}

          {payoutReviewMutation.isError ? (
            <div className="empty-state exact-admin-payout-feedback">
              <strong>Payout review failed.</strong>
              <p>{payoutReviewMutation.error.message}</p>
            </div>
          ) : null}
        </article>
      </section>

      <section className="admin-finance-card">
        <div className="admin-finance-cardhead">
          <div>
            <h3>Finance Summary</h3>
            <p>Combined view of ride revenue, payouts, expenses, and margin.</p>
          </div>
        </div>
        <div className="admin-finance-summary-strip">
          <div>
            <span>Total Revenue</span>
            <strong>{formatMoney(adminCurrency, totalRevenue)}</strong>
          </div>
          <div>
            <span>Total Payouts</span>
            <strong>{formatMoney(adminCurrency, payoutOutflow)}</strong>
          </div>
          <div>
            <span>Total Expenses</span>
            <strong>{formatMoney(adminCurrency, 0)}</strong>
          </div>
          <div>
            <span>Net Profit</span>
            <strong>{formatMoney(adminCurrency, platformNetProfit)}</strong>
          </div>
          <div>
            <span>Profit Margin</span>
            <strong>{profitMargin.toFixed(1)}%</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
