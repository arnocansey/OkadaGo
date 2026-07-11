import { useState } from "react";
import { Bike, Package, CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import type { RideRecord, DeliveryRecord } from "./types";
import { parseNumber, formatDateTime, statusTone, formatEnumLabel } from "./utils";

type RequestTab = "rides" | "delivery";
type RequestStatusView = "all" | "pending" | "accepted" | "on-trip" | "completed" | "cancelled";

export type RequestDashboardScreenProps = {
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  adminCurrency: string;
  requestTab: RequestTab;
  onTabChange: (tab: RequestTab) => void;
  requestStatusView: RequestStatusView;
  onStatusViewChange: (view: RequestStatusView) => void;
  visibleRequestCards: RideRecord[];
  visibleDeliveryRequestCards: DeliveryRecord[];
  activeRequestCounts: {
    all: number;
    pending: number;
    accepted: number;
    onTrip: number;
    completed: number;
    cancelled: number;
  };
  requestPeakBuckets: { label: string; count: number }[];
  requestPeakMax: number;
  onRideAction: (rideId: string, action: "accept" | "decline") => void;
  onDeliveryAction: (deliveryId: string, action: "accept" | "decline") => void;
  isMutating: boolean;
};

const statusFilters: { key: RequestStatusView; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "on-trip", label: "On Trip" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" }
];

export function RequestDashboardScreen({
  rides,
  deliveries,
  adminCurrency,
  requestTab,
  onTabChange,
  requestStatusView,
  onStatusViewChange,
  visibleRequestCards,
  visibleDeliveryRequestCards,
  activeRequestCounts,
  requestPeakBuckets,
  requestPeakMax,
  onRideAction,
  onDeliveryAction,
  isMutating
}: RequestDashboardScreenProps) {
  const [selectedRideIds, setSelectedRideIds] = useState<Set<string>>(new Set());
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<Set<string>>(new Set());

  const toggleRideId = (id: string) => {
    setSelectedRideIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAllRides = () => {
    const allIds = visibleRequestCards.map((r) => r.id);
    if (allIds.every((id) => selectedRideIds.has(id))) setSelectedRideIds(new Set());
    else setSelectedRideIds(new Set(allIds));
  };
  const toggleDeliveryId = (id: string) => {
    setSelectedDeliveryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleAllDeliveries = () => {
    const allIds = visibleDeliveryRequestCards.map((d) => d.id);
    if (allIds.every((id) => selectedDeliveryIds.has(id))) setSelectedDeliveryIds(new Set());
    else setSelectedDeliveryIds(new Set(allIds));
  };

  const activeTab = requestTab;
  const selectedCount = activeTab === "rides" ? selectedRideIds.size : selectedDeliveryIds.size;

  const handleBulkAccept = () => {
    const ids = activeTab === "rides" ? selectedRideIds : selectedDeliveryIds;
    const action = activeTab === "rides" ? onRideAction : onDeliveryAction;
    ids.forEach((id) => action(id as string, "accept"));
    if (activeTab === "rides") setSelectedRideIds(new Set());
    else setSelectedDeliveryIds(new Set());
  };
  const handleBulkDecline = () => {
    const ids = activeTab === "rides" ? selectedRideIds : selectedDeliveryIds;
    const action = activeTab === "rides" ? onRideAction : onDeliveryAction;
    ids.forEach((id) => action(id as string, "decline"));
    if (activeTab === "rides") setSelectedRideIds(new Set());
    else setSelectedDeliveryIds(new Set());
  };

  return (
    <div className="exact-admin-screen">
      {/* Tab switcher */}
      <div className="admin-tab-bar">
        <button
          type="button"
          className={`admin-tab ${requestTab === "rides" ? "active" : ""}`}
          onClick={() => onTabChange("rides")}
        >
          <Bike size={16} />
          Rides ({rides.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${requestTab === "delivery" ? "active" : ""}`}
          onClick={() => onTabChange("delivery")}
        >
          <Package size={16} />
          Deliveries ({deliveries.length})
        </button>
      </div>

      {/* Status filter bar */}
      <div className="admin-filter-bar">
        <Filter size={14} />
        {statusFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={`admin-filter-pill ${requestStatusView === filter.key ? "active" : ""}`}
            onClick={() => onStatusViewChange(filter.key)}
          >
            {filter.label}
            <em>
              {filter.key === "all"
                ? activeRequestCounts.all
                : filter.key === "pending"
                  ? activeRequestCounts.pending
                  : filter.key === "accepted"
                    ? activeRequestCounts.accepted
                    : filter.key === "on-trip"
                      ? activeRequestCounts.onTrip
                      : filter.key === "completed"
                        ? activeRequestCounts.completed
                        : activeRequestCounts.cancelled}
            </em>
          </button>
        ))}
      </div>

      <div className="admin-screen-grid-2">
        {/* Request cards */}
        <div className="admin-card-list">
          {requestTab === "rides" && (
            <>
              {visibleRequestCards.length === 0 ? (
                <EmptyCard
                  title="No ride requests found."
                  body="Try switching the status filter or waiting for new requests."
                />
              ) : (
                <>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 13, color: "var(--muted, #888)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={visibleRequestCards.length > 0 && visibleRequestCards.every((r) => selectedRideIds.has(r.id))}
                      onChange={toggleAllRides}
                    />
                    Select all rides
                  </label>
                  {visibleRequestCards.map((ride) => (
                  <article key={ride.id} className="admin-request-card">
                    <div className="admin-request-card-head">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={selectedRideIds.has(ride.id)}
                          onChange={() => toggleRideId(ride.id)}
                        />
                        <div>
                          <strong>{ride.passenger.user.fullName}</strong>
                          <small>{ride.id.slice(-6).toUpperCase()}</small>
                        </div>
                      </div>
                      <em className={`admin-reference-tag ${statusTone(ride.status)}`}>
                        {formatEnumLabel(ride.status)}
                      </em>
                    </div>
                    <div className="admin-request-card-route">
                      <span>From: {ride.pickupAddress}</span>
                      <span>To: {ride.destinationAddress}</span>
                    </div>
                    <div className="admin-request-card-meta">
                      <span>
                        Rider: {ride.rider?.user.fullName ?? "Unassigned"}
                      </span>
                      <span>
                        Fare:{" "}
                        {formatMoney(
                          ride.currency,
                          parseNumber(ride.finalFare ?? ride.estimatedFare)
                        )}
                      </span>
                      <span>{formatDateTime(ride.createdAt)}</span>
                    </div>
                    {["searching", "pending"].includes(ride.status.toLowerCase()) && (
                      <div className="admin-request-card-actions">
                        <button
                          type="button"
                          className="button-sm success"
                          disabled={isMutating}
                          onClick={() => onRideAction(ride.id, "accept")}
                        >
                          <CheckCircle size={14} />
                          Accept
                        </button>
                        <button
                          type="button"
                          className="button-sm danger"
                          disabled={isMutating}
                          onClick={() => onRideAction(ride.id, "decline")}
                        >
                          <XCircle size={14} />
                          Decline
                        </button>
                      </div>
                    )}
                  </article>
                ))}
                </>
              )}
            </>
          )}

          {requestTab === "delivery" && (
            <>
              {visibleDeliveryRequestCards.length === 0 ? (
                <EmptyCard
                  title="No delivery requests found."
                  body="Try switching the status filter or waiting for new deliveries."
                />
              ) : (
                <>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 13, color: "var(--muted, #888)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={visibleDeliveryRequestCards.length > 0 && visibleDeliveryRequestCards.every((d) => selectedDeliveryIds.has(d.id))}
                      onChange={toggleAllDeliveries}
                    />
                    Select all deliveries
                  </label>
                  {visibleDeliveryRequestCards.map((delivery) => (
                  <article key={delivery.id} className="admin-request-card">
                    <div className="admin-request-card-head">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={selectedDeliveryIds.has(delivery.id)}
                          onChange={() => toggleDeliveryId(delivery.id)}
                        />
                        <div>
                          <strong>{delivery.passenger.user.fullName}</strong>
                          <small>{delivery.id.slice(-6).toUpperCase()}</small>
                        </div>
                      </div>
                      <em className={`admin-reference-tag ${statusTone(delivery.status)}`}>
                        {formatEnumLabel(delivery.status)}
                      </em>
                    </div>
                    <div className="admin-request-card-route">
                      <span>From: {delivery.pickupAddress}</span>
                      <span>To: {delivery.dropoffAddress}</span>
                    </div>
                    <div className="admin-request-card-meta">
                      <span>Package: {delivery.packageDescription}</span>
                      <span>Recipient: {delivery.recipientName}</span>
                      <span>
                        Fee:{" "}
                        {formatMoney(
                          delivery.currency,
                          parseNumber(delivery.finalFee ?? delivery.estimatedFee)
                        )}
                      </span>
                      <span>{formatDateTime(delivery.createdAt)}</span>
                    </div>
                    {["searching", "pending"].includes(delivery.status.toLowerCase()) && (
                      <div className="admin-request-card-actions">
                        <button
                          type="button"
                          className="button-sm success"
                          disabled={isMutating}
                          onClick={() => onDeliveryAction(delivery.id, "accept")}
                        >
                          <CheckCircle size={14} />
                          Accept
                        </button>
                        <button
                          type="button"
                          className="button-sm danger"
                          disabled={isMutating}
                          onClick={() => onDeliveryAction(delivery.id, "decline")}
                        >
                          <XCircle size={14} />
                          Decline
                        </button>
                      </div>
                    )}
                  </article>
                ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Peak hours chart */}
        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Peak Hours</h3>
                <p>Ride volume by time of day.</p>
              </div>
              <Clock size={16} />
            </div>
            <div className="admin-reference-bars horizontal">
              {requestPeakBuckets.map((bucket) => (
                <div key={bucket.label} className="admin-reference-hbar-row">
                  <span>{bucket.label}</span>
                  <div className="admin-reference-hbar-track">
                    <div
                      className="admin-reference-hbar-fill"
                      style={{ width: `${Math.max(4, (bucket.count / requestPeakMax) * 100)}%` }}
                    />
                  </div>
                  <em>{bucket.count}</em>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Status Summary</h3>
              </div>
            </div>
            <ul className="admin-summary-list">
              <li>
                <span>Pending dispatch</span>
                <strong>{activeRequestCounts.pending}</strong>
              </li>
              <li>
                <span>Accepted / en route</span>
                <strong>{activeRequestCounts.accepted}</strong>
              </li>
              <li>
                <span>On trip</span>
                <strong>{activeRequestCounts.onTrip}</strong>
              </li>
              <li>
                <span>Completed</span>
                <strong>{activeRequestCounts.completed}</strong>
              </li>
              <li>
                <span>Cancelled</span>
                <strong>{activeRequestCounts.cancelled}</strong>
              </li>
            </ul>
          </article>
        </aside>
      </div>

      {selectedCount > 0 && (
        <div
          className="admin-bulk-bar"
          style={{
            position: "sticky",
            bottom: 0,
            background: "var(--card-bg, #1a1b1e)",
            borderTop: "1px solid var(--border)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            zIndex: 10
          }}
        >
          <span style={{ fontSize: 13, color: "var(--muted, #aaa)" }}>
            {selectedCount} {activeTab === "rides" ? "ride" : "delivery"}{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <button type="button" className="admin-select-sm" onClick={handleBulkAccept}>
            <CheckCircle size={14} /> Accept Selected
          </button>
          <button type="button" className="admin-select-sm" onClick={handleBulkDecline}>
            <XCircle size={14} /> Decline Selected
          </button>
          <button
            type="button"
            className="admin-select-sm"
            onClick={() => { setSelectedRideIds(new Set()); setSelectedDeliveryIds(new Set()); }}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}
