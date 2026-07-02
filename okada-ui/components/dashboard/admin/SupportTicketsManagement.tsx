"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestJson } from "@/lib/api";
import { EmptyCard } from "./EmptyCard";

type TicketStatus =
  | "OPEN"
  | "PENDING_PASSENGER"
  | "PENDING_RIDER"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

type SupportTicketRecord = {
  id: string;
  title: string;
  category: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  closedAt: string | null;
  createdBy: {
    id: string;
    fullName: string;
    email: string | null;
    phoneE164: string;
    role: string;
  };
  assignedTo: {
    id: string;
    fullName: string;
    email: string | null;
  } | null;
  ride: {
    id: string;
    status: string;
    pickupAddress: string;
    destinationAddress: string;
  } | null;
  _count?: { messages: number };
};

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusTone(status: TicketStatus) {
  if (status === "RESOLVED" || status === "CLOSED") return "success";
  if (status === "ESCALATED") return "danger";
  if (status === "OPEN") return "warning";
  return "neutral";
}

function priorityTone(priority: TicketPriority) {
  if (priority === "CRITICAL" || priority === "HIGH") return "danger";
  if (priority === "NORMAL") return "warning";
  return "neutral";
}

type SupportTicketsManagementProps = {
  token?: string | null;
};

export function SupportTicketsManagement({ token }: SupportTicketsManagementProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState("");

  const ticketsQuery = useQuery({
    queryKey: ["admin-support-tickets", token, statusFilter, priorityFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      const query = params.toString();
      return requestJson<SupportTicketRecord[]>(
        query ? `/admin/support/tickets?${query}` : "/admin/support/tickets",
        { token },
      );
    },
    enabled: Boolean(token),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      ticketId,
      patch,
    }: {
      ticketId: string;
      patch: { status?: TicketStatus; priority?: TicketPriority };
    }) =>
      requestJson<SupportTicketRecord>(`/admin/support/tickets/${ticketId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(patch),
      }),
    onSuccess: async () => {
      setUpdateError("");
      await queryClient.invalidateQueries({ queryKey: ["admin-support-tickets", token] });
    },
    onError: (error: Error) => setUpdateError(error.message),
  });

  const tickets = ticketsQuery.data ?? [];
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0] ?? null;

  const openCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "OPEN" || ticket.status === "ESCALATED").length,
    [tickets],
  );
  const criticalCount = useMemo(
    () => tickets.filter((ticket) => ticket.priority === "CRITICAL" || ticket.priority === "HIGH").length,
    [tickets],
  );
  const resolvedCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED").length,
    [tickets],
  );

  return (
    <section className="exact-admin-card wide">
      <div className="exact-admin-cardhead">
        <div>
          <h3>Support tickets</h3>
          <p>Review and update passenger and rider support tickets from the live backend.</p>
        </div>
        <div className="exact-admin-inline-actions">
          <select
            className="exact-admin-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="PENDING_PASSENGER">Pending passenger</option>
            <option value="PENDING_RIDER">Pending rider</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            className="exact-admin-select"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div className="exact-admin-kpis exact-admin-kpis-compact">
        <article className="exact-admin-kpi">
          <span>Total tickets</span>
          <strong>{tickets.length}</strong>
        </article>
        <article className="exact-admin-kpi">
          <span>Open / escalated</span>
          <strong>{openCount}</strong>
        </article>
        <article className="exact-admin-kpi">
          <span>High priority</span>
          <strong>{criticalCount}</strong>
        </article>
        <article className="exact-admin-kpi">
          <span>Resolved</span>
          <strong>{resolvedCount}</strong>
        </article>
      </div>

      {updateError ? <p className="exact-admin-form-error">{updateError}</p> : null}

      {ticketsQuery.isLoading ? (
        <div className="status-chip warning">Loading support tickets</div>
      ) : ticketsQuery.isError ? (
        <EmptyCard title="Could not load support tickets." body={ticketsQuery.error.message} />
      ) : tickets.length === 0 ? (
        <EmptyCard
          title="No support tickets yet."
          body="Tickets submitted from the passenger or rider apps will appear here for admin follow-up."
        />
      ) : (
        <div className="exact-admin-grid">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Reporter</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={selectedTicket?.id === ticket.id ? "is-selected" : undefined}
                    onClick={() => setSelectedTicketId(ticket.id)}
                  >
                    <td>
                      <strong>{ticket.title}</strong>
                      <div>#{ticket.id.slice(-8).toUpperCase()}</div>
                    </td>
                    <td>
                      <strong>{ticket.createdBy.fullName}</strong>
                      <div>{formatEnumLabel(ticket.createdBy.role)}</div>
                    </td>
                    <td>{formatEnumLabel(ticket.category)}</td>
                    <td>
                      <span className={`status-chip ${priorityTone(ticket.priority)}`}>
                        {formatEnumLabel(ticket.priority)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-chip ${statusTone(ticket.status)}`}>
                        {formatEnumLabel(ticket.status)}
                      </span>
                    </td>
                    <td>{formatDateTime(ticket.createdAt)}</td>
                    <td>
                      <div className="exact-admin-inline-actions">
                        {ticket.status !== "RESOLVED" ? (
                          <button
                            type="button"
                            className="exact-admin-button ghost"
                            disabled={updateMutation.isPending}
                            onClick={(event) => {
                              event.stopPropagation();
                              updateMutation.mutate({
                                ticketId: ticket.id,
                                patch: { status: "RESOLVED" },
                              });
                            }}
                          >
                            Resolve
                          </button>
                        ) : null}
                        {ticket.status !== "CLOSED" ? (
                          <button
                            type="button"
                            className="exact-admin-button ghost"
                            disabled={updateMutation.isPending}
                            onClick={(event) => {
                              event.stopPropagation();
                              updateMutation.mutate({
                                ticketId: ticket.id,
                                patch: { status: "CLOSED" },
                              });
                            }}
                          >
                            Close
                          </button>
                        ) : null}
                        {ticket.status === "OPEN" ? (
                          <button
                            type="button"
                            className="exact-admin-button ghost"
                            disabled={updateMutation.isPending}
                            onClick={(event) => {
                              event.stopPropagation();
                              updateMutation.mutate({
                                ticketId: ticket.id,
                                patch: { status: "ESCALATED", priority: "HIGH" },
                              });
                            }}
                          >
                            Escalate
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedTicket ? (
            <section className="exact-admin-card">
              <div className="exact-admin-cardhead">
                <div>
                  <h3>Ticket detail</h3>
                  <p>Selected support case and linked ride context.</p>
                </div>
              </div>
              <div className="admin-rider-ticket-detail">
                <strong>{selectedTicket.title}</strong>
                <span className={`status-chip ${statusTone(selectedTicket.status)}`}>
                  {formatEnumLabel(selectedTicket.status)}
                </span>
                <p>{selectedTicket.description}</p>
                <div>
                  <span>Reporter</span>
                  <strong>{selectedTicket.createdBy.fullName}</strong>
                </div>
                <div>
                  <span>Phone</span>
                  <strong>{selectedTicket.createdBy.phoneE164}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{selectedTicket.createdBy.email ?? "—"}</strong>
                </div>
                <div>
                  <span>Messages</span>
                  <strong>{selectedTicket._count?.messages ?? 0}</strong>
                </div>
                {selectedTicket.ride ? (
                  <>
                    <div>
                      <span>Linked ride</span>
                      <strong>{selectedTicket.ride.id.slice(-8).toUpperCase()}</strong>
                    </div>
                    <div>
                      <span>Route</span>
                      <strong>
                        {selectedTicket.ride.pickupAddress} → {selectedTicket.ride.destinationAddress}
                      </strong>
                    </div>
                  </>
                ) : null}
                <div className="exact-admin-inline-actions">
                  <select
                    className="exact-admin-select"
                    value={selectedTicket.status}
                    disabled={updateMutation.isPending}
                    onChange={(event) =>
                      updateMutation.mutate({
                        ticketId: selectedTicket.id,
                        patch: { status: event.target.value as TicketStatus },
                      })
                    }
                  >
                    <option value="OPEN">Open</option>
                    <option value="PENDING_PASSENGER">Pending passenger</option>
                    <option value="PENDING_RIDER">Pending rider</option>
                    <option value="ESCALATED">Escalated</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <select
                    className="exact-admin-select"
                    value={selectedTicket.priority}
                    disabled={updateMutation.isPending}
                    onChange={(event) =>
                      updateMutation.mutate({
                        ticketId: selectedTicket.id,
                        patch: { priority: event.target.value as TicketPriority },
                      })
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </section>
  );
}
