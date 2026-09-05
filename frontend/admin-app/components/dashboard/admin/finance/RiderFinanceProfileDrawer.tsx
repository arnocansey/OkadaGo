"use client";

import { useState, useEffect, useCallback } from "react";
import { formatMoney } from "@/lib/currency";
import { requestJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  X,
  User,
  Phone,
  Bike,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  PlusCircle,
  Sliders,
  Clock,
  Receipt,
  FileText,
  CreditCard,
  Building2,
  RefreshCw,
  Info
} from "lucide-react";

export type RiderFinanceProfileDrawerProps = {
  riderProfileId: string | null;
  onClose: () => void;
  onRefreshParent?: () => void;
  adminCurrency?: string;
};

type RiderFinanceProfile = {
  rider: {
    id: string;
    userId: string;
    fullName: string;
    phoneE164: string;
    avatarUrl?: string;
    vehiclePlate?: string;
    isCashRestricted: boolean;
    cashRestrictedAt?: string;
    commissionWarningIssuedAt?: string;
  };
  metrics: {
    availableEarnings: number;
    cashCollected: number;
    digitalEarnings: number;
    okadagoCommission: number;
    commissionPaid: number;
    outstandingCommission: number;
    totalEarnings: number;
    withdrawableBalance: number;
  };
  recentLedgerEntries: Array<{
    id: string;
    transactionId: string;
    type: string;
    amount: number;
    direction: "DEBIT" | "CREDIT";
    description: string;
    createdAt: string;
  }>;
  commissionPayments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    reference?: string;
    createdAt: string;
  }>;
};

