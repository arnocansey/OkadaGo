"use client";

import { useState, useMemo, useCallback } from "react";
import { OperationsMap } from "@/components/maps/operations-map";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { formatMoney } from "@/lib/currency";
import { parseNumber, formatDateTime, statusTone, ACCRA_MAP_CENTER, ACCRA_MAP_ZOOM_CITY, ACCRA_MAP_ZOOM_METRO } from "./utils";
import type { RideRecord, DeliveryRecord, RiderRecord, AdminIncidentRecord } from "./types";
import { MotorcycleIcon } from "@/components/icons/MotorcycleIcon";
import {
  Package,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  Phone,
  Navigation,
  CircleDot,
  Truck,
  UserX,
  Eye,
  Flame,
  Zap
} from "lucide-react";
import type { DemandHotspot } from "@/components/maps/leaflet-map";

/* ── Types ────────────────────────────────────────────────────────────────── */

type LiveMapMarker = {
  id: string;
  position: [number, number];
  label: string;
  variant: "driverOnline" | "driverTrip" | "driver" | "driverIdle" | "passenger" | "pickup" | "destination";
  lastUpdated?: string;
  profileUrl?: string;
};

type RiderDetail = {
  id: string;
  displayCode: string;
  name: string;
  phone: string;
  zone: string | null;
  online: boolean;
  vehicleType: string | null;
  plateNumber: string | null;
  latitude: number | null;
  longitude: number | null;
};

type TripDetail = {
  id: string;
  status: string;
  pickup: string;
  destination: string;
  passengerName: string;
  riderName: string | null;
  amount: string;
  createdAt: string;
  kind: "ride" | "delivery";
};

