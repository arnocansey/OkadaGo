"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OperationsMap } from "@/components/maps/operations-map";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminPagination, hasServerPagination } from "./ui/AdminPagination";
import { formatMoney } from "@/lib/currency";
import type { RideRecord } from "./types";
import { parseNumber, formatDateTime, statusTone, ACCRA_MAP_CENTER, ACCRA_MAP_ZOOM_CITY, ACCRA_MAP_ZOOM_METRO } from "./utils";
import {
  Search,
  X,
  Bike,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  User,
  Navigation,
  FileText,
  ChevronRight,
  Phone,
  Truck,
  Star,
  Route,
  Eye
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

type StatusFilter = "all" | "active" | "completed" | "cancelled" | "scheduled" | "disputed";

export type RidesScreenProps = {
  rides: RideRecord[];
  adminCurrency: string;
  ridesTotal: number;
  ridesPage: number;
  ridesPageSize: number;
  onRidesPageChange: (page: number) => void;
  dataLoading?: boolean;
};

/* ── Constants ────────────────────────────────────────────────────────────── */

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All Rides" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "scheduled", label: "Scheduled" },
  { key: "disputed", label: "Disputed" }
];

const ACTIVE_STATUSES = ["searching", "assigned", "arriving", "arrived", "started", "picked_up", "in_transit"];
const COMPLETED_STATUSES = ["completed", "delivered"];
const CANCELLED_STATUSES = ["cancelled"];
const SCHEDULED_STATUSES = ["scheduled"];
const DISPUTED_STATUSES = ["disputed", "flagged", "under_review"];

function matchesFilter(ride: RideRecord, filter: StatusFilter): boolean {
  const s = ride.status.toLowerCase();
  if (filter === "all") return true;
  if (filter === "active") return ACTIVE_STATUSES.includes(s);
  if (filter === "completed") return COMPLETED_STATUSES.includes(s);
  if (filter === "cancelled") return CANCELLED_STATUSES.includes(s);
  if (filter === "scheduled") return SCHEDULED_STATUSES.includes(s);
  if (filter === "disputed") return DISPUTED_STATUSES.includes(s);
  return true;
}

