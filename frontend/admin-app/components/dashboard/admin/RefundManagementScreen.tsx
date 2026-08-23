"use client";

import { useState, useMemo, useCallback } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type { WalletTransactionRecord, RideRecord, DeliveryRecord } from "./types";
import { parseNumber, formatDateTime } from "./utils";
import {
  Search,
  Download,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Banknote,
  TrendingDown,
  User,
  Bike,
  Package,
  CreditCard,
  Calendar,
  ChevronRight,
  Eye,
  RefreshCw,
  Check,
  Ban,
  Percent
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type RefundManagementScreenProps = {
  walletTransactions: WalletTransactionRecord[];
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  adminCurrency: string;
  dataLoading?: boolean;
  onServerExport?: (entity: "wallet-transactions") => void;
  onRefundAction?: (transactionId: string, action: "approve" | "reject" | "partial", amount?: number, reason?: string) => void;
};

type RefundStatus = "pending" | "approved" | "rejected" | "processed";

type RefundRow = {
  id: string;
  rideId: string | null;
  rideStatus: string | null;
  deliveryId: string | null;
  deliveryStatus: string | null;
  passengerName: string;
  passengerPhone: string;
  amount: number;
  currency: string;
  reason: string;
  paymentMethod: string;
  status: RefundStatus;
  createdAt: string;
  walletTx: WalletTransactionRecord;
  ride: RideRecord | null;
  delivery: DeliveryRecord | null;
};

type DetailTab = "history" | "details";

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: "", label: "All Statuses" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "processed", label: "Processed" }
];

const STATUS_TONE: Record<RefundStatus, string> = {
  pending: "warning",
  approved: "success",
  rejected: "rejected",
  processed: "paid"
};

/* ── Map wallet tx to refund row ── */

function walletTxToRefundRow(
  tx: WalletTransactionRecord,
  rides: RideRecord[],
  deliveries: DeliveryRecord[]
): RefundRow {
  const ride = rides.find((r) => r.id === tx.ride?.id) ?? null;
  const delivery = deliveries.find((d) => tx.reference?.includes(d.id) || tx.description?.includes(d.id)) ?? null;
  const desc = tx.description?.toLowerCase() ?? "";
  const isPartial = desc.includes("partial");
  const isRejected = desc.includes("rejected");
  const isProcessed = tx.status?.toUpperCase() === "POSTED" || tx.status?.toUpperCase() === "COMPLETED";

  let status: RefundStatus = "pending";
  if (isRejected || tx.status?.toUpperCase() === "REVERSED") status = "rejected";
  else if (isProcessed || tx.status?.toUpperCase() === "POSTED") status = "approved";
  else if (tx.status?.toUpperCase() === "COMPLETED") status = "processed";

  return {
    id: tx.id,
    rideId: tx.ride?.id ?? ride?.id ?? null,
    rideStatus: tx.ride?.status ?? ride?.status ?? null,
    deliveryId: delivery?.id ?? null,
    deliveryStatus: delivery?.status ?? null,
    passengerName: tx.wallet?.user?.fullName ?? "—",
    passengerPhone: tx.wallet?.user?.phoneE164 ?? "—",
    amount: parseNumber(tx.amount),
    currency: tx.currency || "GHS",
    reason: tx.description ?? tx.reference ?? "Refund requested",
    paymentMethod: tx.payment?.method?.replace(/_/g, " ") ?? "Wallet",
    status,
    createdAt: tx.createdAt,
    walletTx: tx,
    ride,
    delivery
  };
}

/* ── Modal: Partial Refund ── */

