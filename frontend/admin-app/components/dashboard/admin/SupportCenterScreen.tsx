"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type { AdminSupportTicketRecord, RideRecord, DeliveryRecord } from "./types";
import { formatDateTime, parseNumber } from "./utils";
import {
  Search,
  Filter,
  Headphones,
  AlertTriangle,
  Clock,
  CheckCircle2,
  User,
  Bike,
  Package,
  Send,
  Paperclip,
  MoreVertical,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Star,
  ExternalLink,
  MessageSquare,
  CircleDot,
  Shield,
  X,
  RefreshCw
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type SupportCenterScreenProps = {
  supportTickets: AdminSupportTicketRecord[];
  openSupportTickets: AdminSupportTicketRecord[];
  inProgressSupportTickets: AdminSupportTicketRecord[];
  resolvedSupportTickets: AdminSupportTicketRecord[];
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  adminCurrency: string;
  dataLoading?: boolean;
  onTicketAction?: (ticketId: string, action: "assign" | "resolve" | "close" | "escalate" | "message", value?: string) => void;
  onServerExport?: (entity: "support-tickets") => void;
};

type StatusTab = "open" | "urgent" | "assigned" | "waiting" | "resolved";
type ViewMode = "three-panel" | "list-only";

interface TicketMessage {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

const STATUS_TABS: Array<{ id: StatusTab; label: string; icon: typeof Clock }> = [
  { id: "open", label: "Open Cases", icon: CircleDot },
  { id: "urgent", label: "Urgent", icon: AlertTriangle },
  { id: "assigned", label: "Assigned", icon: User },
  { id: "waiting", label: "Waiting", icon: Clock },
  { id: "resolved", label: "Resolved", icon: CheckCircle2 }
];

const PRIORITY_TONE: Record<string, string> = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  CRITICAL: "critical"
};

const STATUS_TONE: Record<string, string> = {
  OPEN: "open",
  PENDING_PASSENGER: "waiting",
  PENDING_RIDER: "waiting",
  ESCALATED: "urgent",
  RESOLVED: "resolved",
  CLOSED: "resolved"
};

/* ── Helpers ── */

function tabCounts(tickets: AdminSupportTicketRecord[]) {
  const open = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "ESCALATED"
  );
  const urgent = tickets.filter(
    (t) => t.priority === "HIGH" || t.priority === "CRITICAL"
  );
  const assigned = tickets.filter(
    (t) => t.assignedTo && !["RESOLVED", "CLOSED"].includes(t.status)
  );
  const waiting = tickets.filter(
    (t) => t.status === "PENDING_PASSENGER" || t.status === "PENDING_RIDER"
  );
  const resolved = tickets.filter(
    (t) => t.status === "RESOLVED" || t.status === "CLOSED"
  );
  return { open, urgent, assigned, waiting, resolved };
}

function filterByTab(tickets: AdminSupportTicketRecord[], tab: StatusTab) {
  switch (tab) {
    case "open":
      return tickets.filter((t) => t.status === "OPEN" || t.status === "ESCALATED");
    case "urgent":
      return tickets.filter((t) => t.priority === "HIGH" || t.priority === "CRITICAL");
    case "assigned":
      return tickets.filter(
        (t) => t.assignedTo && !["RESOLVED", "CLOSED"].includes(t.status)
      );
    case "waiting":
      return tickets.filter(
        (t) => t.status === "PENDING_PASSENGER" || t.status === "PENDING_RIDER"
      );
    case "resolved":
      return tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");
    default:
      return tickets;
  }
}

function formatPriority(p: string) {
  if (p === "CRITICAL") return "Critical";
  if (p === "HIGH") return "High";
  if (p === "NORMAL") return "Normal";
  if (p === "LOW") return "Low";
  return p;
}

