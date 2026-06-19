"use client";

import { UseMutationResult } from "@tanstack/react-query";
import { EmptyCard } from "./EmptyCard";
import type { AdminIncidentRecord, AdminRatingRecord } from "./types";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (["completed", "delivered", "paid", "captured", "posted", "approved", "valid"].includes(normalized)) {
    return "success";
  }
  if (["searching", "assigned", "arriving", "arrived", "started", "picked_up", "in_transit", "pending", "requested", "reviewing", "under review", "processing"].includes(normalized)) {
    return "warning";
  }
  if (["failed", "rejected", "cancelled", "reversed", "missing", "expired"].includes(normalized)) {
    return "danger";
  }
  return "neutral";
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type RatingsScreenProps = {
  screenMeta: { eyebrow: string; title: string; description: string };
  ratings: AdminRatingRecord[];
  ratingsQuery: { isLoading: boolean; isError: boolean; error: Error | null };
  incidents: AdminIncidentRecord[];
  incidentsQuery: { isLoading: boolean; isError: boolean; error: Error | null };
  ratingRiderFilter: string;
  setRatingRiderFilter: (value: string) => void;
  ratingRideFilter: string;
  setRatingRideFilter: (value: string) => void;
  ratingFromDateFilter: string;
  setRatingFromDateFilter: (value: string) => void;
  ratingToDateFilter: string;
  setRatingToDateFilter: (value: string) => void;
  incidentStatusFilter: string;
  setIncidentStatusFilter: (value: string) => void;
  incidentSeverityFilter: string;
  setIncidentSeverityFilter: (value: string) => void;
  incidentReviewMutation: UseMutationResult<unknown, Error, { incidentId: string; status: string }>;
};

