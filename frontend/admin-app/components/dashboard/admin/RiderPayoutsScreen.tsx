import { useEffect, useState } from "react";
import { useAdminToast } from "./AdminToast";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPagination, hasServerPagination, usePagination } from "./ui/AdminPagination";
import { formatMoney } from "@/lib/currency";
import { parseNumber, formatDateTime, statusTone } from "./utils";
import { canPayoutAction, readPayoutProviderMeta } from "./payoutActions";
import type { PayoutRequestRecord } from "./types";
import {
  DollarSign,
  Clock,
  Cog,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Filter,
  X,
  CreditCard,
  AlertTriangle,
  Eye,
  User,
  Phone,
  Wallet,
  Calendar,
  FileText,
} from "lucide-react";

export type RiderPayoutsScreenProps = {
  riderPayoutRequests: PayoutRequestRecord[];
  requestedRiderPayouts: PayoutRequestRecord[];
  paidRiderPayouts: PayoutRequestRecord[];
  failedRiderPayouts: PayoutRequestRecord[];
  totalRiderPayoutValue: number;
  riderPayoutMethodSnapshot: [string, number][];
  riderPayoutMethodTotal: number;
  adminCurrency: string;
  payoutRejectionReasons: Record<string, string>;
  onRejectionReasonChange: (payoutId: string, reason: string) => void;
  onPayoutAction: (
    payoutRequestId: string,
    action: "mark_reviewing" | "approve" | "mark_processing" | "mark_paid" | "reject",
    rejectionReason?: string
  ) => void;
  isMutating: boolean;
  dataLoading?: boolean;
  page?: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
};

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  "All Statuses",
  "requested",
  "reviewing",
  "approved",
  "processing",
  "paid",
  "rejected",
  "cancelled"
] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

type TabOption = "All Payouts" | "Pending" | "Processing" | "Completed" | "Failed";

const tabToStatuses: Record<TabOption, string[]> = {
  "All Payouts": [],
  Pending: ["requested", "reviewing"],
  Processing: ["approved", "processing"],
  Completed: ["paid"],
  Failed: ["rejected", "cancelled"]
};

function statusBadgeColor(status: string) {
  const tone = statusTone(status);
  if (tone === "success") return { bg: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)" };
  if (tone === "warning") return { bg: "color-mix(in srgb, var(--brand-orange) 15%, transparent)", color: "var(--brand-orange)" };
  if (tone === "danger") return { bg: "color-mix(in srgb, var(--danger) 15%, transparent)", color: "var(--danger)" };
  return { bg: "color-mix(in srgb, var(--text-muted) 15%, transparent)", color: "var(--text-muted)" };
}

