import { useState } from "react";
import { Star, Filter, Download, AlertTriangle } from "lucide-react";
import { downloadCsv } from "@/lib/export-csv";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { useAdminToast } from "./AdminToast";
import { EmptyCard } from "./EmptyCard";
import { SkeletonKPI, SkeletonTable, SkeletonDonut } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
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
  const { isMobile } = useBreakpoint();
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const toast = useAdminToast();

  if (dataLoading) {
    return (
      <div className="exact-admin-screen">
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
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Ratings"
        subtitle="Passenger scores and reviews on completed Accra rides."
        actions={
          <div className="admin-screen-toolbar">
            <button type="button" className="admin-btn-primary" onClick={handleExport}>
              <Download size={14} /> Export CSV
            </button>
          </div>
        }
      />

      <AdminKpiRow
        items={[
          {
            label: "Total Ratings",
            value: ratings.length,
            hint: `${withReview.length} with review text`,
            icon: <Star size={22} />,
            tone: "yellow",
          },
          {
            label: "Average Score",
            value: `${riderRatingAverage.toFixed(1)} ★`,
            hint: "Platform-wide",
            icon: <Star size={22} />,
            tone: "green",
          },
          {
            label: "Incidents",
            value: incidents.length,
            hint: "All severity levels",
            icon: <AlertTriangle size={22} />,
            tone: "red",
          },
          {
            label: "5-Star Ratings",
            value: fiveStarCount,
            hint: "Top scores",
            icon: <Star size={22} />,
            tone: "green",
          },
        ]}
      />

      <div className="admin-filter-bar">
        <Filter size={14} aria-hidden />
        <label className="admin-filter-search">
          <input
            type="text"
            placeholder="Rider ID..."
            value={ratingRiderFilter}
            onChange={(e) => onRiderFilterChange(e.target.value)}
          />
        </label>
        <label className="admin-filter-search">
          <input
            type="text"
            placeholder="Ride ID..."
            value={ratingRideFilter}
            onChange={(e) => onRideFilterChange(e.target.value)}
          />
        </label>
        <input
          type="date"
          className="admin-select-sm"
          value={ratingFromDateFilter}
          onChange={(e) => onFromDateChange(e.target.value)}
        />
        <input
          type="date"
          className="admin-select-sm"
          value={ratingToDateFilter}
          onChange={(e) => onToDateChange(e.target.value)}
        />
      </div>

      <div className="admin-overview-split">
        <article className="admin-reference-card">
          <div className="admin-reference-cardhead">
            <div>
              <h3>Rating Records</h3>
              <p>{ratings.length} submissions</p>
            </div>
          </div>

          {ratings.length === 0 ? (
            <EmptyCard
              title="No ratings found."
              body="Rating submissions will appear here once Accra rides are completed and rated."
            />
          ) : (
            <>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Score</th>
                      <th>Rater</th>
                      <th>Rated (Rider)</th>
                      <th>Category</th>
                      <th>Review</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRatings.map((rating) => (
                      <tr
                        key={rating.id}
                        onMouseEnter={() => setHoveredRow(rating.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          background:
                            hoveredRow === rating.id
                              ? "color-mix(in srgb, var(--accent-yellow) 8%, transparent)"
                              : undefined,
                        }}
                      >
                        <td>
                          <strong
                            style={{
                              color:
                                rating.score >= 4
                                  ? "var(--color-success)"
                                  : rating.score <= 2
                                    ? "var(--color-danger)"
                                    : "var(--accent-yellow)",
                            }}
                          >
                            {rating.score} ★
                          </strong>
                        </td>
                        <td>
                          <strong>{rating.rater.fullName}</strong>
                          <br />
                          <small>{rating.rater.phoneE164}</small>
                        </td>
                        <td>
                          <strong>{rating.rated.fullName}</strong>
                          <br />
                          {rating.rated.riderProfile ? (
                            <small>{rating.rated.riderProfile.displayCode}</small>
                          ) : null}
                        </td>
                        <td>{rating.category ?? "General"}</td>
                        <td style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {rating.review?.body ?? "—"}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(rating.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="admin-screen-toolbar" style={{ justifyContent: "center", marginTop: 12 }}>
                  <button
                    type="button"
                    className="admin-btn-secondary"
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
                      type="button"
                      className={page === safePage ? "admin-btn-primary" : "admin-btn-secondary"}
                      onClick={() => {
                        setCurrentPage(page);
                        toast.addToast(`Page ${page} of ${totalPages}`, "info");
                      }}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="admin-btn-secondary"
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
        </article>

        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Rating Distribution</h3>
                <p>Score breakdown</p>
              </div>
            </div>
            <ul className="admin-summary-list">
              {riderRatingDistribution.map((d) => (
                <li key={d.score}>
                  <span>{d.score} ★</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 4,
                        minWidth: 4,
                        width: `${Math.max(4, (d.count / maxRatingCount) * 80)}px`,
                        background:
                          d.score >= 4
                            ? "var(--color-success)"
                            : d.score <= 2
                              ? "var(--color-danger)"
                              : "var(--accent-yellow)",
                      }}
                    />
                    <strong>{d.count}</strong>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Incident Summary</h3>
                <p>Severity snapshot</p>
              </div>
            </div>
            {incidents.length === 0 ? (
              <EmptyCard title="No incidents." body="" />
            ) : (
              <ul className="admin-summary-list">
                {(["HIGH", "MEDIUM", "LOW"] as const).map((severity) => {
                  const count = incidents.filter((i) => i.severity.toUpperCase() === severity).length;
                  const tone = severity === "HIGH" ? "red" : severity === "MEDIUM" ? "yellow" : "green";
                  return (
                    <li key={severity}>
                      <em className={`admin-reference-tag ${tone}`}>{severity}</em>
                      <strong>{count}</strong>
                    </li>
                  );
                })}
                <li>
                  <span>Resolved</span>
                  <strong>
                    {incidents.filter((i) => ["resolved", "closed"].includes(i.status.toLowerCase())).length}
                  </strong>
                </li>
                <li>
                  <span>Open</span>
                  <strong>
                    {incidents.filter((i) => !["resolved", "closed"].includes(i.status.toLowerCase())).length}
                  </strong>
                </li>
              </ul>
            )}
          </article>
        </aside>
      </div>
    </div>
  );
}
