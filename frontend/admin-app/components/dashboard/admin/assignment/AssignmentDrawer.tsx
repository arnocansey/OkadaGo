"use client";

import React, { useState } from "react";
import {
  X,
  Zap,
  Star,
  Bike,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  ShieldCheck,
  Percent,
  Clock
} from "lucide-react";
import type { RideItem, RiderCandidate, AvailableRidersResponse } from "./types";

export type AssignmentDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  ride: RideItem | null;
  availableData?: AvailableRidersResponse;
  isLoading?: boolean;
  onAutoAssign: (rideId: string) => void;
  onManualAssignSelect: (rider: RiderCandidate) => void;
  isAssigning?: boolean;
  adminCurrency?: string;
};

export function AssignmentDrawer({
  isOpen,
  onClose,
  ride,
  availableData,
  isLoading,
  onAutoAssign,
  onManualAssignSelect,
  isAssigning,
  adminCurrency = "GHS"
}: AssignmentDrawerProps) {
  const [expandedRiderId, setExpandedRiderId] = useState<string | null>(null);

  if (!isOpen || !ride) return null;

  const candidates = availableData?.availableRiders || [];
  const recommendedId = availableData?.recommendedRiderId;
  const bestCandidate = candidates.find((c) => c.riderId === recommendedId) || candidates[0];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
          transition: "opacity 0.2s ease"
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: "480px",
          background: "var(--card-bg, #0d1220)",
          borderLeft: "1px solid var(--border-color, #1a2235)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.5)",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color, #1a2235)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            background: "rgba(15, 23, 42, 0.5)"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  fontWeight: 800,
                  color: "#10B981",
                  background: "rgba(16, 185, 129, 0.12)",
                  padding: "2px 8px",
                  borderRadius: "6px"
                }}
              >
                #OG-{ride.id.slice(-6).toUpperCase()}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                Rider Dispatch Panel
              </span>
            </div>
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "#FFFFFF",
                margin: "6px 0 0 0"
              }}
            >
              Assign Motorcycle Rider
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "none",
              borderRadius: "8px",
              padding: "6px",
              color: "#94A3B8",
              cursor: "pointer"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected Request Summary Card */}
        <div
          style={{
            padding: "16px 24px",
            background: "rgba(15, 23, 42, 0.3)",
            borderBottom: "1px solid var(--border-color, #1a2235)",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#F1F5F9" }}>
              Passenger: {ride.passenger?.name || "Passenger"}
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#22C55E" }}>
              {ride.currency || adminCurrency} {Number(ride.estimatedFare || 0).toFixed(2)}
            </div>
          </div>

          <div style={{ fontSize: "0.75rem", color: "#94A3B8", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Pickup: {ride.pickupAddress}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: 6, height: 6, borderRadius: "2px", background: "#EF4444" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Dropoff: {ride.destinationAddress}
              </span>
            </div>
          </div>

          {/* AUTO ASSIGN BEST RIDER ACTION BUTTON */}
          <button
            type="button"
            onClick={() => onAutoAssign(ride.id)}
            disabled={isAssigning || candidates.length === 0}
            style={{
              marginTop: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "10px",
              background: "#10B981",
              color: "#FFFFFF",
              border: "none",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: isAssigning || candidates.length === 0 ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
              transition: "all 0.15s ease",
              opacity: candidates.length === 0 ? 0.6 : 1
            }}
          >
            <Zap size={16} fill="#FFFFFF" />
            {isAssigning
              ? "Dispatching Best Rider..."
              : bestCandidate
              ? `Auto-Assign Best (${bestCandidate.displayName} - ${bestCandidate.score.toFixed(0)} pts)`
              : "Auto-Assign Best Rider"}
          </button>
        </div>

        {/* Candidate Riders List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.04em"
              }}
            >
              Recommended Riders ({candidates.length})
            </span>
            <span style={{ fontSize: "0.7rem", color: "#64748B" }}>
              Ranked by 11-factor engine
            </span>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "10px 0" }}>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    height: "100px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.04)",
                    animation: "pulse 1.5s infinite"
                  }}
                />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "36px 16px",
                color: "#64748B"
              }}
            >
              <AlertTriangle size={28} color="#F59E0B" style={{ marginBottom: "8px" }} />
              <div style={{ color: "#E2E8F0", fontWeight: 700, fontSize: "0.9rem" }}>
                No Available Riders Nearby
              </div>
              <p style={{ fontSize: "0.75rem", margin: "4px 0 0 0" }}>
                All riders within range are currently busy on other trips or offline.
              </p>
            </div>
          ) : (
            candidates.map((rider, index) => {
              const isRecommended = rider.riderId === recommendedId || index === 0;
              const isExpanded = expandedRiderId === rider.riderId;

              return (
                <div
                  key={rider.riderId}
                  style={{
                    background: isRecommended
                      ? "rgba(16, 185, 129, 0.05)"
                      : "rgba(15, 23, 42, 0.4)",
                    border: isRecommended
                      ? "1.5px solid #10B981"
                      : "1px solid var(--border-color, #1a2235)",
                    borderRadius: "12px",
                    padding: "14px",
                    position: "relative"
                  }}
                >
                  {/* Top recommended pill */}
                  {isRecommended && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "12px",
                        background: "#10B981",
                        color: "#FFFFFF",
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        letterSpacing: "0.03em"
                      }}
                    >
                      #1 RECOMMENDED
                    </div>
                  )}

                  {/* Rider Main Header: Name, Plate, Match Score */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "8px"
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          color: "#F8FAFC",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        {rider.displayName}
                        <span style={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 500 }}>
                          ({rider.displayCode})
                        </span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: "2px" }}>
                        🏍️ {rider.vehicle ? `${rider.vehicle.make} ${rider.vehicle.model} · ${rider.vehicle.plateNumber}` : "Motorcycle"}
                      </div>
                    </div>

                    {/* Score badge */}
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 800,
                          color: rider.score >= 75 ? "#10B981" : rider.score >= 50 ? "#F59E0B" : "#EF4444"
                        }}
                      >
                        {rider.score.toFixed(1)}
                      </div>
                      <span style={{ fontSize: "0.62rem", color: "#64748B", textTransform: "uppercase" }}>
                        Score / 100
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Strip: Distance, ETA, Rating, Acceptance */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "6px",
                      background: "rgba(0, 0, 0, 0.2)",
                      padding: "8px",
                      borderRadius: "8px",
                      marginBottom: "10px",
                      textAlign: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E2E8F0" }}>
                        {rider.distanceToPickupKm.toFixed(1)} km
                      </div>
                      <span style={{ fontSize: "0.62rem", color: "#64748B" }}>Distance</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#E2E8F0" }}>
                        {rider.etaMinutes} min
                      </div>
                      <span style={{ fontSize: "0.62rem", color: "#64748B" }}>ETA</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#F59E0B" }}>
                        ⭐ {rider.rating.toFixed(1)}
                      </div>
                      <span style={{ fontSize: "0.62rem", color: "#64748B" }}>Rating</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#10B981" }}>
                        {rider.acceptanceRate.toFixed(0)}%
                      </div>
                      <span style={{ fontSize: "0.62rem", color: "#64748B" }}>Acceptance</span>
                    </div>
                  </div>

                  {/* Score breakdown toggle */}
                  <button
                    type="button"
                    onClick={() => setExpandedRiderId(isExpanded ? null : rider.riderId)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94A3B8",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: 0,
                      marginBottom: isExpanded ? "8px" : "10px"
                    }}
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {isExpanded ? "Hide score breakdown" : "View score breakdown"}
                  </button>

                  {/* Collapsible score breakdown */}
                  {isExpanded && rider.scoreBreakdown && (
                    <div
                      style={{
                        padding: "8px 10px",
                        background: "rgba(0, 0, 0, 0.3)",
                        borderRadius: "8px",
                        fontSize: "0.68rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        marginBottom: "10px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8" }}>
                        <span>Proximity Score:</span>
                        <strong style={{ color: "#E2E8F0" }}>{rider.scoreBreakdown.proximity.toFixed(1)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8" }}>
                        <span>ETA Score:</span>
                        <strong style={{ color: "#E2E8F0" }}>{rider.scoreBreakdown.eta.toFixed(1)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8" }}>
                        <span>Driver Rating Score:</span>
                        <strong style={{ color: "#E2E8F0" }}>{rider.scoreBreakdown.rating.toFixed(1)}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8" }}>
                        <span>Acceptance Rate Score:</span>
                        <strong style={{ color: "#E2E8F0" }}>{rider.scoreBreakdown.acceptance.toFixed(1)}</strong>
                      </div>
                      {rider.scoreBreakdown.cancellationPenalty > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#EF4444" }}>
                          <span>Cancellation Penalty:</span>
                          <strong>-{rider.scoreBreakdown.cancellationPenalty.toFixed(1)}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Assign Button */}
                  <button
                    type="button"
                    onClick={() => onManualAssignSelect(rider)}
                    disabled={isAssigning}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: isRecommended ? "#10B981" : "rgba(255, 255, 255, 0.06)",
                      color: isRecommended ? "#FFFFFF" : "#E2E8F0",
                      border: isRecommended ? "none" : "1px solid var(--border-color, #1a2235)",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: isAssigning ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!isRecommended) {
                        e.currentTarget.style.borderColor = "#10B981";
                        e.currentTarget.style.color = "#10B981";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isRecommended) {
                        e.currentTarget.style.borderColor = "var(--border-color, #1a2235)";
                        e.currentTarget.style.color = "#E2E8F0";
                      }
                    }}
                  >
                    <CheckCircle2 size={14} />
                    Assign {rider.displayName}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
