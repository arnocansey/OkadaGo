import { useState } from "react";
import { Star, Filter, Download } from "lucide-react";
import { downloadCsv } from "@/lib/export-csv";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { useAdminToast } from "./AdminToast";
import { EmptyCard } from "./EmptyCard";
import { SkeletonKPI, SkeletonTable, SkeletonDonut } from "./AdminSkeleton";
import type { AdminRatingRecord, AdminIncidentRecord } from "./types";
import { formatDateTime } from "./utils";

export type RatingsScreenProps = {
  ratings: AdminRatingRecord[];
  incidents: AdminIncidentRecord[];
  riderRatingAverage: number;
  riderRatingDistribution: { score: number; count: number }[];
  ratingRiderFilter: string;
  ratingRideFilter: string;
  ratingFromDateFilter: string;
  ratingToDateFilter: string;
  onRiderFilterChange: (v: string) => void;
  onRideFilterChange: (v: string) => void;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  dataLoading?: boolean;
};

const PAGE_SIZE = 8;

const s = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
    padding: 24,
    background: "#0d0f12",
    minHeight: "100%",
    color: "#e4e4e7",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 14,
  },
  kpi: {
    background: "#181a1e",
    border: "1px solid #27292d",
    borderRadius: 12,
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  kpiIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiLabel: {
    fontSize: 12,
    color: "#a1a1aa",
    letterSpacing: 0.3,
    textTransform: "uppercase" as const,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.1,
    color: "#f4f4f5",
  },
  kpiSub: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 2,
  },
  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#181a1e",
    border: "1px solid #27292d",
    borderRadius: 10,
    padding: "10px 14px",
    flexWrap: "wrap" as const,
  },
  input: {
    background: "#27292d",
    border: "1px solid #3f4147",
    borderRadius: 8,
    padding: "7px 12px",
    color: "#e4e4e7",
    fontSize: 13,
    outline: "none",
    width: 160,
  },
  exportBtn: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#2563eb",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 18,
    alignItems: "start",
  },
  card: {
    background: "#181a1e",
    border: "1px solid #27292d",
    borderRadius: 12,
    overflow: "hidden",
  },
  cardHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderBottom: "1px solid #27292d",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#f4f4f5",
    margin: 0,
  },
  cardSub: {
    fontSize: 12,
    color: "#71717a",
    margin: 0,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: 13,
  },
  th: {
    textAlign: "left" as const,
    padding: "10px 14px",
    background: "#1e2024",
    color: "#a1a1aa",
    fontWeight: 600,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
    borderBottom: "1px solid #27292d",
  },
  td: {
    padding: "10px 14px",
    borderBottom: "1px solid #1f2125",
    color: "#d4d4d8",
    verticalAlign: "top" as const,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "12px 18px",
    borderTop: "1px solid #27292d",
  },
  pageBtn: {
    background: "transparent",
    border: "1px solid #3f4147",
    borderRadius: 6,
    padding: "5px 11px",
    color: "#d4d4d8",
    fontSize: 12,
    cursor: "pointer",
  },
  pageBtnActive: {
    background: "#2563eb",
    border: "1px solid #2563eb",
    color: "#fff",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  distList: {
    listStyle: "none",
    margin: 0,
    padding: "12px 18px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  distItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 13,
    color: "#d4d4d8",
  },
  distBar: {
    height: 8,
    borderRadius: 4,
    minWidth: 4,
  },
  distBarWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  summaryList: {
    listStyle: "none",
    margin: 0,
    padding: "12px 18px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  summaryItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 13,
    color: "#d4d4d8",
  },
  severityBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  emptyWrap: {
    padding: 36,
    textAlign: "center" as const,
    color: "#71717a",
    fontSize: 13,
  },
} as const;