export function RiderFinanceProfileDrawer({
  riderProfileId,
  onClose,
  onRefreshParent,
  adminCurrency = "GHS"
}: RiderFinanceProfileDrawerProps) {
  const { session } = useAuth();
  const token = session?.token ?? null;

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<RiderFinanceProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ledger" | "settlements">("ledger");

  // Modal dialog states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadProfile = useCallback(async () => {
    if (!riderProfileId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await requestJson<{ profile: RiderFinanceProfile }>(
        `/finance/riders/${riderProfileId}/profile`,
        { token }
      );
      setProfile(res.profile);
    } catch (err: any) {
      setError(err.message || "Failed to load rider finance profile");
    } finally {
      setLoading(false);
    }
  }, [riderProfileId, token]);

  useEffect(() => {
    if (riderProfileId) {
      loadProfile();
    } else {
      setProfile(null);
    }
  }, [riderProfileId, loadProfile]);

  const handleToggleRestriction = async () => {
    if (!riderProfileId || !token || !profile) return;
    try {
      const willRestrict = !profile.rider.isCashRestricted;
      await requestJson(`/finance/riders/${riderProfileId}/restrict`, {
        method: "POST",
        token,
        body: JSON.stringify({
          restricted: willRestrict,
          reason: willRestrict ? "Manual administrative restriction" : "Restriction lifted by admin"
        })
      });
      setActionNotice({
        type: "success",
        text: willRestrict ? "Cash trips restricted for rider." : "Cash restriction lifted."
      });
      await loadProfile();
      onRefreshParent?.();
    } catch (err: any) {
      setActionNotice({ type: "error", text: err.message || "Failed to update restriction." });
    }
  };

  const handleSendReminder = async () => {
    if (!riderProfileId || !token) return;
    try {
      await requestJson(`/finance/riders/${riderProfileId}/remind`, {
        method: "POST",
        token
      });
      setActionNotice({ type: "success", text: "Payment reminder notification dispatched." });
    } catch (err: any) {
      setActionNotice({ type: "error", text: err.message || "Failed to send reminder." });
    }
  };

  const handleRecordPayment = async () => {
    if (!riderProfileId || !token || !paymentAmount) return;
    const num = parseFloat(paymentAmount);
    if (isNaN(num) || num <= 0) {
      setActionNotice({ type: "error", text: "Enter a valid positive payment amount." });
      return;
    }
    setSubmittingPayment(true);
    try {
      await requestJson(`/finance/riders/${riderProfileId}/record-payment`, {
        method: "POST",
        token,
        body: JSON.stringify({
          amount: num,
          paymentMethod,
          reference: paymentRef || undefined,
          notes: paymentNotes || undefined
        })
      });
      setActionNotice({ type: "success", text: `Payment of ${formatMoney(adminCurrency, num)} recorded successfully.` });
      setShowPaymentModal(false);
      setPaymentAmount("");
      setPaymentRef("");
      setPaymentNotes("");
      await loadProfile();
      onRefreshParent?.();
    } catch (err: any) {
      setActionNotice({ type: "error", text: err.message || "Failed to record payment." });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!riderProfileId || !token || !adjustAmount || !adjustReason.trim()) {
      setActionNotice({ type: "error", text: "Amount and a mandatory reason are required for adjustments." });
      return;
    }
    const num = parseFloat(adjustAmount);
    if (isNaN(num) || num <= 0) {
      setActionNotice({ type: "error", text: "Enter a valid positive adjustment amount." });
      return;
    }
    setSubmittingAdjust(true);
    try {
      await requestJson(`/finance/riders/${riderProfileId}/adjust`, {
        method: "POST",
        token,
        body: JSON.stringify({
          type: adjustType,
          amount: num,
          reason: adjustReason.trim()
        })
      });
      setActionNotice({ type: "success", text: `Balance adjusted by ${formatMoney(adminCurrency, num)} (${adjustType}).` });
      setShowAdjustModal(false);
      setAdjustAmount("");
      setAdjustReason("");
      await loadProfile();
      onRefreshParent?.();
    } catch (err: any) {
      setActionNotice({ type: "error", text: err.message || "Failed to adjust balance." });
    } finally {
      setSubmittingAdjust(false);
    }
  };

  if (!riderProfileId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[var(--surface-elevated)] border-l border-[var(--border)] text-[var(--text-primary)] flex flex-col h-full shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 font-bold text-lg">
              {profile?.rider.fullName?.charAt(0) || "R"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-wide">
                  {profile?.rider.fullName || "Loading..."}
                </h2>
                {profile?.rider.isCashRestricted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                    <ShieldAlert size={12} /> RESTRICTED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck size={12} /> ACTIVE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mt-1">
                <span className="flex items-center gap-1">
                  <Phone size={12} /> {profile?.rider.phoneE164 || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Bike size={12} /> Plate: {profile?.rider.vehiclePlate || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadProfile}
              className="p-2 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              title="Refresh profile"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div
            className={`px-6 py-3 text-sm flex items-center justify-between ${
              actionNotice.type === "success"
                ? "bg-emerald-950/80 text-emerald-300 border-b border-emerald-500/30"
                : "bg-red-950/80 text-red-300 border-b border-red-500/30"
            }`}
          >
            <span>{actionNotice.text}</span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              className="text-xs underline hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Restriction Banner */}
          {profile?.rider.isCashRestricted && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-red-200 text-sm">Cash Trip Dispatch Locked</h4>
                  <p className="text-xs text-red-300/80 mt-0.5">
                    This rider has reached the commission liability debt limit. They cannot be assigned cash trips until outstanding commission is settled.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleRestriction}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition shrink-0"
              >
                Lift Restriction
              </button>
            </div>
          )}

          {/* Quick Admin Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm transition"
            >
              <PlusCircle size={14} /> Record Manual Payment
            </button>
            <button
              type="button"
              onClick={() => setShowAdjustModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border)] transition"
            >
              <Sliders size={14} /> Adjust Balance
            </button>
            <button
              type="button"
              onClick={handleSendReminder}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border)] transition"
            >
              <Send size={14} /> Send Reminder
            </button>
            <button
              type="button"
              onClick={handleToggleRestriction}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ml-auto ${
                profile?.rider.isCashRestricted
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              }`}
            >
              {profile?.rider.isCashRestricted ? (
                <>
                  <ShieldCheck size={14} /> Lift Cash Restriction
                </>
              ) : (
                <>
                  <ShieldAlert size={14} /> Restrict Cash Trips
                </>
              )}
            </button>
          </div>

          {/* 8 Required Financial Wallet Metrics */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Financial Wallet Metrics (Official Ledger)
              </h3>
              <span className="text-xs text-amber-500 font-medium">Auto-reconciled</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* 1. AVAILABLE EARNINGS */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden shadow-sm">
                <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  Available Earnings
                </div>
                <div className="text-lg font-bold text-emerald-500 mt-1">
                  {formatMoney(adminCurrency, profile?.metrics.availableEarnings ?? 0)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">In rider digital wallet</div>
              </div>

              {/* 2. CASH COLLECTED */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden shadow-sm">
                <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  Cash Collected
                </div>
                <div className="text-lg font-bold text-amber-500 mt-1">
                  {formatMoney(adminCurrency, profile?.metrics.cashCollected ?? 0)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">Directly held by rider</div>
              </div>

              {/* 3. DIGITAL EARNINGS */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden shadow-sm">
                <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  Digital Earnings
                </div>
                <div className="text-lg font-bold text-blue-500 mt-1">
                  {formatMoney(adminCurrency, profile?.metrics.digitalEarnings ?? 0)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">MoMo, Card & Wallet trips</div>
              </div>

              {/* 4. OKADAGO COMMISSION */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden shadow-sm">
                <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  OkadaGo Commission
                </div>
                <div className="text-lg font-bold text-purple-500 mt-1">
                  {formatMoney(adminCurrency, profile?.metrics.okadagoCommission ?? 0)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">Total platform liability accrued</div>
              </div>

              {/* 5. COMMISSION PAID */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden shadow-sm">
                <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  Commission Paid
                </div>
                <div className="text-lg font-bold text-teal-500 mt-1">
                  {formatMoney(adminCurrency, profile?.metrics.commissionPaid ?? 0)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">Settled by rider</div>
              </div>

              {/* 6. OUTSTANDING COMMISSION */}
              <div className={`p-4 rounded-xl border relative overflow-hidden shadow-sm ${
                (profile?.metrics.outstandingCommission ?? 0) > 0
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-[var(--surface)] border-[var(--border)]"
              }`}>
                <div className="text-[11px] font-semibold text-red-500 uppercase tracking-wide flex items-center justify-between">
                  <span>Outstanding Commission</span>
                  {(profile?.metrics.outstandingCommission ?? 0) >= 50 && (
                    <AlertTriangle size={12} className="text-red-500" />
                  )}
                </div>
                <div className="text-lg font-bold text-red-500 mt-1">
                  {formatMoney(adminCurrency, profile?.metrics.outstandingCommission ?? 0)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">Owed to OkadaGo</div>
              </div>

              {/* 7. TOTAL EARNINGS */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden shadow-sm">
                <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  Total Earnings
                </div>
                <div className="text-lg font-bold text-[var(--text-primary)] mt-1">
                  {formatMoney(adminCurrency, profile?.metrics.totalEarnings ?? 0)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">Net rider revenue (85%)</div>
              </div>

              {/* 8. WITHDRAWABLE BALANCE */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-emerald-500/20 relative overflow-hidden shadow-sm">
                <div className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wide">
                  Withdrawable Balance
                </div>
                <div className="text-lg font-bold text-emerald-500 mt-1">
                  {formatMoney(adminCurrency, profile?.metrics.withdrawableBalance ?? 0)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">Eligible for payout</div>
              </div>
            </div>
          </div>

          {/* Subtabs for Ledger and Settlements */}
          <div className="border-t border-[var(--border)] pt-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("ledger")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "ledger"
                    ? "bg-[var(--surface-muted)] text-[var(--brand-primary)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                <FileText size={14} /> Immutable Ledger ({profile?.recentLedgerEntries.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("settlements")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "settlements"
                    ? "bg-[var(--surface-muted)] text-[var(--brand-primary)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                <Receipt size={14} /> Commission Settlements ({profile?.commissionPayments.length ?? 0})
              </button>
            </div>

            {/* Ledger Tab Content */}
            {activeTab === "ledger" && (
              <div className="mt-4 space-y-2">
                {profile?.recentLedgerEntries.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                    No ledger entries recorded yet.
                  </div>
                ) : (
                  profile?.recentLedgerEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-md flex items-center justify-center font-bold ${
                            entry.direction === "CREDIT"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {entry.direction === "CREDIT" ? "+" : "−"}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <span>{entry.type.replace(/_/g, " ")}</span>
                            <span className="text-[10px] text-[var(--text-muted)] font-mono">
                              {entry.transactionId}
                            </span>
                          </div>
                          <div className="text-[var(--text-secondary)] text-[11px] mt-0.5">
                            {entry.description || "—"}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-bold ${
                            entry.direction === "CREDIT" ? "text-emerald-500" : "text-[var(--text-primary)]"
                          }`}
                        >
                          {entry.direction === "CREDIT" ? "+" : "−"}
                          {formatMoney(adminCurrency, entry.amount)}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Settlements Tab Content */}
            {activeTab === "settlements" && (
              <div className="mt-4 space-y-2">
                {profile?.commissionPayments.length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                    No commission payments recorded.
                  </div>
                ) : (
                  profile?.commissionPayments.map((pmt) => (
                    <div
                      key={pmt.id}
                      className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                          <span className="capitalize">{pmt.method.replace(/_/g, " ")}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold">
                            {pmt.status}
                          </span>
                        </div>
                        <div className="text-[var(--text-muted)] text-[11px] mt-0.5">
                          Ref: {pmt.reference || "N/A"}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-emerald-500">
                          {formatMoney(adminCurrency, pmt.amount)}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {new Date(pmt.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal: Record Manual Payment */}
        {showPaymentModal && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[var(--text-primary)] text-base flex items-center gap-2">
                  <Receipt size={18} className="text-amber-500" /> Record Manual Payment
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Record commission received directly from the rider via cash, bank transfer, or offline collection.
              </p>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                  Payment Amount ({adminCurrency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 50.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="CASH">Cash (Office / Field)</option>
                  <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                  <option value="MOMO">Mobile Money Offline</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                  Transaction / Receipt Reference
                </label>
                <input
                  type="text"
                  placeholder="Receipt # or bank ref (optional)"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Admin notes..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingPayment || !paymentAmount}
                  onClick={handleRecordPayment}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 transition disabled:opacity-50"
                >
                  {submittingPayment ? "Recording..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Adjust Balance */}
        {showAdjustModal && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[var(--text-primary)] text-base flex items-center gap-2">
                  <Sliders size={18} className="text-amber-500" /> Adjust Rider Balance
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Directly debit or credit the rider's balance. All adjustments create an immutable audit record in the financial ledger.
              </p>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("CREDIT")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      adjustType === "CREDIT"
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        : "bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-secondary)]"
                    }`}
                  >
                    Credit (Add to Wallet)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("DEBIT")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                      adjustType === "DEBIT"
                        ? "bg-red-500/20 border-red-500/40 text-red-400"
                        : "bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-secondary)]"
                    }`}
                  >
                    Debit (Deduct from Wallet)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                  Adjustment Amount ({adminCurrency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 25.00"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                  Mandatory Audit Reason *
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this adjustment is being made (required for compliance)..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingAdjust || !adjustAmount || !adjustReason.trim()}
                  onClick={handleAdjustBalance}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 transition disabled:opacity-50"
                >
                  {submittingAdjust ? "Applying..." : "Apply Adjustment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
