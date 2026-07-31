import { useEffect } from "react";
import { CreditCard, TrendingUp, TrendingDown, Filter, Download } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { downloadCsv } from "@/lib/export-csv";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPagination, usePagination } from "./ui/AdminPagination";
import type { WalletTransactionRecord, PayoutRequestRecord } from "./types";
import { parseNumber, formatDateTime, statusTone, formatEnumLabel } from "./utils";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { AdminPageSkeleton } from "./AdminSkeleton";

const PAGE_SIZE = 10;

export type FinanceScreenProps = {
  walletTransactions: WalletTransactionRecord[];
  payoutRequests: PayoutRequestRecord[];
  postedWalletTransactions: WalletTransactionRecord[];
  pendingWalletTransactions: WalletTransactionRecord[];
  failedWalletTransactions: WalletTransactionRecord[];
  pendingPayoutRequests: PayoutRequestRecord[];
  paidPayoutRequests: PayoutRequestRecord[];
  totalRevenue: number;
  totalCommission: number;
  payoutOutflow: number;
  platformNetProfit: number;
  profitMargin: number;
  postedWalletVolume: number;
  pendingPayoutValue: number;
  payoutHoldBalance: number;
  financeDailyBuckets: { key: string; label: string; revenue: number; commission: number }[];
  financeDailyMax: number;
  payoutDailyBuckets: { key: string; label: string; payouts: number }[];
  payoutDailyMax: number;
  paymentMethodSnapshot: [string, number][];
  paymentMethodTotal: number;
  recentFinanceTransactions: WalletTransactionRecord[];
  transactionStatusFilter: string;
  transactionTypeFilter: string;
  payoutStatusFilter: string;
  onTransactionStatusChange: (v: string) => void;
  onTransactionTypeChange: (v: string) => void;
  onPayoutStatusChange: (v: string) => void;
  adminCurrency: string;
  totalRideRevenue: number;
  totalDeliveryRevenue: number;
  totalRideCommission: number;
  totalDeliveryCommission: number;
  riderEarningsTotal: number;
  dataLoading?: boolean;
  onPayoutAction?: (
    payoutRequestId: string,
    action: "mark_reviewing" | "approve" | "mark_processing" | "mark_paid" | "reject",
    rejectionReason?: string
  ) => void;
  onServerExport?: (entity: "wallet-transactions" | "payout-requests") => void;
  isMutating?: boolean;
};