function formatPaymentMethod(method?: string | null): string {
  if (!method) return "—";
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildTimeline(ride: RideRecord) {
  const events: { label: string; time: string | null; done: boolean }[] = [
    { label: "Requested", time: ride.requestedAt ?? ride.createdAt, done: true },
    { label: "Assigned", time: ride.assignedAt ?? null, done: Boolean(ride.assignedAt) },
    { label: "Rider Arrived", time: ride.riderArrivedAt ?? null, done: Boolean(ride.riderArrivedAt) },
    { label: "Started", time: ride.startedAt ?? null, done: Boolean(ride.startedAt) },
    { label: "Completed", time: ride.completedAt ?? null, done: Boolean(ride.completedAt) }
  ];
  if (ride.cancelledAt) {
    events.push({ label: "Cancelled", time: ride.cancelledAt, done: true });
  }
  return events;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export function RidesScreen({
  rides,
  adminCurrency,
  ridesTotal,
  ridesPage,
  ridesPageSize,
  onRidesPageChange,
  dataLoading = false
}: RidesScreenProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedRide, setSelectedRide] = useState<RideRecord | null>(null);

  const filtered = useMemo(() => {
    let list = rides;
    if (statusFilter !== "all") {
      list = list.filter((r) => matchesFilter(r, statusFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.passenger.user.fullName.toLowerCase().includes(q) ||
          r.rider?.user.fullName.toLowerCase().includes(q) ||
          r.pickupAddress.toLowerCase().includes(q) ||
          r.destinationAddress.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rides, statusFilter, search]);

  const filterCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = { all: rides.length, active: 0, completed: 0, cancelled: 0, scheduled: 0, disputed: 0 };
    for (const r of rides) {
      const s = r.status.toLowerCase();
      if (ACTIVE_STATUSES.includes(s)) counts.active++;
      else if (COMPLETED_STATUSES.includes(s)) counts.completed++;
      else if (CANCELLED_STATUSES.includes(s)) counts.cancelled++;
      else if (SCHEDULED_STATUSES.includes(s)) counts.scheduled++;
      else if (DISPUTED_STATUSES.includes(s)) counts.disputed++;
    }
    return counts;
  }, [rides]);

  const detailTimeline = useMemo(() => selectedRide ? buildTimeline(selectedRide) : [], [selectedRide]);

  const detailRoute = useMemo((): [number, number][] => {
    if (!selectedRide) return [];
    const lat = parseNumber(selectedRide.pickupLatitude);
    const lng = parseNumber(selectedRide.pickupLongitude);
    const dlat = parseNumber(selectedRide.destinationLatitude);
    const dlng = parseNumber(selectedRide.destinationLongitude);
    if (!lat || !lng || !dlat || !dlng) return [];
    return [[lat, lng], [dlat, dlng]];
  }, [selectedRide]);

  const detailMarkers = useMemo(() => {
    if (!selectedRide) return [];
    const lat = parseNumber(selectedRide.pickupLatitude);
    const lng = parseNumber(selectedRide.pickupLongitude);
    const dlat = parseNumber(selectedRide.destinationLatitude);
    const dlng = parseNumber(selectedRide.destinationLongitude);
    const markers = [];
    if (lat && lng) markers.push({ id: "pickup", position: [lat, lng] as [number, number], label: "Pickup", variant: "pickup" as const });
    if (dlat && dlng) markers.push({ id: "dest", position: [dlat, dlng] as [number, number], label: "Destination", variant: "destination" as const });
    return markers;
  }, [selectedRide]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="table" kpis={4} rows={8} cols={8} />;
  }

  return (
    <div className="rides-mgmt">
      <AdminPageHeader
        title="Rides"
        subtitle={`Manage and review all ${ridesTotal} ride requests across the platform.`}
      />

      {/* ── Filters ── */}
      <div className="rides-mgmt-toolbar">
        <div className="rides-mgmt-filters">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`rides-mgmt-filter ${statusFilter === f.key ? "active" : ""}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
              <span className="rides-mgmt-filter-count">{filterCounts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="rides-mgmt-search">
          <Search size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, or address..."
          />
          {search && (
            <button type="button" className="rides-mgmt-search-clear" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rides-mgmt-table-wrap">
        {filtered.length === 0 ? (
          <div className="rides-mgmt-empty">
            <EmptyCard title="No rides found" body="Try adjusting your filters or search query." />
          </div>
        ) : (
          <table className="rides-mgmt-table">
            <thead>
              <tr>
                <th>Ride ID</th>
                <th>Passenger</th>
                <th>Rider</th>
                <th>Pickup</th>
                <th>Destination</th>
                <th>Service</th>
                <th>Fare</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((ride) => (
                <tr
                  key={ride.id}
                  className={selectedRide?.id === ride.id ? "selected" : ""}
                >
                  <td>
                    <code className="rides-mgmt-id">{ride.id.slice(0, 8)}</code>
                  </td>
                  <td>
                    <span className="rides-mgmt-name">{ride.passenger.user.fullName}</span>
                  </td>
                  <td>
                    <span className="rides-mgmt-name">
                      {ride.rider?.user.fullName ?? <em className="rides-mgmt-unassigned">Unassigned</em>}
                    </span>
                  </td>
                  <td>
                    <span className="rides-mgmt-address" title={ride.pickupAddress}>
                      {ride.pickupAddress.length > 28 ? ride.pickupAddress.slice(0, 28) + "…" : ride.pickupAddress}
                    </span>
                  </td>
                  <td>
                    <span className="rides-mgmt-address" title={ride.destinationAddress}>
                      {ride.destinationAddress.length > 28 ? ride.destinationAddress.slice(0, 28) + "…" : ride.destinationAddress}
                    </span>
                  </td>
                  <td>
                    <span className="rides-mgmt-zone">{ride.serviceZone?.name ?? "—"}</span>
                  </td>
                  <td>
                    <span className="rides-mgmt-fare">
                      {formatMoney(ride.currency || adminCurrency, parseNumber(ride.finalFare ?? ride.estimatedFare))}
                    </span>
                  </td>
                  <td>
                    <span className="rides-mgmt-payment">{formatPaymentMethod(ride.paymentMethod)}</span>
                  </td>
                  <td>
                    <em className={`rides-mgmt-status ${statusTone(ride.status)}`}>{ride.status}</em>
                  </td>
                  <td>
                    <span className="rides-mgmt-date">{formatDateTime(ride.createdAt)}</span>
                  </td>
                  <td>
                    <Link href={`/rides/${ride.id}`} className="rides-mgmt-view-btn">
                      <Eye size={14} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {hasServerPagination({ page: ridesPage, totalItems: ridesTotal, onPageChange: onRidesPageChange }) && (
        <AdminPagination
          page={ridesPage}
          totalItems={ridesTotal}
          pageSize={ridesPageSize}
          onPageChange={onRidesPageChange}
        />
      )}

      {/* ── Detail Panel (slide-in) ── */}
      {selectedRide && (
        <div className="rides-detail-overlay" onClick={() => setSelectedRide(null)}>
          <div className="rides-detail-panel" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="rides-detail-header">
              <div className="rides-detail-header-left">
                <code className="rides-detail-id">{selectedRide.id.slice(0, 12)}</code>
                <em className={`rides-mgmt-status ${statusTone(selectedRide.status)}`}>{selectedRide.status}</em>
              </div>
              <button type="button" className="rides-detail-close" onClick={() => setSelectedRide(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="rides-detail-body">
              {/* ── Map Route ── */}
              {detailRoute.length >= 2 && (
                <section className="rides-detail-section">
                  <h4><Route size={14} /> Route</h4>
                  <div className="rides-detail-map">
                    <OperationsMap
                      basemap="auto"
                      center={detailRoute[0]}
                      zoom={13}
                      markers={detailMarkers}
                      route={detailRoute}
                      emptyTitle=""
                      emptyDescription=""
                      bare
                    />
                  </div>
                </section>
              )}

              {/* ── Trip Timeline ── */}
              <section className="rides-detail-section">
                <h4><Clock size={14} /> Trip Timeline</h4>
                <div className="rides-detail-timeline">
                  {detailTimeline.map((event, i) => (
                    <div key={event.label} className={`rides-timeline-step ${event.done ? "done" : ""}`}>
                      <div className="rides-timeline-dot" />
                      {i < detailTimeline.length - 1 && <div className="rides-timeline-line" />}
                      <div className="rides-timeline-content">
                        <strong>{event.label}</strong>
                        <small>{event.time ? formatDateTime(event.time) : "—"}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Passenger Info ── */}
              <section className="rides-detail-section">
                <h4><User size={14} /> Passenger</h4>
                <div className="rides-detail-info-grid">
                  <div className="rides-detail-info-item">
                    <span className="rides-detail-info-label">Name</span>
                    <span className="rides-detail-info-value">{selectedRide.passenger.user.fullName}</span>
                  </div>
                  {selectedRide.passenger.user.phoneE164 && (
                    <div className="rides-detail-info-item">
                      <span className="rides-detail-info-label">Phone</span>
                      <span className="rides-detail-info-value">
                        <Phone size={12} /> {selectedRide.passenger.user.phoneE164}
                      </span>
                    </div>
                  )}
                  {selectedRide.passenger.user.email && (
                    <div className="rides-detail-info-item">
                      <span className="rides-detail-info-label">Email</span>
                      <span className="rides-detail-info-value">{selectedRide.passenger.user.email}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Rider Info ── */}
              <section className="rides-detail-section">
                <h4><Bike size={14} /> Rider</h4>
                {selectedRide.rider ? (
                  <div className="rides-detail-info-grid">
                    <div className="rides-detail-info-item">
                      <span className="rides-detail-info-label">Name</span>
                      <span className="rides-detail-info-value">{selectedRide.rider.user.fullName}</span>
                    </div>
                    {selectedRide.rider.displayCode && (
                      <div className="rides-detail-info-item">
                        <span className="rides-detail-info-label">Code</span>
                        <span className="rides-detail-info-value">{selectedRide.rider.displayCode}</span>
                      </div>
                    )}
                    {selectedRide.rider.vehicle && (
                      <>
                        <div className="rides-detail-info-item">
                          <span className="rides-detail-info-label">Vehicle</span>
                          <span className="rides-detail-info-value">
                            <Truck size={12} /> {selectedRide.rider.vehicle.make} {selectedRide.rider.vehicle.model}
                          </span>
                        </div>
                        <div className="rides-detail-info-item">
                          <span className="rides-detail-info-label">Plate</span>
                          <span className="rides-detail-info-value">{selectedRide.rider.vehicle.plateNumber}</span>
                        </div>
                      </>
                    )}
                    {selectedRide.rider.serviceZone && (
                      <div className="rides-detail-info-item">
                        <span className="rides-detail-info-label">Zone</span>
                        <span className="rides-detail-info-value">{selectedRide.rider.serviceZone.name}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rides-detail-unassigned">No rider assigned</div>
                )}
              </section>

              {/* ── Fare Breakdown ── */}
              <section className="rides-detail-section">
                <h4><DollarSign size={14} /> Fare Breakdown</h4>
                <div className="rides-detail-fare-grid">
                  <div className="rides-detail-fare-row">
                    <span>Estimated Fare</span>
                    <strong>{formatMoney(selectedRide.currency || adminCurrency, parseNumber(selectedRide.estimatedFare))}</strong>
                  </div>
                  {selectedRide.finalFare != null && (
                    <div className="rides-detail-fare-row total">
                      <span>Final Fare</span>
                      <strong>{formatMoney(selectedRide.currency || adminCurrency, parseNumber(selectedRide.finalFare))}</strong>
                    </div>
                  )}
                  {parseNumber(selectedRide.surgeAmount) > 0 && (
                    <div className="rides-detail-fare-row">
                      <span>Surge</span>
                      <strong>+{formatMoney(selectedRide.currency || adminCurrency, parseNumber(selectedRide.surgeAmount))}</strong>
                    </div>
                  )}
                  {parseNumber(selectedRide.waitingAmount) > 0 && (
                    <div className="rides-detail-fare-row">
                      <span>Waiting Fee</span>
                      <strong>+{formatMoney(selectedRide.currency || adminCurrency, parseNumber(selectedRide.waitingAmount))}</strong>
                    </div>
                  )}
                  {parseNumber(selectedRide.promoDiscount) > 0 && (
                    <div className="rides-detail-fare-row discount">
                      <span>Promo Discount</span>
                      <strong>−{formatMoney(selectedRide.currency || adminCurrency, parseNumber(selectedRide.promoDiscount))}</strong>
                    </div>
                  )}
                  {parseNumber(selectedRide.referralDiscount) > 0 && (
                    <div className="rides-detail-fare-row discount">
                      <span>Referral Discount</span>
                      <strong>−{formatMoney(selectedRide.currency || adminCurrency, parseNumber(selectedRide.referralDiscount))}</strong>
                    </div>
                  )}
                  {parseNumber(selectedRide.cancellationFee) > 0 && (
                    <div className="rides-detail-fare-row">
                      <span>Cancellation Fee</span>
                      <strong>{formatMoney(selectedRide.currency || adminCurrency, parseNumber(selectedRide.cancellationFee))}</strong>
                    </div>
                  )}
                  {selectedRide.riderEarnings != null && (
                    <div className="rides-detail-fare-row">
                      <span>Rider Earnings</span>
                      <strong>{formatMoney(selectedRide.currency || adminCurrency, parseNumber(selectedRide.riderEarnings))}</strong>
                    </div>
                  )}
                  {selectedRide.platformCommission != null && (
                    <div className="rides-detail-fare-row">
                      <span>Platform Commission</span>
                      <strong>{formatMoney(selectedRide.currency || adminCurrency, parseNumber(selectedRide.platformCommission))}</strong>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Payment Status ── */}
              <section className="rides-detail-section">
                <h4><DollarSign size={14} /> Payment</h4>
                <div className="rides-detail-info-grid">
                  <div className="rides-detail-info-item">
                    <span className="rides-detail-info-label">Method</span>
                    <span className="rides-detail-info-value">{formatPaymentMethod(selectedRide.paymentMethod)}</span>
                  </div>
                  <div className="rides-detail-info-item">
                    <span className="rides-detail-info-label">Currency</span>
                    <span className="rides-detail-info-value">{selectedRide.currency}</span>
                  </div>
                  <div className="rides-detail-info-item">
                    <span className="rides-detail-info-label">Status</span>
                    <span className="rides-detail-info-value">
                      {selectedRide.status.toLowerCase() === "completed" ? "Captured" :
                       selectedRide.status.toLowerCase() === "cancelled" ? "Refunded" : "Pending"}
                    </span>
                  </div>
                </div>
              </section>

              {/* ── Trip Details ── */}
              <section className="rides-detail-section">
                <h4><MapPin size={14} /> Trip Details</h4>
                <div className="rides-detail-route-display">
                  <div className="rides-detail-route-point">
                    <i className="rides-route-dot pickup" />
                    <span>{selectedRide.pickupAddress}</span>
                  </div>
                  <div className="rides-route-line-v" />
                  <div className="rides-detail-route-point">
                    <i className="rides-route-dot destination" />
                    <span>{selectedRide.destinationAddress}</span>
                  </div>
                </div>
                <div className="rides-detail-info-grid">
                  {selectedRide.actualDistanceKm != null && (
                    <div className="rides-detail-info-item">
                      <span className="rides-detail-info-label">Distance</span>
                      <span className="rides-detail-info-value">{parseNumber(selectedRide.actualDistanceKm).toFixed(1)} km</span>
                    </div>
                  )}
                  {selectedRide.actualDurationMinutes != null && (
                    <div className="rides-detail-info-item">
                      <span className="rides-detail-info-label">Duration</span>
                      <span className="rides-detail-info-value">{selectedRide.actualDurationMinutes} min</span>
                    </div>
                  )}
                  {selectedRide.serviceZone && (
                    <div className="rides-detail-info-item">
                      <span className="rides-detail-info-label">Zone</span>
                      <span className="rides-detail-info-value">{selectedRide.serviceZone.name}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Support / Notes ── */}
              {(selectedRide.notes || selectedRide.cancellationReason) && (
                <section className="rides-detail-section">
                  <h4><FileText size={14} /> Notes & Support</h4>
                  {selectedRide.cancellationReason && (
                    <div className="rides-detail-note">
                      <strong>Cancellation Reason ({selectedRide.cancellationParty ?? "unknown"}):</strong>
                      <p>{selectedRide.cancellationReason}</p>
                    </div>
                  )}
                  {selectedRide.notes && (
                    <div className="rides-detail-note">
                      <strong>Admin Notes:</strong>
                      <p>{selectedRide.notes}</p>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
