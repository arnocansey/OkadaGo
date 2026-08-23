"use client";

import { useState, useMemo } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type { AdminFinanceSummary } from "./useAdminFinanceSummary";
import type { WalletTransactionRecord, RideRecord, DeliveryRecord } from "./types";
import { parseNumber, formatDateTime } from "./utils";
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Package,
  Bike,
  Clock
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type FinanceDashboardScreenProps = {
  financeSummary: AdminFinanceSummary | null;
  walletTransactions: WalletTransactionRecord[];
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  pendingPayoutValue: number;
  adminCurrency: string;
  dataLoading?: boolean;
  onServerExport?: (entity: "wallet-transactions" | "payout-requests") => void;
};

type TimePeriod = "day" | "week" | "month" | "all";
type ServiceFilter = "all" | "rides" | "deliveries";
type PaymentFilter = "all" | "cash" | "card" | "wallet" | "mobile_money";

const TIME_PERIODS: Array<{ id: TimePeriod; label: string }> = [
  { id: "day", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" }
];

const SERVICE_FILTERS: Array<{ id: ServiceFilter; label: string; icon: typeof Bike }> = [
  { id: "all", label: "All Services", icon: Activity },
  { id: "rides", label: "Rides", icon: Bike },
  { id: "deliveries", label: "Deliveries", icon: Package }
];

const PAYMENT_FILTERS: Array<{ id: PaymentFilter; label: string }> = [
  { id: "all", label: "All Methods" },
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "wallet", label: "Wallet" },
  { id: "mobile_money", label: "Mobile Money" }
];

/* ── Mini Bar Chart ── */

