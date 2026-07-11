import { useState, useMemo } from "react";
import { useAdminToast } from "./AdminToast";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { SkeletonKPI, SkeletonTable, SkeletonCard, SkeletonDonut } from "./AdminSkeleton";
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
  const { isMobile, isTablet } = useBreakpoint();
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
      <div style={{ padding: isMobile ? "16px 12px" : "24px 0", minHeight: "100vh", display: "flex", flexDirection: "column", gap: 20 }}>
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

  const baseCard: React.CSSProperties = {
    background: "var(--bg-secondary, #141517)",
    border: "1px solid var(--border, #2a2b2e)",
    borderRadius: 14,
    padding: 18,
    transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s"
  };

  const baseCardHover: React.CSSProperties = {
    ...baseCard,
    borderColor: "#3a3b3e",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
    transform: "translateY(-2px)"
  };

  const baseBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 16px",
    borderRadius: 10,
    border: "1px solid var(--border, #2a2b2e)",
    background: "var(--bg-tertiary, #1c1d20)",
    color: "var(--text-primary, #f0f0f0)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s"
  };

  const primaryBtn: React.CSSProperties = {
    ...baseBtn,
    background: "#22c55e",
    color: "#000",
    border: "none"
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 24,
        padding: isMobile ? "16px 12px" : "24px 0",
        color: "var(--text-primary, #f0f0f0)"
      }}
    >
      {/* KPI Row */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "140px" : "195px"}, 1fr))`,
          gap: 14
        }}
      >
        {[
          {
            label: "Wallet Balance",
            value: formatMoney(adminCurrency, riderWalletAvailableBalance),
            icon: <Wallet size={20} />,
            color: "#22c55e",
            sub: "Available to use"
          },
          {
            label: "Total Earnings",
            value: formatMoney(adminCurrency, riderWalletCredits),
            icon: <TrendingUp size={20} />,
            color: "#38bdf8",
            sub: "All credits received"
          },
          {
            label: "Total Payouts",
            value: formatMoney(adminCurrency, riderWalletDebits),
            icon: <TrendingDown size={20} />,
            color: "#f97316",
            sub: "All debits processed"
          },
          {
            label: "Pending Payouts",
            value: formatMoney(adminCurrency, Math.max(pendingBalance, 0)),
            icon: <ArrowUpDown size={20} />,
            color: "#eab308",
            sub: "Awaiting settlement"
          },
          {
            label: "Locked Balance",
            value: formatMoney(adminCurrency, riderWalletLockedBalance),
            icon: <Lock size={20} />,
            color: "#a78bfa",
            sub: "Held for disputes"
          }
        ].map((kpi) => (
          <article
            key={kpi.label}
            style={{
              ...baseCard,
              display: "flex",
              alignItems: "center",
              gap: 14
            }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, baseCardHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, baseCard)}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: `${kpi.color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: kpi.color,
                flexShrink: 0
              }}
            >
              {kpi.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginTop: 2 }}>{kpi.value}</div>
              <div style={{ fontSize: 11, opacity: 0.45, marginTop: 2 }}>{kpi.sub}</div>
            </div>
          </article>
        ))}
      </section>

      {/* 3-Column Layout */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr",
          gap: 16
        }}
      >
        {/* Wallet Actions Panel */}
        <div style={baseCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <CreditCard size={18} style={{ color: "#38bdf8" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Wallet Actions</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Cash Out", icon: <Banknote size={16} />, color: "#22c55e", msg: "Cash out flow initiated" },
              { label: "Add Money", icon: <Coins size={16} />, color: "#38bdf8", msg: "Add money flow opened" },
              { label: "Transaction History", icon: <History size={16} />, color: "#a78bfa", msg: "Transaction history exported" },
              { label: "Earnings Summary", icon: <BarChart3 size={16} />, color: "#f97316", msg: "Earnings summary generated" }
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => addToast(action.msg, "info")}
                style={{
                  ...baseBtn,
                  width: "100%",
                  justifyContent: "flex-start"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.boxShadow = `0 0 12px ${action.color}22`;
                  e.currentTarget.style.transform = "translateX(3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border, #2a2b2e)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <span style={{ color: action.color }}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Balance Breakdown Donut */}
        <div style={baseCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <BarChart3 size={18} style={{ color: "#eab308" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Balance Breakdown</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <svg width="120" height="120" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15.915"
                fill="none"
                stroke="var(--border, #2a2b2e)"
                strokeWidth="3"
              />
              <circle
                cx="18" cy="18" r="15.915"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeDasharray={`${availablePct} ${100 - availablePct}`}
                strokeDashoffset="25"
                strokeLinecap="round"
              />
              <circle
                cx="18" cy="18" r="15.915"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="3"
                strokeDasharray={`${lockedPct} ${100 - lockedPct}`}
                strokeDashoffset={25 - availablePct}
                strokeLinecap="round"
              />
              <circle
                cx="18" cy="18" r="15.915"
                fill="none"
                stroke="#eab308"
                strokeWidth="3"
                strokeDasharray={`${pendingPct} ${100 - pendingPct}`}
                strokeDashoffset={25 - availablePct - lockedPct}
                strokeLinecap="round"
              />
              <text x="18" y="17.5" textAnchor="middle" fill="var(--text-primary, #f0f0f0)" fontSize="5" fontWeight="700">
                {formatMoney(adminCurrency, riderWalletMovementTotal)}
              </text>
              <text x="18" y="22" textAnchor="middle" fill="var(--text-primary, #f0f0f0)" fontSize="2.8" opacity="0.5">
                Total Movement
              </text>
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Available", pct: availablePct, color: "#22c55e" },
                { label: "Locked", pct: lockedPct, color: "#a78bfa" },
                { label: "Pending", pct: pendingPct, color: "#eab308" }
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, opacity: 0.7, minWidth: 60 }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{item.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bonus & Incentives Panel */}
        <div style={baseCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <BadgePercent size={18} style={{ color: "#22c55e" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Bonus & Incentives</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                background: "#22c55e12",
                border: "1px solid #22c55e30",
                borderRadius: 10,
                padding: 14,
                display: "flex",
                alignItems: "center",
                gap: 12
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#22c55e20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Gift size={18} style={{ color: "#22c55e" }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Active Bonuses</div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>Review active incentive programs</div>
              </div>
            </div>
            <button
              onClick={() => addToast("Viewing all bonuses", "info")}
              style={{
                ...baseBtn,
                width: "100%",
                justifyContent: "center",
                background: "#22c55e18",
                borderColor: "#22c55e40",
                color: "#22c55e"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#22c55e30";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#22c55e18";
                e.currentTarget.style.transform = "none";
              }}
            >
              <Eye size={14} />
              View All Bonuses
            </button>
            <button
              onClick={() => addToast("Viewing all transactions", "info")}
              style={{
                ...baseBtn,
                width: "100%",
                justifyContent: "center"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#38bdf8";
                e.currentTarget.style.boxShadow = "0 0 12px #38bdf822";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border, #2a2b2e)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <History size={14} />
              View All Transactions
            </button>
          </div>
        </div>
      </section>

      {/* Transaction History Table */}
      <div style={baseCard}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <History size={18} style={{ color: "#38bdf8" }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Transaction History</span>
            <span style={{ fontSize: 11, opacity: 0.4, marginLeft: 4 }}>
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "var(--bg-tertiary, #1c1d20)",
              border: "1px solid var(--border, #2a2b2e)",
              borderRadius: 8,
              padding: "7px 12px",
              flex: "1 1 220px",
              minWidth: 0
            }}
          >
            <Search size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name, reference, type..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary, #f0f0f0)",
                fontSize: 13,
                width: "100%",
                minWidth: 0
              }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              background: "var(--bg-tertiary, #1c1d20)",
              border: "1px solid var(--border, #2a2b2e)",
              borderRadius: 8,
              padding: "7px 12px",
              color: "var(--text-primary, #f0f0f0)",
              fontSize: 13,
              cursor: "pointer",
              minWidth: 120
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              background: "var(--bg-tertiary, #1c1d20)",
              border: "1px solid var(--border, #2a2b2e)",
              borderRadius: 8,
              padding: "7px 12px",
              color: "var(--text-primary, #f0f0f0)",
              fontSize: 13,
              cursor: "pointer",
              minWidth: 120
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

        {/* Table */}
        {filteredTransactions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 16px",
              opacity: 0.4,
              fontSize: 13
            }}
          >
            No transactions match the current filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Rider", "Type", "Direction", "Amount", "Status", "Reference", "Date"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        borderBottom: "1px solid var(--border, #2a2b2e)",
                        fontSize: 11,
                        fontWeight: 700,
                        opacity: 0.5,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        whiteSpace: "nowrap"
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((t) => {
                  const amt = Math.abs(parseNumber(t.amount));
                  const isCredit = parseNumber(t.amount) >= 0;
                  return (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: "1px solid var(--border, #2a2b2e)",
                        transition: "background 0.1s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--bg-tertiary, #1c1d20)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 600 }}>{t.wallet.user.fullName}</div>
                        <div style={{ fontSize: 11, opacity: 0.4 }}>
                          {t.wallet.user.riderProfile?.displayCode ?? "N/A"}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: 12 }}>{formatEnumLabel(t.type)}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: isCredit ? "#22c55e18" : "#f9731618",
                            color: isCredit ? "#22c55e" : "#f97316"
                          }}
                        >
                          {isCredit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {t.direction}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                        {formatMoney(t.currency, amt)}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background:
                              statusTone(t.status) === "success"
                                ? "#22c55e18"
                                : statusTone(t.status) === "warning"
                                ? "#eab30818"
                                : statusTone(t.status) === "danger"
                                ? "#ef444418"
                                : "#6b728018",
                            color:
                              statusTone(t.status) === "success"
                                ? "#22c55e"
                                : statusTone(t.status) === "warning"
                                ? "#eab308"
                                : statusTone(t.status) === "danger"
                                ? "#ef4444"
                                : "#9ca3af",
                            textTransform: "capitalize"
                          }}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <code style={{ fontSize: 11, opacity: 0.5 }}>
                          {t.reference?.slice(-12) ?? "N/A"}
                        </code>
                      </td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 12, opacity: 0.6 }}>
                          {formatDateTime(t.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredTransactions.length > PER_PAGE && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid var(--border, #2a2b2e)"
            }}
          >
            <span style={{ fontSize: 12, opacity: 0.4 }}>
              Page {currentPage} of {totalPages}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  ...baseBtn,
                  padding: "6px 10px",
                  opacity: currentPage <= 1 ? 0.35 : 1,
                  cursor: currentPage <= 1 ? "not-allowed" : "pointer"
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  ...baseBtn,
                  padding: "6px 10px",
                  opacity: currentPage >= totalPages ? 0.35 : 1,
                  cursor: currentPage >= totalPages ? "not-allowed" : "pointer"
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