function PartialRefundModal({
  maxAmount,
  currency,
  onConfirm,
  onClose
}: {
  maxAmount: number;
  currency: string;
  onConfirm: (amount: number, reason: string) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState<string>(String(maxAmount));
  const [reason, setReason] = useState("");
  const parsed = parseFloat(amount) || 0;
  const valid = parsed > 0 && parsed <= maxAmount && reason.trim().length >= 3;

  return (
    <div className="rfm-modal-backdrop" onClick={onClose}>
      <div className="rfm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Partial Refund</h3>
        <p className="rfm-modal-desc">Issue a partial refund of up to {formatMoney(currency, maxAmount)}.</p>
        <label className="rfm-modal-label">Refund Amount</label>
        <input
          className="rfm-modal-input"
          type="number"
          step="0.01"
          min="0.01"
          max={maxAmount}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
        {parsed > maxAmount && <span className="rfm-modal-error">Amount exceeds maximum</span>}
        <label className="rfm-modal-label" style={{ marginTop: 12 }}>Reason</label>
        <textarea
          className="rfm-modal-textarea"
          rows={3}
          placeholder="Reason for partial refund…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="rfm-modal-actions">
          <button type="button" className="rfm-btn rfm-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="rfm-btn rfm-btn--primary"
            disabled={!valid}
            onClick={() => onConfirm(parsed, reason.trim())}
          >
            <Percent size={13} /> Process Partial Refund
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function RefundManagementScreen({
  walletTransactions,
  rides,
  deliveries,
  adminCurrency,
  dataLoading = false,
  onServerExport,
  onRefundAction
}: RefundManagementScreenProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRefund, setSelectedRefund] = useState<RefundRow | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("history");
  const [partialRefundId, setPartialRefundId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const refundRows = useMemo(() => {
    return walletTransactions
      .filter((tx) => tx.type?.toUpperCase() === "REFUND")
      .map((tx) => walletTxToRefundRow(tx, rides, deliveries));
  }, [walletTransactions, rides, deliveries]);

  const filtered = useMemo(() => {
    let rows = refundRows;
    if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.passengerName.toLowerCase().includes(q) ||
          r.passengerPhone.includes(q) ||
          r.rideId?.toLowerCase().includes(q) ||
          r.deliveryId?.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          String(r.amount).includes(q)
      );
    }
    return rows;
  }, [refundRows, statusFilter, search]);

  const kpis = useMemo(() => {
    const total = refundRows.reduce((s, r) => s + r.amount, 0);
    const pending = refundRows.filter((r) => r.status === "pending");
    const approved = refundRows.filter((r) => r.status === "approved" || r.status === "processed");
    const rejected = refundRows.filter((r) => r.status === "rejected");
    return {
      totalRefunds: total,
      pendingCount: pending.length,
      pendingValue: pending.reduce((s, r) => s + r.amount, 0),
      approvedCount: approved.length,
      approvedValue: approved.reduce((s, r) => s + r.amount, 0),
      rejectedCount: rejected.length,
      refundRate: 0
    };
  }, [refundRows]);

  const selectedRideDetail = useMemo(() => {
    if (!selectedRefund?.ride) return null;
    return selectedRefund.ride;
  }, [selectedRefund]);

  const handleConfirmAction = useCallback(() => {
    if (!confirmAction) return;
    if (onRefundAction) onRefundAction(confirmAction.id, confirmAction.action, undefined, confirmAction.action === "reject" ? rejectReason.trim() || undefined : undefined);
    setConfirmAction(null);
    setRejectReason("");
  }, [confirmAction, onRefundAction, rejectReason]);

  const handlePartialConfirm = useCallback(
    (amount: number, reason: string) => {
      if (partialRefundId && onRefundAction) onRefundAction(partialRefundId, "partial", amount, reason);
      setPartialRefundId(null);
    },
    [partialRefundId, onRefundAction]
  );

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={4} rows={6} cols={7} />;
  }

  return (
    <div className="rfm-mgmt">
      <AdminPageHeader
        title="Refund Management"
        subtitle="Review and process passenger refund requests."
        actions={
          onServerExport ? (
            <button type="button" className="rfm-btn rfm-btn--outline" onClick={() => onServerExport("wallet-transactions")}>
              <Download size={13} /> Export CSV
            </button>
          ) : undefined
        }
      />

      {/* ── KPIs ── */}
      <section className="rfm-kpis">
        <article className="rfm-kpi rfm-kpi--total">
          <div className="rfm-kpi-icon"><Banknote size={18} /></div>
          <div className="rfm-kpi-body">
            <span className="rfm-kpi-label">Total Refunds</span>
            <strong className="rfm-kpi-value">{formatMoney(adminCurrency, kpis.totalRefunds)}</strong>
            <small>{refundRows.length} requests</small>
          </div>
        </article>
        <article className="rfm-kpi rfm-kpi--pending">
          <div className="rfm-kpi-icon"><Clock size={18} /></div>
          <div className="rfm-kpi-body">
            <span className="rfm-kpi-label">Pending Review</span>
            <strong className="rfm-kpi-value">{kpis.pendingCount}</strong>
            <small>{formatMoney(adminCurrency, kpis.pendingValue)} value</small>
          </div>
        </article>
        <article className="rfm-kpi rfm-kpi--approved">
          <div className="rfm-kpi-icon"><CheckCircle2 size={18} /></div>
          <div className="rfm-kpi-body">
            <span className="rfm-kpi-label">Approved / Processed</span>
            <strong className="rfm-kpi-value">{kpis.approvedCount}</strong>
            <small>{formatMoney(adminCurrency, kpis.approvedValue)} refunded</small>
          </div>
        </article>
        <article className="rfm-kpi rfm-kpi--rejected">
          <div className="rfm-kpi-icon"><XCircle size={18} /></div>
          <div className="rfm-kpi-body">
            <span className="rfm-kpi-label">Rejected</span>
            <strong className="rfm-kpi-value">{kpis.rejectedCount}</strong>
            <small>{kpis.rejectedCount > 0 ? `${((kpis.rejectedCount / refundRows.length) * 100).toFixed(0)}% rejection rate` : "No rejections"}</small>
          </div>
        </article>
      </section>

      {/* ── Toolbar ── */}
      <div className="rfm-toolbar">
        <div className="rfm-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search passenger, ride ID, amount…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="rfm-filter-group">
          <Filter size={13} />
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.id}
              type="button"
              className={`rfm-filter-chip${statusFilter === sf.id ? " active" : ""}`}
              onClick={() => setStatusFilter(sf.id)}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="rfm-layout">
        {/* ── Table ── */}
        <div className="rfm-table-section">
          <div className="rfm-table-wrap">
            {filtered.length === 0 ? (
              <div className="rfm-empty"><EmptyCard title="No refund requests" body="Refund requests from passengers will appear here." /></div>
            ) : (
              <table className="rfm-table">
                <thead>
                  <tr>
                    <th>Ride / Delivery</th>
                    <th>Passenger</th>
                    <th>Amount</th>
                    <th>Reason</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      className={`rfm-row${selectedRefund?.id === row.id ? " rfm-row--selected" : ""}${row.status !== "pending" ? " rfm-row--terminal" : ""}`}
                      onClick={() => setSelectedRefund(row)}
                    >
                      <td>
                        <div className="rfm-ride-ref">
                          {row.rideId ? (
                            <>
                              <Bike size={12} />
                              <span className="rfm-ride-id">{row.rideId.slice(0, 12)}…</span>
                            </>
                          ) : row.deliveryId ? (
                            <>
                              <Package size={12} />
                              <span className="rfm-ride-id">{row.deliveryId.slice(0, 12)}…</span>
                            </>
                          ) : (
                            <span className="rfm-ride-id">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="rfm-passenger">
                          <span className="rfm-passenger-name">{row.passengerName}</span>
                          <span className="rfm-passenger-phone">{row.passengerPhone}</span>
                        </div>
                      </td>
                      <td>
                        <span className="rfm-amount">{formatMoney(row.currency, row.amount)}</span>
                      </td>
                      <td>
                        <span className="rfm-reason" title={row.reason}>{row.reason.length > 40 ? row.reason.slice(0, 40) + "…" : row.reason}</span>
                      </td>
                      <td>
                        <span className="rfm-method">{row.paymentMethod}</span>
                      </td>
                      <td>
                        <span className={`rfm-status rfm-status--${STATUS_TONE[row.status]}`}>{row.status}</span>
                      </td>
                      <td>
                        <span className="rfm-date">{formatDateTime(row.createdAt)}</span>
                      </td>
                      <td>
                        {row.status === "pending" ? (
                          <div className="rfm-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="rfm-action-btn rfm-action-btn--approve"
                              onClick={() => setConfirmAction({ id: row.id, action: "approve" })}
                              title="Approve full refund"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              type="button"
                              className="rfm-action-btn rfm-action-btn--partial"
                              onClick={() => setPartialRefundId(row.id)}
                              title="Partial refund"
                            >
                              <Percent size={12} />
                            </button>
                            <button
                              type="button"
                              className="rfm-action-btn rfm-action-btn--reject"
                              onClick={() => setConfirmAction({ id: row.id, action: "reject" })}
                              title="Reject refund"
                            >
                              <Ban size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="rfm-no-action">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Detail Panel ── */}
        {selectedRefund && (
          <div className="rfm-detail-panel">
            <div className="rfm-detail-header">
              <h3>Trip History</h3>
              <button type="button" className="rfm-detail-close" onClick={() => setSelectedRefund(null)}>
                <XCircle size={16} />
              </button>
            </div>

            {/* ── Refund Summary Card ── */}
            <div className="rfm-detail-card">
              <div className="rfm-detail-card-row">
                <span className="rfm-detail-label">Refund ID</span>
                <span className="rfm-detail-value rfm-mono">{selectedRefund.id.slice(0, 16)}…</span>
              </div>
              <div className="rfm-detail-card-row">
                <span className="rfm-detail-label">Amount</span>
                <span className="rfm-detail-value rfm-detail-value--amount">{formatMoney(selectedRefund.currency, selectedRefund.amount)}</span>
              </div>
              <div className="rfm-detail-card-row">
                <span className="rfm-detail-label">Passenger</span>
                <span className="rfm-detail-value">{selectedRefund.passengerName}</span>
              </div>
              <div className="rfm-detail-card-row">
                <span className="rfm-detail-label">Phone</span>
                <span className="rfm-detail-value rfm-mono">{selectedRefund.passengerPhone}</span>
              </div>
              <div className="rfm-detail-card-row">
                <span className="rfm-detail-label">Reason</span>
                <span className="rfm-detail-value">{selectedRefund.reason}</span>
              </div>
              <div className="rfm-detail-card-row">
                <span className="rfm-detail-label">Payment</span>
                <span className="rfm-detail-value">{selectedRefund.paymentMethod}</span>
              </div>
              <div className="rfm-detail-card-row">
                <span className="rfm-detail-label">Status</span>
                <span className={`rfm-status rfm-status--${STATUS_TONE[selectedRefund.status]}`}>{selectedRefund.status}</span>
              </div>
              <div className="rfm-detail-card-row">
                <span className="rfm-detail-label">Requested</span>
                <span className="rfm-detail-value">{formatDateTime(selectedRefund.createdAt)}</span>
              </div>
            </div>

            {/* ── Trip Details ── */}
            {selectedRideDetail && (
              <div className="rfm-detail-card">
                <h4><Bike size={14} /> Ride Details</h4>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Ride ID</span>
                  <span className="rfm-detail-value rfm-mono">{selectedRideDetail.id.slice(0, 16)}…</span>
                </div>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Status</span>
                  <span className="rfm-detail-value">{selectedRideDetail.status}</span>
                </div>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Pickup</span>
                  <span className="rfm-detail-value">{selectedRideDetail.pickupAddress}</span>
                </div>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Destination</span>
                  <span className="rfm-detail-value">{selectedRideDetail.destinationAddress}</span>
                </div>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Distance</span>
                  <span className="rfm-detail-value">{selectedRideDetail.actualDistanceKm ?? selectedRideDetail.estimatedDistanceKm ?? "—"} km</span>
                </div>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Duration</span>
                  <span className="rfm-detail-value">{selectedRideDetail.actualDurationMinutes ?? selectedRideDetail.estimatedDurationMinutes ?? "—"} min</span>
                </div>
                <div className="rfm-detail-divider" />
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Estimated Fare</span>
                  <span className="rfm-detail-value">{formatMoney(selectedRideDetail.currency, parseNumber(selectedRideDetail.estimatedFare))}</span>
                </div>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Final Fare</span>
                  <span className="rfm-detail-value">{formatMoney(selectedRideDetail.currency, parseNumber(selectedRideDetail.finalFare))}</span>
                </div>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Rider Earnings</span>
                  <span className="rfm-detail-value">{formatMoney(selectedRideDetail.currency, parseNumber(selectedRideDetail.riderEarnings))}</span>
                </div>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Payment Method</span>
                  <span className="rfm-detail-value">{selectedRideDetail.paymentMethod?.replace(/_/g, " ") ?? "—"}</span>
                </div>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Rider</span>
                  <span className="rfm-detail-value">{selectedRideDetail.rider?.user?.fullName ?? "—"}</span>
                </div>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Vehicle</span>
                  <span className="rfm-detail-value">{selectedRideDetail.rider?.vehicle ? `${selectedRideDetail.rider.vehicle.make} ${selectedRideDetail.rider.vehicle.model} (${selectedRideDetail.rider.vehicle.plateNumber})` : "—"}</span>
                </div>
              </div>
            )}

            {!selectedRideDetail && selectedRefund.deliveryId && (
              <div className="rfm-detail-card">
                <h4><Package size={14} /> Delivery Details</h4>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Delivery ID</span>
                  <span className="rfm-detail-value rfm-mono">{selectedRefund.deliveryId.slice(0, 16)}…</span>
                </div>
                <div className="rfm-detail-card-row">
                  <span className="rfm-detail-label">Status</span>
                  <span className="rfm-detail-value">{selectedRefund.deliveryStatus ?? "—"}</span>
                </div>
              </div>
            )}

            {!selectedRideDetail && !selectedRefund.deliveryId && (
              <div className="rfm-detail-card rfm-detail-card--empty">
                <span>No trip data linked to this refund.</span>
              </div>
            )}

            {/* ── Timeline ── */}
            <div className="rfm-detail-card">
              <h4><Calendar size={14} /> Timeline</h4>
              <div className="rfm-timeline">
                {selectedRefund.walletTx.postedAt && (
                  <div className="rfm-timeline-item">
                    <div className="rfm-timeline-dot rfm-timeline-dot--posted" />
                    <div className="rfm-timeline-content">
                      <span className="rfm-timeline-label">Transaction Posted</span>
                      <span className="rfm-timeline-date">{formatDateTime(selectedRefund.walletTx.postedAt)}</span>
                    </div>
                  </div>
                )}
                <div className="rfm-timeline-item">
                  <div className="rfm-timeline-dot rfm-timeline-dot--created" />
                  <div className="rfm-timeline-content">
                    <span className="rfm-timeline-label">Refund Requested</span>
                    <span className="rfm-timeline-date">{formatDateTime(selectedRefund.createdAt)}</span>
                  </div>
                </div>
                {selectedRefund.status === "approved" || selectedRefund.status === "processed" ? (
                  <div className="rfm-timeline-item">
                    <div className="rfm-timeline-dot rfm-timeline-dot--approved" />
                    <div className="rfm-timeline-content">
                      <span className="rfm-timeline-label">Refund Approved</span>
                      <span className="rfm-timeline-date">{formatDateTime(selectedRefund.createdAt)}</span>
                    </div>
                  </div>
                ) : selectedRefund.status === "rejected" ? (
                  <div className="rfm-timeline-item">
                    <div className="rfm-timeline-dot rfm-timeline-dot--rejected" />
                    <div className="rfm-timeline-content">
                      <span className="rfm-timeline-label">Refund Rejected</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* ── Actions ── */}
            {selectedRefund.status === "pending" && (
              <div className="rfm-detail-actions">
                <button
                  type="button"
                  className="rfm-btn rfm-btn--approve"
                  onClick={() => setConfirmAction({ id: selectedRefund.id, action: "approve" })}
                >
                  <CheckCircle2 size={14} /> Approve Full Refund
                </button>
                <button
                  type="button"
                  className="rfm-btn rfm-btn--partial"
                  onClick={() => setPartialRefundId(selectedRefund.id)}
                >
                  <Percent size={14} /> Partial Refund
                </button>
                <button
                  type="button"
                  className="rfm-btn rfm-btn--reject"
                  onClick={() => setConfirmAction({ id: selectedRefund.id, action: "reject" })}
                >
                  <Ban size={14} /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Confirm Modal ── */}
      {confirmAction && (
        <div className="rfm-modal-backdrop" onClick={() => { setConfirmAction(null); setRejectReason(""); }}>
          <div className="rfm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmAction.action === "approve" ? "Approve Refund" : "Reject Refund"}</h3>
            <p className="rfm-modal-desc">
              {confirmAction.action === "approve"
                ? "This will refund the full amount to the passenger's wallet. Continue?"
                : "This will reject the refund request. Provide a reason below."}
            </p>
            {confirmAction.action === "reject" && (
              <>
                <label className="rfm-modal-label">Rejection Reason</label>
                <textarea
                  className="rfm-modal-textarea"
                  rows={3}
                  placeholder="Why is this refund being rejected?"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  autoFocus
                />
              </>
            )}
            <div className="rfm-modal-actions">
              <button type="button" className="rfm-btn rfm-btn--ghost" onClick={() => { setConfirmAction(null); setRejectReason(""); }}>Cancel</button>
              <button
                type="button"
                className={`rfm-btn ${confirmAction.action === "approve" ? "rfm-btn--approve" : "rfm-btn--reject"}`}
                onClick={handleConfirmAction}
                disabled={confirmAction.action === "reject" && rejectReason.trim().length < 3}
              >
                {confirmAction.action === "approve" ? <><CheckCircle2 size={13} /> Approve</> : <><Ban size={13} /> Reject</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Partial Refund Modal ── */}
      {partialRefundId && (() => {
        const row = refundRows.find((r) => r.id === partialRefundId);
        if (!row) return null;
        return (
          <PartialRefundModal
            maxAmount={row.amount}
            currency={row.currency}
            onConfirm={handlePartialConfirm}
            onClose={() => setPartialRefundId(null)}
          />
        );
      })()}
    </div>
  );
}