function formatStatus(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ══════════════════════════════════════════════════════════════════════════════ */

export function SupportCenterScreen({
  supportTickets,
  openSupportTickets,
  inProgressSupportTickets,
  resolvedSupportTickets,
  rides,
  deliveries,
  adminCurrency,
  dataLoading = false,
  onTicketAction,
  onServerExport
}: SupportCenterScreenProps) {
  const [activeTab, setActiveTab] = useState<StatusTab>("open");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicketRecord | null>(null);
  const [messageText, setMessageText] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("three-panel");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => tabCounts(supportTickets), [supportTickets]);

  const filteredTickets = useMemo(() => {
    let tickets = filterByTab(supportTickets, activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.createdBy?.fullName?.toLowerCase().includes(q)
      );
    }
    return tickets;
  }, [supportTickets, activeTab, search]);

  const selectedRide = useMemo(() => {
    if (!selectedTicket?.ride?.id) return null;
    return rides.find((r) => r.id === selectedTicket.ride?.id) ?? null;
  }, [selectedTicket, rides]);

  const selectedDelivery = useMemo(() => {
    if (!selectedTicket?.ride?.id) return null;
    return deliveries.find((d) => d.id === selectedTicket.ride?.id) ?? null;
  }, [selectedTicket, deliveries]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket, scrollToBottom]);

  const handleSendMessage = useCallback(() => {
    if (!messageText.trim() || !selectedTicket) return;
    if (onTicketAction) onTicketAction(selectedTicket.id, "message", messageText.trim());
    setMessageText("");
  }, [messageText, selectedTicket, onTicketAction]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={5} rows={6} cols={6} />;
  }

  return (
    <div className="sc-mgmt">
      <AdminPageHeader
        title="Support Center"
        subtitle="Unified passenger and rider support — manage tickets, conversations, and trip details."
        actions={
          <div className="sc-header-actions">
            <button
              type="button"
              className={`sc-view-toggle${viewMode === "three-panel" ? " active" : ""}`}
              onClick={() => setViewMode("three-panel")}
            >
              Panels
            </button>
            <button
              type="button"
              className={`sc-view-toggle${viewMode === "list-only" ? " active" : ""}`}
              onClick={() => setViewMode("list-only")}
            >
              List
            </button>
            {onServerExport && (
              <button type="button" className="sc-btn sc-btn--outline" onClick={() => onServerExport("support-tickets")}>
                Export
              </button>
            )}
          </div>
        }
      />

      {/* ── Status Tabs ── */}
      <div className="sc-tabs">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const count =
            tab.id === "open" ? counts.open.length :
            tab.id === "urgent" ? counts.urgent.length :
            tab.id === "assigned" ? counts.assigned.length :
            tab.id === "waiting" ? counts.waiting.length :
            counts.resolved.length;
          return (
            <button
              key={tab.id}
              type="button"
              className={`sc-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              <span className="sc-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Three-Panel Layout ── */}
      <div className={`sc-layout${viewMode === "list-only" ? " sc-layout--list" : ""}`}>
        {/* ── Panel 1: Ticket List ── */}
        <div className="sc-panel sc-panel--list">
          <div className="sc-list-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search tickets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sc-list-count">
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""}
          </div>
          <div className="sc-ticket-list">
            {filteredTickets.length === 0 ? (
              <div className="sc-list-empty">
                <EmptyCard title="No tickets" body="No tickets match the current filter." />
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`sc-ticket-card${selectedTicket?.id === ticket.id ? " selected" : ""}`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="sc-ticket-card-header">
                    <span className={`sc-priority-dot sc-priority-dot--${PRIORITY_TONE[ticket.priority] ?? "normal"}`} />
                    <span className={`sc-ticket-status sc-ticket-status--${STATUS_TONE[ticket.status] ?? "open"}`}>
                      {formatStatus(ticket.status)}
                    </span>
                    <span className="sc-ticket-time">{formatDateTime(ticket.createdAt)}</span>
                  </div>
                  <div className="sc-ticket-card-title">{ticket.title}</div>
                  <div className="sc-ticket-card-meta">
                    <span className="sc-ticket-category">{ticket.category}</span>
                    <span className="sc-ticket-requester">{ticket.createdBy?.fullName ?? "—"}</span>
                    {ticket.assignedTo && (
                      <span className="sc-ticket-assignee">
                        <User size={10} /> {ticket.assignedTo.fullName}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Panel 2: Conversation ── */}
        <div className="sc-panel sc-panel--conversation">
          {selectedTicket ? (
            <>
              <div className="sc-conv-header">
                <div className="sc-conv-header-info">
                  <h3>{selectedTicket.title}</h3>
                  <span className={`sc-ticket-status sc-ticket-status--${STATUS_TONE[selectedTicket.status] ?? "open"}`}>
                    {formatStatus(selectedTicket.status)}
                  </span>
                </div>
                <div className="sc-conv-header-actions">
                  {selectedTicket.status !== "RESOLVED" && selectedTicket.status !== "CLOSED" && (
                    <>
                      <button
                        type="button"
                        className="sc-action-btn sc-action-btn--resolve"
                        onClick={() => onTicketAction?.(selectedTicket.id, "resolve")}
                        title="Resolve"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="sc-action-btn sc-action-btn--escalate"
                        onClick={() => onTicketAction?.(selectedTicket.id, "escalate")}
                        title="Escalate"
                      >
                        <AlertTriangle size={14} />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="sc-action-btn"
                    onClick={() => onTicketAction?.(selectedTicket.id, "close")}
                    title="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* ── Description ── */}
              <div className="sc-conv-description">
                <div className="sc-conv-desc-header">
                  <User size={12} />
                  <span>{selectedTicket.createdBy?.fullName ?? "Unknown"}</span>
                  <span className="sc-conv-desc-time">{formatDateTime(selectedTicket.createdAt)}</span>
                </div>
                <p>{selectedTicket.description}</p>
              </div>

              {/* ── Messages ── */}
              <div className="sc-conv-messages">
                <div className="sc-conv-messages-empty">
                  <MessageSquare size={20} />
                  <span>Conversation messages will appear here once the message API is connected.</span>
                  <small>Ticket #{selectedTicket.id.slice(0, 8)} — {selectedTicket.title}</small>
                </div>
                <div ref={messagesEndRef} />
              </div>

              {/* ── Composer ── */}
              <div className="sc-conv-composer">
                <button type="button" className="sc-composer-btn" title="File attachments coming soon" disabled style={{ opacity: 0.4, cursor: "not-allowed" }}>
                  <Paperclip size={16} />
                </button>
                <input
                  type="text"
                  className="sc-composer-input"
                  placeholder="Type a reply…"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  type="button"
                  className={`sc-composer-send${messageText.trim() ? " active" : ""}`}
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="sc-conv-placeholder">
              <Headphones size={32} />
              <h3>Select a ticket</h3>
              <p>Choose a ticket from the list to view the conversation and customer details.</p>
            </div>
          )}
        </div>

        {/* ── Panel 3: Customer / Trip Info ── */}
        {viewMode === "three-panel" && (
          <div className="sc-panel sc-panel--info">
            {selectedTicket ? (
              <div className="sc-info-scroll">
                {/* ── Customer Card ── */}
                <div className="sc-info-card">
                  <h4><User size={14} /> Customer</h4>
                  <div className="sc-info-row">
                    <span className="sc-info-label">Name</span>
                    <span className="sc-info-value">{selectedTicket.createdBy?.fullName ?? "—"}</span>
                  </div>
                  {selectedTicket.createdBy?.phoneE164 && (
                    <div className="sc-info-row">
                      <span className="sc-info-label">Phone</span>
                      <span className="sc-info-value sc-info-value--mono">
                        <Phone size={11} /> {selectedTicket.createdBy.phoneE164}
                      </span>
                    </div>
                  )}
                  {selectedTicket.createdBy?.email && (
                    <div className="sc-info-row">
                      <span className="sc-info-label">Email</span>
                      <span className="sc-info-value sc-info-value--mono">
                        <Mail size={11} /> {selectedTicket.createdBy.email}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Ticket Details ── */}
                <div className="sc-info-card">
                  <h4><Shield size={14} /> Ticket Details</h4>
                  <div className="sc-info-row">
                    <span className="sc-info-label">Category</span>
                    <span className="sc-info-value">{selectedTicket.category}</span>
                  </div>
                  <div className="sc-info-row">
                    <span className="sc-info-label">Priority</span>
                    <span className={`sc-priority-badge sc-priority-badge--${PRIORITY_TONE[selectedTicket.priority] ?? "normal"}`}>
                      {formatPriority(selectedTicket.priority)}
                    </span>
                  </div>
                  <div className="sc-info-row">
                    <span className="sc-info-label">Status</span>
                    <span className={`sc-ticket-status sc-ticket-status--${STATUS_TONE[selectedTicket.status] ?? "open"}`}>
                      {formatStatus(selectedTicket.status)}
                    </span>
                  </div>
                  <div className="sc-info-row">
                    <span className="sc-info-label">Created</span>
                    <span className="sc-info-value">{formatDateTime(selectedTicket.createdAt)}</span>
                  </div>
                  {selectedTicket.closedAt && (
                    <div className="sc-info-row">
                      <span className="sc-info-label">Closed</span>
                      <span className="sc-info-value">{formatDateTime(selectedTicket.closedAt)}</span>
                    </div>
                  )}
                  {selectedTicket.assignedTo && (
                    <div className="sc-info-row">
                      <span className="sc-info-label">Assigned</span>
                      <span className="sc-info-value">{selectedTicket.assignedTo.fullName}</span>
                    </div>
                  )}
                </div>

                {/* ── Trip / Delivery Card ── */}
                {selectedRide && (
                  <div className="sc-info-card">
                    <h4><Bike size={14} /> Linked Ride</h4>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Ride ID</span>
                      <span className="sc-info-value sc-info-value--mono">{selectedRide.id.slice(0, 12)}…</span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Status</span>
                      <span className="sc-info-value">{selectedRide.status}</span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Pickup</span>
                      <span className="sc-info-value sc-info-value--small">
                        <MapPin size={10} /> {selectedRide.pickupAddress}
                      </span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Destination</span>
                      <span className="sc-info-value sc-info-value--small">
                        <MapPin size={10} /> {selectedRide.destinationAddress}
                      </span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Distance</span>
                      <span className="sc-info-value">{selectedRide.actualDistanceKm ?? selectedRide.estimatedDistanceKm ?? "—"} km</span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Fare</span>
                      <span className="sc-info-value">{formatMoney(selectedRide.currency, parseNumber(selectedRide.finalFare ?? selectedRide.estimatedFare))}</span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Rider</span>
                      <span className="sc-info-value">{selectedRide.rider?.user?.fullName ?? "—"}</span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Passenger</span>
                      <span className="sc-info-value">{selectedRide.passenger?.user?.fullName ?? "—"}</span>
                    </div>
                    <div className="sc-info-actions">
                      <a
                        href={`/rides/${selectedRide.id}`}
                        className="sc-link-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/rides/${selectedRide.id}`;
                        }}
                      >
                        <ExternalLink size={12} /> View Full Ride Details
                      </a>
                    </div>
                  </div>
                )}

                {selectedDelivery && (
                  <div className="sc-info-card">
                    <h4><Package size={14} /> Linked Delivery</h4>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Delivery ID</span>
                      <span className="sc-info-value sc-info-value--mono">{selectedDelivery.id.slice(0, 12)}…</span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Status</span>
                      <span className="sc-info-value">{selectedDelivery.status}</span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Pickup</span>
                      <span className="sc-info-value sc-info-value--small">
                        <MapPin size={10} /> {selectedDelivery.pickupAddress}
                      </span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Dropoff</span>
                      <span className="sc-info-value sc-info-value--small">
                        <MapPin size={10} /> {selectedDelivery.dropoffAddress}
                      </span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Fee</span>
                      <span className="sc-info-value">{formatMoney(selectedDelivery.currency, parseNumber(selectedDelivery.finalFee ?? selectedDelivery.estimatedFee))}</span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Rider</span>
                      <span className="sc-info-value">{selectedDelivery.rider?.user?.fullName ?? "—"}</span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Passenger</span>
                      <span className="sc-info-value">{selectedDelivery.passenger?.user?.fullName ?? "—"}</span>
                    </div>
                    <div className="sc-info-actions">
                      <a
                        href={`/deliveries/${selectedDelivery.id}`}
                        className="sc-link-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/deliveries/${selectedDelivery.id}`;
                        }}
                      >
                        <ExternalLink size={12} /> View Full Delivery Details
                      </a>
                    </div>
                  </div>
                )}

                {!selectedRide && !selectedDelivery && selectedTicket.ride && (
                  <div className="sc-info-card">
                    <h4><Bike size={14} /> Linked Trip</h4>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Trip ID</span>
                      <span className="sc-info-value sc-info-value--mono">{selectedTicket.ride.id.slice(0, 12)}…</span>
                    </div>
                    <div className="sc-info-row">
                      <span className="sc-info-label">Status</span>
                      <span className="sc-info-value">{selectedTicket.ride.status}</span>
                    </div>
                    <div className="sc-info-actions">
                      <a
                        href={`/rides/${selectedTicket.ride!.id}`}
                        className="sc-link-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/rides/${selectedTicket.ride!.id}`;
                        }}
                      >
                        <ExternalLink size={12} /> View Ride Details
                      </a>
                    </div>
                  </div>
                )}

                {!selectedTicket.ride && (
                  <div className="sc-info-card sc-info-card--empty">
                    <Package size={16} />
                    <span>No trip linked to this ticket.</span>
                  </div>
                )}

                {/* ── Actions ── */}
                {selectedTicket.status !== "RESOLVED" && selectedTicket.status !== "CLOSED" && (
                  <div className="sc-info-card">
                    <h4><MoreVertical size={14} /> Actions</h4>
                    <div className="sc-info-action-list">
                      <button
                        type="button"
                        className="sc-info-action-btn"
                        onClick={() => onTicketAction?.(selectedTicket.id, "assign")}
                      >
                        <User size={13} /> Assign to Me
                      </button>
                      <button
                        type="button"
                        className="sc-info-action-btn"
                        onClick={() => onTicketAction?.(selectedTicket.id, "escalate")}
                      >
                        <AlertTriangle size={13} /> Escalate
                      </button>
                      <button
                        type="button"
                        className="sc-info-action-btn sc-info-action-btn--resolve"
                        onClick={() => onTicketAction?.(selectedTicket.id, "resolve")}
                      >
                        <CheckCircle2 size={13} /> Resolve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="sc-info-placeholder">
                <User size={24} />
                <span>Customer details will appear here.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
