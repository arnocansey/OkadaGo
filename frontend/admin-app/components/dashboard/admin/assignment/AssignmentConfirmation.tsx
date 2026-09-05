"use client";

import React from "react";
import { AlertCircle, CheckCircle2, X, Bike, Navigation, Clock } from "lucide-react";
import type { RideItem, RiderCandidate } from "./types";

export type AssignmentConfirmationProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ride: RideItem | null;
  rider: RiderCandidate | null;
  isAssigning?: boolean;
  adminCurrency?: string;
};

export function AssignmentConfirmation({
  isOpen,
  onClose,
  onConfirm,
  ride,
  rider,
  isAssigning,
  adminCurrency = "GHS"
}: AssignmentConfirmationProps) {
  if (!isOpen || !ride || !rider) return null;

  const shortId = `#OG-${ride.id.slice(-6).toUpperCase()}`;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          zIndex: 10000,
          transition: "opacity 0.2s ease"
        }}
      />

      {/* Modal Card */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: "460px",
          background: "var(--card-bg, #0d1220)",
          border: "1px solid var(--border-color, #1a2235)",
          borderRadius: "18px",
          padding: "24px",
          zIndex: 10001,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
          animation: "scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "18px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981"
              }}
            >
              <Bike size={20} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#FFFFFF",
                  margin: 0
                }}
              >
                Confirm Assignment
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                Manual Operations Dispatch
              </span>
            </div>
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
            <X size={16} />
          </button>
        </div>

        {/* Question Prompt */}
        <p
          style={{
            fontSize: "0.9rem",
            color: "#CBD5E1",
            margin: "0 0 16px 0",
            lineHeight: 1.4
          }}
        >
          Are you sure you want to assign rider{" "}
          <strong style={{ color: "#10B981" }}>{rider.displayName}</strong> to Request{" "}
          <strong style={{ color: "#FFFFFF" }}>{shortId}</strong>?
        </p>

        {/* Dispatch Preview Box */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "12px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "20px"
          }}
        >
          {/* Rider Details */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>Selected Rider:</div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F8FAFC" }}>
              {rider.displayName} ({rider.vehicle?.plateNumber ?? "Motorcycle"})
            </div>
          </div>

          {/* Passenger Details */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>Passenger:</div>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#E2E8F0" }}>
              {ride.passenger?.name || "Passenger"}
            </div>
          </div>

          {/* Pickup Address */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <div style={{ fontSize: "0.78rem", color: "#94A3B8", flexShrink: 0 }}>Pickup:</div>
            <div
              style={{
                fontSize: "0.78rem",
                color: "#E2E8F0",
                textAlign: "right",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {ride.pickupAddress}
            </div>
          </div>

          {/* ETA & Distance */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>ETA to Pickup:</div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#10B981" }}>
              {rider.etaMinutes} mins ({rider.distanceToPickupKm.toFixed(1)} km)
            </div>
          </div>

          {/* Estimated Fare */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "0.78rem", color: "#94A3B8" }}>Trip Fare:</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#22C55E" }}>
              {ride.currency || adminCurrency} {Number(ride.estimatedFare || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isAssigning}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-color, #1a2235)",
              color: "#94A3B8",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: isAssigning ? "not-allowed" : "pointer"
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isAssigning}
            style={{
              flex: 1.4,
              padding: "10px 16px",
              borderRadius: "10px",
              background: "#10B981",
              border: "none",
              color: "#FFFFFF",
              fontSize: "0.82rem",
              fontWeight: 800,
              cursor: isAssigning ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <CheckCircle2 size={16} />
            {isAssigning ? "Assigning..." : "Confirm & Dispatch"}
          </button>
        </div>
      </div>
    </>
  );
}