function MiniBarChart({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
  const safeMax = Math.max(1, maxVal);
  return (
    <div className="fd-bar-chart">
      {data.map((val, i) => (
        <div
          key={i}
          className="fd-bar"
          style={{
            height: `${Math.max(4, (val / safeMax) * 100)}%`,
            background: color,
            opacity: 0.4 + (val / safeMax) * 0.6
          }}
        />
      ))}
    </div>
  );
}

/* ── Donut Segment ── */

function DonutSegment({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="fd-donut-seg">
      <span className="fd-donut-dot" style={{ background: color }} />
      <span className="fd-donut-label">{label}</span>
      <span className="fd-donut-value">{pct}%</span>
      <span className="fd-donut-amount">{formatMoney("GHS", value)}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function FinanceDashboardScreen({
  financeSummary,
  walletTransactions,
  rides,
  deliveries,
  pendingPayoutValue,
  adminCurrency,
  dataLoading = false,
  onServerExport
}: FinanceDashboardScreenProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");

  const summary = financeSummary;

  const kpis = useMemo(() => {
    const grossRevenue = summary?.revenue.total ?? 0;
    const commission = summary?.commission.total ?? 0;
    const riderEarnings = summary?.riderEarningsTotal ?? 0;
    const deliveryRevenue = summary?.revenue.deliveries ?? 0;
    const refunds = walletTransactions
      .filter((t) => t.type?.toLowerCase().includes("refund") || t.direction === "credit" && t.type?.toLowerCase().includes("refund"))
      .reduce((sum, t) => sum + parseNumber(t.amount), 0);
    const netRevenue = summary?.platformNetProfit ?? grossRevenue - commission - refunds;

    return { grossRevenue, commission, riderEarnings, deliveryRevenue, refunds, pendingPayouts: pendingPayoutValue, netRevenue };
  }, [summary, walletTransactions, pendingPayoutValue]);

  const dailyData = useMemo(() => {
    if (!summary?.daily) return [];
    return summary.daily.slice(-14);
  }, [summary]);

  const paymentDistribution = useMemo(() => {
    if (!summary?.paymentMethods) return [];
    return summary.paymentMethods;
  }, [summary]);

  const recentTransactions = useMemo(() => {
    let txns = walletTransactions;
    if (paymentFilter !== "all") {
      txns = txns.filter((t) => t.type?.toLowerCase().replace(/\s+/g, "_").includes(paymentFilter));
    }
    return txns.slice(0, 20);
  }, [walletTransactions, paymentFilter]);

  const filteredRevenue = useMemo(() => {
    if (!summary) return { rides: 0, deliveries: 0, total: 0 };
    if (serviceFilter === "rides") return { rides: summary.revenue.rides, deliveries: 0, total: summary.revenue.rides };
    if (serviceFilter === "deliveries") return { rides: 0, deliveries: summary.revenue.deliveries, total: summary.revenue.deliveries };
    return summary.revenue;
  }, [summary, serviceFilter]);

  const filteredCommission = useMemo(() => {
    if (!summary) return { rides: 0, deliveries: 0, total: 0 };
    if (serviceFilter === "rides") return { rides: summary.commission.rides, deliveries: 0, total: summary.commission.rides };
    if (serviceFilter === "deliveries") return { rides: 0, deliveries: summary.commission.deliveries, total: summary.commission.deliveries };
    return summary.commission;
  }, [summary, serviceFilter]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="cards" kpis={7} rows={6} />;
  }

  const revenueMax = Math.max(1, ...dailyData.map((d) => d.revenue));
  const commissionMax = Math.max(1, ...dailyData.map((d) => d.commission));

  const PAYMENT_COLORS: Record<string, string> = {
    cash: "#22c55e",
    card: "#3b82f6",
    wallet: "#a855f7",
    mobile_money: "#ff6b00",
    momo: "#ff6b00"
  };

  return (
    <div className="fd-mgmt">
      <AdminPageHeader
        title="Finance Dashboard"
        subtitle="Revenue, commissions, payouts, and transaction analytics."
        actions={
          onServerExport ? (
            <button
              type="button"
              className="fd-btn fd-btn--outline"
              onClick={() => onServerExport("wallet-transactions")}
            >
              <Download size={13} /> Export CSV
            </button>
          ) : undefined
        }
      />

      {/* ── Filters ── */}
      <div className="fd-filters">
        <div className="fd-filter-group">
          <Calendar size={13} />
          {TIME_PERIODS.map((tp) => (
            <button
              key={tp.id}
              type="button"
              className={`fd-filter-chip${timePeriod === tp.id ? " active" : ""}`}
              onClick={() => setTimePeriod(tp.id)}
            >
              {tp.label}
            </button>
          ))}
        </div>
        <div className="fd-filter-group">
          <Filter size={13} />
          {SERVICE_FILTERS.map((sf) => {
            const Icon = sf.icon;
            return (
              <button
                key={sf.id}
                type="button"
                className={`fd-filter-chip${serviceFilter === sf.id ? " active" : ""}`}
                onClick={() => setServiceFilter(sf.id)}
              >
                <Icon size={12} /> {sf.label}
              </button>
            );
          })}
        </div>
        <div className="fd-filter-group">
          {PAYMENT_FILTERS.map((pf) => (
            <button
              key={pf.id}
              type="button"
              className={`fd-filter-chip${paymentFilter === pf.id ? " active" : ""}`}
              onClick={() => setPaymentFilter(pf.id)}
            >
              {pf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <section className="fd-kpis">
        <article className="fd-kpi fd-kpi--revenue">
          <div className="fd-kpi-icon"><Banknote size={18} /></div>
          <div className="fd-kpi-body">
            <span className="fd-kpi-label">Gross Revenue</span>
            <strong className="fd-kpi-value">{formatMoney(adminCurrency, filteredRevenue.total)}</strong>
            <small>{formatMoney(adminCurrency, filteredRevenue.rides)} rides · {formatMoney(adminCurrency, filteredRevenue.deliveries)} deliveries</small>
          </div>
        </article>
        <article className="fd-kpi fd-kpi--commission">
          <div className="fd-kpi-icon"><TrendingUp size={18} /></div>
          <div className="fd-kpi-body">
            <span className="fd-kpi-label">OkadaGo Commission</span>
            <strong className="fd-kpi-value">{formatMoney(adminCurrency, filteredCommission.total)}</strong>
            <small>{summary ? `${((filteredCommission.total / Math.max(1, filteredRevenue.total)) * 100).toFixed(1)}% of revenue` : "—"}</small>
          </div>
        </article>
        <article className="fd-kpi fd-kpi--rider">
          <div className="fd-kpi-icon"><Users size={18} /></div>
          <div className="fd-kpi-body">
            <span className="fd-kpi-label">Rider Earnings</span>
            <strong className="fd-kpi-value">{formatMoney(adminCurrency, kpis.riderEarnings)}</strong>
            <small>{summary ? `${((kpis.riderEarnings / Math.max(1, filteredRevenue.total)) * 100).toFixed(1)}% of revenue` : "—"}</small>
          </div>
        </article>
        <article className="fd-kpi fd-kpi--delivery">
          <div className="fd-kpi-icon"><Package size={18} /></div>
          <div className="fd-kpi-body">
            <span className="fd-kpi-label">Delivery Revenue</span>
            <strong className="fd-kpi-value">{formatMoney(adminCurrency, filteredRevenue.deliveries)}</strong>
            <small>{summary ? `${((filteredRevenue.deliveries / Math.max(1, filteredRevenue.total)) * 100).toFixed(1)}% of total` : "—"}</small>
          </div>
        </article>
        <article className="fd-kpi fd-kpi--refund">
          <div className="fd-kpi-icon"><TrendingDown size={18} /></div>
          <div className="fd-kpi-body">
            <span className="fd-kpi-label">Refunds</span>
            <strong className="fd-kpi-value">{formatMoney(adminCurrency, kpis.refunds)}</strong>
            <small>{kpis.refunds > 0 ? `${((kpis.refunds / Math.max(1, filteredRevenue.total)) * 100).toFixed(1)}% of revenue` : "No refunds"}</small>
          </div>
        </article>
        <article className="fd-kpi fd-kpi--payout">
          <div className="fd-kpi-icon"><Wallet size={18} /></div>
          <div className="fd-kpi-body">
            <span className="fd-kpi-label">Pending Payouts</span>
            <strong className="fd-kpi-value">{formatMoney(adminCurrency, kpis.pendingPayouts)}</strong>
            <small>{summary?.payouts.pendingCount ?? 0} pending requests</small>
          </div>
        </article>
        <article className="fd-kpi fd-kpi--net">
          <div className="fd-kpi-icon"><BarChart3 size={18} /></div>
          <div className="fd-kpi-body">
            <span className="fd-kpi-label">Net Revenue</span>
            <strong className="fd-kpi-value">{formatMoney(adminCurrency, kpis.netRevenue)}</strong>
            <small>{summary ? `${(summary.profitMargin * 100).toFixed(1)}% margin` : "—"}</small>
          </div>
        </article>
      </section>

      {/* ── Charts Row ── */}
      <section className="fd-charts">
        {/* ── Revenue Trend ── */}
        <article className="fd-chart-card">
          <div className="fd-chart-header">
            <h3><TrendingUp size={15} /> Revenue Trend</h3>
            <span className="fd-chart-subtitle">Last {dailyData.length} days</span>
          </div>
          {dailyData.length === 0 ? (
            <div className="fd-chart-empty"><EmptyCard title="No daily data" body="Revenue trends will appear here." /></div>
          ) : (
            <div className="fd-chart-body">
              <MiniBarChart data={dailyData.map((d) => d.revenue)} maxVal={revenueMax} color="#22c55e" />
              <div className="fd-chart-labels">
                {dailyData.map((d, i) => (
                  <span key={i}>{d.key.slice(-2)}</span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* ── Commission Trend ── */}
        <article className="fd-chart-card">
          <div className="fd-chart-header">
            <h3><TrendingUp size={15} /> Commission Trend</h3>
            <span className="fd-chart-subtitle">Last {dailyData.length} days</span>
          </div>
          {dailyData.length === 0 ? (
            <div className="fd-chart-empty"><EmptyCard title="No daily data" body="Commission trends will appear here." /></div>
          ) : (
            <div className="fd-chart-body">
              <MiniBarChart data={dailyData.map((d) => d.commission)} maxVal={commissionMax} color="#ff6b00" />
              <div className="fd-chart-labels">
                {dailyData.map((d, i) => (
                  <span key={i}>{d.key.slice(-2)}</span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* ── Payment Distribution ── */}
        <article className="fd-chart-card fd-chart-card--donut">
          <div className="fd-chart-header">
            <h3><PieChart size={15} /> Payment Methods</h3>
          </div>
          {paymentDistribution.length === 0 ? (
            <div className="fd-chart-empty"><EmptyCard title="No payment data" body="Payment method distribution will appear here." /></div>
          ) : (
            <div className="fd-donut-list">
              {paymentDistribution.map(([method, amount]) => (
                <DonutSegment
                  key={method}
                  label={method.replace(/_/g, " ")}
                  value={amount}
                  total={paymentDistribution.reduce((sum, [, v]) => sum + v, 0)}
                  color={PAYMENT_COLORS[method] ?? "#6b7280"}
                />
              ))}
            </div>
          )}
        </article>
      </section>

      {/* ── Summary Cards Row ── */}
      <section className="fd-summary-row">
        <article className="fd-summary-card">
          <h4>Ride vs Delivery Split</h4>
          <div className="fd-split-bars">
            <div className="fd-split-row">
              <span className="fd-split-label">Rides</span>
              <div className="fd-split-bar-wrap">
                <div
                  className="fd-split-bar fd-split-bar--rides"
                  style={{ width: `${filteredRevenue.total > 0 ? (filteredRevenue.rides / filteredRevenue.total) * 100 : 50}%` }}
                />
              </div>
              <span className="fd-split-pct">{filteredRevenue.total > 0 ? Math.round((filteredRevenue.rides / filteredRevenue.total) * 100) : 50}%</span>
            </div>
            <div className="fd-split-row">
              <span className="fd-split-label">Deliveries</span>
              <div className="fd-split-bar-wrap">
                <div
                  className="fd-split-bar fd-split-bar--delivery"
                  style={{ width: `${filteredRevenue.total > 0 ? (filteredRevenue.deliveries / filteredRevenue.total) * 100 : 50}%` }}
                />
              </div>
              <span className="fd-split-pct">{filteredRevenue.total > 0 ? Math.round((filteredRevenue.deliveries / filteredRevenue.total) * 100) : 50}%</span>
            </div>
          </div>
        </article>

        <article className="fd-summary-card">
          <h4>Revenue Breakdown</h4>
          <div className="fd-breakdown-list">
            <div className="fd-breakdown-line">
              <span>Gross Revenue</span>
              <strong>{formatMoney(adminCurrency, filteredRevenue.total)}</strong>
            </div>
            <div className="fd-breakdown-line fd-breakdown-line--indent">
              <span>− Commission</span>
              <span>−{formatMoney(adminCurrency, filteredCommission.total)}</span>
            </div>
            <div className="fd-breakdown-line fd-breakdown-line--indent">
              <span>− Refunds</span>
              <span>−{formatMoney(adminCurrency, kpis.refunds)}</span>
            </div>
            <div className="fd-divider" />
            <div className="fd-breakdown-line fd-breakdown-line--total">
              <span>Net Revenue</span>
              <strong>{formatMoney(adminCurrency, kpis.netRevenue)}</strong>
            </div>
            <div className="fd-breakdown-line">
              <span>Rider Earnings</span>
              <span>{formatMoney(adminCurrency, kpis.riderEarnings)}</span>
            </div>
          </div>
        </article>

        <article className="fd-summary-card">
          <h4>Transaction Activity</h4>
          <div className="fd-activity-list">
            {recentTransactions.length === 0 ? (
              <span className="fd-empty-text">No recent transactions</span>
            ) : (
              recentTransactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="fd-activity-row">
                  <div className="fd-activity-info">
                    <span className="fd-activity-type">{tx.type}</span>
                    <span className="fd-activity-user">{tx.wallet?.user?.fullName ?? "—"}</span>
                  </div>
                  <div className="fd-activity-amounts">
                    <span className={`fd-activity-amount ${tx.direction === "credit" ? "fd-activity-amount--credit" : "fd-activity-amount--debit"}`}>
                      {tx.direction === "credit" ? "+" : "−"}{formatMoney(adminCurrency, parseNumber(tx.amount))}
                    </span>
                    <span className="fd-activity-date">{formatDateTime(tx.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
