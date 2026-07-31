"use client";

import { useEffect, useMemo, useState } from "react";
import { Headphones, CheckCircle, Clock, AlertTriangle, Search } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPagination, usePagination } from "./ui/AdminPagination";
import type { AdminIncidentRecord, AdminSupportTicketRecord } from "./types";
import { formatDateTime, statusTone, formatEnumLabel } from "./utils";

const PAGE_SIZE = 10;

export type SupportTicketsScreenProps = {
  incidents: AdminIncidentRecord[];
  openTickets: AdminIncidentRecord[];
  inProgressTickets: AdminIncidentRecord[];
  resolvedTickets: AdminIncidentRecord[];
  supportTickets: AdminSupportTicketRecord[];
  openSupportTickets: AdminSupportTicketRecord[];
  inProgressSupportTickets: AdminSupportTicketRecord[];
  resolvedSupportTickets: AdminSupportTicketRecord[];
  onIncidentAction: (
    incidentId: string,
    status: "UNDER_REVIEW" | "ACTIONED" | "RESOLVED" | "CLOSED"
  ) => void;
  isMutating: boolean;
};

function isHighPriority(priority: string) {
  const p = priority.toUpperCase();
  return p === "HIGH" || p === "URGENT" || p === "CRITICAL";
}

function isOpenTicket(status: string) {
  const s = status.toLowerCase();
  return !["resolved", "closed", "cancelled"].includes(s);
}

