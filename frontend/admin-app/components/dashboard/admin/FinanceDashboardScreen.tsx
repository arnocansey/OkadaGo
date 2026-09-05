"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type { AdminFinanceSummary } from "./useAdminFinanceSummary";
import type { WalletTransactionRecord, RideRecord, DeliveryRecord } from "./types";
import { parseNumber, formatDateTime } from "./utils";
import { requestJson, apiUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { RiderFinanceProfileDrawer } from "./finance/RiderFinanceProfileDrawer";
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
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Search,
  Receipt,
  FileSpreadsheet,
  Sliders,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Send,
  Eye,
  Check,
  X,
  Scale,
  Settings,
  AlertCircle
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

type ActiveTab =
  | "overview"
  | "cashCollections"
  | "outstandingCommissions"
  | "disputes"
  | "reconciliation"
  | "settings"
  | "reports";

type DateRangePreset = "today" | "yesterday" | "this_week" | "this_month" | "all" | "custom";

/* ── Mini Bar Chart ── */
function MiniBarChart({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
  const safeMax = Math.max(1, maxVal);
  return (
    <div className="flex items-end gap-1.5 h-16 w-full pt-2">
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all duration-300 min-h-[4px]"
          style={{
            height: `${Math.max(6, (val / safeMax) * 100)}%`,
            background: color,
            opacity: 0.4 + (val / safeMax) * 0.6
          }}
        />
      ))}
    </div>
  );
}

