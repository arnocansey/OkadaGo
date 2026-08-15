"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OperationsMap } from "@/components/maps/operations-map";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { formatMoney } from "@/lib/currency";
import type { RideRecord } from "./types";
import { parseNumber, formatDateTime, statusTone, ACCRA_MAP_CENTER, ACCRA_MAP_ZOOM_CITY } from "./utils";
import {
  ArrowLeft,
  Bike,
  MapPin,
  Clock,
  DollarSign,
  User,
  Phone,
  Mail,
  Truck,
  Route,
  FileText,
  AlertTriangle,
  MessageSquare,
  RotateCcw,
  Flag,
  Headphones,
  CheckCircle,
  XCircle,
  Navigation,
  CreditCard,
  Star,
  Shield
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────────────────── */

export type RideDetailsScreenProps = {
  ride: RideRecord | null;
  loading?: boolean;
  error?: string | null;
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatPaymentMethod(method?: string | null): string {
  if (!method) return "—";
  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildFullTimeline(ride: RideRecord) {
  const events: { label: string; time: string | null; description: string; icon: typeof Clock; done: boolean }[] = [
    { label: "Ride Requested", time: ride.requestedAt ?? ride.createdAt, description: "Passenger requested a ride", icon: Clock, done: true },
    { label: "Rider Assigned", time: ride.assignedAt ?? null, description: ride.rider ? `${ride.rider.user.fullName} accepted the trip` : "Waiting for rider", icon: Bike, done: Boolean(ride.assignedAt) },
    { label: "Rider Arrived", time: ride.riderArrivedAt ?? null, description: "Rider reached pickup location", icon: MapPin, done: Boolean(ride.riderArrivedAt) },
    { label: "Trip Started", time: ride.startedAt ?? null, description: "Passenger boarded, trip in progress", icon: Navigation, done: Boolean(ride.startedAt) },
    { label: "Trip Completed", time: ride.completedAt ?? null, description: "Passenger dropped off at destination", icon: CheckCircle, done: Boolean(ride.completedAt) }
  ];

  if (ride.cancelledAt) {
    events.push({
      label: "Trip Cancelled",
      time: ride.cancelledAt,
      description: `Cancelled by ${ride.cancellationParty ?? "unknown"}${ride.cancellationReason ? `: ${ride.cancellationReason}` : ""}`,
      icon: XCircle,
      done: true
    });
  }

  return events;
}

/* ── Component ────────────────────────────────────────────────────────────── */

export function RideDetailsScreen({ ride, loading = false, error = null }: RideDetailsScreenProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const timeline = useMemo(() => ride ? buildFullTimeline(ride) : [], [ride]);

  const route = useMemo((): [number, number][] => {
    if (!ride) return [];
    const lat = parseNumber(ride.pickupLatitude);
    const lng = parseNumber(ride.pickupLongitude);
    const dlat = parseNumber(ride.destinationLatitude);
    const dlng = parseNumber(ride.destinationLongitude);
    if (!lat || !lng || !dlat || !dlng) return [];
    return [[lat, lng], [dlat, dlng]];
  }, [ride]);

  const mapMarkers = useMemo(() => {
    if (!ride) return [];
    const lat = parseNumber(ride.pickupLatitude);
    const lng = parseNumber(ride.pickupLongitude);
    const dlat = parseNumber(ride.destinationLatitude);
    const dlng = parseNumber(ride.destinationLongitude);
    const markers = [];
    if (lat && lng) markers.push({ id: "pickup", position: [lat, lng] as [number, number], label: "Pickup", variant: "pickup" as const });
    if (dlat && dlng) markers.push({ id: "dest", position: [dlat, dlng] as [number, number], label: "Destination", variant: "destination" as const });
    return markers;
  }, [ride]);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    // Simulate action delay
    await new Promise((r) => setTimeout(r, 800));
    setActionLoading(null);
  };

  if (loading) {
    return <AdminPageSkeleton variant="dashboard" kpis={4} />;
  }

  if (error || !ride) {
    return (
      <div className="rd-page">
        <div className="rd-error">
          <AlertTriangle size={24} />
          <h2>Ride Not Found</h2>
          <p>{error || "The ride you're looking for doesn't exist or has been removed."}</p>
          <Link href="/rides" className="rd-btn rd-btn-primary">
            <ArrowLeft size={14} /> Back to Rides
          </Link>
        </div>
      </div>
    );
  }

  const currency = ride.currency || "GHS";

  return (
    <div className="rd-page">
      {/* ── Header ── */}
      <div className="rd-header">
        <Link href="/rides" className="rd-back">
          <ArrowLeft size={16} /> Back to Rides
        </Link>
        <div className="rd-header-center">
          <code className="rd-header-id">{ride.id.slice(0, 12)}</code>
          <em className={`rd-status ${statusTone(ride.status)}`}>{ride.status}</em>
        </div>
        <div className="rd-header-actions">
          <span className="rd-header-date">{formatDateTime(ride.createdAt)}</span>
        </div>
      </div>

      {/* ── Route Map ── */}
      <section className="rd-map-card">
        <div className="rd-map-header">
          <Route size={16} />
          <h3>Route</h3>
          {ride.actualDistanceKm != null && (
            <span className="rd-map-distance">{parseNumber(ride.actualDistanceKm).toFixed(1)} km</span>
          )}
          {ride.actualDurationMinutes != null && (
            <span className="rd-map-duration">{ride.actualDurationMinutes} min</span>
          )}
        </div>
        <div className="rd-map-container">
          {route.length >= 2 ? (
            <OperationsMap
              className="rd-map"
              basemap="auto"
              center={route[0]}
              zoom={13}
              markers={mapMarkers}
              route={route}
              showFitAll
              emptyTitle=""
              emptyDescription=""
            />
          ) : (
            <div className="rd-map-empty">
              <MapPin size={20} />
              <span>No route data available</span>
            </div>
          )}
        </div>
        <div className="rd-map-route-points">
          <div className="rd-route-point">
            <i className="rd-route-dot pickup" />
            <div>
              <small>Pickup</small>
              <strong>{ride.pickupAddress}</strong>
            </div>
          </div>
          <div className="rd-route-line" />
          <div className="rd-route-point">
            <i className="rd-route-dot destination" />
            <div>
              <small>Destination</small>
              <strong>{ride.destinationAddress}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── Info Cards Grid ── */}
      <div className="rd-cards-grid">
        {/* Passenger Card */}
        <section className="rd-card">
          <div className="rd-card-header">
            <User size={14} />
            <h4>Passenger</h4>
          </div>
          <div className="rd-card-body">
            <div className="rd-info-row">
              <span className="rd-info-label">Name</span>
              <span className="rd-info-value">{ride.passenger.user.fullName}</span>
            </div>
            {ride.passenger.user.phoneE164 && (
              <div className="rd-info-row">
                <span className="rd-info-label">Phone</span>
                <span className="rd-info-value">
                  <Phone size={12} /> {ride.passenger.user.phoneE164}
                </span>
              </div>
            )}
            {ride.passenger.user.email && (
              <div className="rd-info-row">
                <span className="rd-info-label">Email</span>
                <span className="rd-info-value">
                  <Mail size={12} /> {ride.passenger.user.email}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Rider Card */}
        <section className="rd-card">
          <div className="rd-card-header">
            <Bike size={14} />
            <h4>Rider</h4>
          </div>
          <div className="rd-card-body">
            {ride.rider ? (
              <>
                <div className="rd-info-row">
                  <span className="rd-info-label">Name</span>
                  <span className="rd-info-value">{ride.rider.user.fullName}</span>
                </div>
                {ride.rider.displayCode && (
                  <div className="rd-info-row">
                    <span className="rd-info-label">Code</span>
                    <span className="rd-info-value">{ride.rider.displayCode}</span>
                  </div>
                )}
                {ride.rider.vehicle && (
                  <>
                    <div className="rd-info-row">
                      <span className="rd-info-label">Vehicle</span>
                      <span className="rd-info-value">
                        <Truck size={12} /> {ride.rider.vehicle.make} {ride.rider.vehicle.model}
                      </span>
                    </div>
                    <div className="rd-info-row">
                      <span className="rd-info-label">Plate</span>
                      <span className="rd-info-value">{ride.rider.vehicle.plateNumber}</span>
                    </div>
                  </>
                )}
                {ride.rider.serviceZone && (
                  <div className="rd-info-row">
                    <span className="rd-info-label">Zone</span>
                    <span className="rd-info-value">{ride.rider.serviceZone.name}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="rd-unassigned">No rider assigned</div>
            )}
          </div>
        </section>

        {/* Fare Breakdown Card */}
        <section className="rd-card">
          <div className="rd-card-header">
            <DollarSign size={14} />
            <h4>Fare Breakdown</h4>
          </div>
          <div className="rd-card-body">
            <div className="rd-fare-row">
              <span>Estimated Fare</span>
              <strong>{formatMoney(currency, parseNumber(ride.estimatedFare))}</strong>
            </div>
            {ride.finalFare != null && (
              <div className="rd-fare-row total">
                <span>Final Fare</span>
                <strong>{formatMoney(currency, parseNumber(ride.finalFare))}</strong>
              </div>
            )}
            {parseNumber(ride.surgeAmount) > 0 && (
              <div className="rd-fare-row">
                <span>Surge</span>
                <strong>+{formatMoney(currency, parseNumber(ride.surgeAmount))}</strong>
              </div>
            )}
            {parseNumber(ride.waitingAmount) > 0 && (
              <div className="rd-fare-row">
                <span>Waiting Fee</span>
                <strong>+{formatMoney(currency, parseNumber(ride.waitingAmount))}</strong>
              </div>
            )}
            {parseNumber(ride.promoDiscount) > 0 && (
              <div className="rd-fare-row discount">
                <span>Promo Discount</span>
                <strong>−{formatMoney(currency, parseNumber(ride.promoDiscount))}</strong>
              </div>
            )}
            {parseNumber(ride.referralDiscount) > 0 && (
              <div className="rd-fare-row discount">
                <span>Referral Discount</span>
                <strong>−{formatMoney(currency, parseNumber(ride.referralDiscount))}</strong>
              </div>
            )}
            {parseNumber(ride.cancellationFee) > 0 && (
              <div className="rd-fare-row">
                <span>Cancellation Fee</span>
                <strong>{formatMoney(currency, parseNumber(ride.cancellationFee))}</strong>
              </div>
            )}
            <div className="rd-fare-divider" />
            {ride.riderEarnings != null && (
              <div className="rd-fare-row">
                <span>Rider Earnings</span>
                <strong>{formatMoney(currency, parseNumber(ride.riderEarnings))}</strong>
              </div>
            )}
            {ride.platformCommission != null && (
              <div className="rd-fare-row">
                <span>Platform Commission</span>
                <strong>{formatMoney(currency, parseNumber(ride.platformCommission))}</strong>
              </div>
            )}
          </div>
        </section>

        {/* Payment Card */}
        <section className="rd-card">
          <div className="rd-card-header">
            <CreditCard size={14} />
            <h4>Payment</h4>
          </div>
          <div className="rd-card-body">
            <div className="rd-info-row">
              <span className="rd-info-label">Method</span>
              <span className="rd-info-value">{formatPaymentMethod(ride.paymentMethod)}</span>
            </div>
            <div className="rd-info-row">
              <span className="rd-info-label">Currency</span>
              <span className="rd-info-value">{currency}</span>
            </div>
            <div className="rd-info-row">
              <span className="rd-info-label">Status</span>
              <span className="rd-info-value">
                {ride.status.toLowerCase() === "completed" ? "Captured" :
                 ride.status.toLowerCase() === "cancelled" ? "Refunded" : "Pending"}
              </span>
            </div>
            {ride.serviceZone && (
              <div className="rd-info-row">
                <span className="rd-info-label">Zone</span>
                <span className="rd-info-value">{ride.serviceZone.name}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Trip Timeline ── */}
      <section className="rd-timeline-card">
        <div className="rd-card-header">
          <Clock size={14} />
          <h4>Trip Timeline</h4>
        </div>
        <div className="rd-timeline">
          {timeline.map((event, i) => {
            const Icon = event.icon;
            return (
              <div key={event.label} className={`rd-timeline-step ${event.done ? "done" : ""}`}>
                <div className="rd-timeline-left">
                  <div className="rd-timeline-dot">
                    <Icon size={12} />
                  </div>
                  {i < timeline.length - 1 && <div className="rd-timeline-line" />}
                </div>
                <div className="rd-timeline-content">
                  <div className="rd-timeline-top">
                    <strong>{event.label}</strong>
                    <span>{event.time ? formatDateTime(event.time) : "—"}</span>
                  </div>
                  <small>{event.description}</small>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Admin Actions ── */}
      <section className="rd-actions-card">
        <div className="rd-card-header">
          <Shield size={14} />
          <h4>Admin Actions</h4>
        </div>
        <div className="rd-actions-grid">
          <button
            type="button"
            className="rd-action-btn"
            onClick={() => handleAction("contact-rider")}
            disabled={actionLoading === "contact-rider" || !ride.rider}
          >
            <Phone size={14} />
            <span>Contact Rider</span>
          </button>
          <button
            type="button"
            className="rd-action-btn"
            onClick={() => handleAction("contact-passenger")}
            disabled={actionLoading === "contact-passenger"}
          >
            <Phone size={14} />
            <span>Contact Passenger</span>
          </button>
          <button
            type="button"
            className="rd-action-btn warning"
            onClick={() => handleAction("refund")}
            disabled={actionLoading === "refund" || ride.status.toLowerCase() !== "completed"}
          >
            <RotateCcw size={14} />
            <span>Refund</span>
          </button>
          <button
            type="button"
            className="rd-action-btn danger"
            onClick={() => handleAction("flag")}
            disabled={actionLoading === "flag"}
          >
            <Flag size={14} />
            <span>Flag Trip</span>
          </button>
          <button
            type="button"
            className="rd-action-btn"
            onClick={() => handleAction("support")}
            disabled={actionLoading === "support"}
          >
            <Headphones size={14} />
            <span>Open Support Case</span>
          </button>
        </div>
      </section>

      {/* ── Notes ── */}
      {(ride.notes || ride.cancellationReason) && (
        <section className="rd-notes-card">
          <div className="rd-card-header">
            <FileText size={14} />
            <h4>Notes & Support</h4>
          </div>
          <div className="rd-card-body">
            {ride.cancellationReason && (
              <div className="rd-note">
                <strong>Cancellation Reason ({ride.cancellationParty ?? "unknown"}):</strong>
                <p>{ride.cancellationReason}</p>
              </div>
            )}
            {ride.notes && (
              <div className="rd-note">
                <strong>Admin Notes:</strong>
                <p>{ride.notes}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