export function SupportTicketsScreen({
  incidents,
  openTickets,
  inProgressTickets,
  resolvedTickets,
  supportTickets,
  openSupportTickets,
  inProgressSupportTickets,
  resolvedSupportTickets,
  onIncidentAction,
  isMutating
}: SupportTicketsScreenProps) {
  const [tab, setTab] = useState<"tickets" | "incidents">("tickets");
  const [query, setQuery] = useState("");

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = supportTickets
      .slice()
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    if (!q) return sorted;
    return sorted.filter((ticket) => {
      const haystack = [
        ticket.title,
        ticket.description,
        ticket.category,
        ticket.priority,
        ticket.status,
        ticket.createdBy?.fullName ?? ""
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [supportTickets, query]);

  const { page: ticketPage, setPage: setTicketPage, paginated: paginatedTickets } = usePagination(
    filteredTickets,
    PAGE_SIZE
  );

  const openAndInProgress = useMemo(
    () =>
      [...openTickets, ...inProgressTickets].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      ),
    [openTickets, inProgressTickets]
  );

  const { page: incidentPage, setPage: setIncidentPage, paginated: paginatedIncidents } =
    usePagination(openAndInProgress, PAGE_SIZE);

  useEffect(() => {
    setTicketPage(1);
  }, [query, setTicketPage]);

  const escalations = useMemo(
    () =>
      supportTickets
        .filter((t) => isOpenTicket(t.status) && isHighPriority(t.priority))
        .slice()
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 6),
    [supportTickets]
  );

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Support"
        subtitle="Passenger and rider tickets for Accra operations."
        actions={
          tab === "tickets" ? (
            <div className="admin-screen-toolbar">
              <label className="admin-filter-search">
                <Search size={16} aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tickets…"
                />
              </label>
            </div>
          ) : null
        }
      />

      <div className="admin-tabs">
        <button type="button" className={`admin-tab ${tab === "tickets" ? "active" : ""}`} onClick={() => setTab("tickets")}>
          Support tickets ({supportTickets.length})
        </button>
        <button type="button" className={`admin-tab ${tab === "incidents" ? "active" : ""}`} onClick={() => setTab("incidents")}>
          Safety incidents ({incidents.length})
        </button>
      </div>

      {tab === "tickets" ? (
        <>
          <AdminKpiRow
            items={[
              { label: "Open Tickets", value: openSupportTickets.length, hint: "Awaiting first response", icon: <AlertTriangle size={22} />, tone: "red" },
              { label: "In Progress", value: inProgressSupportTickets.length, hint: "Assigned / working", icon: <Clock size={22} />, tone: "yellow" },
              { label: "Resolved", value: resolvedSupportTickets.length, hint: "Closed tickets", icon: <CheckCircle size={22} />, tone: "green" },
              { label: "Escalations", value: escalations.length, hint: "High priority open", icon: <Headphones size={22} />, tone: "red" }
            ]}
          />

          <section className="admin-overview-split">
            <article className="admin-reference-card">
              <div className="admin-reference-cardhead">
                <div>
                  <h3>Help desk queue</h3>
                  <p>
                    {filteredTickets.length} ticket{filteredTickets.length === 1 ? "" : "s"}
                    {query.trim() ? " matching search" : ""}
                  </p>
                </div>
              </div>
              {filteredTickets.length === 0 ? (
                <EmptyCard
                  title={query.trim() ? "No tickets match your search." : "No support tickets yet."}
                  body={query.trim() ? "Try a different name, category, or status." : "Tickets created by passengers and riders will show here."}
                />
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Created</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Requester</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTickets.map((ticket) => (
                        <tr key={ticket.id}>
                          <td>
                            <small>{formatDateTime(ticket.createdAt)}</small>
                          </td>
                          <td>
                            <strong>{ticket.title}</strong>
                            <br />
                            <small>{ticket.description}</small>
                          </td>
                          <td>{formatEnumLabel(ticket.category)}</td>
                          <td>
                            <em
                              className={`admin-reference-tag ${
                                isHighPriority(ticket.priority) ? "danger" : "neutral"
                              }`}
                            >
                              {formatEnumLabel(ticket.priority)}
                            </em>
                          </td>
                          <td>{ticket.createdBy?.fullName ?? "—"}</td>
                          <td>
                            <em className={`admin-reference-tag ${statusTone(ticket.status)}`}>
                              {formatEnumLabel(ticket.status)}
                            </em>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <AdminPagination
                    page={ticketPage}
                    totalItems={filteredTickets.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setTicketPage}
                  />
                </div>
              )}
            </article>

            <article className="admin-reference-card">
              <div className="admin-reference-cardhead">
                <div>
                  <h3>Recent escalations</h3>
                  <p>High-priority open tickets</p>
                </div>
              </div>
              {escalations.length === 0 ? (
                <EmptyCard title="No escalations." body="High-priority open tickets will surface here." />
              ) : (
                <ul className="admin-summary-list">
                  {escalations.map((ticket) => (
                    <li key={ticket.id}>
                      <span>
                        <strong>{ticket.title}</strong>
                        <small>
                          {" "}
                          · {ticket.createdBy?.fullName ?? "Unknown"} · {formatDateTime(ticket.createdAt)}
                        </small>
                      </span>
                      <em className="admin-reference-tag danger">{formatEnumLabel(ticket.priority)}</em>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </>
      ) : (
        <>
          <AdminKpiRow
            items={[
              { label: "Open Incidents", value: openTickets.length, hint: "Awaiting first response", icon: <AlertTriangle size={22} />, tone: "red" },
              { label: "In Progress", value: inProgressTickets.length, hint: "Under review or actioned", icon: <Clock size={22} />, tone: "yellow" },
              { label: "Resolved", value: resolvedTickets.length, hint: "Closed incidents", icon: <CheckCircle size={22} />, tone: "green" },
              { label: "Total Incidents", value: incidents.length, hint: "All safety cases", icon: <Headphones size={22} />, tone: "yellow" }
            ]}
          />
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Open & in progress incidents</h3>
                <p>Safety/incident queue (use SOS board for critical alerts)</p>
              </div>
            </div>
            {openTickets.length === 0 && inProgressTickets.length === 0 ? (
              <EmptyCard title="No open incidents." body="All caught up." />
            ) : (
              <div className="admin-incident-list">
                {paginatedIncidents.map((ticket) => (
                    <div key={ticket.id} className="admin-incident-item">
                      <div>
                        <strong>{ticket.reporter.fullName}</strong>
                        <p>{ticket.description}</p>
                        <small>
                          {formatDateTime(ticket.createdAt)} · {formatEnumLabel(ticket.severity)} ·{" "}
                          {formatEnumLabel(ticket.category)}
                        </small>
                      </div>
                      <div className="admin-action-row">
                        <em className={`admin-reference-tag ${statusTone(ticket.status)}`}>
                          {formatEnumLabel(ticket.status)}
                        </em>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          disabled={isMutating}
                          onClick={() => onIncidentAction(ticket.id, "UNDER_REVIEW")}
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          className="admin-btn-primary"
                          disabled={isMutating}
                          onClick={() => onIncidentAction(ticket.id, "RESOLVED")}
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                <AdminPagination
                  page={incidentPage}
                  totalItems={openAndInProgress.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setIncidentPage}
                />
              </div>
            )}
          </article>
        </>
      )}
    </div>
  );
}
