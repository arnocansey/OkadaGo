import { useState, useMemo } from "react";
import { useAdminToast } from "./AdminToast";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { SkeletonKPI, SkeletonTable, SkeletonCard, SkeletonDonut } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { formatMoney } from "@/lib/currency";
import { formatDateTime, formatEnumLabel, statusTone, parseNumber } from "./utils";
import type { WalletTransactionRecord } from "./types";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Lock,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  BadgePercent,
  Gift,
  History,
  BarChart3,
  Eye,
  Coins
} from "lucide-react";

export type RiderWalletScreenProps = {
  riderWalletTransactions: WalletTransactionRecord[];
  riderWalletCredits: number;
  riderWalletDebits: number;
  riderWalletAvailableBalance: number;
  riderWalletLockedBalance: number;
  riderWalletMovementTotal: number;
  adminCurrency: string;
  dataLoading?: boolean;
};

const PER_PAGE = 7;

export function RiderWalletScreen({
  riderWalletTransactions,
  riderWalletCredits,
  riderWalletDebits,
  riderWalletAvailableBalance,
  riderWalletLockedBalance,
  riderWalletMovementTotal,
  adminCurrency,
  dataLoading = false
}: RiderWalletScreenProps) {
  const { addToast } = useAdminToast();
  const { isMobile } = useBreakpoint();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const sortedTransactions = useMemo(() => {
    return riderWalletTransactions
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [riderWalletTransactions]);

  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter((t) => {
      const matchesSearch =
        searchQuery === "" ||
        t.wallet.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatEnumLabel(t.type).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || t.type.toLowerCase() === typeFilter;
      const matchesStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [sortedTransactions, searchQuery, typeFilter, statusFilter]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(riderWalletTransactions.map((t) => t.type));
    return Array.from(types);
  }, [riderWalletTransactions]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(riderWalletTransactions.map((t) => t.status));
    return Array.from(statuses);
  }, [riderWalletTransactions]);

  if (dataLoading) {
    return (
      <div className="exact-admin-screen">
        <SkeletonKPI count={5} />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16 }}>
          <SkeletonCard lines={4} />
          <SkeletonDonut />
          <SkeletonCard lines={3} />
        </div>
        <SkeletonTable rows={5} cols={7} />
      </div>
    );
  }

  const pendingBalance = riderWalletMovementTotal - riderWalletAvailableBalance - riderWalletLockedBalance;

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PER_PAGE));
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const donutTotal = Math.max(riderWalletAvailableBalance + riderWalletLockedBalance + Math.max(pendingBalance, 0), 1);
  const availablePct = (riderWalletAvailableBalance / donutTotal) * 100;
  const lockedPct = (riderWalletLockedBalance / donutTotal) * 100;
  const pendingPct = (Math.max(pendingBalance, 0) / donutTotal) * 100;

  const recentActivity = sortedTransactions.slice(0, 6);

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Rider Wallets"
        subtitle="Accra rider wallet credits, holds, and GHS payout ledgers."
      />

      <AdminKpiRow
        items={[
          { label: "Wallet Balance", value: formatMoney(adminCurrency, riderWalletAvailableBalance), hint: "Available to use", icon: <Wallet size={22} />, tone: "green" },
          { label: "Total Earnings", value: formatMoney(adminCurrency, riderWalletCredits), hint: "All credits received", icon: <TrendingUp size={22} />, tone: "yellow" },
          { label: "Total Payouts", value: formatMoney(adminCurrency, riderWalletDebits), hint: "All debits processed", icon: <TrendingDown size={22} />, tone: "yellow" },
          { label: "Pending Payouts", value: formatMoney(adminCurrency, Math.max(pendingBalance, 0)), hint: "Awaiting settlement", icon: <ArrowUpDown size={22} />, tone: "yellow" },
          { label: "Locked Balance", value: formatMoney(adminCurrency, riderWalletLockedBalance), hint: "Held for disputes", icon: <Lock size={22} />, tone: "red" },
        ]}
      />

      <section className="admin-reference-grid-3">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>
                <CreditCard size={16} style={{ marginRight: 6, verticalAlign: -2, color: "var(--accent-orange)" }} />
                Wallet Actions
              </h3>
              <p>Quick Accra wallet operations.</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Cash Out", icon: <Banknote size={16} />, className: "admin-btn-primary", msg: "Cash out flow initiated" },
              { label: "Add Money", icon: <Coins size={16} />, className: "admin-btn-secondary", msg: "Add money flow opened" },
              { label: "Transaction History", icon: <History size={16} />, className: "admin-btn-secondary", msg: "Transaction history exported" },
              { label: "Earnings Summary", icon: <BarChart3 size={16} />, className: "admin-btn-secondary", msg: "Earnings summary generated" }
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                className={action.className}
                style={{ width: "100%", justifyContent: "flex-start" }}
                onClick={() => addToast(action.msg, "info")}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </article>

        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>
                <BarChart3 size={16} style={{ marginRight: 6, verticalAlign: -2, color: "var(--accent-yellow)" }} />
                Balance Breakdown
              </h3>
              <p>Available, locked, and pending GHS.</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            <svg width="120" height="120" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--border-color)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.915"
                fill="none"
                stroke="var(--color-success, var(--success))"
                strokeWidth="3"
                strokeDasharray={`${availablePct} ${100 - availablePct}`}
                strokeDashoffset="25"
                strokeLinecap="round"
              />
              <circle
                cx="18" cy="18" r="15.915"
                fill="none"
                stroke="var(--accent-yellow)"
                strokeWidth="3"
                strokeDasharray={`${lockedPct} ${100 - lockedPct}`}
                strokeDashoffset={25 - availablePct}
                strokeLinecap="round"
              />
              <circle
                cx="18" cy="18" r="15.915"
                fill="none"
                stroke="var(--accent-orange)"
                strokeWidth="3"
                strokeDasharray={`${pendingPct} ${100 - pendingPct}`}
                strokeDashoffset={25 - availablePct - lockedPct}
                strokeLinecap="round"
              />
              <text x="18" y="17.5" textAnchor="middle" fill="var(--text-primary)" fontSize="5" fontWeight="700">
                {formatMoney(adminCurrency, riderWalletMovementTotal)}
              </text>
              <text x="18" y="22" textAnchor="middle" fill="var(--text-secondary)" fontSize="2.8">
                Total Movement
              </text>
            </svg>
            <ul className="admin-summary-list">
              <li>
                <span>Available</span>
                <strong>{availablePct.toFixed(1)}%</strong>
              </li>
              <li>
                <span>Locked</span>
                <strong>{lockedPct.toFixed(1)}%</strong>
              </li>
              <li>
                <span>Pending</span>
                <strong>{pendingPct.toFixed(1)}%</strong>
              </li>
            </ul>
          </div>
        </article>

        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>
                <BadgePercent size={16} style={{ marginRight: 6, verticalAlign: -2, color: "var(--accent-orange)" }} />
                Bonus & Incentives
              </h3>
              <p>Active Accra rider incentive programs.</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="admin-ops-note" style={{ display: "flex", alignItems: "center", gap: 12, margin: 0 }}>
              <Gift size={18} style={{ color: "var(--accent-orange)", flexShrink: 0 }} />
              <div>
                <strong style={{ display: "block", fontSize: 13 }}>Active Bonuses</strong>
                <small>Review active incentive programs</small>
              </div>
            </div>
            <button
              type="button"
              className="admin-btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => addToast("Viewing all bonuses", "info")}
            >
              <Eye size={14} />
              View All Bonuses
            </button>
            <button
              type="button"
              className="admin-btn-secondary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => addToast("Viewing all transactions", "info")}
            >
              <History size={14} />
              View All Transactions
            </button>
          </div>
        </article>
      </section>

      <div className="admin-overview-split">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>
                <History size={16} style={{ marginRight: 6, verticalAlign: -2, color: "var(--accent-orange)" }} />
                Transaction History
              </h3>
              <p>
                {filteredTransactions.length} ledger movement{filteredTransactions.length !== 1 ? "s" : ""} in GHS.
              </p>
            </div>
          </div>

          <div className="admin-screen-toolbar">
            <div className="admin-filter-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search by name, reference, type..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              className="admin-select-sm"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t.toLowerCase()}>
                  {formatEnumLabel(t)}
                </option>
              ))}
            </select>
            <select
              className="admin-select-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map((s) => (
                <option key={s} value={s.toLowerCase()}>
                  {formatEnumLabel(s)}
                </option>
              ))}
            </select>
          </div>

          {filteredTransactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--text-muted)", fontSize: 13 }}>
              No transactions match the current filters.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    {["Rider", "Type", "Direction", "Amount", "Status", "Reference", "Date"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((t) => {
                    const amt = Math.abs(parseNumber(t.amount));
                    const isCredit = parseNumber(t.amount) >= 0;
                    return (
                      <tr key={t.id}>
                        <td>
                          <strong>{t.wallet.user.fullName}</strong>
                          <div>
                            <small>{t.wallet.user.riderProfile?.displayCode ?? "N/A"}</small>
                          </div>
                        </td>
                        <td><small>{formatEnumLabel(t.type)}</small></td>
                        <td>
                          <em className={`admin-reference-tag ${isCredit ? "success" : "warning"}`}>
                            {isCredit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{" "}
                            {t.direction}
                          </em>
                        </td>
                        <td><strong>{formatMoney(t.currency, amt)}</strong></td>
                        <td>
                          <em className={`admin-reference-tag ${statusTone(t.status)}`}>
                            {t.status}
                          </em>
                        </td>
                        <td>
                          <code style={{ fontSize: 11 }}>
                            {t.reference?.slice(-12) ?? "N/A"}
                          </code>
                        </td>
                        <td><small>{formatDateTime(t.createdAt)}</small></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredTransactions.length > PER_PAGE && (
            <div className="admin-screen-toolbar" style={{ justifyContent: "space-between", marginTop: 14 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Page {currentPage} of {totalPages}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  className="admin-btn-ghost"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  className="admin-btn-ghost"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </article>

        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Recent Activity</h3>
                <p>Latest Accra wallet ledger moves.</p>
              </div>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>
                No recent wallet activity.
              </div>
            ) : (
              <ul className="admin-summary-list">
                {recentActivity.map((t) => (
                  <li key={t.id}>
                    <span>
                      {t.wallet.user.fullName}
                      <small style={{ display: "block" }}>
                        {formatEnumLabel(t.type)} · {formatDateTime(t.createdAt)}
                      </small>
                    </span>
                    <strong>{formatMoney(t.currency, Math.abs(parseNumber(t.amount)))}</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </aside>
      </div>
    </div>
  );
}