function downloadCsv(rows: Record<string, string>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function RiderPayoutsScreen({
  riderPayoutRequests,
  requestedRiderPayouts,
  paidRiderPayouts,
  failedRiderPayouts,
  totalRiderPayoutValue,
  riderPayoutMethodSnapshot,
  riderPayoutMethodTotal,
  adminCurrency,
  payoutRejectionReasons,
  onRejectionReasonChange,
  onPayoutAction,
  isMutating,
  dataLoading = false,
  page,
  totalItems,
  pageSize,
  onPageChange,
}: RiderPayoutsScreenProps) {
  const { addToast } = useAdminToast();
  const { isMobile, isTablet } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<TabOption>("All Payouts");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusOption>("All Statuses");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [selectedPayoutIds, setSelectedPayoutIds] = useState<Set<string>>(new Set());

  const sortedPayouts = riderPayoutRequests
    .slice()
    .sort((a, b) => Date.parse(b.requestedAt) - Date.parse(a.requestedAt));

  const filteredPayouts = sortedPayouts.filter((p) => {
    const tabStatuses = tabToStatuses[activeTab];
    if (tabStatuses.length > 0 && !tabStatuses.includes(p.status.toLowerCase())) return false;
    if (statusFilter !== "All Statuses" && p.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !p.rider.user.fullName.toLowerCase().includes(q) &&
        !p.rider.displayCode.toLowerCase().includes(q) &&
        !p.rider.user.phoneE164.includes(q) &&
        !p.destinationLabel.toLowerCase().includes(q) &&
        !p.method.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const effectivePageSize = pageSize ?? PAGE_SIZE;
  const serverPaginated = hasServerPagination({ page, totalItems, pageSize, onPageChange });
  const clientPagination = usePagination(filteredPayouts, effectivePageSize);
  const paginatedPayouts = serverPaginated ? filteredPayouts : clientPagination.paginated;
  const paginationPage = serverPaginated ? page! : clientPagination.page;
  const paginationTotal = serverPaginated ? totalItems! : filteredPayouts.length;
  const paginationOnChange = serverPaginated ? onPageChange! : clientPagination.setPage;

  useEffect(() => {
    if (!serverPaginated) clientPagination.setPage(1);
  }, [activeTab, searchQuery, statusFilter, serverPaginated, clientPagination.setPage]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="split" kpis={5} rows={5} cols={6} />;
  }

  const processingCount = riderPayoutRequests.filter(
    (p) => p.status.toLowerCase() === "processing" || p.status.toLowerCase() === "approved"
  ).length;

  const allPageIds = paginatedPayouts.map((p) => p.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedPayoutIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedPayoutIds((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedPayoutIds((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleId = (id: string) => {
    setSelectedPayoutIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportCsv = () => {
    const rows = filteredPayouts.map((p) => ({
      Rider: p.rider.user.fullName,
      Code: p.rider.displayCode,
      Phone: p.rider.user.phoneE164,
      Amount: String(parseNumber(p.amount)),
      Currency: p.currency,
      Method: p.method,
      Destination: p.destinationLabel,
      Status: p.status,
      Requested: formatDateTime(p.requestedAt),
      Reviewed: p.reviewedAt ? formatDateTime(p.reviewedAt) : "",
      Paid: p.paidAt ? formatDateTime(p.paidAt) : "",
    }));
    downloadCsv(rows, `rider-payouts-${new Date().toISOString().slice(0, 10)}.csv`);
    addToast(`Exported ${rows.length} payout records`, "success");
  };

  const handleAction = (
    id: string,
    action: "mark_reviewing" | "approve" | "mark_processing" | "mark_paid" | "reject",
    reason?: string
  ) => {
    onPayoutAction(id, action, reason);
    const label = action === "mark_reviewing" ? "Marked as reviewing" : action === "approve" ? "Approved" : action === "mark_processing" ? "Marked as processing" : action === "mark_paid" ? "Marked as paid" : "Rejected";
    addToast(label, action === "reject" ? "error" : "success");
  };

  const donutRadius = 44;
  const donutStroke = 10;
  const donutCircumference = 2 * Math.PI * donutRadius;

  const donutColors = ["var(--accent-orange)", "var(--color-success)", "var(--accent-yellow)", "var(--color-danger)", "var(--text-secondary)"];

  let donutOffset = 0;
  const donutSegments = riderPayoutMethodSnapshot.map(([method, amount], i) => {
    const ratio = riderPayoutMethodTotal > 0 ? amount / riderPayoutMethodTotal : 0;
    const len = ratio * donutCircumference;
    const seg = { ratio, len, offset: donutOffset, color: donutColors[i % donutColors.length], method, amount };
    donutOffset += len;
    return seg;
  });

  const selectedDetail = selectedRow ? riderPayoutRequests.find((p) => p.id === selectedRow) : null;

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 20,
    transition: "all 0.25s ease",
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    color: "var(--text-primary)",
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s ease",
  };

  const btnBase: React.CSSProperties = {
    padding: "7px 16px",
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-primary)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    transition: "all 0.2s ease",
  };

  const tabs: TabOption[] = ["All Payouts", "Pending", "Processing", "Completed", "Failed"];

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Rider Payouts"
        subtitle="Approve and settle Accra MoMo and bank payout requests in Ghana cedis."
        actions={
          <button type="button" className="admin-btn-primary" onClick={handleExportCsv}>
            <Download size={14} /> Export CSV
          </button>
        }
      />

      <AdminKpiRow
        items={[
          { label: "Ready for Payout", value: formatMoney(adminCurrency, totalRiderPayoutValue), hint: "All requests in GHS", icon: <DollarSign size={22} />, tone: "yellow" },
          { label: "Requested", value: requestedRiderPayouts.length, hint: "Awaiting review", icon: <Clock size={22} />, tone: "yellow" },
          { label: "Processing", value: processingCount, hint: "In progress", icon: <Cog size={22} />, tone: "neutral" },
          { label: "Paid", value: paidRiderPayouts.length, hint: "Successfully settled", icon: <CheckCircle size={22} />, tone: "green" },
          { label: "Failed", value: failedRiderPayouts.length, hint: "Requires follow-up", icon: <XCircle size={22} />, tone: "red" },
        ]}
      />

      <div className="admin-tabs">
        {tabs.map((tab) => {
          const tabCounts: Record<TabOption, number> = {
            "All Payouts": riderPayoutRequests.length,
            "Pending": requestedRiderPayouts.length,
            "Processing": processingCount,
            "Completed": paidRiderPayouts.length,
            "Failed": failedRiderPayouts.length,
          };
          return (
            <button
              key={tab}
              type="button"
              className={`admin-tab${activeTab === tab ? " active" : ""}`}
              onClick={() => { setActiveTab(tab); setSelectedRow(null); if (!serverPaginated) clientPagination.setPage(1); }}
            >
              {tab}
              <span style={{ marginLeft: 6, opacity: 0.75 }}>{tabCounts[tab]}</span>
            </button>
          );
        })}
      </div>

      {/* Search + Filter Row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: isMobile ? "wrap" : undefined }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search by rider name, code, phone..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); if (!serverPaginated) clientPagination.setPage(1); }}
            style={{ ...inputStyle, paddingLeft: 36 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--brand-orange)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <Filter size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as StatusOption); if (!serverPaginated) clientPagination.setPage(1); }}
            style={{ ...inputStyle, paddingLeft: 36, paddingRight: 32, width: "auto", minWidth: 160, cursor: "pointer", appearance: "none" as const }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        {selectedPayoutIds.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedPayoutIds.size} selected</span>
            <button
              type="button"
              disabled={isMutating}
              onClick={() => {
                selectedPayoutIds.forEach((id) => {
                  const row = riderPayoutRequests.find((p) => p.id === id);
                  if (row && canPayoutAction(row.status, "approve")) handleAction(id, "approve");
                });
                setSelectedPayoutIds(new Set());
              }}
              style={{ ...btnBase, color: "var(--success)", borderColor: "var(--success)", opacity: isMutating ? 0.5 : 1, cursor: isMutating ? "not-allowed" : "pointer" }}
            >
              <CheckCircle size={13} /> Approve All
            </button>
            <button
              type="button"
              disabled={isMutating}
              onClick={() => {
                selectedPayoutIds.forEach((id) => {
                  const row = riderPayoutRequests.find((p) => p.id === id);
                  if (row && canPayoutAction(row.status, "mark_paid")) handleAction(id, "mark_paid");
                });
                setSelectedPayoutIds(new Set());
              }}
              style={{ ...btnBase, color: "var(--success)", borderColor: "var(--success)", opacity: isMutating ? 0.5 : 1, cursor: isMutating ? "not-allowed" : "pointer" }}
            >
              <CheckCircle size={13} /> Mark Paid
            </button>
            <button
              type="button"
              onClick={() => setSelectedPayoutIds(new Set())}
              style={{ ...btnBase, color: "var(--text-muted)", borderColor: "var(--text-muted)" }}
            >
              <X size={13} /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Table + Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : selectedDetail ? "1fr 380px" : isTablet ? "1fr" : "2fr 1fr", gap: 16, alignItems: "start" }}>
        <div style={cardStyle}>
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              Recent Payout Batches
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
              MoMo and bank settlement queue in Ghana cedis.
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ width: 40, padding: "10px 8px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      style={{ cursor: "pointer", accentColor: "var(--brand-orange)" }}
                    />
                  </th>
                  {["Rider", "Amount", "Method", "Status", "Requested"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedPayouts.map((p) => {
                  const badge = statusBadgeColor(p.status);
                  const isSelected = selectedRow === p.id;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedRow(isSelected ? null : p.id)}
                      style={{
                        background: isSelected ? "color-mix(in srgb, var(--brand-orange) 8%, transparent)" : "transparent",
                        transition: "background 0.15s ease",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "color-mix(in srgb, var(--text-muted) 5%, transparent)"; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "10px 8px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedPayoutIds.has(p.id)}
                          onChange={(e) => { e.stopPropagation(); toggleId(p.id); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ cursor: "pointer", accentColor: "var(--brand-orange)" }}
                        />
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: `color-mix(in srgb, ${badge.color} 15%, var(--bg-primary))`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            color: badge.color,
                            flexShrink: 0,
                          }}>
                            {p.rider.user.fullName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{p.rider.user.fullName}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{p.rider.displayCode}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {formatMoney(p.currency, parseNumber(p.amount))}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>
                        {p.method}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: badge.bg,
                          color: badge.color,
                          textTransform: "capitalize",
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 12 }}>
                        {formatDateTime(p.requestedAt)}
                      </td>
                    </tr>
                  );
                })}
                {paginatedPayouts.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 13 }}>
                      No payout requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={paginationPage}
            totalItems={paginationTotal}
            pageSize={effectivePageSize}
            onPageChange={paginationOnChange}
          />
        </div>

        {/* Right Column: Detail Panel OR Sidebar */}
        {selectedDetail ? (
          <div style={{ ...cardStyle, position: "sticky", top: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7 }}>
                <Eye size={16} color="var(--brand-orange)" />
                Payout Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Status Badge */}
            <div style={{ marginBottom: 16 }}>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 12px",
                borderRadius: 20,
                background: statusBadgeColor(selectedDetail.status).bg,
                color: statusBadgeColor(selectedDetail.status).color,
                textTransform: "capitalize",
              }}>
                {selectedDetail.status}
              </span>
            </div>

            {/* Rider Info */}
            <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: 14, marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <User size={14} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{selectedDetail.rider.user.fullName}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{selectedDetail.rider.displayCode}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Phone size={14} color="var(--text-muted)" />
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{selectedDetail.rider.user.phoneE164}</span>
              </div>
            </div>

            {/* Payout Info */}
            <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: 14, marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <DollarSign size={13} /> Amount
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                  {formatMoney(selectedDetail.currency, parseNumber(selectedDetail.amount))}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <CreditCard size={13} /> Method
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{selectedDetail.method}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <FileText size={13} /> Destination
                </span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "right", maxWidth: 200 }}>{selectedDetail.destinationLabel}</span>
              </div>
            </div>

            {/* Wallet Info */}
            <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Wallet size={13} /> Wallet
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Available</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--success)" }}>
                    {formatMoney(selectedDetail.wallet.currency, parseNumber(selectedDetail.wallet.availableBalance))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Locked</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-orange)" }}>
                    {formatMoney(selectedDetail.wallet.currency, parseNumber(selectedDetail.wallet.lockedBalance))}
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: 14, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={12} /> Requested
                </span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{formatDateTime(selectedDetail.requestedAt)}</span>
              </div>
              {selectedDetail.reviewedAt && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Reviewed</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{formatDateTime(selectedDetail.reviewedAt)}</span>
                </div>
              )}
              {selectedDetail.paidAt && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Paid</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{formatDateTime(selectedDetail.paidAt)}</span>
                </div>
              )}
              {selectedDetail.reviewer && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Reviewer</span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{selectedDetail.reviewer.fullName}</span>
                </div>
              )}
              {selectedDetail.rejectionReason && (
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Reason</span>
                  <span style={{ fontSize: 12, color: "var(--danger)", textAlign: "right" }}>
                    {selectedDetail.rejectionReason}
                  </span>
                </div>
              )}
            </div>

            {(() => {
              const provider = readPayoutProviderMeta(selectedDetail.metadata);
              if (!provider?.provider) return null;
              return (
                <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: 14, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Provider ({provider.provider})
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Transfer status</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {provider.transferStatus ?? "—"}
                    </span>
                  </div>
                  {provider.momoBankCode ? (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>MoMo telco</span>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{provider.momoBankCode}</span>
                    </div>
                  ) : null}
                  {provider.transferReference ? (
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Reference</span>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                        {provider.transferReference}
                      </span>
                    </div>
                  ) : null}
                  {provider.lastError ? (
                    <div style={{ fontSize: 12, color: "var(--danger)" }}>{provider.lastError}</div>
                  ) : null}
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {canPayoutAction(selectedDetail.status, "mark_reviewing") && (
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => handleAction(selectedDetail.id, "mark_reviewing")}
                    style={{
                      ...btnBase,
                      width: "100%",
                      justifyContent: "center",
                      opacity: isMutating ? 0.5 : 1,
                      cursor: isMutating ? "not-allowed" : "pointer",
                    }}
                  >
                    Mark Reviewing
                  </button>
              )}
              {canPayoutAction(selectedDetail.status, "approve") && (
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => handleAction(selectedDetail.id, "approve")}
                    style={{
                      ...btnBase,
                      width: "100%",
                      justifyContent: "center",
                      color: "var(--success)",
                      borderColor: "var(--success)",
                      opacity: isMutating ? 0.5 : 1,
                      cursor: isMutating ? "not-allowed" : "pointer",
                    }}
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
              )}
              {canPayoutAction(selectedDetail.status, "reject") && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      placeholder="Rejection reason..."
                      value={payoutRejectionReasons[selectedDetail.id] ?? ""}
                      onChange={(e) => onRejectionReasonChange(selectedDetail.id, e.target.value)}
                      style={{ ...inputStyle, flex: 1, fontSize: 12 }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--danger)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                    />
                    <button
                      type="button"
                      disabled={isMutating || !payoutRejectionReasons[selectedDetail.id]?.trim()}
                      onClick={() => handleAction(selectedDetail.id, "reject", payoutRejectionReasons[selectedDetail.id])}
                      style={{
                        ...btnBase,
                        color: "var(--danger)",
                        borderColor: "var(--danger)",
                        opacity: isMutating || !payoutRejectionReasons[selectedDetail.id]?.trim() ? 0.5 : 1,
                        cursor: isMutating || !payoutRejectionReasons[selectedDetail.id]?.trim() ? "not-allowed" : "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
              )}
              {canPayoutAction(selectedDetail.status, "mark_processing") && (
                  <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => handleAction(selectedDetail.id, "mark_processing")}
                    style={{
                      ...btnBase,
                      width: "100%",
                      justifyContent: "center",
                      opacity: isMutating ? 0.5 : 1,
                      cursor: isMutating ? "not-allowed" : "pointer",
                    }}
                  >
                    <Cog size={14} />{" "}
                    {selectedDetail.method.toUpperCase() === "MOBILE_MONEY"
                      ? "Start disbursement"
                      : "Mark Processing"}
                  </button>
              )}
              {canPayoutAction(selectedDetail.status, "mark_paid") && (
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={() => handleAction(selectedDetail.id, "mark_paid")}
                  style={{
                    ...btnBase,
                    width: "100%",
                    justifyContent: "center",
                    color: "var(--success)",
                    borderColor: "var(--success)",
                    opacity: isMutating ? 0.5 : 1,
                    cursor: isMutating ? "not-allowed" : "pointer",
                  }}
                >
                  <CheckCircle size={14} /> Mark Paid
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={cardStyle}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <CreditCard size={16} color="var(--brand-orange)" />
                Method Breakdown
              </h3>
              <p style={{ margin: "3px 0 14px", fontSize: 12, color: "var(--text-muted)" }}>
                Ready-for-payout distribution by MoMo / bank channel (GHS)
              </p>
              {riderPayoutMethodSnapshot.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>No method data available.</div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <div style={{ position: "relative", width: 110, height: 110 }}>
                      <svg width={110} height={110} viewBox={`0 0 ${donutRadius * 2} ${donutRadius * 2}`}>
                        {donutSegments.map((seg) => (
                          <circle
                            key={seg.method}
                            cx={donutRadius}
                            cy={donutRadius}
                            r={donutRadius - donutStroke / 2}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth={donutStroke}
                            strokeDasharray={`${seg.len} ${donutCircumference - seg.len}`}
                            strokeDashoffset={-seg.offset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${donutRadius} ${donutRadius})`}
                            style={{ transition: "all 0.4s ease" }}
                          />
                        ))}
                      </svg>
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                          {formatMoney(adminCurrency, riderPayoutMethodTotal)}
                        </span>
                        <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Total</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {riderPayoutMethodSnapshot.map(([method, amount], i) => (
                      <div key={method} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: donutColors[i % donutColors.length], display: "inline-block" }} />
                          {method}
                        </span>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                          {formatMoney(adminCurrency, amount)}
                          <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>
                            {riderPayoutMethodTotal > 0 ? Math.round((amount / riderPayoutMethodTotal) * 100) : 0}%
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Failed Requests */}
            {failedRiderPayouts.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <AlertTriangle size={16} color="var(--danger)" />
                  Failed Requests
                </h3>
                <p style={{ margin: "3px 0 14px", fontSize: 12, color: "var(--text-muted)" }}>Requires follow-up action</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {failedRiderPayouts.map((p) => {
                    const badge = statusBadgeColor(p.status);
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedRow(p.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          background: "var(--bg-primary)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--danger)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{p.rider.user.fullName}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatDateTime(p.requestedAt)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: badge.bg,
                            color: badge.color,
                            textTransform: "capitalize",
                          }}>
                            {p.status}
                          </span>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", marginTop: 3 }}>
                            {formatMoney(p.currency, parseNumber(p.amount))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