export function RatingsScreen({
  screenMeta,
  ratings,
  ratingsQuery,
  incidents,
  incidentsQuery,
  ratingRiderFilter,
  setRatingRiderFilter,
  ratingRideFilter,
  setRatingRideFilter,
  ratingFromDateFilter,
  setRatingFromDateFilter,
  ratingToDateFilter,
  setRatingToDateFilter,
  incidentStatusFilter,
  setIncidentStatusFilter,
  incidentSeverityFilter,
  setIncidentSeverityFilter,
  incidentReviewMutation
}: RatingsScreenProps) {
  return (
    <>
      <section className="exact-admin-section">
        <div className="exact-admin-heading">
          <p className="exact-admin-eyebrow">{screenMeta.eyebrow}</p>
          <h1>{screenMeta.title}</h1>
          <p>{screenMeta.description}</p>
        </div>

        <div className="exact-admin-kpis">
          <article className="exact-admin-kpi">
            <span>Total ratings</span>
            <strong>{ratings.length}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Average score</span>
            <strong>
              {ratings.length === 0
                ? "0.0"
                : (ratings.reduce((sum, rating) => sum + rating.score, 0) / ratings.length).toFixed(1)}
            </strong>
          </article>
          <article className="exact-admin-kpi">
            <span>With text review</span>
            <strong>{ratings.filter((rating) => Boolean(rating.review?.body)).length}</strong>
          </article>
          <article className="exact-admin-kpi">
            <span>Distinct riders rated</span>
            <strong>{new Set(ratings.map((rating) => rating.rated.id)).size}</strong>
          </article>
        </div>
      </section>

      <section className="exact-admin-card">
        <div className="exact-admin-cardhead">
          <div>
            <h3>Rating filters</h3>
            <p>Filter submissions by rider profile, ride, and date window for operational verification.</p>
          </div>
        </div>
        <div className="exact-admin-payment-filters">
          <div className="field-group">
            <label className="field-label">Rider profile ID</label>
            <input
              className="input"
              value={ratingRiderFilter}
              onChange={(event) => setRatingRiderFilter(event.target.value)}
              placeholder="Filter by rider profile CUID"
            />
          </div>
          <div className="field-group">
            <label className="field-label">Ride ID</label>
            <input
              className="input"
              value={ratingRideFilter}
              onChange={(event) => setRatingRideFilter(event.target.value)}
              placeholder="Filter by ride CUID"
            />
          </div>
          <div className="field-group">
            <label className="field-label">From date</label>
            <input
              className="input"
              type="date"
              value={ratingFromDateFilter}
              onChange={(event) => setRatingFromDateFilter(event.target.value)}
            />
          </div>
          <div className="field-group">
            <label className="field-label">To date</label>
            <input
              className="input"
              type="date"
              value={ratingToDateFilter}
              onChange={(event) => setRatingToDateFilter(event.target.value)}
            />
          </div>
        </div>
        <div className="exact-admin-payment-filters">
          <div className="field-group">
            <label className="field-label">Incident status</label>
            <select
              className="select"
              value={incidentStatusFilter}
              onChange={(event) => setIncidentStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="ACTIONED">Actioned</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Incident severity</label>
            <select
              className="select"
              value={incidentSeverityFilter}
              onChange={(event) => setIncidentSeverityFilter(event.target.value)}
            >
              <option value="">All severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </section>

      <section className="exact-admin-card wide">
        <div className="exact-admin-cardhead">
          <div>
            <h3>Ratings verification ledger</h3>
            <p>Passenger submissions with linked rider and ride records.</p>
          </div>
        </div>
        {ratingsQuery.isLoading ? (
          <div className="status-chip warning">Loading ratings</div>
        ) : ratingsQuery.isError ? (
          <EmptyCard title="Ratings could not be loaded." body={ratingsQuery.error!.message} />
        ) : ratings.length === 0 ? (
          <EmptyCard
            title="No ratings matched the current filters."
            body="Passenger rating submissions will appear here after completed rides are rated."
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Rated rider</th>
                  <th>Ride ID</th>
                  <th>Score</th>
                  <th>Category</th>
                  <th>Review</th>
                  <th>Submitted by</th>
                  <th>Submitted at</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating) => (
                  <tr key={rating.id}>
                    <td>
                      <div className="exact-admin-transaction-user">
                        <strong>{rating.rated.fullName}</strong>
                        <span>{rating.rated.riderProfile?.displayCode ?? "No rider code"}</span>
                      </div>
                    </td>
                    <td>{rating.ride.id}</td>
                    <td>{rating.score}/5</td>
                    <td>{rating.category ?? "General"}</td>
                    <td>{rating.review?.body ?? "No written review"}</td>
                    <td>
                      <div className="exact-admin-transaction-user">
                        <strong>{rating.rater.fullName}</strong>
                        <span>{rating.rater.phoneE164}</span>
                      </div>
                    </td>
                    <td>{formatDateTime(rating.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="exact-admin-card wide">
        <div className="exact-admin-cardhead">
          <div>
            <h3>Incident moderation queue</h3>
            <p>Review and action SOS and safety incident submissions from riders and passengers.</p>
          </div>
        </div>
        {incidentsQuery.isLoading ? (
          <div className="status-chip warning">Loading incidents</div>
        ) : incidentsQuery.isError ? (
          <EmptyCard title="Incidents could not be loaded." body={incidentsQuery.error!.message} />
        ) : incidents.length === 0 ? (
          <EmptyCard
            title="No incidents matched the current filters."
            body="Incident reports will appear here when users submit SOS or safety reports."
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Reporter</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Ride</th>
                  <th>Assigned</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>
                      <div className="exact-admin-transaction-user">
                        <strong>{incident.reporter.fullName}</strong>
                        <span>{incident.reporter.phoneE164}</span>
                      </div>
                    </td>
                    <td>{formatEnumLabel(incident.severity)}</td>
                    <td>
                      <span className={`status-chip ${statusTone(incident.status)}`}>
                        {formatEnumLabel(incident.status)}
                      </span>
                    </td>
                    <td>{incident.category}</td>
                    <td>{incident.description}</td>
                    <td>{incident.ride?.id ?? "No ride linked"}</td>
                    <td>{incident.assignedTo?.fullName ?? "Unassigned"}</td>
                    <td>
                      <div className="button-row">
                        {incident.status === "OPEN" ? (
                          <button
                            className="button button-secondary"
                            type="button"
                            disabled={incidentReviewMutation.isPending}
                            onClick={() =>
                              incidentReviewMutation.mutate({
                                incidentId: incident.id,
                                status: "UNDER_REVIEW"
                              })
                            }
                          >
                            Review
                          </button>
                        ) : null}
                        {["OPEN", "UNDER_REVIEW"].includes(incident.status) ? (
                          <button
                            className="button button-secondary"
                            type="button"
                            disabled={incidentReviewMutation.isPending}
                            onClick={() =>
                              incidentReviewMutation.mutate({
                                incidentId: incident.id,
                                status: "ACTIONED"
                              })
                            }
                          >
                            Actioned
                          </button>
                        ) : null}
                        {["ACTIONED", "UNDER_REVIEW", "OPEN"].includes(incident.status) ? (
                          <button
                            className="button"
                            type="button"
                            disabled={incidentReviewMutation.isPending}
                            onClick={() =>
                              incidentReviewMutation.mutate({
                                incidentId: incident.id,
                                status: "RESOLVED"
                              })
                            }
                          >
                            Resolve
                          </button>
                        ) : null}
                        {incident.status !== "CLOSED" ? (
                          <button
                            className="button button-secondary"
                            type="button"
                            disabled={incidentReviewMutation.isPending}
                            onClick={() =>
                              incidentReviewMutation.mutate({
                                incidentId: incident.id,
                                status: "CLOSED"
                              })
                            }
                          >
                            Close
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
