"use client";

import { useMemo } from "react";
import { OperationsMap } from "@/components/maps/operations-map";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { formatMoney } from "@/lib/currency";
import type { DeliveryRecord } from "./types";
import { parseNumber, formatDateTime, ACCRA_MAP_CENTER, ACCRA_MAP_ZOOM_CITY } from "./utils";
import {
  Package,
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
  Flag,
  CheckCircle,
  XCircle,
  Navigation,
  CreditCard,
  Shield,
  Box
} from "lucide-react";

export type DeliveryDetailsScreenProps = {
  delivery: DeliveryRecord | null;
  loading?: boolean;
  error?: string | null;
};

function buildDeliveryTimeline(delivery: DeliveryRecord) {
  const events: { label: string; time: string | null; description: string; icon: typeof Clock; done: boolean }[] = [
    { label: "Created", time: delivery.createdAt, description: "Delivery order created", icon: Package, done: true },
    { label: "Rider Assigned", time: null, description: delivery.rider ? `${delivery.rider.user.fullName} accepted the delivery` : "Waiting for rider", icon: Truck, done: Boolean(delivery.rider) },
    { label: "Picked Up", time: null, description: "Package picked up from sender", icon: MapPin, done: false },
    { label: "In Transit", time: null, description: "Rider en route to recipient", icon: Navigation, done: false },
    { label: "Delivered", time: null, description: "Package delivered to recipient", icon: CheckCircle, done: delivery.status.toLowerCase() === "delivered" }
  ];

  if (delivery.status.toLowerCase() === "cancelled") {
    events.push({
      label: "Cancelled",
      time: null,
      description: "Delivery was cancelled",
      icon: XCircle,
      done: true
    });
  }

  if (delivery.status.toLowerCase() === "failed") {
    events.push({
      label: "Failed",
      time: null,
      description: "Delivery could not be completed",
      icon: AlertTriangle,
      done: true
    });
  }

  return events;
}

