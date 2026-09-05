"use client";

import React from "react";

export type StatusBadgeProps = {
  status: string;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string; pulse?: boolean }
> = {
  SEARCHING: {
    label: "Searching",
    bg: "rgba(245, 158, 11, 0.12)",
    text: "#F59E0B",
    border: "rgba(245, 158, 11, 0.3)",
    dot: "#F59E0B",
    pulse: true
  },
  SCHEDULED: {
    label: "Scheduled",
    bg: "rgba(139, 92, 246, 0.12)",
    text: "#A78BFA",
    border: "rgba(139, 92, 246, 0.3)",
    dot: "#8B5CF6"
  },
  ASSIGNED: {
    label: "Assigned",
    bg: "rgba(16, 185, 129, 0.12)",
    text: "#10B981",
    border: "rgba(16, 185, 129, 0.3)",
    dot: "#10B981"
  },
  ARRIVING: {
    label: "En Route to Pickup",
    bg: "rgba(14, 165, 233, 0.12)",
    text: "#0EA5E9",
    border: "rgba(14, 165, 233, 0.3)",
    dot: "#0EA5E9",
    pulse: true
  },
  ARRIVED: {
    label: "Arrived at Pickup",
    bg: "rgba(249, 115, 22, 0.12)",
    text: "#F97316",
    border: "rgba(249, 115, 22, 0.3)",
    dot: "#F97316"
  },
  STARTED: {
    label: "Trip in Progress",
    bg: "rgba(20, 184, 166, 0.12)",
    text: "#14B8A6",
    border: "rgba(20, 184, 166, 0.3)",
    dot: "#14B8A6",
    pulse: true
  },
  COMPLETED: {
    label: "Completed",
    bg: "rgba(34, 197, 94, 0.12)",
    text: "#22C55E",
    border: "rgba(34, 197, 94, 0.3)",
    dot: "#22C55E"
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "rgba(239, 68, 68, 0.12)",
    text: "#EF4444",
    border: "rgba(239, 68, 68, 0.3)",
    dot: "#EF4444"
  },
  UNASSIGNED: {
    label: "Unassigned",
    bg: "rgba(244, 63, 94, 0.12)",
    text: "#F43F5E",
    border: "rgba(244, 63, 94, 0.3)",
    dot: "#F43F5E"
  }
};

export function StatusBadge({ status, size = "md", showDot = true }: StatusBadgeProps) {
  const norm = (status || "UNASSIGNED").toUpperCase();
  const config = STATUS_CONFIG[norm] || {
    label: status,
    bg: "rgba(148, 163, 184, 0.12)",
    text: "#94A3B8",
    border: "rgba(148, 163, 184, 0.3)",
    dot: "#94A3B8"
  };

  const isSmall = size === "sm";
  const isLarge = size === "lg";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSmall ? 4 : 6,
        padding: isSmall ? "2px 6px" : isLarge ? "5px 12px" : "3px 9px",
        borderRadius: 9999,
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        fontSize: isSmall ? "0.65rem" : isLarge ? "0.82rem" : "0.72rem",
        fontWeight: 600,
        letterSpacing: "0.02em",
        lineHeight: 1.2,
        whiteSpace: "nowrap"
      }}
    >
      {showDot && (
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            width: isSmall ? 5 : 6,
            height: isSmall ? 5 : 6
          }}
        >
          {config.pulse && (
            <span
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: 9999,
                background: config.dot,
                opacity: 0.75,
                animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite"
              }}
            />
          )}
          <span
            style={{
              position: "relative",
              display: "inline-block",
              width: isSmall ? 5 : 6,
              height: isSmall ? 5 : 6,
              borderRadius: 9999,
              background: config.dot
            }}
          />
        </span>
      )}
      {config.label}
    </span>
  );
}
