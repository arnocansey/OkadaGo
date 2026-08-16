"use client";

import { useState, useMemo, useCallback } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPagination } from "./ui/AdminPagination";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { payoutActionsForStatus, canPayoutAction, readPayoutProviderMeta, type PayoutReviewAction } from "./payoutActions";
import type { PayoutRequestRecord } from "./types";
import { formatDateTime } from "./utils";
import {
  Search,
  Download,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Banknote,
  ArrowRight,
  ChevronDown,
  Eye,
  RefreshCw,
  Wallet,
  User,
  Phone
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type RiderPayoutDashboardScreenProps = {
  payoutRequests: PayoutRequestRecord[];
  payoutRequestsTotal: number;
  payoutStatusFilter: string;
  onPayoutStatusChange: (status: string) => void;
  payoutPage: number;
  payoutTotal: number;
  listPageSize: number;
  onPayoutPageChange: (page: number) => void;
  pendingPayoutValue: number;
  payoutOutflow: number;
  totalRiderPayoutValue: number;
  failedRiderPayouts: PayoutRequestRecord[];
  onPayoutAction: (payoutRequestId: string, action: PayoutReviewAction, rejectionReason?: string) => void;
  onServerExport: (entity: "payout-requests") => void;
  isMutating?: boolean;
  adminCurrency: string;
  dataLoading?: boolean;
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "REQUESTED", label: "Requested" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "APPROVED", label: "Approved" },
  { value: "PROCESSING", label: "Processing" },
  { value: "PAID", label: "Paid" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" }
];

const STATUS_TONE: Record<string, string> = {
  REQUESTED: "warning",
  REVIEWING: "info",
  APPROVED: "success",
  PROCESSING: "processing",
  PAID: "paid",
  REJECTED: "rejected",
  CANCELLED: "cancelled"
};

const ACTION_LABELS: Record<PayoutReviewAction, string> = {
  mark_reviewing: "Review",
  approve: "Approve",
  mark_processing: "Disburse",
  mark_paid: "Mark Paid",
  reject: "Reject",
  cancel: "Cancel"
};

const ACTION_ICONS: Record<PayoutReviewAction, typeof Clock> = {
  mark_reviewing: Eye,
  approve: CheckCircle2,
  mark_processing: ArrowRight,
  mark_paid: Banknote,
  reject: XCircle,
  cancel: XCircle
};

function countByStatus(requests: PayoutRequestRecord[], statuses: string[]) {
  return requests.filter((r) => statuses.includes(r.status.toUpperCase())).length;
}

function sumByStatus(requests: PayoutRequestRecord[], statuses: string[], currency: string) {
  const total = requests
    .filter((r) => statuses.includes(r.status.toUpperCase()))
    .reduce((sum, r) => sum + (typeof r.amount === "number" ? r.amount : parseFloat(String(r.amount)) || 0), 0);
  return formatMoney(currency, total);
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function RiderPayoutDashboardScreen({
  payoutRequests,
  payoutRequestsTotal,
  payoutStatusFilter,
  onPayoutStatusChange,
  payoutPage,
  payoutTotal,
  listPageSize,
  onPayoutPageChange,
  pendingPayoutValue,
  payoutOutflow,
  totalRiderPayoutValue,
  failedRiderPayouts,
  onPayoutAction,
  onServerExport,
  isMutating = false,
  adminCurrency,
  dataLoading = false
}: RiderPayoutDashboardScreenProps) {
  const [search, setSearch] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return payoutRequests;
    const q = search.toLowerCase();
    return payoutRequests.filter(
      (p) =>
        p.rider?.user?.fullName?.toLowerCase().includes(q) ||
        p.rider?.displayCode?.toLowerCase().includes(q) ||
        p.destinationLabel?.toLowerCase().includes(q) ||
        p.method?.toLowerCase().includes(q) ||
        String(p.amount).includes(q)
    );
  }, [payoutRequests, search]);

  const openReject = useCallback((id: string) => {
    setRejectingId(id);
    setRejectReason("");
  }, []);

  const confirmReject = useCallback(() => {
    if (rejectingId && rejectReason.trim().length >= 3) {
      onPayoutAction(rejectingId, "reject", rejectReason.trim());
      setRejectingId(null);
      setRejectReason("");
    }
  }, [rejectingId, rejectReason, onPayoutAction]);

  const handleAction = useCallback(
    (id: string, action: PayoutReviewAction) => {
      if (action === "reject") {
        openReject(id);
      } else {
        onPayoutAction(id, action);
      }
    },
    [onPayoutAction, openReject]
  );

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={4} rows={6} cols={7} />;
  }

  return (
    <div className="rpd-mgmt">
      <AdminPageHeader
        title="Rider Payouts"
        subtitle="Review, process, and track rider payout requests."
        actions={
          <button type="button" className="rpd-btn rpd-btn--outline" onClick={() => onServerExport("payout-requests")}>
            <Download size={13} /> Export CSV
          </button>
        }
      />

      {/* ── KPI Cards ── */}
      <section className="rpd-kpis">
        <article className="rpd-kpi rpd-kpi--pending">
          <div className="rpd-kpi-icon"><Clock size={18} /></div>
          <div className="rpd-kpi-body">
            <span className="rpd-kpi-label">Pending Payouts</span>
            <strong className="rpd-kpi-value">{payoutRequestsTotal > 0 ? countByStatus(payoutRequests, ["REQUESTED", "REVIEWING", "APPROVED", "PROCESSING"]) : 0}</strong>
            <small>{formatMoney(adminCurrency, pendingPayoutValue)} value</small>
          </div>
        </article>
        <article className="rpd-kpi rpd-kpi--completed">
          <div className="rpd-kpi-icon"><CheckCircle2 size={18} /></div>
          <div className="rpd-kpi-body">
            <span className="rpd-kpi-label">Completed Payouts</span>
            <strong className="rpd-kpi-value">{payoutRequestsTotal > 0 ? countByStatus(payoutRequests, ["PAID"]) : 0}</strong>
            <small>{formatMoney(adminCurrency, payoutOutflow)} disbursed</small>
          </div>
        </article>
        <article className="rpd-kpi rpd-kpi--failed">
          <div className="rpd-kpi-icon"><AlertTriangle size={18} /></div>
          <div className="rpd-kpi-body">
            <span className="rpd-kpi-label">Failed / Rejected</span>
            <strong className="rpd-kpi-value">{failedRiderPayouts.length}</strong>
            <small>{failedRiderPayouts.filter((r) => r.status.toUpperCase() === "REJECTED").length} rejected · {failedRiderPayouts.filter((r) => r.status.toUpperCase() === "CANCELLED").length} cancelled</small>
          </div>
        </article>
        <article className="rpd-kpi rpd-kpi--total">
          <div className="rpd-kpi-icon"><Wallet size={18} /></div>
          <div className="rpd-kpi-body">
            <span className="rpd-kpi-label">Total Payout Value</span>
            <strong className="rpd-kpi-value">{formatMoney(adminCurrency, totalRiderPayoutValue)}</strong>
            <small>{payoutRequestsTotal} requests all time</small>
          </div>
        </article>
      </section>

      {/* ── Search & Filters ── */}
      <div className="rpd-toolbar">
        <div className="rpd-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search rider, phone, amount…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="rpd-filter-group">
          <Filter size={13} />
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`rpd-filter-chip${payoutStatusFilter === opt.value ? " active" : ""}`}
              onClick={() => onPayoutStatusChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rpd-table-wrap">
        {filtered.length === 0 ? (
          <div className="rpd-empty"><EmptyCard title="No payout requests" body="Payout requests from riders will appear here." /></div>
        ) : (
          <table className="rpd-table">
            <thead>
              <tr>
                <th>Rider</th>
                <th>Amount</th>
                <th>Mobile Money Account</th>
                <th>Method</th>
                <th>Period</th>
                <th>Status</th>
                <th>Payout Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payout) => {
                const actions = payoutActionsForStatus(payout.status);
                const providerMeta = readPayoutProviderMeta(payout.metadata);
                const isTerminal = ["PAID", "REJECTED", "CANCELLED"].includes(payout.status.toUpperCase());

                return (
                  <tr key={payout.id} className={`rpd-row${isTerminal ? " rpd-row--terminal" : ""}`}>
                    <td>
                      <div className="rpd-rider">
                        <span className="rpd-rider-name">{payout.rider?.user?.fullName ?? "—"}</span>
                        <span className="rpd-rider-code">{payout.rider?.displayCode ?? ""}</span>
                      </div>
                    </td>
                    <td>
                      <span className="rpd-amount">{formatMoney(payout.currency || adminCurrency, typeof payout.amount === "number" ? payout.amount : parseFloat(String(payout.amount)) || 0)}</span>
                    </td>
                    <td>
                      <div className="rpd-account">
                        <Phone size={12} />
                        <span>{payout.destinationLabel ?? "—"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="rpd-method">{payout.method?.replace(/_/g, " ") ?? "—"}</span>
                    </td>
                    <td>
                      <span className="rpd-period">{formatDateTime(payout.requestedAt)}</span>
                    </td>
                    <td>
                      <span className={`rpd-status rpd-status--${STATUS_TONE[payout.status.toUpperCase()] ?? "default"}`}>
                        {payout.status}
                      </span>
                      {providerMeta?.transferStatus && (
                        <span className="rpd-provider-status">{providerMeta.transferStatus}</span>
                      )}
                    </td>
                    <td>
                      <span className="rpd-date">
                        {payout.paidAt ? formatDateTime(payout.paidAt) : payout.paidAt ?? "—"}
                      </span>
                    </td>
                    <td>
                      {!isTerminal && actions.length > 0 ? (
                        <div className="rpd-actions">
                          {actions.map((action) => {
                            const Icon = ACTION_ICONS[action];
                            const isReject = action === "reject";
                            return (
                              <button
                                key={action}
                                type="button"
                                className={`rpd-action-btn rpd-action-btn--${isReject ? "reject" : "primary"}`}
                                onClick={() => handleAction(payout.id, action)}
                                disabled={isMutating}
                              >
                                <Icon size={12} /> {ACTION_LABELS[action]}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="rpd-no-action">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      <AdminPagination
        page={payoutPage}
        totalItems={payoutTotal}
        pageSize={listPageSize}
        onPageChange={onPayoutPageChange}
      />

      {/* ── Reject Modal ── */}
      {rejectingId && (
        <div className="rpd-modal-backdrop" onClick={() => setRejectingId(null)}>
          <div className="rpd-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Payout</h3>
            <p className="rpd-modal-desc">Provide a reason for rejecting this payout request. Minimum 3 characters.</p>
            <textarea
              className="rpd-modal-input"
              rows={4}
              placeholder="Rejection reason…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              autoFocus
            />
            <div className="rpd-modal-actions">
              <button type="button" className="rpd-btn rpd-btn--ghost" onClick={() => setRejectingId(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="rpd-btn rpd-btn--danger"
                disabled={rejectReason.trim().length < 3 || isMutating}
                onClick={confirmReject}
              >
                <XCircle size={13} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
