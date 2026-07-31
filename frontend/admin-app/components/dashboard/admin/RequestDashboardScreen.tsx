import { useEffect, useMemo, useState } from "react";
import { Bike, Package, CheckCircle, XCircle, Clock, Filter, Search } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { EmptyCard } from "./EmptyCard";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPagination } from "./ui/AdminPagination";
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

const REQUESTS_PAGE_SIZE = 10;

function isActionableStatus(status: string) {
  return ["searching", "pending"].includes(status.toLowerCase());
}

function shortenAddress(address: string, max = 64) {
  const value = address?.trim() || "Unknown location";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

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
  const [query, setQuery] = useState("");
  const [ridePage, setRidePage] = useState(1);
  const [deliveryPage, setDeliveryPage] = useState(1);

  const normalizedQuery = query.trim().toLowerCase();

  // Start from page 1 whenever the segment changes (tab, status filter, or search).
  useEffect(() => {
    setRidePage(1);
    setDeliveryPage(1);
  }, [requestTab, requestStatusView, normalizedQuery]);

  const filteredRideCards = useMemo(() => {
    if (!normalizedQuery) return visibleRequestCards;
    return visibleRequestCards.filter((ride) => {
      const haystack = [
        ride.passenger.user.fullName,
        ride.rider?.user.fullName ?? "",
        ride.pickupAddress,
        ride.destinationAddress,
        ride.id,
        ride.status
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [visibleRequestCards, normalizedQuery]);

  const filteredDeliveryCards = useMemo(() => {
    if (!normalizedQuery) return visibleDeliveryRequestCards;
    return visibleDeliveryRequestCards.filter((delivery) => {
      const haystack = [
        delivery.passenger.user.fullName,
        delivery.recipientName,
        delivery.pickupAddress,
        delivery.dropoffAddress,
        delivery.packageDescription,
        delivery.id,
        delivery.status
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [visibleDeliveryRequestCards, normalizedQuery]);

  const rideTotalPages = Math.max(1, Math.ceil(filteredRideCards.length / REQUESTS_PAGE_SIZE));
  const safeRidePage = Math.min(ridePage, rideTotalPages);
  const paginatedRideCards = useMemo(
    () => filteredRideCards.slice((safeRidePage - 1) * REQUESTS_PAGE_SIZE, safeRidePage * REQUESTS_PAGE_SIZE),
    [filteredRideCards, safeRidePage]
  );

  const deliveryTotalPages = Math.max(1, Math.ceil(filteredDeliveryCards.length / REQUESTS_PAGE_SIZE));
  const safeDeliveryPage = Math.min(deliveryPage, deliveryTotalPages);
  const paginatedDeliveryCards = useMemo(
    () =>
      filteredDeliveryCards.slice(
        (safeDeliveryPage - 1) * REQUESTS_PAGE_SIZE,
        safeDeliveryPage * REQUESTS_PAGE_SIZE
      ),
    [filteredDeliveryCards, safeDeliveryPage]
  );

  const toggleRideId = (id: string) => {
    setSelectedRideIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAllRides = () => {
    const actionable = paginatedRideCards.filter((r) => isActionableStatus(r.status)).map((r) => r.id);
    if (actionable.length === 0) return;
    if (actionable.every((id) => selectedRideIds.has(id))) setSelectedRideIds(new Set());
    else setSelectedRideIds(new Set(actionable));
  };
  const toggleDeliveryId = (id: string) => {
    setSelectedDeliveryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAllDeliveries = () => {
    const actionable = paginatedDeliveryCards.filter((d) => isActionableStatus(d.status)).map((d) => d.id);
    if (actionable.length === 0) return;
    if (actionable.every((id) => selectedDeliveryIds.has(id))) setSelectedDeliveryIds(new Set());
    else setSelectedDeliveryIds(new Set(actionable));
  };

  const activeTab = requestTab;
  const selectedCount = activeTab === "rides" ? selectedRideIds.size : selectedDeliveryIds.size;
  const liveCount =
    activeRequestCounts.pending + activeRequestCounts.accepted + activeRequestCounts.onTrip;
  const currency = adminCurrency || "GHS";

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

  const countForFilter = (key: RequestStatusView) => {
    if (key === "all") return activeRequestCounts.all;
    if (key === "pending") return activeRequestCounts.pending;
    if (key === "accepted") return activeRequestCounts.accepted;
    if (key === "on-trip") return activeRequestCounts.onTrip;
    if (key === "completed") return activeRequestCounts.completed;
    return activeRequestCounts.cancelled;
  };

  return (
    <div className="exact-admin-screen">
      <AdminPageHeader
        title="Ride Requests"
        subtitle="Live ride and delivery queue for Accra operations — fares in Ghana cedis."
      />

      {liveCount === 0 && activeRequestCounts.cancelled > 0 && requestStatusView === "all" && (
        <div className="admin-inline-banner">
          <span>
            No live requests right now. You&apos;re mostly seeing cancelled trips
            ({activeRequestCounts.cancelled}).
          </span>
          <button type="button" className="admin-filter-pill" onClick={() => onStatusViewChange("cancelled")}>
            View cancelled only
          </button>
        </div>
      )}

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

      <div className="admin-filter-bar admin-request-toolbar">
        <Filter size={14} />
        {statusFilters.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={`admin-filter-pill ${requestStatusView === filter.key ? "active" : ""}`}
            onClick={() => onStatusViewChange(filter.key)}
          >
            {filter.label}
            <em>{countForFilter(filter.key)}</em>
          </button>
        ))}
        <label className="admin-request-search">
          <Search size={14} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search passenger, place, or ID"
          />
        </label>
      </div>

      <div className="admin-screen-grid-2">
        <div className="admin-card-list">
          {requestTab === "rides" && (
            <>
              {filteredRideCards.length === 0 ? (
                <EmptyCard
                  title={normalizedQuery ? "No rides match your search." : "No ride requests found."}
                  body={
                    normalizedQuery
                      ? "Clear the search or switch status filters."
                      : "Try another status filter or wait for new passenger requests."
                  }
                />
              ) : (
                <>
                  <label className="admin-request-select-all">
                    <input
                      type="checkbox"
                      checked={
                        paginatedRideCards.some((r) => isActionableStatus(r.status)) &&
                        paginatedRideCards
                          .filter((r) => isActionableStatus(r.status))
                          .every((r) => selectedRideIds.has(r.id))
                      }
                      onChange={toggleAllRides}
                      disabled={!paginatedRideCards.some((r) => isActionableStatus(r.status))}
                    />
                    Select pending rides on this page
                  </label>
                  {paginatedRideCards.map((ride) => (
                    <article key={ride.id} className="admin-request-card">
                      <div className="admin-request-card-head">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={selectedRideIds.has(ride.id)}
                            disabled={!isActionableStatus(ride.status)}
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
                        <span>From: {shortenAddress(ride.pickupAddress)}</span>
                        <span>To: {shortenAddress(ride.destinationAddress)}</span>
                      </div>
                      <div className="admin-request-card-meta">
                        <span>Rider: {ride.rider?.user.fullName ?? "Unassigned"}</span>
                        <span>
                          Fare:{" "}
                          {formatMoney(
                            ride.currency || currency,
                            parseNumber(ride.finalFare ?? ride.estimatedFare)
                          )}
                        </span>
                        <span>{formatDateTime(ride.createdAt)}</span>
                      </div>
                      {isActionableStatus(ride.status) && (
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
                  <AdminPagination
                    page={safeRidePage}
                    totalItems={filteredRideCards.length}
                    pageSize={REQUESTS_PAGE_SIZE}
                    onPageChange={setRidePage}
                  />
                </>
              )}
            </>
          )}

          {requestTab === "delivery" && (
            <>
              {filteredDeliveryCards.length === 0 ? (
                <EmptyCard
                  title={normalizedQuery ? "No deliveries match your search." : "No delivery requests found."}
                  body={
                    normalizedQuery
                      ? "Clear the search or switch status filters."
                      : "Try another status filter or wait for new delivery requests."
                  }
                />
              ) : (
                <>
                  <label className="admin-request-select-all">
                    <input
                      type="checkbox"
                      checked={
                        paginatedDeliveryCards.some((d) => isActionableStatus(d.status)) &&
                        paginatedDeliveryCards
                          .filter((d) => isActionableStatus(d.status))
                          .every((d) => selectedDeliveryIds.has(d.id))
                      }
                      onChange={toggleAllDeliveries}
                      disabled={!paginatedDeliveryCards.some((d) => isActionableStatus(d.status))}
                    />
                    Select pending deliveries on this page
                  </label>
                  {paginatedDeliveryCards.map((delivery) => (
                    <article key={delivery.id} className="admin-request-card">
                      <div className="admin-request-card-head">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={selectedDeliveryIds.has(delivery.id)}
                            disabled={!isActionableStatus(delivery.status)}
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
                        <span>From: {shortenAddress(delivery.pickupAddress)}</span>
                        <span>To: {shortenAddress(delivery.dropoffAddress)}</span>
                      </div>
                      <div className="admin-request-card-meta">
                        <span>Package: {delivery.packageDescription || delivery.packageType}</span>
                        <span>Recipient: {delivery.recipientName}</span>
                        <span>
                          Fee:{" "}
                          {formatMoney(
                            delivery.currency || currency,
                            parseNumber(delivery.finalFee ?? delivery.estimatedFee)
                          )}
                        </span>
                        <span>{formatDateTime(delivery.createdAt)}</span>
                      </div>
                      {isActionableStatus(delivery.status) && (
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
                  <AdminPagination
                    page={safeDeliveryPage}
                    totalItems={filteredDeliveryCards.length}
                    pageSize={REQUESTS_PAGE_SIZE}
                    onPageChange={setDeliveryPage}
                  />
                </>
              )}
            </>
          )}
        </div>

        <aside className="admin-sidebar-panel">
          <article className="admin-reference-card">
            <div className="admin-reference-cardhead">
              <div>
                <h3>Peak Hours</h3>
                <p>Request volume by hour (Africa/Accra).</p>
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
                <p>{liveCount} live · {activeRequestCounts.cancelled} cancelled</p>
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
        <div className="admin-bulk-bar">
          <span>
            {selectedCount} {activeTab === "rides" ? "ride" : "delivery"}
            {selectedCount !== 1 ? "s" : ""} selected
          </span>
          <button type="button" className="admin-btn-primary" onClick={handleBulkAccept}>
            <CheckCircle size={14} /> Accept Selected
          </button>
          <button type="button" className="admin-btn-secondary" onClick={handleBulkDecline}>
            <XCircle size={14} /> Decline Selected
          </button>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => {
              setSelectedRideIds(new Set());
              setSelectedDeliveryIds(new Set());
            }}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}
