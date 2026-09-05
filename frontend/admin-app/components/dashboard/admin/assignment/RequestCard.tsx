"use client";

import React from "react";
import {
  MapPin,
  Clock,
  Phone,
  User,
  Bike,
  Navigation,
  ExternalLink,
  Zap,
  Eye,
  CheckCircle2,
  UserX,
  ArrowRightLeft
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { RideItem } from "./types";

export type RequestCardProps = {
  ride: RideItem;
  isSelected: boolean;
  onSelect: (rideId: string) => void;
  onAssignClick: (rideId: string) => void;
  onViewDetailsClick: (rideId: string) => void;
  onUnassignClick?: (rideId: string) => void;
  onReassignClick?: (rideId: string) => void;
  adminCurrency?: string;
};

function formatTimeAgo(dateStr: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return "";
  }
}

export function RequestCard({
  ride,
  isSelected,
  onSelect,
  onAssignClick,
  onViewDetailsClick,
  onUnassignClick,
  onReassignClick,
  adminCurrency = "GHS"
}: RequestCardProps) {
  const shortId = `#OG-${ride.id.slice(-6).toUpperCase()}`;
  const passengerName = ride.passenger?.name || "Passenger";
  const passengerPhone = ride.passenger?.phone || "";
  const timeAgo = formatTimeAgo(ride.requestedAt);
  const fare =
    typeof ride.estimatedFare === "number"
      ? ride.estimatedFare.toFixed(2)
      : Number(ride.estimatedFare || 0).toFixed(2);
  const distance =
    typeof ride.estimatedDistanceKm === "number"
      ? `${ride.estimatedDistanceKm.toFixed(1)} km`
      : ride.estimatedDistanceKm
      ? `${Number(ride.estimatedDistanceKm).toFixed(1)} km`
      : null;
  const eta = ride.estimatedDurationMinutes ? `${ride.estimatedDurationMinutes} mins` : null;

  const isAssigned = Boolean(ride.assignedRider || ride.status === "ASSIGNED");

  return (
    <div
      onClick={() => onSelect(ride.id)}
      style={{
        background: isSelected
          ? "rgba(16, 185, 129, 0.05)"
          : "var(--card-bg, #0d1220)",
        border: isSelected
          ? "1.5px solid #10B981"
          : "1px solid var(--border-color, #1a2235)",
        borderRadius: "14px",
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.18s ease",
        position: "relative",
        boxShadow: isSelected
          ? "0 4px 20px rgba(16, 185, 129, 0.12)"
          : "none"
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.4)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = "var(--border-color, #1a2235)";
          e.currentTarget.style.background = "var(--card-bg, #0d1220)";
        }
      }}
    >
      {/* Top row: ID, Badge, Time Ago */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "8px",
          flexWrap: "wrap"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "#10B981",
              background: "rgba(16, 185, 129, 0.12)",
              padding: "3px 7px",
              borderRadius: "6px",
              letterSpacing: "0.03em"
            }}
          >
            {shortId}
          </span>
          <StatusBadge status={ride.status} size="sm" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Clock size={12} color="#64748B" />
          <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 500 }}>
            {timeAgo}
          </span>
        </div>
      </div>

      {/* Passenger Info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          paddingBottom: "10px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8"
            }}
          >
            <User size={14} />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-primary, #F1F5F9)"
              }}
            >
              {passengerName}
            </div>
            {passengerPhone && (
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <Phone size={10} />
                {passengerPhone}
              </div>
            )}
          </div>
        </div>

        {/* Fare display */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: 800,
              color: "#22C55E",
              letterSpacing: "-0.01em"
            }}
          >
            {ride.currency || adminCurrency} {fare}
          </div>
          <span style={{ fontSize: "0.68rem", color: "#64748B" }}>Est. Fare</span>
        </div>
      </div>

      {/* Route: Pickup -> Destination */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
        {/* Pickup */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#10B981",
              marginTop: "5px",
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.78rem",
                color: "#CBD5E1",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
              title={ride.pickupAddress}
            >
              {ride.pickupAddress || "Pickup location"}
            </div>
          </div>
        </div>

        {/* Destination */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "2px",
              background: "#EF4444",
              marginTop: "5px",
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.78rem",
                color: "#94A3B8",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
              title={ride.destinationAddress}
            >
              {ride.destinationAddress || "Destination location"}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Strip (Distance & ETA) + Assigned Rider if any */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "8px",
          marginBottom: "14px",
          padding: "8px 10px",
          borderRadius: "8px",
          background: "rgba(15, 23, 42, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.04)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {distance && (
            <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
              Dist: <strong style={{ color: "#E2E8F0" }}>{distance}</strong>
            </div>
          )}
          {eta && (
            <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
              ETA: <strong style={{ color: "#E2E8F0" }}>{eta}</strong>
            </div>
          )}
        </div>

        {ride.assignedRider ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "0.72rem",
              color: "#10B981",
              fontWeight: 600
            }}
          >
            <Bike size={12} />
            <span>{ride.assignedRider.name}</span>
          </div>
        ) : (
          <span style={{ fontSize: "0.7rem", color: "#F59E0B", fontStyle: "italic" }}>
            Unassigned
          </span>
        )}
      </div>

      {/* Bottom Actions */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {isAssigned ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onReassignClick) {
                  onReassignClick(ride.id);
                } else {
                  onAssignClick(ride.id);
                }
              }}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                padding: "8px 10px",
                borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10B981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.12)";
              }}
            >
              <ArrowRightLeft size={13} />
              Reassign
            </button>

            {onUnassignClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnassignClick(ride.id);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "#EF4444",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                title="Unassign rider & return to Searching pool"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                }}
              >
                <UserX size={13} />
                Unassign
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAssignClick(ride.id);
            }}
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              background: "#10B981",
              color: "#FFFFFF",
              border: "none",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#059669";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#10B981";
            }}
          >
            <Zap size={13} fill="#FFFFFF" />
            Assign Rider
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetailsClick(ride.id);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(255, 255, 255, 0.04)",
            color: "#94A3B8",
            border: "1px solid var(--border-color, #1a2235)",
            fontSize: "0.78rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#94A3B8";
            e.currentTarget.style.color = "#FFFFFF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-color, #1a2235)";
            e.currentTarget.style.color = "#94A3B8";
          }}
        >
          <Eye size={13} />
          Details
        </button>
      </div>
    </div>
  );
}
