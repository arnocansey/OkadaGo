"use client";

import { useState } from "react";
import { Headphones, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { EmptyCard } from "./EmptyCard";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { AdminIncidentRecord, AdminSupportTicketRecord } from "./types";
import { formatDateTime, statusTone, formatEnumLabel } from "./utils";

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

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Support"
        subtitle="Passenger/rider support tickets and safety incidents in one place."
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
              { label: "Total Tickets", value: supportTickets.length, hint: "All support cases", icon: <Headphones size={22} />, tone: "yellow" }
            ]}
          />
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Support ticket queue</h3>
                <p>From /admin/support/tickets</p>
              </div>
            </div>
            {supportTickets.length === 0 ? (
              <EmptyCard title="No support tickets yet." body="Tickets created by passengers and riders will show here." />
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
                    {supportTickets
                      .slice()
                      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
                      .map((ticket) => (
                        <tr key={ticket.id}>
                          <td><small>{formatDateTime(ticket.createdAt)}</small></td>
                          <td>
                            <strong>{ticket.title}</strong>
                            <br />
                            <small>{ticket.description}</small>
                          </td>
                          <td>{formatEnumLabel(ticket.category)}</td>
                          <td>{formatEnumLabel(ticket.priority)}</td>
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
              </div>
            )}
          </article>
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
                {[...openTickets, ...inProgressTickets]
                  .slice()
                  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
                  .map((ticket) => (
                    <div key={ticket.id} className="admin-incident-item">
                      <div>
                        <strong>{ticket.reporter.fullName}</strong>
                        <p>{ticket.description}</p>
                        <small>{formatDateTime(ticket.createdAt)} · {formatEnumLabel(ticket.severity)} · {formatEnumLabel(ticket.category)}</small>
                      </div>
                      <div className="admin-action-row">
                        <em className={`admin-reference-tag ${statusTone(ticket.status)}`}>{formatEnumLabel(ticket.status)}</em>
                        <button type="button" className="admin-btn-secondary" disabled={isMutating} onClick={() => onIncidentAction(ticket.id, "UNDER_REVIEW")}>Review</button>
                        <button type="button" className="admin-btn-primary" disabled={isMutating} onClick={() => onIncidentAction(ticket.id, "RESOLVED")}>Resolve</button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </article>
        </>
      )}
    </div>
  );
}