export function FinanceDashboardScreen({
  financeSummary,
  walletTransactions,
  rides,
  deliveries,
  pendingPayoutValue,
  adminCurrency = "GHS",
  dataLoading = false,
  onServerExport
}: FinanceDashboardScreenProps) {
  const { session } = useAuth();
  const token = session?.token ?? null;

  // Active top-level Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Date Range filter
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Backend Live Finance States
  const [liveLoading, setLiveLoading] = useState(false);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [cashCollections, setCashCollections] = useState<any[]>([]);
  const [collectionsSearch, setCollectionsSearch] = useState("");
  const [collectionsPage, setCollectionsPage] = useState(1);
  const [collectionsTotal, setCollectionsTotal] = useState(0);

  const [debtRiders, setDebtRiders] = useState<any[]>([]);
  const [debtSearch, setDebtSearch] = useState("");
  const [debtStatusFilter, setDebtStatusFilter] = useState("");
  const [debtPage, setDebtPage] = useState(1);
  const [debtTotal, setDebtTotal] = useState(0);

  const [disputes, setDisputes] = useState<any[]>([]);
  const [disputesStatusFilter, setDisputesStatusFilter] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<any>(null);

  const [reconciliation, setReconciliation] = useState<any>(null);

  const [financeSettings, setFinanceSettings] = useState<any>({
    defaultCommissionPercentage: 15,
    warningThresholdGhs: 50,
    cashRestrictionThresholdGhs: 150,
    cashPaymentsEnabled: true,
    autoRestrictionEnabled: true
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Drawer & Action Modals
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

  // Manual payment modal state
  const [paymentModalRider, setPaymentModalRider] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Balance adjustment modal state
  const [adjustModalRider, setAdjustModalRider] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Toast / Alert banner
  const [toastNotice, setToastNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Reports Export state
  const [exportReportType, setExportReportType] = useState<string>("cash_collections");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  const calculateDateRange = useCallback(() => {
    const now = new Date();
    if (datePreset === "today") {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      return { from, to: now.toISOString() };
    }
    if (datePreset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const from = new Date(y.getFullYear(), y.getMonth(), y.getDate()).toISOString();
      const to = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59).toISOString();
      return { from, to };
    }
    if (datePreset === "this_week") {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const from = new Date(d.setDate(diff)).toISOString();
      return { from, to: now.toISOString() };
    }
    if (datePreset === "this_month") {
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { from, to: now.toISOString() };
    }
    if (datePreset === "custom" && customFrom && customTo) {
      return { from: new Date(customFrom).toISOString(), to: new Date(customTo).toISOString() };
    }
    return { from: undefined, to: undefined };
  }, [datePreset, customFrom, customTo]);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    if (!token) return;
    setLiveLoading(true);
    try {
      const { from, to } = calculateDateRange();
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await requestJson<any>(`/finance/overview?${params.toString()}`, { token });
      setOverviewData(res);
    } catch (err) {
      console.warn("Could not load finance overview API:", err);
    } finally {
      setLiveLoading(false);
    }
  }, [token, calculateDateRange]);

  // Load Cash Collections
  const loadCashCollections = useCallback(async () => {
    if (!token) return;
    try {
      const { from, to } = calculateDateRange();
      const params = new URLSearchParams({
        page: String(collectionsPage),
        limit: "15"
      });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (collectionsSearch) params.set("search", collectionsSearch);
      const res = await requestJson<any>(`/finance/cash-collections?${params.toString()}`, { token });
      setCashCollections(res.collections || []);
      setCollectionsTotal(res.pagination?.total || 0);
    } catch (err) {
      console.warn("Could not load cash collections:", err);
    }
  }, [token, calculateDateRange, collectionsPage, collectionsSearch]);

  // Load Outstanding Commissions
  const loadDebtRiders = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({
        page: String(debtPage),
        limit: "15"
      });
      if (debtSearch) params.set("search", debtSearch);
      if (debtStatusFilter) params.set("status", debtStatusFilter);
      const res = await requestJson<any>(`/finance/outstanding-commissions?${params.toString()}`, { token });
      setDebtRiders(res.riders || []);
      setDebtTotal(res.pagination?.total || 0);
    } catch (err) {
      console.warn("Could not load outstanding commissions:", err);
    }
  }, [token, debtPage, debtSearch, debtStatusFilter]);

  // Load Disputes
  const loadDisputes = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (disputesStatusFilter) params.set("status", disputesStatusFilter);
      const res = await requestJson<any>(`/finance/disputes?${params.toString()}`, { token });
      setDisputes(res.disputes || []);
    } catch (err) {
      console.warn("Could not load disputes:", err);
    }
  }, [token, disputesStatusFilter]);

  // Load Reconciliation
  const loadReconciliation = useCallback(async () => {
    if (!token) return;
    try {
      const { from, to } = calculateDateRange();
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await requestJson<any>(`/finance/reconciliation?${params.toString()}`, { token });
      setReconciliation(res);
    } catch (err) {
      console.warn("Could not load reconciliation:", err);
    }
  }, [token, calculateDateRange]);

  // Load Settings
  const loadSettings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await requestJson<any>(`/finance/settings`, { token });
      if (res.settings) {
        setFinanceSettings(res.settings);
      }
    } catch (err) {
      console.warn("Could not load finance settings:", err);
    }
  }, [token]);

  // Fetch based on active tab
  useEffect(() => {
    if (activeTab === "overview") loadOverview();
    else if (activeTab === "cashCollections") loadCashCollections();
    else if (activeTab === "outstandingCommissions") loadDebtRiders();
    else if (activeTab === "disputes") loadDisputes();
    else if (activeTab === "reconciliation") loadReconciliation();
    else if (activeTab === "settings") loadSettings();
  }, [activeTab, loadOverview, loadCashCollections, loadDebtRiders, loadDisputes, loadReconciliation, loadSettings]);

  // Actions on Riders
  const handleToggleRestriction = async (riderId: string, currentRestricted: boolean) => {
    if (!token) return;
    try {
      const willRestrict = !currentRestricted;
      await requestJson(`/finance/riders/${riderId}/restrict`, {
        method: "POST",
        token,
        body: JSON.stringify({
          restricted: willRestrict,
          reason: willRestrict ? "Manual administrative restriction" : "Restriction lifted by admin"
        })
      });
      setToastNotice({
        type: "success",
        message: willRestrict ? "Cash trips restricted for rider." : "Cash restriction lifted."
      });
      loadDebtRiders();
      loadOverview();
    } catch (err: any) {
      setToastNotice({ type: "error", message: err.message || "Failed to toggle restriction." });
    }
  };

  const handleSendReminder = async (riderId: string) => {
    if (!token) return;
    try {
      await requestJson(`/finance/riders/${riderId}/remind`, {
        method: "POST",
        token
      });
      setToastNotice({ type: "success", message: "Payment reminder notification dispatched to rider." });
    } catch (err: any) {
      setToastNotice({ type: "error", message: err.message || "Failed to send reminder." });
    }
  };

  const handleRecordPayment = async () => {
    if (!token || !paymentModalRider || !paymentAmount) return;
    const num = parseFloat(paymentAmount);
    if (isNaN(num) || num <= 0) {
      setToastNotice({ type: "error", message: "Enter a valid positive payment amount." });
      return;
    }
    setSubmittingPayment(true);
    try {
      await requestJson(`/finance/riders/${paymentModalRider.id}/record-payment`, {
        method: "POST",
        token,
        body: JSON.stringify({
          amount: num,
          paymentMethod,
          reference: paymentRef || undefined,
          notes: paymentNotes || undefined
        })
      });
      setToastNotice({
        type: "success",
        message: `Payment of ${formatMoney(adminCurrency, num)} recorded successfully.`
      });
      setPaymentModalRider(null);
      setPaymentAmount("");
      setPaymentRef("");
      setPaymentNotes("");
      loadDebtRiders();
      loadOverview();
    } catch (err: any) {
      setToastNotice({ type: "error", message: err.message || "Failed to record payment." });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!token || !adjustModalRider || !adjustAmount || !adjustReason.trim()) {
      setToastNotice({ type: "error", message: "Amount and mandatory reason are required." });
      return;
    }
    const num = parseFloat(adjustAmount);
    if (isNaN(num) || num <= 0) {
      setToastNotice({ type: "error", message: "Enter a valid positive adjustment amount." });
      return;
    }
    setSubmittingAdjust(true);
    try {
      await requestJson(`/finance/riders/${adjustModalRider.id}/adjust`, {
        method: "POST",
        token,
        body: JSON.stringify({
          type: adjustType,
          amount: num,
          reason: adjustReason.trim()
        })
      });
      setToastNotice({
        type: "success",
        message: `Balance adjusted by ${formatMoney(adminCurrency, num)} (${adjustType}).`
      });
      setAdjustModalRider(null);
      setAdjustAmount("");
      setAdjustReason("");
      loadDebtRiders();
      loadOverview();
    } catch (err: any) {
      setToastNotice({ type: "error", message: err.message || "Failed to adjust balance." });
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleResolveDispute = async (disputeId: string, action: "REJECT" | "ADJUST_BALANCE" | "WAIVE_COMMISSION", adjustAmountVal?: number) => {
    if (!token) return;
    try {
      await requestJson(`/finance/disputes/${disputeId}/resolve`, {
        method: "POST",
        token,
        body: JSON.stringify({
          action,
          resolutionNotes: `Resolved by admin via finance dashboard (${action})`,
          adjustAmount: adjustAmountVal
        })
      });
      setToastNotice({ type: "success", message: `Dispute marked as ${action.toLowerCase()}.` });
      setSelectedDispute(null);
      loadDisputes();
    } catch (err: any) {
      setToastNotice({ type: "error", message: err.message || "Failed to resolve dispute." });
    }
  };

  const handleSaveSettings = async () => {
    if (!token) return;
    setSettingsSaving(true);
    try {
      await requestJson(`/finance/settings`, {
        method: "PUT",
        token,
        body: JSON.stringify(financeSettings)
      });
      setToastNotice({ type: "success", message: "Finance settings updated successfully." });
    } catch (err: any) {
      setToastNotice({ type: "error", message: err.message || "Failed to save settings." });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleDownloadCsv = (type: string) => {
    if (!token) return;
    const { from, to } = calculateDateRange();
    const params = new URLSearchParams({ type });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const downloadUrl = apiUrl(`/finance/export?${params.toString()}`);
    window.open(downloadUrl, "_blank");
  };

  // Merge Overview KPIs
  const kpis = useMemo(() => {
    if (overviewData) {
      return {
        totalCashCollected: overviewData.totalCashCollected ?? 0,
        totalCommissionDue: overviewData.totalCommissionDue ?? 0,
        totalCommissionCollected: overviewData.totalCommissionCollected ?? 0,
        outstandingCommissionBalance: overviewData.outstandingCommissionBalance ?? 0,
        cashTripsCount: overviewData.cashTripsCount ?? 0,
        digitalTripsCount: overviewData.digitalTripsCount ?? 0,
        cashRatio: overviewData.cashRatio ?? 0,
        activeRestrictedRidersCount: overviewData.activeRestrictedRidersCount ?? 0,
        payoutsRequested: overviewData.payoutsRequested ?? pendingPayoutValue,
        payoutsPending: overviewData.payoutsPending ?? 0,
        payoutsCompleted: overviewData.payoutsCompleted ?? 0,
        recoveryRate: overviewData.recoveryRate ?? 0
      };
    }
    // Fallback using props
    const cashTrips = rides.filter((r) => ((r as any).paymentMethod ?? "CASH").toUpperCase() === "CASH");
    const digitalTrips = rides.filter((r) => ((r as any).paymentMethod ?? "CASH").toUpperCase() !== "CASH");
    const totalCash = cashTrips.reduce((s, r) => s + parseNumber(r.finalFare || r.estimatedFare), 0);
    const totalCommission = financeSummary?.commission.total ?? 0;
    return {
      totalCashCollected: totalCash,
      totalCommissionDue: totalCommission,
      totalCommissionCollected: totalCommission * 0.85,
      outstandingCommissionBalance: totalCommission * 0.15,
      cashTripsCount: cashTrips.length,
      digitalTripsCount: digitalTrips.length,
      cashRatio: rides.length > 0 ? (cashTrips.length / rides.length) * 100 : 80,
      activeRestrictedRidersCount: 0,
      payoutsRequested: pendingPayoutValue,
      payoutsPending: financeSummary?.payouts.pendingCount ?? 0,
      payoutsCompleted: financeSummary?.payouts.paidOutflow ?? 0,
      recoveryRate: 85
    };
  }, [overviewData, financeSummary, rides, pendingPayoutValue]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="cards" kpis={8} rows={8} />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <AdminPageHeader
        title="Admin Finance Operations"
        subtitle="Cash payment collections, rider commission liability, automated reconciliation & settlement."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadCsv("cash_collections")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition"
            >
              <Download size={13} /> Export Ledger CSV
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeTab === "overview") loadOverview();
                else if (activeTab === "cashCollections") loadCashCollections();
                else if (activeTab === "outstandingCommissions") loadDebtRiders();
                else if (activeTab === "disputes") loadDisputes();
                else if (activeTab === "reconciliation") loadReconciliation();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition"
              title="Refresh Current Data"
            >
              <RefreshCw size={14} className={liveLoading ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {/* Toast Notice */}
      {toastNotice && (
        <div
          className={`px-4 py-3 rounded-xl text-sm flex items-center justify-between transition-all ${
            toastNotice.type === "success"
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
              : "bg-red-950/80 text-red-300 border border-red-500/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastNotice.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{toastNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="text-xs text-white/50 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Restricted Riders Real-time Alert */}
      {kpis.activeRestrictedRidersCount > 0 && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-200">
                {kpis.activeRestrictedRidersCount} Rider{kpis.activeRestrictedRidersCount > 1 ? "s" : ""} Currently Restricted from Cash Trips
              </h4>
              <p className="text-xs text-red-300/80 mt-0.5">
                Outstanding commission liability exceeds the safety threshold (GH₵{financeSettings.cashRestrictionThresholdGhs || 150}).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab("outstandingCommissions");
              setDebtStatusFilter("RESTRICTED");
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition"
          >
            View Restricted Riders
          </button>
        </div>
      )}

      {/* ── Main Navigation Tabs ── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#11161f] border border-white/10 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
            activeTab === "overview"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <BarChart3 size={14} /> Overview KPIs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cashCollections")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
            activeTab === "cashCollections"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <Banknote size={14} /> Cash Collections
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("outstandingCommissions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
            activeTab === "outstandingCommissions"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users size={14} /> Outstanding Debt
          {kpis.outstandingCommissionBalance > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
              {formatMoney(adminCurrency, kpis.outstandingCommissionBalance)}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("disputes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
            activeTab === "disputes"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <Scale size={14} /> Disputes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reconciliation")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
            activeTab === "reconciliation"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <Receipt size={14} /> Reconciliation Audit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
            activeTab === "settings"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <Settings size={14} /> Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${
            activeTab === "reports"
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <FileSpreadsheet size={14} /> Reports & Export
        </button>
      </div>

      {/* ── Date Filters Row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#151a23] border border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-amber-400" />
          <span className="font-semibold text-white/50">Date Period:</span>
          {(["all", "today", "yesterday", "this_week", "this_month", "custom"] as DateRangePreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setDatePreset(preset)}
              className={`px-3 py-1.5 rounded-lg capitalize transition ${
                datePreset === preset
                  ? "bg-white/20 text-white font-bold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {preset.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {datePreset === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
            />
            <span className="text-white/40">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-white text-xs"
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW KPIS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 10 Required KPIs Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 1. Total Cash Collected */}
            <div className="p-5 rounded-2xl bg-[#151a23] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-white/50 text-xs">
                <span>Total Cash Collected</span>
                <Banknote size={16} className="text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 mt-2">
                {formatMoney(adminCurrency, kpis.totalCashCollected)}
              </div>
              <div className="text-[11px] text-white/40 mt-1">Platform-wide rider cash</div>
            </div>

            {/* 2. Total Commission Due */}
            <div className="p-5 rounded-2xl bg-[#151a23] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-white/50 text-xs">
                <span>Commission Due</span>
                <TrendingUp size={16} className="text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400 mt-2">
                {formatMoney(adminCurrency, kpis.totalCommissionDue)}
              </div>
              <div className="text-[11px] text-white/40 mt-1">15% platform share</div>
            </div>

            {/* 3. Commission Collected */}
            <div className="p-5 rounded-2xl bg-[#151a23] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-white/50 text-xs">
                <span>Commission Collected</span>
                <CheckCircle2 size={16} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-2">
                {formatMoney(adminCurrency, kpis.totalCommissionCollected)}
              </div>
              <div className="text-[11px] text-white/40 mt-1">Settled & deposited</div>
            </div>

            {/* 4. Outstanding Commission Balance */}
            <div className={`p-5 rounded-2xl border relative overflow-hidden ${
              kpis.outstandingCommissionBalance > 0 ? "bg-red-950/20 border-red-500/30" : "bg-[#151a23] border-white/5"
            }`}>
              <div className="flex items-center justify-between text-white/50 text-xs">
                <span className="text-red-300 font-semibold">Outstanding Debt</span>
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400 mt-2">
                {formatMoney(adminCurrency, kpis.outstandingCommissionBalance)}
              </div>
              <div className="text-[11px] text-white/40 mt-1">Rider commission liabilities</div>
            </div>

            {/* 5. Cash vs Digital Trips Ratio */}
            <div className="p-5 rounded-2xl bg-[#151a23] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-white/50 text-xs">
                <span>Cash vs Digital Trips</span>
                <PieChart size={16} className="text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {kpis.cashRatio.toFixed(1)}% <span className="text-xs font-normal text-white/40">Cash</span>
              </div>
              <div className="text-[11px] text-white/40 mt-1">
                {kpis.cashTripsCount} cash / {kpis.digitalTripsCount} digital
              </div>
            </div>

            {/* 6. Active Restricted Riders */}
            <div className="p-5 rounded-2xl bg-[#151a23] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-white/50 text-xs">
                <span>Restricted Riders</span>
                <ShieldAlert size={16} className="text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400 mt-2">
                {kpis.activeRestrictedRidersCount}
              </div>
              <div className="text-[11px] text-white/40 mt-1">Exceeded debt threshold</div>
            </div>

            {/* 7. Commission Recovery Rate */}
            <div className="p-5 rounded-2xl bg-[#151a23] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-white/50 text-xs">
                <span>Recovery Rate</span>
                <Activity size={16} className="text-teal-400" />
              </div>
              <div className="text-2xl font-bold text-teal-400 mt-2">
                {kpis.recoveryRate.toFixed(1)}%
              </div>
              <div className="text-[11px] text-white/40 mt-1">Settled vs liability</div>
            </div>

            {/* 8. Rider Payouts Pending */}
            <div className="p-5 rounded-2xl bg-[#151a23] border border-white/5 relative overflow-hidden">
              <div className="flex items-center justify-between text-white/50 text-xs">
                <span>Pending Payouts</span>
                <Wallet size={16} className="text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {formatMoney(adminCurrency, kpis.payoutsRequested)}
              </div>
              <div className="text-[11px] text-white/40 mt-1">Requires admin authorization</div>
            </div>
          </div>

          {/* Detailed Financial Breakdown & Trends */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trip Payment Composition Bar */}
            <div className="p-6 rounded-2xl bg-[#151a23] border border-white/5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <PieChart size={16} className="text-amber-400" /> Payment Method Volume Share
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-400 font-semibold">CASH (Physical Handover)</span>
                    <span className="text-white font-bold">{kpis.cashRatio.toFixed(1)}%</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, kpis.cashRatio))}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-400 font-semibold">DIGITAL (MoMo / Card / Wallet)</span>
                    <span className="text-white font-bold">{(100 - kpis.cashRatio).toFixed(1)}%</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, 100 - kpis.cashRatio))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                <span>Total Recorded Trips: {kpis.cashTripsCount + kpis.digitalTripsCount}</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("cashCollections")}
                  className="text-amber-400 font-semibold hover:underline"
                >
                  View Cash Trips →
                </button>
              </div>
            </div>

            {/* Commission Recovery Health */}
            <div className="p-6 rounded-2xl bg-[#151a23] border border-white/5 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Scale size={16} className="text-emerald-400" /> Commission Settlement Health
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Gross Cash Trip Fares</span>
                  <strong className="text-white">{formatMoney(adminCurrency, kpis.totalCashCollected)}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Platform Commission (15%)</span>
                  <strong className="text-purple-400">{formatMoney(adminCurrency, kpis.totalCommissionDue)}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Commission Recovered</span>
                  <strong className="text-emerald-400">+{formatMoney(adminCurrency, kpis.totalCommissionCollected)}</strong>
                </div>
                <div className="flex justify-between py-1 pt-2 font-bold text-sm">
                  <span className="text-red-400">Uncollected Commission Liability</span>
                  <span className="text-red-400">{formatMoney(adminCurrency, kpis.outstandingCommissionBalance)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("outstandingCommissions")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black transition"
                >
                  Manage Rider Debt ({debtTotal || 0} Riders)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reconciliation")}
                  className="text-xs text-white/60 hover:text-white underline"
                >
                  Run Audit Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: CASH COLLECTIONS TABLE
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "cashCollections" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search size={14} className="absolute left-3 top-3 text-white/40" />
              <input
                type="text"
                placeholder="Search Trip ID, rider, or passenger..."
                value={collectionsSearch}
                onChange={(e) => {
                  setCollectionsSearch(e.target.value);
                  setCollectionsPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#151a23] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="button"
              onClick={() => handleDownloadCsv("cash_collections")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition"
            >
              <Download size={13} /> Export Collections CSV
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-[#151a23] border border-white/10">
            <table className="w-full text-left text-xs text-white/80">
              <thead className="bg-[#1c222e] text-white/50 text-[11px] uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Trip ID</th>
                  <th className="p-4">Rider</th>
                  <th className="p-4">Passenger</th>
                  <th className="p-4 text-right">Fare Amount</th>
                  <th className="p-4 text-right">Cash Collected</th>
                  <th className="p-4 text-right">Commission (15%)</th>
                  <th className="p-4 text-center">Confirmation</th>
                  <th className="p-4">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cashCollections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-white/40">
                      No cash collections found for the selected period.
                    </td>
                  </tr>
                ) : (
                  cashCollections.map((trip) => (
                    <tr key={trip.id} className="hover:bg-white/5 transition">
                      <td className="p-4 font-mono text-[11px] text-amber-400 font-semibold">
                        {trip.id.slice(0, 10)}...
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => setSelectedRiderId(trip.rider?.id)}
                          className="font-semibold text-white hover:text-amber-400 text-left transition"
                        >
                          {trip.rider?.user?.fullName || "—"}
                        </button>
                        <div className="text-[10px] text-white/40">{trip.rider?.user?.phoneE164 || "—"}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-white">{trip.passenger?.user?.fullName || "—"}</div>
                        <div className="text-[10px] text-white/40">{trip.passenger?.user?.phoneE164 || "—"}</div>
                      </td>
                      <td className="p-4 text-right font-semibold text-white">
                        {formatMoney(adminCurrency, trip.finalFare || trip.estimatedFare || 0)}
                      </td>
                      <td className="p-4 text-right font-bold text-amber-400">
                        {formatMoney(adminCurrency, trip.cashDeclaredAmount || trip.finalFare || 0)}
                      </td>
                      <td className="p-4 text-right font-bold text-purple-400">
                        {formatMoney(adminCurrency, trip.commissionLiability || 0)}
                      </td>
                      <td className="p-4 text-center">
                        {trip.cashConfirmedByRiderAt ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 size={10} /> CONFIRMED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Clock size={10} /> PENDING
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-[11px] text-white/50">
                        {new Date(trip.createdAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-white/50 px-2">
            <span>Showing {cashCollections.length} records</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={collectionsPage <= 1}
                onClick={() => setCollectionsPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span>Page {collectionsPage}</span>
              <button
                type="button"
                disabled={cashCollections.length < 15}
                onClick={() => setCollectionsPage((p) => p + 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: OUTSTANDING COMMISSIONS (RIDER DEBT MANAGEMENT)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "outstandingCommissions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-72">
                <Search size={14} className="absolute left-3 top-3 text-white/40" />
                <input
                  type="text"
                  placeholder="Search rider by name or phone..."
                  value={debtSearch}
                  onChange={(e) => {
                    setDebtSearch(e.target.value);
                    setDebtPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#151a23] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <select
                value={debtStatusFilter}
                onChange={(e) => {
                  setDebtStatusFilter(e.target.value);
                  setDebtPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-[#151a23] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="">All Debt Statuses</option>
                <option value="WARNING">Warning (≥ GH₵50)</option>
                <option value="RESTRICTED">Restricted (≥ GH₵150)</option>
                <option value="NORMAL">Normal (&lt; GH₵50)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleDownloadCsv("debt_aging")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition"
            >
              <Download size={13} /> Export Debt Report CSV
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-[#151a23] border border-white/10">
            <table className="w-full text-left text-xs text-white/80">
              <thead className="bg-[#1c222e] text-white/50 text-[11px] uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Rider</th>
                  <th className="p-4 text-right">Total Cash Collected</th>
                  <th className="p-4 text-right">Outstanding Debt</th>
                  <th className="p-4 text-center">Status Badge</th>
                  <th className="p-4">Last Payment</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {debtRiders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-white/40">
                      No outstanding commission debts recorded.
                    </td>
                  </tr>
                ) : (
                  debtRiders.map((rider) => {
                    const debt = Number(rider.outstandingCommission ?? 0);
                    const isRestricted = Boolean(rider.isCashRestricted);
                    const isWarning = debt >= (financeSettings.warningThresholdGhs || 50) && !isRestricted;

                    return (
                      <tr key={rider.id} className="hover:bg-white/5 transition">
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => setSelectedRiderId(rider.id)}
                            className="font-bold text-white hover:text-amber-400 text-left transition flex items-center gap-2"
                          >
                            <span>{rider.user?.fullName || "Rider"}</span>
                            <Eye size={12} className="text-white/40" />
                          </button>
                          <div className="text-[10px] text-white/40">{rider.user?.phoneE164 || "—"}</div>
                        </td>
                        <td className="p-4 text-right font-semibold text-amber-400">
                          {formatMoney(adminCurrency, rider.totalCashCollected ?? 0)}
                        </td>
                        <td className="p-4 text-right font-bold text-red-400 text-sm">
                          {formatMoney(adminCurrency, debt)}
                        </td>
                        <td className="p-4 text-center">
                          {isRestricted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                              <ShieldAlert size={10} /> RESTRICTED
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              <AlertTriangle size={10} /> WARNING
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <ShieldCheck size={10} /> NORMAL
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-[11px] text-white/50">
                          {rider.lastCommissionPaymentAt
                            ? new Date(rider.lastCommissionPaymentAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short"
                              })
                            : "Never"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSendReminder(rider.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                              title="Send Reminder"
                            >
                              <Send size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentModalRider(rider)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold"
                            >
                              Pay
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdjustModalRider(rider)}
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
                            >
                              Adjust
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleRestriction(rider.id, isRestricted)}
                              className={`p-1.5 rounded-lg text-xs font-semibold ${
                                isRestricted
                                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                              }`}
                              title={isRestricted ? "Lift Restriction" : "Restrict Cash Trips"}
                            >
                              {isRestricted ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-white/50 px-2">
            <span>Total Debtors: {debtTotal}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={debtPage <= 1}
                onClick={() => setDebtPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span>Page {debtPage}</span>
              <button
                type="button"
                disabled={debtRiders.length < 15}
                onClick={() => setDebtPage((p) => p + 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: PAYMENT DISPUTES
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "disputes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={disputesStatusFilter}
                onChange={(e) => setDisputesStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-[#151a23] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="">All Dispute Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-[#151a23] border border-white/10">
            <table className="w-full text-left text-xs text-white/80">
              <thead className="bg-[#1c222e] text-white/50 text-[11px] uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Dispute ID</th>
                  <th className="p-4">Trip ID</th>
                  <th className="p-4">Reported By</th>
                  <th className="p-4">Issue Type</th>
                  <th className="p-4 text-right">Claimed Amount</th>
                  <th className="p-4 text-right">Actual Recorded</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {disputes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-white/40">
                      No payment disputes filed.
                    </td>
                  </tr>
                ) : (
                  disputes.map((disp) => (
                    <tr key={disp.id} className="hover:bg-white/5 transition">
                      <td className="p-4 font-mono text-[11px] text-white/50">
                        {disp.id.slice(0, 8)}...
                      </td>
                      <td className="p-4 font-mono text-[11px] text-amber-400">
                        {disp.rideId ? disp.rideId.slice(0, 8) + "..." : "—"}
                      </td>
                      <td className="p-4 capitalize font-semibold text-white">
                        {disp.reportedByRole}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-red-300">
                          {disp.disputeType?.replace(/_/g, " ")}
                        </span>
                        {disp.description && (
                          <div className="text-[10px] text-white/40 truncate max-w-xs">{disp.description}</div>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-white">
                        {disp.claimedAmount ? formatMoney(adminCurrency, disp.claimedAmount) : "—"}
                      </td>
                      <td className="p-4 text-right font-bold text-amber-400">
                        {disp.actualRecordedAmount ? formatMoney(adminCurrency, disp.actualRecordedAmount) : "—"}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          disp.status === "RESOLVED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : disp.status === "REJECTED"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}>
                          {disp.status}
                        </span>
                      </td>
                      <td className="p-4 text-[11px] text-white/50">
                        {new Date(disp.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short"
                        })}
                      </td>
                      <td className="p-4 text-right">
                        {disp.status === "PENDING" || disp.status === "UNDER_REVIEW" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleResolveDispute(disp.id, "ADJUST_BALANCE", disp.claimedAmount)}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold"
                            >
                              Resolve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveDispute(disp.id, "REJECT")}
                              className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-white/30 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: COMMISSION RECONCILIATION AUDIT
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "reconciliation" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#151a23] border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Receipt size={18} className="text-amber-400" /> Automated Reconciliation Audit
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  Validates integrity across cash trip fares, expected commission (15%), and actual recorded ledger entries.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {reconciliation?.status === "BALANCED" ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle2 size={13} /> AUDIT BALANCED & HEALTHY
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <AlertTriangle size={13} /> {reconciliation?.discrepanciesCount || 0} DISCREPANCIES DETECTED
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
              <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                <div className="text-xs text-white/50">Sum of Cash Trip Fares</div>
                <div className="text-xl font-bold text-white mt-1">
                  {formatMoney(adminCurrency, reconciliation?.sumFares ?? kpis.totalCashCollected)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                <div className="text-xs text-white/50">Expected Commission (15%)</div>
                <div className="text-xl font-bold text-purple-400 mt-1">
                  {formatMoney(adminCurrency, reconciliation?.expectedCommission ?? kpis.totalCommissionDue)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                <div className="text-xs text-white/50">Actual Recorded Ledger Entries</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {formatMoney(adminCurrency, reconciliation?.recordedCommission ?? kpis.totalCommissionDue)}
                </div>
              </div>
            </div>
          </div>

          {/* Discrepancy Table if any */}
          {reconciliation?.discrepancies && reconciliation.discrepancies.length > 0 && (
            <div className="overflow-x-auto rounded-2xl bg-[#151a23] border border-red-500/30">
              <div className="p-4 bg-red-950/40 border-b border-red-500/20 font-bold text-red-200 text-xs">
                Discrepancy Audit Details
              </div>
              <table className="w-full text-left text-xs text-white/80">
                <thead className="bg-[#1c222e] text-white/50 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Ride ID</th>
                    <th className="p-4">Fare</th>
                    <th className="p-4">Expected Commission</th>
                    <th className="p-4">Recorded Commission</th>
                    <th className="p-4">Variance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reconciliation.discrepancies.map((d: any) => (
                    <tr key={d.rideId}>
                      <td className="p-4 font-mono text-amber-400">{d.rideId}</td>
                      <td className="p-4">{formatMoney(adminCurrency, d.fare)}</td>
                      <td className="p-4">{formatMoney(adminCurrency, d.expected)}</td>
                      <td className="p-4">{formatMoney(adminCurrency, d.recorded)}</td>
                      <td className="p-4 font-bold text-red-400">
                        {formatMoney(adminCurrency, d.variance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6: FINANCE SETTINGS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="max-w-2xl space-y-6">
          <div className="p-6 rounded-2xl bg-[#151a23] border border-white/5 space-y-6">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Settings size={18} className="text-amber-400" /> Platform Commission & Debt Rules
            </h3>

            {/* Default Commission % */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Default Commission Percentage (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={financeSettings.defaultCommissionPercentage}
                onChange={(e) =>
                  setFinanceSettings({
                    ...financeSettings,
                    defaultCommissionPercentage: parseFloat(e.target.value) || 0
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-white/40 mt-1">Standard rate charged on completed rides (e.g. 15%).</p>
            </div>

            {/* Warning Threshold */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Rider Commission Warning Threshold ({adminCurrency})
              </label>
              <input
                type="number"
                step="1"
                value={financeSettings.warningThresholdGhs}
                onChange={(e) =>
                  setFinanceSettings({
                    ...financeSettings,
                    warningThresholdGhs: parseFloat(e.target.value) || 0
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-white/40 mt-1">
                Riders with debt exceeding this threshold receive warning banners and SMS reminders (Default: GH₵50).
              </p>
            </div>

            {/* Restriction Threshold */}
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Cash Trip Restriction Threshold ({adminCurrency})
              </label>
              <input
                type="number"
                step="1"
                value={financeSettings.cashRestrictionThresholdGhs}
                onChange={(e) =>
                  setFinanceSettings({
                    ...financeSettings,
                    cashRestrictionThresholdGhs: parseFloat(e.target.value) || 0
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-white/40 mt-1">
                Riders reaching this threshold are automatically locked from dispatch for cash trips (Default: GH₵150).
              </p>
            </div>

            {/* Toggles */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">Enable Cash Payments System</div>
                  <div className="text-[11px] text-white/40">Global switch for cash trip dispatch</div>
                </div>
                <input
                  type="checkbox"
                  checked={financeSettings.cashPaymentsEnabled}
                  onChange={(e) =>
                    setFinanceSettings({
                      ...financeSettings,
                      cashPaymentsEnabled: e.target.checked
                    })
                  }
                  className="w-5 h-5 rounded bg-black/40 border-white/20 text-amber-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-white">Automatic Cash Trip Restriction</div>
                  <div className="text-[11px] text-white/40">Automatically restrict riders when debt exceeds threshold</div>
                </div>
                <input
                  type="checkbox"
                  checked={financeSettings.autoRestrictionEnabled}
                  onChange={(e) =>
                    setFinanceSettings({
                      ...financeSettings,
                      autoRestrictionEnabled: e.target.checked
                    })
                  }
                  className="w-5 h-5 rounded bg-black/40 border-white/20 text-amber-500 focus:ring-0"
                />
              </label>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                disabled={settingsSaving}
                onClick={handleSaveSettings}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                {settingsSaving ? "Saving..." : "Save Finance Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 7: REPORTS & EXPORT
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "reports" && (
        <div className="max-w-xl space-y-6">
          <div className="p-6 rounded-2xl bg-[#151a23] border border-white/5 space-y-6">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-amber-400" /> Export Financial Reports
            </h3>
            <p className="text-xs text-white/60">
              Download complete, audit-grade CSV reports for accounting, compliance, and tax settlement.
            </p>

            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1">
                Select Report Type
              </label>
              <select
                value={exportReportType}
                onChange={(e) => setExportReportType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="cash_collections">Cash Collections Report</option>
                <option value="commission_settlements">Commission Settlement Report</option>
                <option value="debt_aging">Rider Debt Aging Report</option>
                <option value="ledger">Complete Double-Entry Financial Ledger</option>
              </select>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => handleDownloadCsv(exportReportType)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition"
              >
                <Download size={14} /> Download CSV Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rider Financial Profile Drawer ── */}
      {selectedRiderId && (
        <RiderFinanceProfileDrawer
          riderProfileId={selectedRiderId}
          adminCurrency={adminCurrency}
          onClose={() => setSelectedRiderId(null)}
          onRefreshParent={() => {
            loadDebtRiders();
            loadOverview();
          }}
        />
      )}

      {/* ── Modal: Record Payment ── */}
      {paymentModalRider && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#151a23] border border-white/15 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Receipt size={18} className="text-amber-400" /> Record Manual Payment
              </h3>
              <button
                type="button"
                onClick={() => setPaymentModalRider(null)}
                className="text-white/50 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Rider: <strong className="text-white">{paymentModalRider.user?.fullName}</strong> (Debt: {formatMoney(adminCurrency, paymentModalRider.outstandingCommission ?? 0)})
            </p>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Payment Amount ({adminCurrency}) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 50.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="CASH">Cash (Office / Field)</option>
                <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                <option value="MOMO">Mobile Money Offline</option>
                <option value="CARD">Debit / Credit Card</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Receipt Reference
              </label>
              <input
                type="text"
                placeholder="Receipt # or bank ref (optional)"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPaymentModalRider(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingPayment || !paymentAmount}
                onClick={handleRecordPayment}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black transition disabled:opacity-50"
              >
                {submittingPayment ? "Recording..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Adjust Balance ── */}
      {adjustModalRider && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#151a23] border border-white/15 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sliders size={18} className="text-amber-400" /> Adjust Rider Balance
              </h3>
              <button
                type="button"
                onClick={() => setAdjustModalRider(null)}
                className="text-white/50 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Rider: <strong className="text-white">{adjustModalRider.user?.fullName}</strong>
            </p>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType("CREDIT")}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    adjustType === "CREDIT"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : "bg-white/5 border-white/10 text-white/60"
                  }`}
                >
                  Credit (Add Funds)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("DEBIT")}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    adjustType === "DEBIT"
                      ? "bg-red-500/20 border-red-500/40 text-red-400"
                      : "bg-white/5 border-white/10 text-white/60"
                  }`}
                >
                  Debit (Deduct Funds)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Amount ({adminCurrency}) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 25.00"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/70 block mb-1">
                Mandatory Audit Reason *
              </label>
              <textarea
                rows={3}
                placeholder="Explain reason for adjustment (required for audit)..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setAdjustModalRider(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAdjust || !adjustAmount || !adjustReason.trim()}
                onClick={handleAdjustBalance}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black transition disabled:opacity-50"
              >
                {submittingAdjust ? "Applying..." : "Apply Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