export function FinanceScreen({
  walletTransactions,
  payoutRequests,
  postedWalletTransactions,
  pendingWalletTransactions,
  failedWalletTransactions,
  pendingPayoutRequests,
  paidPayoutRequests,
  totalRevenue,
  totalCommission,
  payoutOutflow,
  platformNetProfit,
  profitMargin,
  postedWalletVolume,
  pendingPayoutValue,
  payoutHoldBalance,
  financeDailyBuckets,
  financeDailyMax,
  payoutDailyBuckets,
  payoutDailyMax,
  paymentMethodSnapshot,
  paymentMethodTotal,
  recentFinanceTransactions,
  transactionStatusFilter,
  transactionTypeFilter,
  payoutStatusFilter,
  onTransactionStatusChange,
  onTransactionTypeChange,
  onPayoutStatusChange,
  adminCurrency,
  totalRideRevenue,
  totalDeliveryRevenue,
  totalRideCommission,
  totalDeliveryCommission,
  riderEarningsTotal,
  dataLoading = false,
  onPayoutAction,
  onServerExport,
  isMutating = false
}: FinanceScreenProps) {
  const { isMobile } = useBreakpoint();

  const { page: walletPage, setPage: setWalletPage, paginated: paginatedWalletTx } = usePagination(
    walletTransactions,
    PAGE_SIZE
  );
  const { page: payoutPage, setPage: setPayoutPage, paginated: paginatedPayouts } = usePagination(
    payoutRequests,
    PAGE_SIZE
  );

  useEffect(() => {
    setWalletPage(1);
  }, [transactionStatusFilter, transactionTypeFilter, setWalletPage]);

  useEffect(() => {
    setPayoutPage(1);
  }, [payoutStatusFilter, setPayoutPage]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={4} rows={5} cols={7} />;
  }
  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Finance"
        subtitle="GHS wallet volume, commission, and rider payout outflow."
        actions={
          <div className="admin-screen-toolbar">
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() =>
                downloadCsv(
                  "wallet-transactions.csv",
                  ["User", "Role", "Type", "Direction", "Amount", "Status", "Reference", "Date"],
                  walletTransactions.map((tx) => [
                    tx.wallet.user.fullName,
                    tx.wallet.user.role,
                    tx.type,
                    tx.direction,
                    tx.amount,
                    tx.status,
                    tx.reference ?? "",
                    tx.createdAt
                  ])
                )
              }
            >
              <Download size={14} />
              Export Report
            </button>
          </div>
        }
      />
      <section className="admin-kpi-grid">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><CreditCard size={22} /></div>
          <div>
            <span>Total Revenue</span>
            <strong>{formatMoney(adminCurrency, totalRevenue)}</strong>
            <small>{formatMoney(adminCurrency, totalCommission)} commission</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><TrendingUp size={22} /></div>
          <div>
            <span>Platform Net Profit</span>
            <strong>{formatMoney(adminCurrency, platformNetProfit)}</strong>
            <small>{profitMargin.toFixed(1)}% margin</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon red"><TrendingDown size={22} /></div>
          <div>
            <span>Payout Outflow</span>
            <strong>{formatMoney(adminCurrency, payoutOutflow)}</strong>
            <small>{paidPayoutRequests.length} paid requests</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><CreditCard size={22} /></div>
          <div>
            <span>Pending Payouts</span>
            <strong>{pendingPayoutRequests.length}</strong>
            <small>{formatMoney(adminCurrency, pendingPayoutValue)} value</small>
          </div>
        </article>
      </section>

      <article className="admin-reference-card" style={{ marginTop: 16 }}>
        <div className="admin-reference-cardhead">
          <div><h3>Finance Reconciliation</h3><p>Revenue, commission & net breakdown</p></div>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Revenue</th>
                <th>Commission</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Rides</strong></td>
                <td>{formatMoney(adminCurrency, totalRideRevenue)}</td>
                <td>{formatMoney(adminCurrency, totalRideCommission)}</td>
                <td>{formatMoney(adminCurrency, totalRideRevenue - totalRideCommission)}</td>
              </tr>
              <tr>
                <td><strong>Deliveries</strong></td>
                <td>{formatMoney(adminCurrency, totalDeliveryRevenue)}</td>
                <td>{formatMoney(adminCurrency, totalDeliveryCommission)}</td>
                <td>{formatMoney(adminCurrency, totalDeliveryRevenue - totalDeliveryCommission)}</td>
              </tr>
              <tr style={{ fontWeight: 700 }}>
                <td><strong>Totals</strong></td>
                <td>{formatMoney(adminCurrency, totalRideRevenue + totalDeliveryRevenue)}</td>
                <td>{formatMoney(adminCurrency, totalRideCommission + totalDeliveryCommission)}</td>
                <td>{formatMoney(adminCurrency, (totalRideRevenue - totalRideCommission) + (totalDeliveryRevenue - totalDeliveryCommission))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="admin-finance-summary">
          <div className="admin-finance-summary-row">
            <span>Revenue coming in</span>
            <strong>{formatMoney(adminCurrency, totalRevenue)}</strong>
          </div>
          <div className="admin-finance-summary-row">
            <span>Commission captured</span>
            <strong>{formatMoney(adminCurrency, totalCommission)}</strong>
          </div>
          <div className="admin-finance-summary-row">
            <span>Rider earnings paid out</span>
            <strong>{formatMoney(adminCurrency, riderEarningsTotal)}</strong>
          </div>
          <div className="admin-finance-summary-row">
            <span>Payout outflow</span>
            <strong>{formatMoney(adminCurrency, payoutOutflow)}</strong>
          </div>
          <div className={`admin-finance-summary-row is-total`}>
            <span>Platform net profit</span>
            <strong style={{ color: platformNetProfit >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
              {formatMoney(adminCurrency, platformNetProfit)}
            </strong>
          </div>
        </div>
      </article>

      <section className="admin-overview-split">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div><h3>Revenue vs Payout Trends</h3><p>Last 10 days of Accra wallet activity</p></div>
          </div>
          <div className="admin-reference-legend">
            <span><i className="black" /> Revenue</span>
            <span><i className="yellow" /> Commission</span>
          </div>
          <div className="admin-reference-bars">
            {financeDailyBuckets.map((bucket) => (
              <div key={bucket.key} className="admin-reference-bar-day">
                <div className="admin-reference-bar-track">
                  <i
                    className="rides"
                    style={{ height: bucket.revenue === 0 ? 0 : `${Math.max(8, (bucket.revenue / financeDailyMax) * 100)}%` }}
                  />
                  <i
                    className="completed"
                    style={{ height: bucket.commission === 0 ? 0 : `${Math.max(8, (bucket.commission / financeDailyMax) * 100)}%` }}
                  />
                </div>
                <span>{bucket.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div><h3>Payment Gateways</h3><p>MoMo, card, and cash volume</p></div>
          </div>
          {paymentMethodSnapshot.length === 0 ? (
            <EmptyCard title="No method data." body="" />
          ) : (
            <ul className="admin-summary-list">
              {paymentMethodSnapshot.map(([method, amount]) => (
                <li key={method}>
                  <span>{method}</span>
                  <div>
                    <strong>{formatMoney(adminCurrency, amount)}</strong>
                    <small>
                      {paymentMethodTotal > 0 ? Math.round((amount / paymentMethodTotal) * 100) : 0}%
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="admin-reference-grid-3">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div><h3>Payout Trend</h3><p>Last 10 days</p></div>
          </div>
          <div className="admin-reference-bars">
            {payoutDailyBuckets.map((bucket) => (
              <div key={bucket.key} className="admin-reference-bar-day">
                <div className="admin-reference-bar-track">
                  <i
                    className="rides"
                    style={{ height: bucket.payouts === 0 ? 0 : `${Math.max(8, (bucket.payouts / payoutDailyMax) * 100)}%` }}
                  />
                </div>
                <span>{bucket.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-reference-card admin-grid-span-2">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Recent Transactions</h3>
              <p>{recentFinanceTransactions.length} latest wallet movements</p>
            </div>
          </div>
          {recentFinanceTransactions.length === 0 ? (
            <EmptyCard title="No recent transactions." body="" />
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFinanceTransactions.slice(0, 8).map((tx) => (
                    <tr key={tx.id}>
                      <td><strong>{tx.wallet.user.fullName}</strong></td>
                      <td><small>{formatEnumLabel(tx.type)}</small></td>
                      <td><strong>{formatMoney(tx.currency, Math.abs(parseNumber(tx.amount)))}</strong></td>
                      <td><em className={`admin-reference-tag ${statusTone(tx.status)}`}>{tx.status}</em></td>
                      <td><small>{formatDateTime(tx.createdAt)}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      {/* Wallet Transactions */}
      <article className="admin-reference-card" style={{ marginTop: 16 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>Wallet Transactions</h3>
            <p>
              {postedWalletTransactions.length} posted · {pendingWalletTransactions.length} pending ·{" "}
              {failedWalletTransactions.length} failed
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: isMobile ? "wrap" : undefined }}>
            <button
              className="admin-select-sm"
              onClick={() =>
                onServerExport
                  ? onServerExport("wallet-transactions")
                  : downloadCsv(
                      "wallet-transactions.csv",
                      ["User", "Role", "Type", "Direction", "Amount", "Status", "Reference", "Date"],
                      walletTransactions.map((tx) => [
                        tx.wallet.user.fullName,
                        tx.wallet.user.role,
                        tx.type,
                        tx.direction,
                        tx.amount,
                        tx.status,
                        tx.reference ?? "",
                        tx.createdAt
                      ])
                    )
              }
            >
              <Download size={14} /> Export CSV
            </button>
            <Filter size={14} />
            <select
              className="admin-select-sm"
              value={transactionStatusFilter}
              onChange={(e) => onTransactionStatusChange(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="POSTED">Posted</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REVERSED">Reversed</option>
            </select>
            <select
              className="admin-select-sm"
              value={transactionTypeFilter}
              onChange={(e) => onTransactionTypeChange(e.target.value)}
            >
              <option value="">All types</option>
              <option value="RIDE_FARE">Ride Fare</option>
              <option value="PAYOUT">Payout</option>
              <option value="COMMISSION">Commission</option>
            </select>
          </div>
        </div>
        {walletTransactions.length === 0 ? (
          <EmptyCard title="No wallet transactions." body="Transactions will appear as payments are processed." />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Direction</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedWalletTx.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <strong>{tx.wallet.user.fullName}</strong>
                      <br />
                      <small>{tx.wallet.user.role}</small>
                    </td>
                    <td><small>{formatEnumLabel(tx.type)}</small></td>
                    <td>
                      <em className={`admin-reference-tag ${parseNumber(tx.amount) >= 0 ? "success" : "danger"}`}>
                        {tx.direction}
                      </em>
                    </td>
                    <td><strong>{formatMoney(tx.currency, Math.abs(parseNumber(tx.amount)))}</strong></td>
                    <td>
                      <em className={`admin-reference-tag ${statusTone(tx.status)}`}>{tx.status}</em>
                    </td>
                    <td><code style={{ fontSize: 11 }}>{tx.reference?.slice(-12)}</code></td>
                    <td><small>{formatDateTime(tx.createdAt)}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AdminPagination
              page={walletPage}
              totalItems={walletTransactions.length}
              pageSize={PAGE_SIZE}
              onPageChange={setWalletPage}
            />
          </div>
        )}
      </article>

      {/* Payout Requests */}
      <article className="admin-reference-card" style={{ marginTop: 16 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>Payout Requests</h3>
            <p>{payoutRequests.length} total · {pendingPayoutRequests.length} pending</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: isMobile ? "wrap" : undefined }}>
            <button
              className="admin-select-sm"
              onClick={() =>
                onServerExport
                  ? onServerExport("payout-requests")
                  : downloadCsv(
                      "payout-requests.csv",
                      ["Rider", "Code", "Amount", "Method", "Destination", "Status", "Requested", "Reviewer"],
                      payoutRequests.map((request) => [
                        request.rider.user.fullName,
                        request.rider.displayCode,
                        request.amount,
                        request.method,
                        request.destinationLabel,
                        request.status,
                        request.requestedAt,
                        request.reviewer?.fullName ?? "—"
                      ])
                    )
              }
            >
              <Download size={14} /> Export CSV
            </button>
            <select
              className="admin-select-sm"
              value={payoutStatusFilter}
              onChange={(e) => onPayoutStatusChange(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="REQUESTED">Requested</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="APPROVED">Approved</option>
              <option value="PROCESSING">Processing</option>
              <option value="PAID">Paid</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
        {payoutRequests.length === 0 ? (
          <EmptyCard title="No payout requests." body="Rider payout requests will appear here." />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Reviewer</th>
                  {onPayoutAction ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {paginatedPayouts.map((request) => {
                  const status = request.status.toUpperCase();
                  return (
                  <tr key={request.id}>
                    <td>
                      <strong>{request.rider.user.fullName}</strong>
                      <br />
                      <small>{request.rider.displayCode}</small>
                    </td>
                    <td><strong>{formatMoney(request.currency, parseNumber(request.amount))}</strong></td>
                    <td><small>{request.method}</small></td>
                    <td><small>{request.destinationLabel}</small></td>
                    <td>
                      <em className={`admin-reference-tag ${statusTone(request.status)}`}>
                        {request.status}
                      </em>
                    </td>
                    <td><small>{formatDateTime(request.requestedAt)}</small></td>
                    <td><small>{request.reviewer?.fullName ?? "—"}</small></td>
                    {onPayoutAction ? (
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {status === "REQUESTED" && (
                            <button type="button" className="admin-btn-secondary" disabled={isMutating} onClick={() => onPayoutAction(request.id, "mark_reviewing")}>
                              Review
                            </button>
                          )}
                          {(status === "REQUESTED" || status === "REVIEWING") && (
                            <button type="button" className="admin-btn-primary" disabled={isMutating} onClick={() => onPayoutAction(request.id, "approve")}>
                              Approve
                            </button>
                          )}
                          {status === "APPROVED" && (
                            <button type="button" className="admin-btn-secondary" disabled={isMutating} onClick={() => onPayoutAction(request.id, "mark_processing")}>
                              Process
                            </button>
                          )}
                          {(status === "APPROVED" || status === "PROCESSING") && (
                            <button type="button" className="admin-btn-primary" disabled={isMutating} onClick={() => onPayoutAction(request.id, "mark_paid")}>
                              Mark Paid
                            </button>
                          )}
                          {!["PAID", "REJECTED", "CANCELLED"].includes(status) && (
                            <button type="button" className="admin-btn-secondary" disabled={isMutating} onClick={() => onPayoutAction(request.id, "reject", "Rejected from finance console")}>
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                  );
                })}
              </tbody>
            </table>
            <AdminPagination
              page={payoutPage}
              totalItems={payoutRequests.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPayoutPage}
            />
          </div>
        )}
      </article>
    </div>
  );
}
