"use client";

import React, { useMemo } from "react";
import { OperationsMap } from "@/components/maps/operations-map";
import type { LeafletMapMarker } from "@/components/maps/leaflet-map";
import { Bike, Navigation, Layers, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";
import type { RideItem, RiderCandidate } from "./types";

export type RiderMapProps = {
  activeRides: RideItem[];
  selectedRide: RideItem | null;
  mapMarkers?: LeafletMapMarker[];
  candidateRiders?: RiderCandidate[];
  onAssignRider?: (riderId: string) => void;
  height?: string | number;
};

// Accra city default coordinates
const ACCRA_CENTER: [number, number] = [5.6037, -0.1870];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function RiderMap({
  activeRides,
  selectedRide,
  mapMarkers = [],
  candidateRiders = [],
  onAssignRider,
  height = "100%"
}: RiderMapProps) {
  // Center map on selected request pickup if available, else first ride, else Accra
  const center = useMemo((): [number, number] => {
    if (selectedRide && Number.isFinite(selectedRide.pickupLatitude) && Number.isFinite(selectedRide.pickupLongitude)) {
      return [Number(selectedRide.pickupLatitude), Number(selectedRide.pickupLongitude)];
    }
    const firstActive = activeRides.find(
      (r) => Number.isFinite(r.pickupLatitude) && Number.isFinite(r.pickupLongitude)
    );
    if (firstActive) {
      return [Number(firstActive.pickupLatitude), Number(firstActive.pickupLongitude)];
    }
    return ACCRA_CENTER;
  }, [selectedRide, activeRides]);

  // Candidate rider fast lookup map by riderId
  const candidatesMap = useMemo(() => {
    const map = new Map<string, RiderCandidate>();
    candidateRiders.forEach((c) => map.set(c.riderId, c));
    return map;
  }, [candidateRiders]);

  // Combine and format markers
  const markers = useMemo((): LeafletMapMarker[] => {
    const list: LeafletMapMarker[] = [];

    // 1. If a ride is selected, add its Pickup and Destination markers
    if (selectedRide) {
      if (Number.isFinite(selectedRide.pickupLatitude) && Number.isFinite(selectedRide.pickupLongitude)) {
        list.push({
          id: `pickup-${selectedRide.id}`,
          position: [Number(selectedRide.pickupLatitude), Number(selectedRide.pickupLongitude)],
          label: `Pickup: ${selectedRide.pickupAddress}`,
          variant: "pickup",
          permanentLabel: true
        });
      }
      if (
        selectedRide.destinationLatitude &&
        selectedRide.destinationLongitude &&
        Number.isFinite(Number(selectedRide.destinationLatitude)) &&
        Number.isFinite(Number(selectedRide.destinationLongitude))
      ) {
        list.push({
          id: `dest-${selectedRide.id}`,
          position: [Number(selectedRide.destinationLatitude), Number(selectedRide.destinationLongitude)],
          label: `Dropoff: ${selectedRide.destinationAddress}`,
          variant: "destination"
        });
      }
    }

    // 2. Add Rider markers
    mapMarkers.forEach((m) => {
      const cand = candidatesMap.get(m.id);
      let distKm: number | undefined;
      let etaMins: number | undefined;
      let score: number | undefined;
      let rating: number | undefined;

      if (cand) {
        distKm = cand.distanceToPickupKm;
        etaMins = cand.etaMinutes;
        score = cand.score;
        rating = cand.rating;
      } else if (
        selectedRide &&
        Number.isFinite(selectedRide.pickupLatitude) &&
        Number.isFinite(selectedRide.pickupLongitude) &&
        Number.isFinite(m.position[0]) &&
        Number.isFinite(m.position[1])
      ) {
        distKm = haversineKm(
          Number(selectedRide.pickupLatitude),
          Number(selectedRide.pickupLongitude),
          m.position[0],
          m.position[1]
        );
        etaMins = Math.max(1, Math.round(distKm * 2.5));
      }

      list.push({
        ...m,
        extraDetails: {
          distanceKm: distKm,
          etaMinutes: etaMins,
          score,
          rating,
          vehiclePlate: cand?.vehicle?.plateNumber
        },
        actionButton:
          selectedRide && onAssignRider
            ? {
                label: `Assign to #OG-${selectedRide.id.slice(-6).toUpperCase()}`,
                onClick: () => onAssignRider(m.id)
              }
            : undefined
      });
    });

    return list;
  }, [selectedRide, mapMarkers, candidatesMap, onAssignRider]);

  // Pickup radius circle highlight (3km radius around selected pickup)
  const pickupRadius = useMemo(() => {
    if (!selectedRide || !Number.isFinite(selectedRide.pickupLatitude) || !Number.isFinite(selectedRide.pickupLongitude)) {
      return null;
    }
    return {
      center: [Number(selectedRide.pickupLatitude), Number(selectedRide.pickupLongitude)] as [number, number],
      radiusMeters: 3000,
      label: "Dispatch Area (3 km)"
    };
  }, [selectedRide]);

  // Route points if selected ride has pickup and dropoff
  const route = useMemo((): Array<[number, number]> => {
    if (
      selectedRide &&
      Number.isFinite(selectedRide.pickupLatitude) &&
      Number.isFinite(selectedRide.pickupLongitude) &&
      selectedRide.destinationLatitude &&
      selectedRide.destinationLongitude &&
      Number.isFinite(Number(selectedRide.destinationLatitude)) &&
      Number.isFinite(Number(selectedRide.destinationLongitude))
    ) {
      return [
        [Number(selectedRide.pickupLatitude), Number(selectedRide.pickupLongitude)],
        [Number(selectedRide.destinationLatitude), Number(selectedRide.destinationLongitude)]
      ];
    }
    return [];
  }, [selectedRide]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: height,
        minHeight: "560px",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid var(--border-color, #1a2235)",
        background: "#080c14"
      }}
    >
      <OperationsMap
        center={center}
        zoom={selectedRide ? 14 : 12}
        markers={markers}
        route={route}
        pickupRadius={pickupRadius}
        emptyTitle="No rider telemetry"
        emptyDescription="Riders will appear here once online."
        bare
      />

      {/* Map Legend Overlay */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          zIndex: 1000,
          background: "rgba(13, 18, 32, 0.88)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
        }}
      >
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: "2px"
          }}
        >
          Fleet Status
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "#E2E8F0" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
          <span>Available</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "#E2E8F0" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0EA5E9" }} />
          <span>On Trip</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "#E2E8F0" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F97316" }} />
          <span>En Route to Pickup</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "#E2E8F0" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#64748B" }} />
          <span>Offline / Idle</span>
        </div>
      </div>

      {/* Selected Request Banner Overlay */}
      {selectedRide && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            right: "16px",
            zIndex: 1000,
            background: "rgba(13, 18, 32, 0.92)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "12px",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981",
                flexShrink: 0
              }}
            >
              <Navigation size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#FFFFFF" }}>
                Targeting Request #{selectedRide.id.slice(-6).toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#94A3B8",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                Pickup: {selectedRide.pickupAddress}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <span
              style={{
                fontSize: "0.7rem",
                padding: "3px 8px",
                borderRadius: "6px",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10B981",
                fontWeight: 600
              }}
            >
              3 km Dispatch Radius Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