export function DeliveryDetailsScreen({ delivery, loading = false, error = null }: DeliveryDetailsScreenProps) {
  const timeline = useMemo(() => (delivery ? buildDeliveryTimeline(delivery) : []), [delivery]);

  if (loading) {
    return <AdminPageSkeleton variant="cards" kpis={6} />;
  }

  if (error || !delivery) {
    return (
      <div className="rd-error">
        <AlertTriangle size={48} />
        <h2>{error || "Delivery not found"}</h2>
        <p>This delivery may have been deleted or you may not have access.</p>
      </div>
    );
  }

  const finalFee = parseNumber(delivery.finalFee ?? delivery.estimatedFee);
  const estimatedFee = parseNumber(delivery.estimatedFee);
  const riderEarnings = parseNumber(delivery.riderEarnings);
  const platformCommission = parseNumber(delivery.platformCommission);

  return (
    <div className="rd-page">
      {/* ── Header ── */}
      <header className="rd-header">
        <div className="rd-header-center">
          <h2>Delivery Details</h2>
          <span className="rd-header-id">{delivery.id.slice(0, 12)}</span>
          <span className={`rd-status ${delivery.status.toLowerCase() === "delivered" ? "success" : delivery.status.toLowerCase() === "failed" || delivery.status.toLowerCase() === "cancelled" ? "danger" : "warning"}`}>
            {delivery.status}
          </span>
          <span className="rd-header-date">{formatDateTime(delivery.createdAt)}</span>
        </div>
      </header>

      {/* ── Route Map ── */}
      <section className="rd-map-card">
        <div className="rd-map-header">
          <div>
            <h4>Route Overview</h4>
            <div className="rd-map-route-points">
              <span className="rd-route-point">
                <span className="rd-route-dot pickup" />
                <small>Pickup</small>
                <strong>{delivery.pickupAddress}</strong>
              </span>
              <span className="rd-route-line" />
              <span className="rd-route-point">
                <span className="rd-route-dot destination" />
                <small>Destination</small>
                <strong>{delivery.dropoffAddress}</strong>
              </span>
            </div>
          </div>
        </div>
        <div className="rd-map-container">
          <div className="rd-map">
            <OperationsMap
              center={ACCRA_MAP_CENTER}
              zoom={ACCRA_MAP_ZOOM_CITY}
              emptyTitle="No route data"
              emptyDescription="Route markers will appear here"
              markers={[]}
              className="rd-map-inner"
            />
          </div>
        </div>
      </section>

      {/* ── 4-Column Info Grid ── */}
      <section className="rd-cards-grid">
        {/* Sender */}
        <div className="rd-card">
          <div className="rd-card-header">
            <User size={16} />
            <h4>Sender</h4>
          </div>
          <div className="rd-card-body">
            <div className="rd-info-row">
              <span className="rd-info-label">Name</span>
              <span className="rd-info-value">{delivery.passenger?.user?.fullName ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Recipient */}
        <div className="rd-card">
          <div className="rd-card-header">
            <MapPin size={16} />
            <h4>Recipient</h4>
          </div>
          <div className="rd-card-body">
            <div className="rd-info-row">
              <span className="rd-info-label">Name</span>
              <span className="rd-info-value">{delivery.recipientName}</span>
            </div>
            <div className="rd-info-row">
              <span className="rd-info-label">Phone</span>
              <span className="rd-info-value"><Phone size={12} /> {delivery.recipientPhoneE164}</span>
            </div>
          </div>
        </div>

        {/* Rider */}
        <div className="rd-card">
          <div className="rd-card-header">
            <Truck size={16} />
            <h4>Rider</h4>
          </div>
          <div className="rd-card-body">
            {delivery.rider ? (
              <div className="rd-info-row">
                <span className="rd-info-label">Name</span>
                <span className="rd-info-value">{delivery.rider.user.fullName}</span>
              </div>
            ) : (
              <span className="rd-unassigned">No rider assigned</span>
            )}
            {delivery.serviceZone && (
              <div className="rd-info-row">
                <span className="rd-info-label">Zone</span>
                <span className="rd-info-value">{delivery.serviceZone.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Package */}
        <div className="rd-card">
          <div className="rd-card-header">
            <Box size={16} />
            <h4>Package</h4>
          </div>
          <div className="rd-card-body">
            <div className="rd-info-row">
              <span className="rd-info-label">Type</span>
              <span className="rd-info-value">{delivery.packageType}</span>
            </div>
            <div className="rd-info-row">
              <span className="rd-info-label">Description</span>
              <span className="rd-info-value">{delivery.packageDescription || "—"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Timeline + Payment (side-by-side) ── */}
      <section className="rd-cards-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Timeline */}
        <div className="rd-card rd-timeline-card">
          <div className="rd-card-header">
            <Clock size={16} />
            <h4>Package Journey</h4>
          </div>
          <div className="rd-card-body">
            <div className="rd-timeline">
              {timeline.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className={`rd-timeline-step${step.done ? " done" : ""}`}>
                    <div className="rd-timeline-left">
                      <div className="rd-timeline-dot"><Icon size={12} /></div>
                      {i < timeline.length - 1 && <div className="rd-timeline-line" />}
                    </div>
                    <div className="rd-timeline-content">
                      <div className="rd-timeline-top">
                        <strong>{step.label}</strong>
                        {step.time && <span>{formatDateTime(step.time)}</span>}
                      </div>
                      <small>{step.description}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="rd-card">
          <div className="rd-card-header">
            <DollarSign size={16} />
            <h4>Payment</h4>
          </div>
          <div className="rd-card-body">
            <div className="rd-fare-row">
              <span>Estimated Fee</span>
              <span>{formatMoney(delivery.currency, estimatedFee)}</span>
            </div>
            <div className="rd-fare-row total">
              <span>Final Fee</span>
              <strong>{formatMoney(delivery.currency, finalFee)}</strong>
            </div>
            <div className="rd-fare-divider" />
            <div className="rd-fare-row">
              <span>Rider Earnings</span>
              <span>{formatMoney(delivery.currency, riderEarnings)}</span>
            </div>
            <div className="rd-fare-row">
              <span>Platform Commission</span>
              <span>{formatMoney(delivery.currency, platformCommission)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pickup & Delivery Details ── */}
      <section className="rd-cards-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Pickup Verification */}
        <div className="rd-card">
          <div className="rd-card-header">
            <MapPin size={16} />
            <h4>Pickup Verification</h4>
          </div>
          <div className="rd-card-body">
            <div className="rd-info-row">
              <span className="rd-info-label">Pickup Address</span>
              <span className="rd-info-value">{delivery.pickupAddress}</span>
            </div>
            <div className="rd-info-row">
              <span className="rd-info-label">Requested At</span>
              <span className="rd-info-value">{formatDateTime(delivery.requestedAt)}</span>
            </div>
          </div>
        </div>

        {/* Delivery PIN Status */}
        <div className="rd-card">
          <div className="rd-card-header">
            <Shield size={16} />
            <h4>Delivery PIN Status</h4>
          </div>
          <div className="rd-card-body">
            <div className="rd-info-row">
              <span className="rd-info-label">Status</span>
              <span className={`rd-status ${delivery.status.toLowerCase() === "delivered" ? "success" : delivery.status.toLowerCase() === "failed" || delivery.status.toLowerCase() === "cancelled" ? "danger" : "neutral"}`}>
                {delivery.status.toLowerCase() === "delivered" ? "PIN Verified" : "Awaiting Verification"}
              </span>
            </div>
            <div className="rd-info-row">
              <span className="rd-info-label">Destination</span>
              <span className="rd-info-value">{delivery.dropoffAddress}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Admin Actions ── */}
      <section className="rd-card rd-actions-card">
        <div className="rd-card-header">
          <MessageSquare size={16} />
          <h4>Actions</h4>
        </div>
        <div className="rd-actions-grid">
          <button className="rd-action-btn" type="button">
            <MessageSquare size={14} /> Contact Rider
          </button>
          <button className="rd-action-btn" type="button">
            <MessageSquare size={14} /> Contact Sender
          </button>
          <button className="rd-action-btn warning" type="button">
            <Flag size={14} /> Flag Delivery
          </button>
          <button className="rd-action-btn danger" type="button">
            <XCircle size={14} /> Cancel Delivery
          </button>
        </div>
      </section>
    </div>
  );
}
