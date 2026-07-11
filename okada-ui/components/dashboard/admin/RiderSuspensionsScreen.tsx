import { useState, useMemo } from "react";
import {
  Shield,
  Clock,
  CheckCircle,
  Hourglass,
  Search,
  MoreVertical,
  X,
  Mail,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import { useAdminToast } from "./AdminToast";
import { SkeletonKPI, SkeletonTable } from "./AdminSkeleton";
import { useBreakpoint } from "../../../hooks/use-breakpoint";

export type RiderSuspensionsScreenProps = {
  suspendedRiders: {
    id: string;
    displayCode: string;
    onlineStatus: boolean;
    user: { fullName: string; email?: string | null; phoneE164: string; accountStatus?: string };
    vehicle?: { plateNumber: string } | null;
    serviceZone?: { name: string } | null;
    createdAt?: string;
  }[];
  totalRiders: number;
  onSuspensionAction?: (riderProfileId: string, action: "suspend" | "reinstate" | "extend" | "warn", reason?: string) => void;
  isMutating?: boolean;
  dataLoading?: boolean;
};

const TABS = ["All Suspensions", "Active", "Expired", "Reinstated"] as const;
type TabKey = (typeof TABS)[number];
const PAGE_SIZE = 8;

function getSuspensionData(accountStatus?: string) {
  if (accountStatus === "SUSPENDED") {
    return {
      reason: "Policy violation",
      description: "Rider violated platform policies. Pending review and appeal.",
      duration: "30 days",
      status: "Active",
      suspendedOn: "May 31, 2024",
      endsOn: "Jun 30, 2024",
    };
  }
  return {
    reason: "Multiple complaints",
    description: "Three or more passenger complaints received within 30 days.",
    duration: "7 days",
    status: "Reinstated",
    suspendedOn: "May 15, 2024",
    endsOn: "May 22, 2024",
  };
}

function getStatusStyle(status: string) {
  if (status === "Active") return { background: "rgba(245,158,11,0.15)", color: "#f59e0b" };
  if (status === "Expired") return { background: "rgba(107,114,128,0.15)", color: "#9ca3af" };
  return { background: "rgba(16,185,129,0.15)", color: "#10b981" };
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(245,158,11,0.2)",
        color: "#f59e0b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

export function RiderSuspensionsScreen({
  suspendedRiders,
  totalRiders,
  onSuspensionAction,
  isMutating = false,
  dataLoading = false,
}: RiderSuspensionsScreenProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("All Suspensions");
  const [searchQuery, setSearchQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState("All Reasons");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [durationFilter, setDurationFilter] = useState("All Durations");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSuspension, setSelectedSuspension] = useState<string | null>(null);

  const { isMobile, isTablet } = useBreakpoint();
  const { addToast } = useAdminToast();

  const tabFiltered = useMemo(() => {
    if (activeTab === "Active")
      return suspendedRiders.filter((r) => r.user.accountStatus === "SUSPENDED");
    if (activeTab === "Expired")
      return suspendedRiders.filter(
        (r) => r.user.accountStatus !== "SUSPENDED" && r.user.accountStatus !== "REINSTATED"
      );
    if (activeTab === "Reinstated")
      return suspendedRiders.filter((r) => r.user.accountStatus === "REINSTATED");
    return suspendedRiders;
  }, [activeTab, suspendedRiders]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return tabFiltered;
    const q = searchQuery.toLowerCase();
    return tabFiltered.filter(
      (r) =>
        r.user.fullName.toLowerCase().includes(q) ||
        r.user.phoneE164.includes(q) ||
        r.displayCode.toLowerCase().includes(q)
    );
  }, [tabFiltered, searchQuery]);

  if (dataLoading) {
    return (
      <div style={{ padding: "24px 28px", minHeight: "100vh", display: "flex", flexDirection: "column", gap: 20 }}>
        <SkeletonKPI count={4} />
        <SkeletonTable rows={5} cols={5} />
      </div>
    );
  }

  const selectedRider = suspendedRiders.find((r) => r.id === selectedSuspension);

  const activeCount = suspendedRiders.filter(
    (r) => r.user.accountStatus === "SUSPENDED"
  ).length;
  const reinstatedCount = suspendedRiders.filter(
    (r) => r.user.accountStatus === "REINSTATED"
  ).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedSuspension(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const suspDetails = selectedRider ? getSuspensionData(selectedRider.user.accountStatus) : null;

  const suspensionHistory = [
    { event: "Suspended", date: "May 31, 2024 · 09:30 AM", reason: "Safety violation" },
    { event: "Warning Sent", date: "May 25, 2024 · 02:15 PM", reason: "Speeding" },
  ];

  const handleSendWarning = () => {
    const rider = filtered.find((r) => r.id === selectedSuspension);
    if (onSuspensionAction && rider) {
      onSuspensionAction(rider.id, "warn");
    } else {
      addToast("Warning Sent", "success");
    }
  };

  const handleAddNote = () => {
    addToast("Note Added", "success");
  };

  const handleReinstate = () => {
    const rider = filtered.find((r) => r.id === selectedSuspension);
    if (onSuspensionAction && rider) {
      onSuspensionAction(rider.id, "reinstate");
    } else {
      addToast("Rider Reinstated", "success");
    }
  };

  const handleExtend = () => {
    const rider = filtered.find((r) => r.id === selectedSuspension);
    if (onSuspensionAction && rider) {
      onSuspensionAction(rider.id, "extend");
    } else {
      addToast("Suspension Extended", "warning");
    }
  };

  return (
    <div style={{ padding: isMobile ? "16px 12px" : 24, background: "#0f1117", minHeight: "100vh", color: "#e5e7eb", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* ── KPI Row ── */}
      <section style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {/* Total Suspended */}
        <article style={{ background: "#1e2028", borderRadius: 14, padding: "18px 20px", border: "1px solid #2a2d35", display: "flex", alignItems: "center", gap: 14, transition: "border-color 0.2s, box-shadow 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.boxShadow = "0 0 16px rgba(239,68,68,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2d35"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(239,68,68,0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>Total Suspended</div>
            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{suspendedRiders.length}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>All time suspensions</div>
          </div>
        </article>

        {/* Currently Suspended */}
        <article style={{ background: "#1e2028", borderRadius: 14, padding: "18px 20px", border: "1px solid #2a2d35", display: "flex", alignItems: "center", gap: 14, transition: "border-color 0.2s, box-shadow 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; e.currentTarget.style.boxShadow = "0 0 16px rgba(245,158,11,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2d35"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(245,158,11,0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>Currently Suspended</div>
            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{activeCount}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Active restrictions</div>
          </div>
        </article>

        {/* Reinstated */}
        <article style={{ background: "#1e2028", borderRadius: 14, padding: "18px 20px", border: "1px solid #2a2d35", display: "flex", alignItems: "center", gap: 14, transition: "border-color 0.2s, box-shadow 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)"; e.currentTarget.style.boxShadow = "0 0 16px rgba(16,185,129,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2d35"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(16,185,129,0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>Reinstated</div>
            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{reinstatedCount}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Access restored</div>
          </div>
        </article>

        {/* Avg Duration */}
        <article style={{ background: "#1e2028", borderRadius: 14, padding: "18px 20px", border: "1px solid #2a2d35", display: "flex", alignItems: "center", gap: 14, transition: "border-color 0.2s, box-shadow 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; e.currentTarget.style.boxShadow = "0 0 16px rgba(139,92,246,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2d35"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(139,92,246,0.15)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Hourglass size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 2 }}>Avg Duration</div>
            <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>7d 4h</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Per suspension event</div>
          </div>
        </article>
      </section>

      {/* ── Split Layout ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 320px" : selectedSuspension ? "1fr 400px" : "1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* ── LEFT: List Panel ── */}
        <article style={{ background: "#1e2028", borderRadius: 16, border: "1px solid #2a2d35", padding: 20, minWidth: 0 }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #2a2d35", marginBottom: 20, overflowX: "auto" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? "#f59e0b" : "#9ca3af",
                  borderBottom: activeTab === tab ? "2px solid #f59e0b" : "2px solid transparent",
                  marginBottom: -1,
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
            {/* Search */}
            <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Search rider..."
                value={searchQuery}
                onChange={handleSearch}
                style={{
                  background: "#0f1117",
                  border: "1px solid #2a2d35",
                  borderRadius: 8,
                  padding: "8px 10px 8px 32px",
                  color: "#e5e7eb",
                  fontSize: 13,
                  width: "100%",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#f59e0b"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#2a2d35"; }}
              />
            </div>

            {/* Reason Filter */}
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              style={{
                background: "#0f1117",
                border: "1px solid #2a2d35",
                borderRadius: 8,
                padding: "8px 10px",
                color: "#9ca3af",
                fontSize: 13,
                cursor: "pointer",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#f59e0b"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2a2d35"; }}
            >
              <option>All Reasons</option>
              <option>Policy violation</option>
              <option>Multiple complaints</option>
              <option>Safety violation</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: "#0f1117",
                border: "1px solid #2a2d35",
                borderRadius: 8,
                padding: "8px 10px",
                color: "#9ca3af",
                fontSize: 13,
                cursor: "pointer",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#f59e0b"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2a2d35"; }}
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Expired</option>
              <option>Reinstated</option>
            </select>

            {/* Duration Filter */}
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              style={{
                background: "#0f1117",
                border: "1px solid #2a2d35",
                borderRadius: 8,
                padding: "8px 10px",
                color: "#9ca3af",
                fontSize: 13,
                cursor: "pointer",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#f59e0b"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2a2d35"; }}
            >
              <option>All Durations</option>
              <option>7 days</option>
              <option>14 days</option>
              <option>30 days</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Rider", "Reason", "Duration", "Status", "Suspended On", "Ends On", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: 0.05,
                        borderBottom: "1px solid #2a2d35",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", color: "#6b7280", padding: 32 }}>
                      <AlertTriangle size={20} style={{ marginBottom: 6, opacity: 0.5 }} />
                      <div style={{ fontSize: 13 }}>No suspensions found.</div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((rider) => {
                    const susp = getSuspensionData(rider.user.accountStatus);
                    const isSelected = selectedSuspension === rider.id;
                    return (
                      <tr
                        key={rider.id}
                        onClick={() => setSelectedSuspension(isSelected ? null : rider.id)}
                        style={{
                          cursor: "pointer",
                          background: isSelected ? "rgba(245,158,11,0.06)" : "transparent",
                          borderLeft: isSelected ? "3px solid #f59e0b" : "3px solid transparent",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                      >
                        {/* Rider */}
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1f2130" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={rider.user.fullName} size={34} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: "#e5e7eb" }}>{rider.user.fullName}</div>
                              <div style={{ color: "#6b7280", fontSize: 11 }}>{rider.user.phoneE164}</div>
                              <div style={{ color: "#6b7280", fontSize: 11 }}>
                                <code style={{ fontSize: 10, opacity: 0.7, color: "#9ca3af" }}>{rider.displayCode}</code>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Reason */}
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1f2130" }}>
                          <span style={{ fontSize: 13, color: "#d1d5db" }}>{susp.reason}</span>
                        </td>

                        {/* Duration */}
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1f2130" }}>
                          <span style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                            {susp.duration}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1f2130" }}>
                          <span style={{ ...getStatusStyle(susp.status), borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                            {susp.status}
                          </span>
                        </td>

                        {/* Suspended On */}
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1f2130" }}>
                          <span style={{ fontSize: 12, color: "#9ca3af" }}>{susp.suspendedOn}</span>
                        </td>

                        {/* Ends On */}
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1f2130" }}>
                          <span style={{ fontSize: 12, color: "#9ca3af" }}>{susp.endsOn}</span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1f2130", textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "#9ca3af",
                              padding: 4,
                              borderRadius: 6,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "color 0.15s, background 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "#e5e7eb"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; }}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid #2a2d35" }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    background: currentPage === 1 ? "#2a2d35" : "#1f2130",
                    color: currentPage === 1 ? "#6b7280" : "#e5e7eb",
                    border: "1px solid #2a2d35",
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: currentPage === 1 ? "default" : "pointer",
                    opacity: currentPage === 1 ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  ‹ Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    style={{
                      background: p === currentPage ? "#f59e0b" : "#1f2130",
                      color: p === currentPage ? "#000" : "#e5e7eb",
                      border: `1px solid ${p === currentPage ? "#f59e0b" : "#2a2d35"}`,
                      borderRadius: 6,
                      padding: "5px 10px",
                      fontSize: 12,
                      fontWeight: p === currentPage ? 700 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { if (p !== currentPage) { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.color = "#f59e0b"; } }}
                    onMouseLeave={(e) => { if (p !== currentPage) { e.currentTarget.style.borderColor = "#2a2d35"; e.currentTarget.style.color = "#e5e7eb"; } }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    background: currentPage === totalPages ? "#2a2d35" : "#1f2130",
                    color: currentPage === totalPages ? "#6b7280" : "#e5e7eb",
                    border: "1px solid #2a2d35",
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: currentPage === totalPages ? "default" : "pointer",
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </article>

        {/* ── RIGHT: Detail Panel ── */}
        {selectedRider && suspDetails && (
          <div
            style={{
              background: "#1e2028",
              borderRadius: 16,
              padding: 24,
              border: "1px solid #2a2d35",
              position: "sticky",
              top: 24,
              maxHeight: "calc(100vh - 48px)",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f3f4f6" }}>Suspension Details</h3>
              <button
                type="button"
                onClick={() => setSelectedSuspension(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                  borderRadius: 6,
                  transition: "color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#e5e7eb"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Rider Info */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #2a2d35" }}>
              <Avatar name={selectedRider.user.fullName} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#f3f4f6" }}>{selectedRider.user.fullName}</div>
                <div style={{ color: "#9ca3af", fontSize: 12 }}>{selectedRider.user.phoneE164}</div>
              </div>
              <button
                type="button"
                style={{
                  background: "#f59e0b",
                  color: "#000",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#d97706"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#f59e0b"; }}
              >
                View Rider Profile
              </button>
            </div>

            {/* Detail Rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #2a2d35" }}>
              {/* Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Status</span>
                <span style={{ ...getStatusStyle(suspDetails.status), borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                  {suspDetails.status}
                </span>
              </div>

              {/* Reason */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>Reason</span>
                  <span style={{ fontSize: 13, fontWeight: 600, textAlign: "right", maxWidth: "60%", color: "#e5e7eb" }}>
                    {suspDetails.reason}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", fontStyle: "italic", marginTop: 4, lineHeight: 1.5 }}>
                  {suspDetails.description}
                </div>
              </div>

              {/* Duration */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Duration</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e5e7eb" }}>{suspDetails.duration}</span>
              </div>

              {/* Suspended On */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Suspended On</span>
                <span style={{ fontSize: 13, color: "#d1d5db" }}>{suspDetails.suspendedOn}</span>
              </div>

              {/* Ends On */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Ends On</span>
                <span style={{ fontSize: 13, color: "#d1d5db" }}>{suspDetails.endsOn}</span>
              </div>

              {/* Suspended By */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Suspended By</span>
                <span style={{ fontSize: 13, color: "#d1d5db" }}>Admin (Super Admin)</span>
              </div>

              {/* Evidence */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Evidence</span>
                <button
                  type="button"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#f59e0b",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: 0,
                    textDecoration: "underline",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#fbbf24"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#f59e0b"; }}
                >
                  View Evidence (2)
                </button>
              </div>
            </div>

            {/* Rider Actions */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={handleSendWarning}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid #2a2d35",
                  borderRadius: 8,
                  padding: "9px 12px",
                  color: "#e5e7eb",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.color = "#f59e0b"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2d35"; e.currentTarget.style.color = "#e5e7eb"; }}
              >
                <Mail size={14} />
                Send Warning
              </button>
              <button
                type="button"
                onClick={handleAddNote}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid #2a2d35",
                  borderRadius: 8,
                  padding: "9px 12px",
                  color: "#e5e7eb",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.color = "#f59e0b"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2d35"; e.currentTarget.style.color = "#e5e7eb"; }}
              >
                <ClipboardList size={14} />
                Add Note
              </button>
            </div>

            {/* Reinstate Rider */}
            <button
              type="button"
              onClick={handleReinstate}
              style={{
                width: "100%",
                background: "rgba(16,185,129,0.15)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 8,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.25)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.15)"; e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)"; }}
            >
              Reinstate Rider
            </button>

            {/* Extend Suspension */}
            <button
              type="button"
              onClick={handleExtend}
              style={{
                width: "100%",
                background: "transparent",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 24,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.6)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
            >
              Extend Suspension
            </button>

            {/* Suspension History */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#f3f4f6", marginBottom: 4, paddingBottom: 10, borderBottom: "1px solid #2a2d35" }}>
                Suspension History
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 16, position: "relative" }}>
                {/* Timeline line */}
                <div style={{ position: "absolute", left: 4, top: 8, bottom: 8, width: 2, background: "#2a2d35" }} />
                {suspensionHistory.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", position: "relative", paddingBottom: i < suspensionHistory.length - 1 ? 20 : 0 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: i === 0 ? "#f59e0b" : "#6b7280",
                        border: i === 0 ? "2px solid rgba(245,158,11,0.3)" : "2px solid transparent",
                        flexShrink: 0,
                        marginTop: 4,
                        zIndex: 1,
                        boxShadow: i === 0 ? "0 0 8px rgba(245,158,11,0.3)" : "none",
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#e5e7eb" }}>{h.event}</div>
                      <div style={{ color: "#9ca3af", fontSize: 12 }}>{h.date}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>
                        Reason: {h.reason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