export function RatingsScreen({
  ratings,
  incidents,
  riderRatingAverage,
  riderRatingDistribution,
  ratingRiderFilter,
  ratingRideFilter,
  ratingFromDateFilter,
  ratingToDateFilter,
  onRiderFilterChange,
  onRideFilterChange,
  onFromDateChange,
  onToDateChange,
  dataLoading = false,
}: RatingsScreenProps) {
  const { isMobile, isTablet } = useBreakpoint();
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const toast = useAdminToast();

  if (dataLoading) {
    return (
      <div style={{ padding: "24px 28px", minHeight: "100vh", display: "flex", flexDirection: "column", gap: 20 }}>
        <SkeletonKPI count={4} />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 18 }}>
          <SkeletonTable rows={5} cols={5} />
          <SkeletonDonut />
        </div>
      </div>
    );
  }

  const maxRatingCount = Math.max(1, ...riderRatingDistribution.map((d) => d.count));
  const withReview = ratings.filter((r) => Boolean(r.review?.body));
  const fiveStarCount = riderRatingDistribution.find((d) => d.score === 5)?.count ?? 0;

  const totalPages = Math.max(1, Math.ceil(ratings.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRatings = ratings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleExport() {
    downloadCsv(
      "ratings.csv",
      ["Score", "Rater", "Rater Phone", "Rated Rider", "Display Code", "Category", "Review", "Date"],
      ratings.map((rating) => [
        rating.score,
        rating.rater.fullName,
        rating.rater.phoneE164,
        rating.rated.fullName,
        rating.rated.riderProfile?.displayCode ?? "",
        rating.category ?? "General",
        rating.review?.body ?? "",
        rating.createdAt,
      ])
    );
    toast.addToast("Ratings CSV exported successfully", "success");
  }

  return (
    <div style={{ ...s.root, padding: isMobile ? "16px 12px" : s.root.padding }}>
      {/* KPI Cards */}
      <div style={{ ...s.kpiRow, gridTemplateColumns: isMobile || isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)" }}>
        <div style={s.kpi}>
          <div style={{ ...s.kpiIcon, background: "#1e293b" }}>
            <Star size={20} color="#facc15" />
          </div>
          <div>
            <div style={s.kpiLabel}>Total Ratings</div>
            <div style={s.kpiValue}>{ratings.length}</div>
            <div style={s.kpiSub}>{withReview.length} with review text</div>
          </div>
        </div>
        <div style={s.kpi}>
          <div style={{ ...s.kpiIcon, background: "#0f2e1a" }}>
            <Star size={20} color="#22c55e" />
          </div>
          <div>
            <div style={s.kpiLabel}>Average Score</div>
            <div style={s.kpiValue}>{riderRatingAverage.toFixed(1)} ★</div>
            <div style={s.kpiSub}>Platform-wide</div>
          </div>
        </div>
        <div style={s.kpi}>
          <div style={{ ...s.kpiIcon, background: "#2e1f0f" }}>
            <Star size={20} color="#f59e0b" />
          </div>
          <div>
            <div style={s.kpiLabel}>Incidents</div>
            <div style={s.kpiValue}>{incidents.length}</div>
            <div style={s.kpiSub}>All severity levels</div>
          </div>
        </div>
        <div style={s.kpi}>
          <div style={{ ...s.kpiIcon, background: "#0f2e1a" }}>
            <Star size={20} color="#22c55e" />
          </div>
          <div>
            <div style={s.kpiLabel}>5-Star Ratings</div>
            <div style={s.kpiValue}>{fiveStarCount}</div>
            <div style={s.kpiSub}>Top scores</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={s.filterBar}>
        <Filter size={14} color="#71717a" />
        <input
          type="text"
          style={s.input}
          placeholder="Rider ID..."
          value={ratingRiderFilter}
          onChange={(e) => onRiderFilterChange(e.target.value)}
        />
        <input
          type="text"
          style={s.input}
          placeholder="Ride ID..."
          value={ratingRideFilter}
          onChange={(e) => onRideFilterChange(e.target.value)}
        />
        <input
          type="date"
          style={s.input}
          value={ratingFromDateFilter}
          onChange={(e) => onFromDateChange(e.target.value)}
        />
        <input
          type="date"
          style={s.input}
          value={ratingToDateFilter}
          onChange={(e) => onToDateChange(e.target.value)}
        />
        <button style={s.exportBtn} onClick={handleExport}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Main Grid */}
      <div style={{ ...s.grid2, gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 280px" : "1fr 340px" }}>
        {/* Ratings Table */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h3 style={s.cardTitle}>Rating Records</h3>
              <p style={s.cardSub}>{ratings.length} submissions</p>
            </div>
          </div>

          {ratings.length === 0 ? (
            <div style={s.emptyWrap}>
              <EmptyCard title="No ratings found." body="Rating submissions will appear here once rides are completed and rated." />
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Score</th>
                      <th style={s.th}>Rater</th>
                      <th style={s.th}>Rated (Rider)</th>
                      <th style={s.th}>Category</th>
                      <th style={s.th}>Review</th>
                      <th style={s.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRatings.map((rating) => (
                      <tr
                        key={rating.id}
                        onMouseEnter={() => setHoveredRow(rating.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          background: hoveredRow === rating.id ? "#1f2125" : "transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        <td style={s.td}>
                          <strong
                            style={{
                              color: rating.score >= 4 ? "#22c55e" : rating.score <= 2 ? "#ef4444" : "#f59e0b",
                            }}
                          >
                            {rating.score} ★
                          </strong>
                        </td>
                        <td style={s.td}>
                          <span style={{ color: "#d4d4d8" }}>{rating.rater.fullName}</span>
                          <br />
                          <span style={{ fontSize: 11, color: "#71717a" }}>{rating.rater.phoneE164}</span>
                        </td>
                        <td style={s.td}>
                          <span style={{ color: "#d4d4d8" }}>{rating.rated.fullName}</span>
                          <br />
                          {rating.rated.riderProfile && (
                            <span style={{ fontSize: 11, color: "#71717a" }}>
                              {rating.rated.riderProfile.displayCode}
                            </span>
                          )}
                        </td>
                        <td style={s.td}>{rating.category ?? "General"}</td>
                        <td style={{ ...s.td, maxWidth: 220, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {rating.review?.body ?? "—"}
                        </td>
                        <td style={{ ...s.td, whiteSpace: "nowrap" as const }}>{formatDateTime(rating.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={s.pagination}>
                  <button
                    style={{
                      ...s.pageBtn,
                      opacity: safePage === 1 ? 0.4 : 1,
                      cursor: safePage === 1 ? "default" : "pointer",
                    }}
                    disabled={safePage === 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      toast.addToast("Navigated to previous page", "info");
                    }}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      style={{
                        ...s.pageBtn,
                        ...(page === safePage ? s.pageBtnActive : {}),
                      }}
                      onClick={() => {
                        setCurrentPage(page);
                        toast.addToast(`Page ${page} of ${totalPages}`, "info");
                      }}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    style={{
                      ...s.pageBtn,
                      opacity: safePage === totalPages ? 0.4 : 1,
                      cursor: safePage === totalPages ? "default" : "pointer",
                    }}
                    disabled={safePage === totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      toast.addToast("Navigated to next page", "info");
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div style={s.sidebar}>
          {/* Rating Distribution */}
          <div style={s.card}>
            <div style={s.cardHead}>
              <h3 style={s.cardTitle}>Rating Distribution</h3>
            </div>
            <ul style={s.distList}>
              {riderRatingDistribution.map((d) => (
                <li key={d.score} style={s.distItem}>
                  <span>
                    {d.score} ★
                  </span>
                  <div style={s.distBarWrap}>
                    <div
                      style={{
                        ...s.distBar,
                        width: `${Math.max(4, (d.count / maxRatingCount) * 80)}px`,
                        background: d.score >= 4 ? "#22c55e" : d.score <= 2 ? "#ef4444" : "#f59e0b",
                      }}
                    />
                    <strong style={{ fontSize: 12, minWidth: 20, textAlign: "right" as const }}>{d.count}</strong>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Incident Summary */}
          <div style={s.card}>
            <div style={s.cardHead}>
              <h3 style={s.cardTitle}>Incident Summary</h3>
            </div>
            {incidents.length === 0 ? (
              <div style={s.emptyWrap}>
                <EmptyCard title="No incidents." body="" />
              </div>
            ) : (
              <ul style={s.summaryList}>
                {(["HIGH", "MEDIUM", "LOW"] as const).map((severity) => {
                  const count = incidents.filter((i) => i.severity.toUpperCase() === severity).length;
                  const bg = severity === "HIGH" ? "#3d0f0f" : severity === "MEDIUM" ? "#3d2e0f" : "#0f2e1a";
                  const fg = severity === "HIGH" ? "#ef4444" : severity === "MEDIUM" ? "#f59e0b" : "#22c55e";
                  return (
                    <li key={severity} style={s.summaryItem}>
                      <span style={{ ...s.severityBadge, background: bg, color: fg }}>{severity}</span>
                      <strong style={{ color: fg }}>{count}</strong>
                    </li>
                  );
                })}
                <li style={s.summaryItem}>
                  <span>Resolved</span>
                  <strong style={{ color: "#22c55e" }}>
                    {incidents.filter((i) => ["resolved", "closed"].includes(i.status.toLowerCase())).length}
                  </strong>
                </li>
                <li style={s.summaryItem}>
                  <span>Open</span>
                  <strong style={{ color: "#ef4444" }}>
                    {incidents.filter((i) => !["resolved", "closed"].includes(i.status.toLowerCase())).length}
                  </strong>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
