"use client";

import React, { useState } from "react";
import { X, ArrowRightLeft, Bike, Star, Navigation, ShieldCheck } from "lucide-react";
import type { RideItem, RiderCandidate } from "./types";

export type AssignmentReassignModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; reasonNote?: string }) => void;
  ride: RideItem | null;
  newRider: RiderCandidate | null;
  isReassigning?: boolean;
};

const REASSIGN_REASONS = [
  { value: "rider_unavailable", label: "Rider Unresponsive / Unavailable" },
  { value: "rider_too_far", label: "Rider Too Far / Stuck in Heavy Traffic" },
  { value: "mechanical_issue", label: "Vehicle / Mechanical Breakdown" },
  { value: "passenger_requested", label: "Passenger Requested Reassignment" },
  { value: "admin_override", label: "Dispatcher Operational Override" }
];

export function AssignmentReassignModal({
  isOpen,
  onClose,
  onConfirm,
  ride,
  newRider,
  isReassigning = false
}: AssignmentReassignModalProps) {
  const [reason, setReason] = useState("rider_unavailable");
  const [reasonNote, setReasonNote] = useState("");

  if (!isOpen || !ride || !newRider) return null;

  const shortId = `#OG-${ride.id.slice(-6).toUpperCase()}`;
  const currentRider = ride.assignedRider;

  const handleConfirm = () => {
    onConfirm({
      reason,
      reasonNote: reasonNote.trim() || undefined
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={isReassigning ? undefined : onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 99998,
          animation: "fadeIn 0.15s ease"
        }}
      />

      {/* Modal Dialog */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: "520px",
          background: "var(--card-bg, #0d1220)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: "16px",
          zIndex: 99999,
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(16, 185, 129, 0.15)",
          overflow: "hidden"
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color, #1a2235)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(16, 185, 129, 0.06)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                Reassign Motorcycle Rider
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                Ride {shortId} · Ops Dispatch
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isReassigning}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "none",
              borderRadius: "8px",
              padding: "6px",
              color: "#94A3B8",
              cursor: isReassigning ? "not-allowed" : "pointer"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Comparison Cards: Current -> New */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: "10px",
              background: "rgba(15, 23, 42, 0.5)",
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid var(--border-color, #1a2235)"
            }}
          >
            {/* Left: Current Rider */}
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "8px",
                padding: "10px 12px"
              }}
            >
              <span style={{ fontSize: "0.68rem", color: "#EF4444", fontWeight: 700, textTransform: "uppercase" }}>
                Current Rider
              </span>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#F8FAFC", marginTop: "2px" }}>
                {currentRider?.name || "None"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                {currentRider?.phone || "—"}
              </div>
            </div>

            {/* Middle: Transfer Indicator */}
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10B981"
              }}
            >
              <ArrowRightLeft size={14} />
            </div>

            {/* Right: New Rider */}
            <div
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: "8px",
                padding: "10px 12px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.68rem", color: "#10B981", fontWeight: 700, textTransform: "uppercase" }}>
                  New Rider
                </span>
                <span style={{ fontSize: "0.68rem", color: "#10B981", fontWeight: 800 }}>
                  {newRider.score.toFixed(0)} pts
                </span>
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#F8FAFC", marginTop: "2px" }}>
                {newRider.displayName}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                {newRider.distanceToPickupKm.toFixed(1)} km · ~{newRider.etaMinutes} mins
              </div>
            </div>
          </div>

          {/* Reason Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#CBD5E1" }}>
              Reason for Reassignment <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isReassigning}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid var(--border-color, #1a2235)",
                color: "#F8FAFC",
                fontSize: "0.82rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              {REASSIGN_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Note Field */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94A3B8" }}>
              Dispatcher Audit Note (Optional)
            </label>
            <textarea
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              placeholder="e.g. Passenger called support requesting closer rider; current rider confirmed stuck at Circle traffic."
              rows={2}
              disabled={isReassigning}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid var(--border-color, #1a2235)",
                color: "#F8FAFC",
                fontSize: "0.8rem",
                outline: "none",
                resize: "none",
                fontFamily: "inherit"
              }}
            />
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
            disabled={isReassigning}
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-color, #1a2235)",
              color: "#94A3B8",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: isReassigning ? "not-allowed" : "pointer"
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isReassigning}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 18px",
              borderRadius: "8px",
              background: "#10B981",
              border: "none",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: isReassigning ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
              opacity: isReassigning ? 0.7 : 1
            }}
          >
            <ArrowRightLeft size={15} />
            {isReassigning ? "Reassigning..." : "Confirm Reassign"}
          </button>
        </div>
      </div>
    </>
  );
}
