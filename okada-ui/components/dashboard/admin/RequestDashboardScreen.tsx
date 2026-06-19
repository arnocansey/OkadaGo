"use client";

import { useState } from "react";
import { Bike, CheckCircle, Clock, Download, Filter, Package, XCircle } from "lucide-react";
import { OperationsMap } from "@/components/maps/operations-map";
import { formatMoney } from "@/lib/currency";
import type { RideRecord, DeliveryRecord } from "./types";
import { EmptyCard } from "./EmptyCard";
import { parseNumber, formatDateTime, statusTone, formatEnumLabel } from "./utils";

type MapMarker = {
  id: string;
  position: [number, number];
  label: string;
  variant: "driver";
};

type RequestDashboardScreenProps = {
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  mapMarkers: MapMarker[];
  currency: string;
  onRideAction?: (rideId: string, action: "accept" | "decline") => void;
  onDeliveryAction?: (deliveryId: string, action: "accept" | "decline") => void;
  isRideActionPending?: boolean;
  isDeliveryActionPending?: boolean;
  rideActionVariables?: { rideId: string } | null;
  deliveryActionVariables?: { deliveryId: string } | null;
  rideActionError?: string | null;
  deliveryActionError?: string | null;
};

export function RequestDashboardScreen({
  rides,
  deliveries,
  mapMarkers,
  currency,
  onRideAction,
  onDeliveryAction,
  isRideActionPending = false,
  isDeliveryActionPending = false,
  rideActionVariables = null,
  deliveryActionVariables = null,
  rideActionError = null,
  deliveryActionError = null
}: RequestDashboardScreenProps) {
  const [requestTab, setRequestTab] = useState<"rides" | "food" | "delivery">("rides");
  const [requestStatusView, setRequestStatusView] = useState<
    "all" | "pending" | "accepted" | "on-trip" | "completed" | "cancelled"
  >("all");

  const requestPending = rides.filter((ride) => ["searching", "pending"].includes(ride.status.toLowerCase()));
  const requestAccepted = rides.filter((ride) =>
    ["assigned", "arriving", "arrived"].includes(ride.status.toLowerCase())
  );
  const requestOnTrip = rides.filter((ride) => ride.status.toLowerCase() === "started");
  const requestCompleted = rides.filter((ride) => ride.status.toLowerCase() === "completed");
  const requestCancelled = rides.filter((ride) => ride.status.toLowerCase() === "cancelled");

  const deliveryRequestPending = deliveries.filter((delivery) =>
    ["searching", "pending"].includes(delivery.status.toLowerCase())
  );
  const deliveryRequestAccepted = deliveries.filter((delivery) =>
    delivery.status.toLowerCase() === "assigned"
  );
  const deliveryRequestOnTrip = deliveries.filter((delivery) =>
    ["picked_up", "in_transit"].includes(delivery.status.toLowerCase())
  );
  const deliveryRequestCompleted = deliveries.filter((delivery) => delivery.status.toLowerCase() === "delivered");
  const deliveryRequestCancelled = deliveries.filter((delivery) => delivery.status.toLowerCase() === "cancelled");

  const requestCards = rides
    .slice()
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 8);

  const deliveryRequestCards = deliveries
    .slice()
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 8);

  const visibleRequestCards =
    requestTab === "rides"
      ? requestCards.filter((ride) => {
          const status = ride.status.toLowerCase();
          if (requestStatusView === "pending") return ["searching", "pending"].includes(status);
          if (requestStatusView === "accepted") return ["assigned", "arriving", "arrived"].includes(status);
          if (requestStatusView === "on-trip") return status === "started";
          if (requestStatusView === "completed") return status === "completed";
          if (requestStatusView === "cancelled") return status === "cancelled";
          return true;
        })
      : [];

  const visibleDeliveryRequestCards =
    requestTab === "delivery"
      ? deliveryRequestCards.filter((delivery) => {
          const status = delivery.status.toLowerCase();
          if (requestStatusView === "pending") return ["searching", "pending"].includes(status);
          if (requestStatusView === "accepted") return status === "assigned";
          if (requestStatusView === "on-trip") return ["picked_up", "in_transit"].includes(status);
          if (requestStatusView === "completed") return status === "delivered";
          if (requestStatusView === "cancelled") return status === "cancelled";
          return true;
        })
      : [];

  const activeRequestCounts =
    requestTab === "delivery"
      ? {
          all: deliveries.length,
          pending: deliveryRequestPending.length,
          accepted: deliveryRequestAccepted.length,
          onTrip: deliveryRequestOnTrip.length,
          completed: deliveryRequestCompleted.length,
          cancelled: deliveryRequestCancelled.length
        }
      : requestTab === "rides"
        ? {
            all: rides.length,
            pending: requestPending.length,
            accepted: requestAccepted.length,
            onTrip: requestOnTrip.length,
            completed: requestCompleted.length,
            cancelled: requestCancelled.length
          }
        : {
            all: 0,
            pending: 0,
            accepted: 0,
            onTrip: 0,
            completed: 0,
            cancelled: 0
          };

  const requestPeakBuckets = Array.from({ length: 6 }, (_, index) => {
    const startHour = index * 4;
    const endHour = startHour + 3;
    const count = rides.filter((ride) => {
      const date = new Date(ride.createdAt);
      return !Number.isNaN(date.getTime()) && date.getHours() >= startHour && date.getHours() <= endHour;
    }).length;
    return {
      label: `${String(startHour).padStart(2, "0")}:00`,
      count
    };
  });
  const requestPeakMax = Math.max(1, ...requestPeakBuckets.map((bucket) => bucket.count));

  function handleExportCsv() {
    const headers =
      requestTab === "delivery"
        ? ["id", "status", "passenger", "rider", "pickup", "dropoff", "package", "fee", "createdAt"]
        : ["id", "status", "passenger", "rider", "pickup", "destination", "fare", "createdAt"];
    const rows =
      requestTab === "delivery"
        ? visibleDeliveryRequestCards.map((delivery) => [
            delivery.id,
            delivery.status,
            delivery.passenger.user.fullName,
            delivery.rider?.user.fullName ?? "",
            delivery.pickupAddress,
            delivery.dropoffAddress,
            delivery.packageDescription,
            parseNumber(delivery.finalFee ?? delivery.estimatedFee).toString(),
            delivery.createdAt
          ])
        : visibleRequestCards.map((ride) => [
            ride.id,
            ride.status,
            ride.passenger.user.fullName,
            ride.rider?.user.fullName ?? "",
            ride.pickupAddress,
            ride.destinationAddress,
            parseNumber(ride.finalFare ?? ride.estimatedFare).toString(),
            ride.createdAt
          ]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`).join(",")
      )
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = requestTab === "delivery" ? "okadago-delivery-requests.csv" : "okadago-ride-requests.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-reference-dark admin-requests-dashboard">
      <section className="admin-request-tabs">
        <button
          className={requestTab === "rides" ? "active" : ""}
          type="button"
          onClick={() => {
            setRequestTab("rides");
            setRequestStatusView("all");
          }}
        >
          <Bike size={16} />
          <span>Ride Requests</span>
        </button>
        <button
          className={requestTab === "food" ? "active" : ""}
          type="button"
          onClick={() => {
            setRequestTab("food");
            setRequestStatusView("all");
          }}
        >
          <Package size={16} />
          <span>Food Orders</span>
        </button>
        <button
          className={requestTab === "delivery" ? "active" : ""}
          type="button"
          onClick={() => {
            setRequestTab("delivery");
            setRequestStatusView("all");
          }}
        >
          <Package size={16} />
          <span>Delivery Requests</span>
        </button>
        <div className="admin-request-actions">
          <button type="button" onClick={() => setRequestStatusView("pending")}>
            <Filter size={15} />
            <span>Show Pending</span>
          </button>
          <button
            className="primary"
            type="button"
            onClick={handleExportCsv}
            disabled={
              requestTab === "delivery"
                ? visibleDeliveryRequestCards.length === 0
                : visibleRequestCards.length === 0
            }
          >
            <Download size={15} />
            <span>Export</span>
          </button>
        </div>
      </section>

      <section className="admin-request-filter-row">
        <button className={requestStatusView === "all" ? "active" : ""} type="button" onClick={() => setRequestStatusView("all")}>
          All Requests <strong>{activeRequestCounts.all}</strong>
        </button>
        <button className={requestStatusView === "pending" ? "active" : ""} type="button" onClick={() => setRequestStatusView("pending")}>
          Pending <strong>{activeRequestCounts.pending}</strong>
        </button>
        <button className={requestStatusView === "accepted" ? "active" : ""} type="button" onClick={() => setRequestStatusView("accepted")}>
          Accepted <strong>{activeRequestCounts.accepted}</strong>
        </button>
        <button className={requestStatusView === "on-trip" ? "active" : ""} type="button" onClick={() => setRequestStatusView("on-trip")}>
          On Trip <strong>{activeRequestCounts.onTrip}</strong>
        </button>
        <button className={requestStatusView === "completed" ? "active" : ""} type="button" onClick={() => setRequestStatusView("completed")}>
          Completed <strong>{activeRequestCounts.completed}</strong>
        </button>
        <button className={`danger ${requestStatusView === "cancelled" ? "active" : ""}`} type="button" onClick={() => setRequestStatusView("cancelled")}>
          Cancelled <strong>{activeRequestCounts.cancelled}</strong>
        </button>
      </section>

      <section className="admin-request-layout">
        <article className="admin-dark-card admin-request-list-card">
          <div className="admin-dark-cardhead">
            <div>
              <h3>
                {requestTab === "delivery"
                  ? `All Delivery Requests (${deliveries.length})`
                  : requestTab === "food"
                    ? "All Food Orders (0)"
                    : `All Ride Requests (${rides.length})`}
              </h3>
              <p>
                {requestTab === "delivery"
                  ? "Live parcel delivery requests from the backend delivery service."
                  : requestTab === "food"
                    ? "Food orders are not part of the backend yet."
                    : "Live ride requests from the backend ride service."}
              </p>
            </div>
            <span>Sort by: Newest</span>
          </div>
          {requestTab === "food" ? (
            <EmptyCard
              title="Food orders are not wired yet."
              body="The delivery system is wired now. Food ordering still needs its own backend model and API before it can render live records."
            />
          ) : requestTab === "delivery" ? (
            visibleDeliveryRequestCards.length === 0 ? (
              <EmptyCard
                title="No delivery requests match this filter."
                body="Change the selected status filter or wait for matching live delivery requests."
              />
            ) : (
              <div className="admin-request-list">
                {visibleDeliveryRequestCards.map((delivery) => {
                  const normalizedStatus = delivery.status.toLowerCase();
                  const isActionable = ["searching", "pending"].includes(normalizedStatus);
                  const isMutatingThisDelivery =
                    isDeliveryActionPending && deliveryActionVariables?.deliveryId === delivery.id;

                  return (
                    <article key={delivery.id} className="admin-request-card">
                      <div className="admin-request-user">
                        <span className={`status-chip ${statusTone(delivery.status)}`}>
                          {formatEnumLabel(delivery.status)}
                        </span>
                        <div className="admin-reference-avatar">
                          {delivery.passenger.user.fullName
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <strong>{delivery.passenger.user.fullName}</strong>
                        <small>{delivery.rider?.user.fullName ?? "Awaiting rider"}</small>
                      </div>
                      <div className="admin-request-route">
                        <span>{delivery.pickupAddress}</span>
                        <span>{delivery.dropoffAddress}</span>
                        <small>
                          {delivery.packageType}: {delivery.packageDescription}
                        </small>
                      </div>
                      <div className="admin-request-fare">
                        <strong>{formatMoney(delivery.currency, delivery.finalFee ?? delivery.estimatedFee)}</strong>
                        <span>{delivery.id.slice(-10).toUpperCase()}</span>
                      </div>
                      <div className="admin-request-card-actions">
                        {isActionable ? (
                          <>
                            <button
                              type="button"
                              disabled={isDeliveryActionPending}
                              onClick={() => onDeliveryAction?.(delivery.id, "accept")}
                            >
                              {isMutatingThisDelivery ? "Working..." : "Accept"}
                            </button>
                            <button
                              className="outline"
                              type="button"
                              disabled={isDeliveryActionPending}
                              onClick={() => onDeliveryAction?.(delivery.id, "decline")}
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <button type="button" onClick={() => setRequestStatusView("all")}>View Details</button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )
          ) : visibleRequestCards.length === 0 ? (
            <EmptyCard
              title="No ride requests match this filter."
              body="Change the selected status filter or wait for matching live ride requests."
            />
          ) : (
            <div className="admin-request-list">
              {visibleRequestCards.map((ride) => {
                const normalizedStatus = ride.status.toLowerCase();
                const isActionable = ["searching", "pending"].includes(normalizedStatus);
                const isMutatingThisRide =
                  isRideActionPending && rideActionVariables?.rideId === ride.id;

                return (
                  <article key={ride.id} className="admin-request-card">
                    <div className="admin-request-user">
                      <span className={`status-chip ${statusTone(ride.status)}`}>
                        {formatEnumLabel(ride.status)}
                      </span>
                      <div className="admin-reference-avatar">
                        {ride.passenger.user.fullName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <strong>{ride.passenger.user.fullName}</strong>
                      <small>{ride.rider?.user.fullName ?? "Awaiting rider"}</small>
                    </div>
                    <div className="admin-request-route">
                      <span>{ride.pickupAddress}</span>
                      <span>{ride.destinationAddress}</span>
                      <small>{formatDateTime(ride.createdAt)}</small>
                    </div>
                    <div className="admin-request-fare">
                      <strong>{formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}</strong>
                      <span>{ride.id.slice(-10).toUpperCase()}</span>
                    </div>
                    <div className="admin-request-card-actions">
                      {isActionable ? (
                        <>
                          <button
                            type="button"
                            disabled={isRideActionPending}
                            onClick={() => onRideAction?.(ride.id, "accept")}
                          >
                            {isMutatingThisRide ? "Working..." : "Accept"}
                          </button>
                          <button
                            className="outline"
                            type="button"
                            disabled={isRideActionPending}
                            onClick={() => onRideAction?.(ride.id, "decline")}
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => setRequestStatusView("all")}>View Details</button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {rideActionError ? (
            <div className="empty-state exact-admin-payout-feedback">
              <strong>Ride request action failed.</strong>
              <p>{rideActionError}</p>
            </div>
          ) : null}
          {deliveryActionError ? (
            <div className="empty-state exact-admin-payout-feedback">
              <strong>Delivery request action failed.</strong>
              <p>{deliveryActionError}</p>
            </div>
          ) : null}
        </article>

        <aside className="admin-request-side">
          <article className="admin-dark-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>Live Requests Map</h3>
                <p>{mapMarkers.length} live rider locations.</p>
              </div>
              <span className="live-dot">Live</span>
            </div>
            <div className="admin-request-map">
              <OperationsMap
                center={mapMarkers[0]?.position ?? [5.6037, -0.187]}
                zoom={mapMarkers.length > 0 ? 11 : 6}
                markers={mapMarkers}
                emptyTitle="No live map coordinates."
                emptyDescription="Online riders with coordinates will appear here."
              />
            </div>
          </article>

          <article className="admin-dark-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>Request Statistics</h3>
                <p>Current ride request status mix.</p>
              </div>
              <span>Today</span>
            </div>
            <div className="admin-request-stats">
              <div><Package size={16} /><span>Total Requests</span><strong>{rides.length}</strong></div>
              <div><Clock size={16} /><span>Pending</span><strong>{requestPending.length}</strong></div>
              <div><CheckCircle size={16} /><span>Accepted</span><strong>{requestAccepted.length}</strong></div>
              <div><Bike size={16} /><span>On Trip</span><strong>{requestOnTrip.length}</strong></div>
              <div><CheckCircle size={16} /><span>Completed</span><strong>{requestCompleted.length}</strong></div>
              <div><XCircle size={16} /><span>Cancelled</span><strong>{requestCancelled.length}</strong></div>
            </div>
          </article>

          <article className="admin-dark-card">
            <div className="admin-dark-cardhead">
              <div>
                <h3>Peak Request Time</h3>
                <p>Requests grouped into 4-hour windows.</p>
              </div>
              <span>Today</span>
            </div>
            <div className="admin-request-peak-chart">
              {requestPeakBuckets.map((bucket) => (
                <div key={bucket.label}>
                  <i style={{ height: bucket.count === 0 ? 0 : `${Math.max(8, (bucket.count / requestPeakMax) * 100)}%` }} />
                  <span>{bucket.label}</span>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
