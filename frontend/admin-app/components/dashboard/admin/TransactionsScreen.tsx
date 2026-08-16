"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Filter, Search, X, CreditCard, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { parseNumber, formatDateTime } from "./utils";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { WalletTransactionRecord, RideRecord, DeliveryRecord } from "./types";

export type TransactionsScreenProps = {
  walletTransactions: WalletTransactionRecord[];
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  adminCurrency: string;
  dataLoading?: boolean;
};

type TypeFilter = "all" | "credit" | "debit" | "refund";
type StatusFilter = "all" | "POSTED" | "COMPLETED" | "PENDING" | "REVERSED";

function directionBadge(direction: string) {
  const d = direction.toLowerCase();
  if (d === "credit") return "txn-badge txn-badge--credit";
  if (d === "debit") return "txn-badge txn-badge--debit";
  return "txn-badge txn-badge--refund";
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "posted" || s === "completed") return "txn-badge txn-badge--success";
  if (s === "pending" || s === "processing") return "txn-badge txn-badge--warning";
  if (s === "reversed" || s === "failed") return "txn-badge txn-badge--danger";
  return "txn-badge txn-badge--neutral";
}

export function TransactionsScreen({
  walletTransactions,
  rides,
  deliveries,
  adminCurrency,
  dataLoading = false,
}: TransactionsScreenProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    let list = walletTransactions;

    if (typeFilter !== "all") {
      list = list.filter((tx) => {
        const dir = tx.direction.toLowerCase();
        if (typeFilter === "credit") return dir === "credit";
        if (typeFilter === "debit") return dir === "debit";
        if (typeFilter === "refund") return dir === "refund" || tx.type.toLowerCase().includes("refund");
        return true;
      });
    }

    if (statusFilter !== "all") {
      list = list.filter((tx) => tx.status.toUpperCase() === statusFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((tx) => {
        const hay = [
          tx.description ?? "",
          tx.reference ?? "",
          tx.wallet.user.fullName,
          tx.type,
          tx.direction,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return list;
  }, [walletTransactions, typeFilter, statusFilter, search]);

  const totalVolume = useMemo(
    () => walletTransactions.reduce((sum, tx) => sum + Math.abs(parseNumber(tx.amount)), 0),
    [walletTransactions]
  );

  const completedCount = useMemo(
    () =>
      walletTransactions.filter(
        (tx) => tx.status.toUpperCase() === "POSTED" || tx.status.toUpperCase() === "COMPLETED"
      ).length,
    [walletTransactions]
  );

  const pendingCount = useMemo(
    () => walletTransactions.filter((tx) => tx.status.toUpperCase() === "PENDING").length,
    [walletTransactions]
  );

  if (dataLoading) {
    return (
      <div className="exact-admin-screen">
        <div className="txn-loading-skeleton">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="txn-skeleton-kpi" />
          ))}
          <div className="txn-skeleton-table" />
        </div>
      </div>
    );
  }

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Transactions"
        subtitle="All wallet transactions and payment history"
      />

      {/* KPI Row */}
      <section className="admin-kpi-grid">
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><ArrowUpDown size={18} /></div>
          <div>
            <span>Total Transactions</span>
            <strong>{walletTransactions.length}</strong>
            <small>All wallet movements</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><CreditCard size={18} /></div>
          <div>
            <span>Total Volume</span>
            <strong>{formatMoney(adminCurrency, totalVolume)}</strong>
            <small>Gross amount processed</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon green"><ArrowUpRight size={18} /></div>
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
            <small>Posted / Completed</small>
          </div>
        </article>
        <article className="admin-reference-kpi">
          <div className="admin-reference-kpi-icon yellow"><RefreshCw size={18} /></div>
          <div>
            <span>Pending</span>
            <strong>{pendingCount}</strong>
            <small>Awaiting confirmation</small>
          </div>
        </article>
      </section>

      {/* Filters */}
      <article className="admin-reference-card" style={{ marginTop: 12 }}>
        <div className="admin-reference-cardhead">
          <div>
            <h3>All Transactions</h3>
            <p>{filtered.length} result{filtered.length === 1 ? "" : "s"}</p>
          </div>
          <div className="txn-filters">
            <label className="admin-filter-search txn-search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description or reference…"
              />
              {search && (
                <button type="button" className="txn-search-clear" onClick={() => setSearch("")}>
                  <X size={12} />
                </button>
              )}
            </label>
            <div className="txn-chip-group">
              <Filter size={14} style={{ color: "var(--text-secondary)" }} />
              {(["all", "credit", "debit", "refund"] as TypeFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`txn-chip ${typeFilter === f ? "txn-chip--active" : ""}`}
                  onClick={() => setTypeFilter(f)}
                >
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="txn-chip-group">
              {(["all", "POSTED", "COMPLETED", "PENDING", "REVERSED"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`txn-chip ${statusFilter === f ? "txn-chip--active" : ""}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f === "all" ? "All Status" : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="txn-empty">
            <ArrowUpDown size={32} strokeWidth={1.2} />
            <strong>No transactions found</strong>
            <p>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <small>{formatDateTime(tx.createdAt)}</small>
                    </td>
                    <td>
                      <em className={directionBadge(tx.direction)}>
                        {tx.direction.toLowerCase() === "credit" ? (
                          <ArrowUpRight size={10} />
                        ) : tx.direction.toLowerCase() === "debit" ? (
                          <ArrowDownRight size={10} />
                        ) : (
                          <RefreshCw size={10} />
                        )}
                        {tx.direction}
                      </em>
                    </td>
                    <td>
                      <span className="txn-desc">{tx.description ?? tx.type}</span>
                    </td>
                    <td>
                      <strong>{formatMoney(tx.currency, Math.abs(parseNumber(tx.amount)))}</strong>
                    </td>
                    <td>
                      <em className={statusBadge(tx.status)}>{tx.status}</em>
                    </td>
                    <td>
                      <code className="txn-ref">{tx.reference?.slice(-12) ?? "—"}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <style>{`
        .txn-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .txn-search {
          position: relative;
          flex: 1 1 220px;
        }
        .txn-search input {
          width: 100%;
          background: #1a2035;
          border: 1px solid #2a3550;
          border-radius: 6px;
          color: #e2e8f0;
          padding: 7px 10px 7px 32px;
          font-size: 0.75rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .txn-search input:focus {
          border-color: #ff6b00;
        }
        .txn-search input::placeholder {
          color: #64748b;
        }
        .txn-search svg {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
        }
        .txn-search-clear {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .txn-search-clear:hover {
          color: #ef4444;
        }
        .txn-chip-group {
          display: flex;
          gap: 4px;
          align-items: center;
          flex-wrap: wrap;
        }
        .txn-chip {
          background: #1a2035;
          border: 1px solid #2a3550;
          border-radius: 999px;
          color: #94a3b8;
          font-size: 0.65rem;
          padding: 4px 10px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .txn-chip:hover {
          border-color: #ff6b00;
          color: #e2e8f0;
        }
        .txn-chip--active {
          background: rgba(255, 107, 0, 0.15);
          border-color: #ff6b00;
          color: #ff6b00;
        }
        .txn-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 0.6rem;
          font-style: normal;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }
        .txn-badge--credit {
          background: rgba(34, 197, 94, 0.12);
          color: #22c55e;
        }
        .txn-badge--debit {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }
        .txn-badge--refund {
          background: rgba(250, 204, 21, 0.12);
          color: #facc15;
        }
        .txn-badge--success {
          background: rgba(34, 197, 94, 0.12);
          color: #22c55e;
        }
        .txn-badge--warning {
          background: rgba(250, 204, 21, 0.12);
          color: #facc15;
        }
        .txn-badge--danger {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }
        .txn-badge--neutral {
          background: rgba(148, 163, 184, 0.12);
          color: #94a3b8;
        }
        .txn-desc {
          color: #cbd5e1;
          font-size: 0.72rem;
        }
        .txn-ref {
          font-size: 0.65rem;
          color: #64748b;
          background: none;
        }
        .txn-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 48px 16px;
          color: #64748b;
          text-align: center;
        }
        .txn-empty strong {
          color: #94a3b8;
          font-size: 0.85rem;
        }
        .txn-empty p {
          font-size: 0.75rem;
          margin: 0;
        }
        .txn-loading-skeleton {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
        }
        .txn-skeleton-kpi {
          height: 80px;
          background: linear-gradient(90deg, #111827 25%, #1a2035 50%, #111827 75%);
          background-size: 200% 100%;
          animation: txn-shimmer 1.5s infinite;
          border-radius: 8px;
        }
        .txn-skeleton-table {
          height: 320px;
          background: linear-gradient(90deg, #111827 25%, #1a2035 50%, #111827 75%);
          background-size: 200% 100%;
          animation: txn-shimmer 1.5s infinite;
          border-radius: 8px;
        }
        @keyframes txn-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .admin-table td {
          font-size: 0.72rem;
        }
        .admin-table th {
          font-size: 0.72rem;
        }
      `}</style>
    </div>
  );
}
