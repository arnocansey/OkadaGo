import { useState } from "react";
import { useAdminToast } from "./AdminToast";
import { EmptyCard } from "./EmptyCard";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { SkeletonKPI, SkeletonTable } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";

const DOCUMENT_TABS = [
  "All",
  "License",
  "Insurance",
  "Registration",
  "National ID",
  "Medical",
  "Background Check",
] as const;

const ITEMS_PER_PAGE = 8;

const STATUS_OPTIONS = ["All", "Compliant", "Expiring Soon", "Expired", "Missing"] as const;

const statusColor: Record<string, string> = {
  Compliant: "#22c55e",
  "Expiring Soon": "#f59e0b",
  Expired: "#ef4444",
  Missing: "#f87171",
};

export type RiderDocumentsScreenProps = {
  riderDocumentRows: {
    id: string;
    riderName: string;
    displayCode: string;
    phone: string;
    documentType: string;
    documentNumber: string;
    status: string;
    expiryDate: string;
    daysLeft: string;
  }[];
  riderDocumentStats: {
    total: number;
    compliant: number;
    expiringSoon: number;
    expired: number;
    missing: number;
  };
  dataLoading?: boolean;
};

export function RiderDocumentsScreen({
  riderDocumentRows,
  riderDocumentStats,
  dataLoading = false,
}: RiderDocumentsScreenProps) {
  const { addToast } = useAdminToast();
  const { isMobile, isTablet } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (dataLoading) {
    return (
      <div style={{ padding: isMobile ? "16px 12px" : "32px", minHeight: "100vh", display: "flex", flexDirection: "column", gap: 20 }}>
        <SkeletonKPI count={5} />
        <SkeletonTable rows={5} cols={5} />
      </div>
    );
  }

  const filtered = riderDocumentRows.filter((row) => {
    const matchesTab =
      activeTab === "All" ||
      row.documentType.toLowerCase().includes(activeTab.toLowerCase());
    const matchesSearch =
      searchQuery === "" ||
      row.riderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.displayCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.phone.includes(searchQuery) ||
      row.documentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || row.status === statusFilter;
    return matchesTab && matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const kpiCards = [
    {
      label: "Total Documents",
      value: riderDocumentStats.total,
      icon: "\u{1F4CB}",
      color: "var(--accent-orange)",
      bg: "var(--accent-yellow-light)",
    },
    {
      label: "Compliant",
      value: riderDocumentStats.compliant,
      icon: "\u2705",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.12)",
    },
    {
      label: "Expiring Soon",
      value: riderDocumentStats.expiringSoon,
      icon: "\u26A0\uFE0F",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
    },
    {
      label: "Expired",
      value: riderDocumentStats.expired,
      icon: "\u274C",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.12)",
    },
    {
      label: "Missing",
      value: riderDocumentStats.missing,
      icon: "\u{1F50D}",
      color: "#f87171",
      bg: "rgba(248,113,113,0.12)",
    },
  ];

  return (
    <div className="exact-admin-screen" style={{ ...styles.container, padding: isMobile ? "16px 12px" : styles.container.padding }}>
      <AdminPageHeader
        title="Rider Documents"
        subtitle="Track rider document readiness and missing operational requirements from live records."
      />

      {/* KPI Cards */}
      <div style={{ ...styles.kpiGrid, gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : styles.kpiGrid.gridTemplateColumns }}>
        {kpiCards.map((kpi) => (
          <div key={kpi.label} style={styles.kpiCard}>
            <div
              style={{
                ...styles.kpiIcon,
                background: kpi.bg,
                color: kpi.color,
              }}
            >
              {kpi.icon}
            </div>
            <div style={styles.kpiContent}>
              <span style={styles.kpiLabel}>{kpi.label}</span>
              <strong style={styles.kpiValue}>{kpi.value}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ ...styles.tabBar, overflowX: "auto" }}>
        {DOCUMENT_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
              addToast(`Filtered to ${tab} documents`);
            }}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
              }
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={styles.filterRow}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>{"\u{1F50D}"}</span>
          <input
            type="text"
            placeholder="Search by name, code, phone, or doc number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.searchInput}
            onFocus={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "var(--accent-orange)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLInputElement).style.borderColor =
                "rgba(255,255,255,0.08)";
            }}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
              addToast(`Status filter: ${e.target.value}`);
            }}
            style={styles.select}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.resultCount}>
          <span style={styles.resultText}>
            {filtered.length} document{filtered.length !== 1 ? "s" : ""} found
          </span>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyCard
          title="No document records."
          body="No riders match your current filters. Try adjusting your search or filters."
        />
      ) : (
        <>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Rider</th>
                  <th style={styles.th}>Document Type</th>
                  <th style={styles.th}>Document Number</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Expiry Date</th>
                  <th style={styles.th}>Days Left</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      ...styles.tr,
                      ...(hoveredRow === row.id ? styles.trHover : {}),
                    }}
                    onMouseEnter={() => setHoveredRow(row.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={styles.td}>
                      <div style={styles.riderCell}>
                        <strong style={styles.riderName}>{row.riderName}</strong>
                        <span style={styles.riderMeta}>
                          {row.displayCode} &middot; {row.phone}
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.docTypeBadge}>{row.documentType}</span>
                    </td>
                    <td style={styles.td}>
                      <code style={styles.docNumber}>{row.documentNumber}</code>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          background: `${
                            statusColor[row.status] || "#94a3b8"
                          }20`,
                          color: statusColor[row.status] || "#94a3b8",
                          border: `1px solid ${
                            statusColor[row.status] || "#94a3b8"
                          }40`,
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.dateText}>{row.expiryDate}</span>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.daysLeft,
                          color:
                            Number(row.daysLeft) <= 30
                              ? "#f59e0b"
                              : Number(row.daysLeft) <= 7
                              ? "#ef4444"
                              : "#22c55e",
                        }}
                      >
                        {row.daysLeft}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionGroup}>
                        <button
                          style={styles.actionBtn}
                          onClick={() =>
                            addToast(`Viewing document for ${row.riderName}`)
                          }
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              "color-mix(in srgb, var(--accent-orange) 20%, transparent)";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "var(--accent-orange)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              "var(--accent-yellow-light)";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "var(--accent-orange)";
                          }}
                        >
                          View
                        </button>
                        <button
                          style={styles.actionBtn}
                          onClick={() =>
                            addToast(`Sending reminder to ${row.riderName}`)
                          }
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              "rgba(245,158,11,0.2)";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "#fbbf24";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              "rgba(245,158,11,0.1)";
                            (e.currentTarget as HTMLButtonElement).style.color =
                              "#f59e0b";
                          }}
                        >
                          Remind
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={styles.paginationRow}>
            <button
              style={{
                ...styles.pageBtn,
                ...(safePage === 1 ? styles.pageBtnDisabled : {}),
              }}
              disabled={safePage === 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                addToast("Previous page");
              }}
            >
              {"\u2190"} Prev
            </button>
            <div style={styles.pageNumbers}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      addToast(`Page ${page}`);
                    }}
                    style={{
                      ...styles.pageNum,
                      ...(page === safePage ? styles.pageNumActive : {}),
                    }}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              style={{
                ...styles.pageBtn,
                ...(safePage === totalPages ? styles.pageBtnDisabled : {}),
              }}
              disabled={safePage === totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                addToast("Next page");
              }}
            >
              Next {"\u2192"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "32px",
    minHeight: "100vh",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-family)",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "16px",
    marginBottom: "32px",
  },
  kpiCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    transition: "all 0.2s ease",
  },
  kpiIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },
  kpiContent: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  kpiLabel: {
    fontSize: "12px",
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  kpiValue: {
    fontSize: "28px",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  tabBar: {
    display: "flex",
    gap: "4px",
    marginBottom: "24px",
    padding: "4px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.04)",
    overflowX: "auto",
  },
  tab: {
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--text-muted)",
    background: "transparent",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap" as const,
  },
  tabActive: {
    background: "var(--accent-yellow-light)",
    color: "var(--accent-orange)",
    boxShadow: "0 0 0 1px color-mix(in srgb, var(--accent-orange) 30%, transparent)",
  },
  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap" as const,
  },
  searchWrapper: {
    position: "relative" as const,
    flex: "1 1 300px",
  },
  searchIcon: {
    position: "absolute" as const,
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "14px",
    pointerEvents: "none" as const,
  },
  searchInput: {
    width: "100%",
    padding: "12px 16px 12px 40px",
    fontSize: "14px",
    color: "var(--text-primary)",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    outline: "none",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box" as const,
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  filterLabel: {
    fontSize: "13px",
    color: "var(--text-muted)",
    whiteSpace: "nowrap" as const,
  },
  select: {
    padding: "10px 14px",
    fontSize: "13px",
    color: "var(--text-primary)",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    outline: "none",
    cursor: "pointer",
    minWidth: "140px",
  },
  resultCount: {
    marginLeft: "auto",
  },
  resultText: {
    fontSize: "13px",
    color: "var(--text-muted)",
  },
  tableWrapper: {
    overflowX: "auto" as const,
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    marginBottom: "24px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "14px",
  },
  th: {
    padding: "14px 16px",
    textAlign: "left" as const,
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    whiteSpace: "nowrap" as const,
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    transition: "background 0.15s ease",
  },
  trHover: {
    background: "color-mix(in srgb, var(--accent-orange) 4%, transparent)",
  },
  td: {
    padding: "14px 16px",
    verticalAlign: "middle" as const,
  },
  riderCell: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  riderName: {
    color: "var(--text-primary)",
    fontWeight: 600,
  },
  riderMeta: {
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  docTypeBadge: {
    display: "inline-block",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 500,
    color: "var(--accent-yellow)",
    background: "var(--accent-yellow-light)",
    borderRadius: "6px",
    border: "1px solid color-mix(in srgb, var(--accent-yellow) 20%, transparent)",
  },
  docNumber: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "var(--text-muted)",
    background: "rgba(255,255,255,0.04)",
    padding: "3px 8px",
    borderRadius: "4px",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 12px",
    fontSize: "12px",
    fontWeight: 600,
    borderRadius: "20px",
  },
  dateText: {
    fontSize: "13px",
    color: "var(--text-muted)",
  },
  daysLeft: {
    fontSize: "14px",
    fontWeight: 600,
  },
  actionGroup: {
    display: "flex",
    gap: "6px",
  },
  actionBtn: {
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: 500,
    background: "var(--accent-yellow-light)",
    color: "var(--accent-orange)",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  paginationRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
  },
  pageBtn: {
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--text-primary)",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  pageBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  pageNumbers: {
    display: "flex",
    gap: "4px",
  },
  pageNum: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--text-muted)",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  pageNumActive: {
    background: "var(--accent-yellow-light)",
    color: "var(--accent-orange)",
    border: "1px solid color-mix(in srgb, var(--accent-orange) 30%, transparent)",
  },
};
