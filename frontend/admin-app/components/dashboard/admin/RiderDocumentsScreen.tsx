import { useState } from "react";
import { ClipboardList, CheckCircle, AlertTriangle, XCircle, Search } from "lucide-react";
import { useAdminToast } from "./AdminToast";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";

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

const STATUS_OPTIONS = ["All", "Compliant", "Expiring Soon", "Expired", "Missing", "Pending"] as const;

const statusColor: Record<string, string> = {
  Compliant: "#22c55e",
  "Expiring Soon": "#f59e0b",
  Expired: "#ef4444",
  Missing: "#f87171",
  Pending: "#94a3b8",
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
    fileUrl?: string;
  }[];
  riderDocumentStats: {
    total: number;
    compliant: number;
    expiringSoon: number;
    expired: number;
    missing: number;
  };
  onDocumentReview?: (documentId: string, status: "APPROVED" | "REJECTED" | "EXPIRED", notes?: string) => void;
  isMutating?: boolean;
  dataLoading?: boolean;
};

export function RiderDocumentsScreen({
  riderDocumentRows,
  riderDocumentStats,
  onDocumentReview,
  isMutating = false,
  dataLoading = false,
}: RiderDocumentsScreenProps) {
  const { addToast } = useAdminToast();
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={5} rows={5} cols={5} />;
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

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Rider Documents"
        subtitle="Accra licences, national IDs, and expiry readiness for Ghana ops."
      />

      <AdminKpiRow
        items={[
          {
            label: "Total Documents",
            value: riderDocumentStats.total,
            hint: "All rider files",
            icon: <ClipboardList size={22} />,
            tone: "yellow",
          },
          {
            label: "Compliant",
            value: riderDocumentStats.compliant,
            hint: "Valid for Accra ops",
            icon: <CheckCircle size={22} />,
            tone: "green",
          },
          {
            label: "Expiring Soon",
            value: riderDocumentStats.expiringSoon,
            hint: "Renewal needed",
            icon: <AlertTriangle size={22} />,
            tone: "yellow",
          },
          {
            label: "Expired",
            value: riderDocumentStats.expired,
            hint: `${riderDocumentStats.missing} missing`,
            icon: <XCircle size={22} />,
            tone: "red",
          },
        ]}
      />

      <div className="admin-tabs" style={{ overflowX: "auto" }}>
        {DOCUMENT_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`admin-tab${activeTab === tab ? " active" : ""}`}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="admin-filter-bar">
        <label className="admin-filter-search">
          <Search size={14} aria-hidden />
          <input
            type="search"
            placeholder="Search by name, code, phone, or doc number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </label>
        <select
          className="admin-select-sm"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {filtered.length} document{filtered.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyCard
          title="No document records."
          body="No Accra riders match your current filters. Try adjusting your search or filters."
        />
      ) : (
        <article className="admin-reference-card">
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
                          disabled={!row.fileUrl}
                          onClick={() => {
                            if (!row.fileUrl) {
                              addToast("No file URL on this document", "error");
                              return;
                            }
                            window.open(row.fileUrl, "_blank", "noopener,noreferrer");
                          }}
                        >
                          View
                        </button>
                        <button
                          style={styles.actionBtn}
                          disabled={isMutating || row.status === "Compliant"}
                          onClick={() => {
                            if (!onDocumentReview) {
                              addToast("Document review is unavailable", "error");
                              return;
                            }
                            onDocumentReview(row.id, "APPROVED");
                          }}
                        >
                          Approve
                        </button>
                        <button
                          style={{ ...styles.actionBtn, opacity: 0.85 }}
                          disabled={isMutating}
                          onClick={() => {
                            if (!onDocumentReview) {
                              addToast("Document review is unavailable", "error");
                              return;
                            }
                            onDocumentReview(row.id, "REJECTED", "Rejected by ops");
                          }}
                        >
                          Reject
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
              }}
            >
              Next {"\u2192"}
            </button>
          </div>
        </article>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