export type LiveOperationsScreenProps = {
  adminCurrency: string;
  ridersWithCoords: RiderRecord[];
  activeRiders: { user: { fullName: string } }[];
  mapMarkers: LiveMapMarker[];
  rides: RideRecord[];
  deliveries: DeliveryRecord[];
  incidents: AdminIncidentRecord[];
  liveOnlineCount: number;
  vehicleCount: number;
  dataLoading?: boolean;
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function classifyRider(
  rider: RiderRecord,
  activeRideRiderIds: Set<string>,
  activeDeliveryRiderIds: Set<string>
): "onTrip" | "delivery" | "online" | "offline" {
  const hasActiveRide = activeRideRiderIds.has(rider.id);
  const hasActiveDelivery = activeDeliveryRiderIds.has(rider.id);
  if (hasActiveRide) return "onTrip";
  if (hasActiveDelivery) return "delivery";
  if (rider.onlineStatus) return "online";
  return "offline";
}

/* ── Component ────────────────────────────────────────────────────────────── */

export function LiveOperationsScreen({
  adminCurrency,
  ridersWithCoords,
  activeRiders,
  mapMarkers: liveMarkers,
  rides,
  deliveries,
  incidents,
  liveOnlineCount,
  vehicleCount,
  dataLoading = false
}: LiveOperationsScreenProps) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [detailPanel, setDetailPanel] = useState<"rider" | "trip" | null>(null);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showSurge, setShowSurge] = useState<boolean>(true);

  /* ── Derived data ── */

  const activeRides = useMemo(
    () => rides.filter((r) => ["assigned", "arriving", "arrived", "started", "picked_up", "in_transit"].includes(r.status)),
    [rides]
  );

  const pendingRequests = useMemo(
    () => rides.filter((r) => r.status === "searching" || r.status === "requested"),
    [rides]
  );

  const activeDeliveries = useMemo(
    () => deliveries.filter((d) => ["picked_up", "in_transit"].includes(d.status)),
    [deliveries]
  );

  const openIncidents = useMemo(
    () => incidents.filter((i) => i.status !== "resolved"),
    [incidents]
  );

  const offlineRiders = useMemo(
    () => ridersWithCoords.filter((r) => !r.onlineStatus),
    [ridersWithCoords]
  );

  const activeRideRiderIds = useMemo(() => {
    const ids = new Set<string>();
    for (const ride of activeRides) {
      if (ride.rider) {
        const rider = ridersWithCoords.find((r) => r.user.fullName === ride.rider!.user.fullName);
        if (rider) ids.add(rider.id);
      }
    }
    return ids;
  }, [activeRides, ridersWithCoords]);

  const activeDeliveryRiderIds = useMemo(() => {
    const ids = new Set<string>();
    for (const delivery of activeDeliveries) {
      if (delivery.rider) {
        const rider = ridersWithCoords.find((r) => r.user.fullName === delivery.rider!.user.fullName);
        if (rider) ids.add(rider.id);
      }
    }
    return ids;
  }, [activeDeliveries, ridersWithCoords]);

  /* ── Build map markers from riders ── */

  const mapMarkers = useMemo((): LiveMapMarker[] => {
    if (liveMarkers.length > 0) return liveMarkers;

    return ridersWithCoords
      .map((rider) => {
        const lat = parseNumber(rider.currentLatitude);
        const lng = parseNumber(rider.currentLongitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;

        const category = classifyRider(rider, activeRideRiderIds, activeDeliveryRiderIds);
        const variant: LiveMapMarker["variant"] =
          category === "onTrip" ? "driverTrip" :
          category === "delivery" ? "driver" :
          category === "online" ? "driverOnline" :
          "driverIdle";

        return {
          id: rider.id,
          position: [lat, lng] as [number, number],
          label: rider.user.fullName,
          variant,
          lastUpdated: rider.createdAt
        };
      })
      .filter(Boolean) as LiveMapMarker[];
  }, [liveMarkers, ridersWithCoords, activeRideRiderIds, activeDeliveryRiderIds]);

  /* ── Dynamic Demand Heatmap & Surge Zones ── */

  const demandHotspots = useMemo((): DemandHotspot[] => {
    if (!showHeatmap) return [];

    const hubs = [
      {
        id: "hub-circle",
        center: [5.5562, -0.2104] as [number, number],
        radiusMeters: 1300,
        intensity: "surge" as const,
        label: "Circle Interchange",
        multiplier: "1.4x",
        matchTerms: ["circle", "odaw", "kaneshie", "adabraka"],
      },
      {
        id: "hub-madina",
        center: [5.6698, -0.1652] as [number, number],
        radiusMeters: 1400,
        intensity: "surge" as const,
        label: "Madina Zongo Junc.",
        multiplier: "1.3x",
        matchTerms: ["madina", "adenta", "zongo", "unb"],
      },
      {
        id: "hub-accra-mall",
        center: [5.6205, -0.1735] as [number, number],
        radiusMeters: 1100,
        intensity: "surge" as const,
        label: "Accra Mall / Tetteh Q.",
        multiplier: "1.25x",
        matchTerms: ["mall", "tetteh", "airport", "shiashie"],
      },
      {
        id: "hub-osu",
        center: [5.5568, -0.1824] as [number, number],
        radiusMeters: 950,
        intensity: "high" as const,
        label: "Osu Oxford St",
        multiplier: "1.2x",
        matchTerms: ["osu", "oxford", "labone", "cantonments"],
      },
      {
        id: "hub-east-legon",
        center: [5.6382, -0.1554] as [number, number],
        radiusMeters: 1200,
        intensity: "surge" as const,
        label: "East Legon",
        multiplier: "1.3x",
        matchTerms: ["legon", "american house", "bawalashie"],
      },
      {
        id: "hub-tema-station",
        center: [5.5451, -0.2012] as [number, number],
        radiusMeters: 1000,
        intensity: "moderate" as const,
        label: "Accra Central CBD",
        multiplier: "1.15x",
        matchTerms: ["cbd", "tema station", "makola", "ministries"],
      },
    ];

    return hubs.map((hub) => {
      const matchedRequests = pendingRequests.filter((r) => {
        const addr = (r.pickupAddress || "").toLowerCase();
        return hub.matchTerms.some((term) => addr.includes(term));
      }).length;

      return {
        id: hub.id,
        center: hub.center,
        radiusMeters: hub.radiusMeters,
        intensity: hub.intensity,
        label: hub.label,
        multiplier: hub.multiplier,
        unfulfilledRequests: matchedRequests,
      };
    });
  }, [showHeatmap, pendingRequests]);

  /* ── Selected detail ── */

  const selectedRiderDetail = useMemo((): RiderDetail | null => {
    if (!selectedMarker || detailPanel !== "rider") return null;
    const rider = ridersWithCoords.find((r) => r.id === selectedMarker);
    if (!rider) return null;
    return {
      id: rider.id,
      displayCode: rider.displayCode,
      name: rider.user.fullName,
      phone: rider.user.phoneE164,
      zone: rider.serviceZone?.name ?? rider.city,
      online: rider.onlineStatus,
      vehicleType: rider.vehicle?.vehicleType ?? rider.vehicle?.make ?? null,
      plateNumber: rider.vehicle?.plateNumber ?? null,
      latitude: parseNumber(rider.currentLatitude),
      longitude: parseNumber(rider.currentLongitude)
    };
  }, [selectedMarker, detailPanel, ridersWithCoords]);

  const selectedTripDetail = useMemo((): TripDetail | null => {
    if (!selectedMarker || detailPanel !== "trip") return null;
    const ride = rides.find((r) => r.id === selectedMarker);
    if (ride) {
      return {
        id: ride.id,
        status: ride.status,
        pickup: ride.pickupAddress,
        destination: ride.destinationAddress,
        passengerName: ride.passenger.user.fullName,
        riderName: ride.rider?.user.fullName ?? null,
        amount: formatMoney(ride.currency || adminCurrency, parseNumber(ride.finalFare ?? ride.estimatedFare)),
        createdAt: ride.createdAt,
        kind: "ride"
      };
    }
    const delivery = deliveries.find((d) => d.id === selectedMarker);
    if (delivery) {
      return {
        id: delivery.id,
        status: delivery.status,
        pickup: delivery.pickupAddress,
        destination: delivery.dropoffAddress,
        passengerName: delivery.passenger.user.fullName,
        riderName: delivery.rider?.user.fullName ?? null,
        amount: delivery.finalFee != null
          ? formatMoney(delivery.currency || adminCurrency, parseNumber(delivery.finalFee))
          : formatMoney(delivery.currency || adminCurrency, parseNumber(delivery.estimatedFee)),
        createdAt: delivery.createdAt,
        kind: "delivery"
      };
    }
    return null;
  }, [selectedMarker, detailPanel, rides, deliveries, adminCurrency]);

  const handleMarkerClick = useCallback((markerId: string) => {
    setSelectedMarker(markerId);
    const isRide = rides.some((r) => r.id === markerId);
    const isDelivery = deliveries.some((d) => d.id === markerId);
    setDetailPanel(isRide || isDelivery ? "trip" : "rider");
  }, [rides, deliveries]);

  const closeDetail = useCallback(() => {
    setSelectedMarker(null);
    setDetailPanel(null);
  }, []);

  if (dataLoading) {
    return <AdminPageSkeleton variant="dashboard" kpis={4} />;
  }

  const categoryCounts = {
    onTrip: activeRideRiderIds.size,
    delivery: activeDeliveryRiderIds.size,
    online: liveOnlineCount - activeRideRiderIds.size - activeDeliveryRiderIds.size,
    offline: offlineRiders.length
  };

  return (
    <div className="liveops">
      {/* ── Map (65%) ── */}
      <div className="liveops-map">
        <OperationsMap
          className="liveops-map-inner"
          basemap="auto"
          emptyPlacement="bottom"
          center={ACCRA_MAP_CENTER}
          zoom={mapMarkers.length > 0 ? ACCRA_MAP_ZOOM_METRO : ACCRA_MAP_ZOOM_CITY}
          markers={mapMarkers}
          demandHotspots={demandHotspots}
          showSurgeBadges={showSurge}
          showFitAll
          emptyTitle="Waiting for fleet GPS pings"
          emptyDescription="Riders will appear on the map when they go online."
        />

        {/* Map Overlays & Surge Controls Toolbar */}
        <div style={{
          position: "absolute",
          top: 14,
          right: 14,
          zIndex: 400,
          display: "flex",
          gap: 8,
          background: "color-mix(in srgb, var(--bg-card) 92%, transparent)",
          backdropFilter: "blur(12px)",
          padding: "6px 10px",
          borderRadius: 12,
          border: "1px solid var(--border)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          <button
            type="button"
            onClick={() => setShowHeatmap((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: showHeatmap ? "color-mix(in srgb, var(--danger) 18%, transparent)" : "transparent",
              color: showHeatmap ? "var(--danger)" : "var(--text-muted)",
              border: `1px solid ${showHeatmap ? "var(--danger)" : "transparent"}`,
              padding: "5px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Flame size={14} /> Heatmap {showHeatmap ? "ON" : "OFF"}
          </button>
          <button
            type="button"
            onClick={() => setShowSurge((prev) => !prev)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: showSurge ? "color-mix(in srgb, var(--brand-orange) 18%, transparent)" : "transparent",
              color: showSurge ? "var(--brand-orange)" : "var(--text-muted)",
              border: `1px solid ${showSurge ? "var(--brand-orange)" : "transparent"}`,
              padding: "5px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Zap size={14} /> Surge Badges {showSurge ? "ON" : "OFF"}
          </button>
        </div>

        {/* Map legend */}
        <div className="liveops-legend">
          <span className="liveops-legend-item">
            <i className="liveops-dot liveops-dot-online" /> Available <strong>{categoryCounts.online}</strong>
          </span>
          <span className="liveops-legend-item">
            <i className="liveops-dot liveops-dot-trip" /> On Trip <strong>{categoryCounts.onTrip}</strong>
          </span>
          <span className="liveops-legend-item">
            <i className="liveops-dot liveops-dot-delivery" /> Delivery <strong>{categoryCounts.delivery}</strong>
          </span>
          <span className="liveops-legend-item">
            <i className="liveops-dot liveops-dot-incident" /> Incident <strong>{openIncidents.length}</strong>
          </span>
        </div>

        {/* Detail panel overlay */}
        {selectedMarker && detailPanel === "rider" && selectedRiderDetail && (
          <div className="liveops-detail-panel">
            <div className="liveops-detail-header">
              <div className="liveops-detail-avatar">
                {selectedRiderDetail.name.charAt(0)}
              </div>
              <div className="liveops-detail-header-text">
                <h3>{selectedRiderDetail.name}</h3>
                <span className="liveops-detail-code">{selectedRiderDetail.displayCode}</span>
              </div>
              <button type="button" className="liveops-detail-close" onClick={closeDetail}>
                <X size={16} />
              </button>
            </div>

            <div className="liveops-detail-status">
              <span className={`liveops-status-badge ${selectedRiderDetail.online ? "online" : "offline"}`}>
                <CircleDot size={12} />
                {selectedRiderDetail.online ? "Online" : "Offline"}
              </span>
            </div>

            <div className="liveops-detail-fields">
              <div className="liveops-detail-field">
                <Phone size={14} />
                <span>{selectedRiderDetail.phone}</span>
              </div>
              {selectedRiderDetail.zone && (
                <div className="liveops-detail-field">
                  <MapPin size={14} />
                  <span>{selectedRiderDetail.zone}</span>
                </div>
              )}
              {selectedRiderDetail.vehicleType && (
                <div className="liveops-detail-field">
                  <MotorcycleIcon size={14} />
                  <span>{selectedRiderDetail.vehicleType}</span>
                </div>
              )}
              {selectedRiderDetail.plateNumber && (
                <div className="liveops-detail-field">
                  <Truck size={14} />
                  <span>{selectedRiderDetail.plateNumber}</span>
                </div>
              )}
            </div>

            <div className="liveops-detail-actions">
              <a href={`/riders/${selectedRiderDetail.id}`} className="liveops-detail-btn primary">
                <Eye size={14} /> View Profile
              </a>
              <a href={`/riders/activity-tracking`} className="liveops-detail-btn">
                <Navigation size={14} /> Live Track
              </a>
            </div>
          </div>
        )}

        {selectedMarker && detailPanel === "trip" && selectedTripDetail && (
          <div className="liveops-detail-panel">
            <div className="liveops-detail-header">
              <div className={`liveops-detail-icon ${selectedTripDetail.kind === "delivery" ? "delivery" : "ride"}`}>
                {selectedTripDetail.kind === "delivery" ? <Package size={18} /> : <MotorcycleIcon size={18} />}
              </div>
              <div className="liveops-detail-header-text">
                <h3>{selectedTripDetail.kind === "delivery" ? "Delivery" : "Trip"}</h3>
                <span className="liveops-detail-code">{selectedTripDetail.id.slice(0, 8)}</span>
              </div>
              <button type="button" className="liveops-detail-close" onClick={closeDetail}>
                <X size={16} />
              </button>
            </div>

            <div className="liveops-detail-status">
              <span className={`liveops-status-badge ${statusTone(selectedTripDetail.status)}`}>
                {selectedTripDetail.status}
              </span>
              <span className="liveops-detail-amount">{selectedTripDetail.amount}</span>
            </div>

            <div className="liveops-detail-route">
              <div className="liveops-route-point">
                <i className="liveops-route-dot pickup" />
                <span>{selectedTripDetail.pickup}</span>
              </div>
              <div className="liveops-route-line" />
              <div className="liveops-route-point">
                <i className="liveops-route-dot destination" />
                <span>{selectedTripDetail.destination}</span>
              </div>
            </div>

            <div className="liveops-detail-fields">
              <div className="liveops-detail-field">
                <Users size={14} />
                <span>{selectedTripDetail.passengerName}</span>
              </div>
              {selectedTripDetail.riderName && (
                <div className="liveops-detail-field">
                  <MotorcycleIcon size={14} />
                  <span>{selectedTripDetail.riderName}</span>
                </div>
              )}
              <div className="liveops-detail-field">
                <Clock size={14} />
                <span>{formatDateTime(selectedTripDetail.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Operations Panel (35%) ── */}
      <aside className="liveops-panel">
        {/* Active Trips */}
        <section className="liveops-section">
          <div className="liveops-section-header">
            <MotorcycleIcon size={14} />
            <h4>Active Trips</h4>
            <span className="liveops-count">{activeRides.length}</span>
          </div>
          <div className="liveops-section-body">
            {activeRides.length === 0 ? (
              <div className="liveops-empty">No active trips</div>
            ) : (
              activeRides.slice(0, 5).map((ride) => (
                <button
                  key={ride.id}
                  type="button"
                  className={`liveops-item ${selectedMarker === ride.id ? "selected" : ""}`}
                  onClick={() => handleMarkerClick(ride.id)}
                >
                  <div className="liveops-item-main">
                    <strong>{ride.passenger.user.fullName}</strong>
                    <small>{ride.pickupAddress} → {ride.destinationAddress}</small>
                  </div>
                  <div className="liveops-item-meta">
                    <em className={`liveops-tag ${statusTone(ride.status)}`}>{ride.status}</em>
                    <small>{ride.rider?.user.fullName ?? "—"}</small>
                  </div>
                </button>
              ))
            )}
            {activeRides.length > 5 && (
              <a href="/requests" className="liveops-view-all">View all {activeRides.length} trips</a>
            )}
          </div>
        </section>

        {/* Pending Requests */}
        <section className="liveops-section">
          <div className="liveops-section-header">
            <Clock size={14} />
            <h4>Pending Requests</h4>
            <span className="liveops-count warning">{pendingRequests.length}</span>
          </div>
          <div className="liveops-section-body">
            {pendingRequests.length === 0 ? (
              <div className="liveops-empty">No pending requests</div>
            ) : (
              pendingRequests.slice(0, 4).map((ride) => (
                <div key={ride.id} className="liveops-item">
                  <div className="liveops-item-main">
                    <strong>{ride.passenger.user.fullName}</strong>
                    <small>{ride.pickupAddress}</small>
                  </div>
                  <em className="liveops-tag warning">{ride.status}</em>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Riders Offline */}
        <section className="liveops-section">
          <div className="liveops-section-header">
            <UserX size={14} />
            <h4>Riders Offline</h4>
            <span className="liveops-count muted">{offlineRiders.length}</span>
          </div>
          <div className="liveops-section-body">
            {offlineRiders.length === 0 ? (
              <div className="liveops-empty">All riders online</div>
            ) : (
              offlineRiders.slice(0, 4).map((rider) => (
                <button
                  key={rider.id}
                  type="button"
                  className={`liveops-item ${selectedMarker === rider.id ? "selected" : ""}`}
                  onClick={() => handleMarkerClick(rider.id)}
                >
                  <div className="liveops-item-main">
                    <strong>{rider.user.fullName}</strong>
                    <small>{rider.displayCode} · {rider.serviceZone?.name ?? rider.city ?? "—"}</small>
                  </div>
                </button>
              ))
            )}
            {offlineRiders.length > 4 && (
              <span className="liveops-more">+{offlineRiders.length - 4} more</span>
            )}
          </div>
        </section>

        {/* Delivery Orders */}
        <section className="liveops-section">
          <div className="liveops-section-header">
            <Package size={14} />
            <h4>Delivery Orders</h4>
            <span className="liveops-count">{activeDeliveries.length}</span>
          </div>
          <div className="liveops-section-body">
            {activeDeliveries.length === 0 ? (
              <div className="liveops-empty">No active deliveries</div>
            ) : (
              activeDeliveries.slice(0, 4).map((delivery) => (
                <button
                  key={delivery.id}
                  type="button"
                  className={`liveops-item ${selectedMarker === delivery.id ? "selected" : ""}`}
                  onClick={() => handleMarkerClick(delivery.id)}
                >
                  <div className="liveops-item-main">
                    <strong>{delivery.passenger.user.fullName}</strong>
                    <small>{delivery.pickupAddress} → {delivery.dropoffAddress}</small>
                  </div>
                  <div className="liveops-item-meta">
                    <em className={`liveops-tag ${statusTone(delivery.status)}`}>{delivery.status}</em>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Incidents */}
        <section className="liveops-section">
          <div className="liveops-section-header">
            <AlertTriangle size={14} style={{ color: "#ef4444" }} />
            <h4>Incidents</h4>
            <span className="liveops-count danger">{openIncidents.length}</span>
          </div>
          <div className="liveops-section-body">
            {openIncidents.length === 0 ? (
              <div className="liveops-empty">No open incidents</div>
            ) : (
              openIncidents.slice(0, 3).map((incident) => (
                <div key={incident.id} className="liveops-item">
                  <div className="liveops-item-main">
                    <strong>{incident.reporter.fullName}</strong>
                    <small>{incident.description.slice(0, 60)}{incident.description.length > 60 ? "…" : ""}</small>
                  </div>
                  <div className="liveops-item-meta">
                    <em className={`liveops-tag ${incident.severity === "critical" ? "danger" : "warning"}`}>
                      {incident.severity}
                    </em>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
