"use client";

import React from "react";
import { X, AlertTriangle, UserX, Bike, User, MapPin } from "lucide-react";
import type { RideItem } from "./types";

export type AssignmentUnassignModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ride: RideItem | null;
  isUnassigning?: boolean;
};

export function AssignmentUnassignModal({
  isOpen,
  onClose,
  onConfirm,
  ride,
  isUnassigning = false
}: AssignmentUnassignModalProps) {
  if (!isOpen || !ride) return null;

  const shortId = `#OG-${ride.id.slice(-6).toUpperCase()}`;
  const riderName = ride.assignedRider?.name || "Assigned Rider";
  const riderPhone = ride.assignedRider?.phone || "";
  const plateNumber = ride.assignedRider?.vehicle?.plateNumber;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={isUnassigning ? undefined : onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 99998,
          animation: "fadeIn 0.15s ease"
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
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "16px",
          zIndex: 99999,
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(239, 68, 68, 0.15)",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color, #1a2235)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(239, 68, 68, 0.06)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#EF4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <UserX size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                Unassign Rider
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#EF4444", fontWeight: 600 }}>
                Reverts ride to Searching pool
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUnassigning}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "none",
              borderRadius: "8px",
              padding: "6px",
              color: "#94A3B8",
              cursor: isUnassigning ? "not-allowed" : "pointer"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Ride & Rider info box */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.5)",
              borderRadius: "12px",
              border: "1px solid var(--border-color, #1a2235)",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  color: "#10B981",
                  background: "rgba(16, 185, 129, 0.1)",
                  padding: "2px 7px",
                  borderRadius: "5px"
                }}
              >
                {shortId}
              </span>
              <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
                Passenger: <strong style={{ color: "#E2E8F0" }}>{ride.passenger?.name || "Passenger"}</strong>
              </span>
            </div>

            {/* Currently assigned rider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)"
              }}
            >
              <Bike size={18} color="#EF4444" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F8FAFC" }}>
                  {riderName}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                  {riderPhone} {plateNumber ? `· ${plateNumber}` : ""}
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "#EF4444",
                  background: "rgba(239, 68, 68, 0.15)",
                  padding: "2px 6px",
                  borderRadius: "4px"
                }}
              >
                To be released
              </span>
            </div>

            {/* Pickup */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", color: "#94A3B8" }}>
              <MapPin size={12} color="#10B981" />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ride.pickupAddress}
              </span>
            </div>
          </div>

          {/* Explanation Alert */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              fontSize: "0.75rem",
              color: "#FBBF24",
              lineHeight: 1.45
            }}
          >
            <AlertTriangle size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              Releasing this rider will immediately notify the passenger and return the request to the active{" "}
              <strong>SEARCHING</strong> queue for auto or manual assignment.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border-color, #1a2235)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            background: "rgba(15, 23, 42, 0.4)"
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isUnassigning}
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-color, #1a2235)",
              color: "#94A3B8",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: isUnassigning ? "not-allowed" : "pointer"
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isUnassigning}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              borderRadius: "8px",
              background: "#EF4444",
              border: "none",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: isUnassigning ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)",
              opacity: isUnassigning ? 0.7 : 1
            }}
          >
            <UserX size={15} />
            {isUnassigning ? "Unassigning..." : "Confirm Unassign"}
          </button>
        </div>
      </div>
    </>
  );
}
