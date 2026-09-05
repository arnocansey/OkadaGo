"use client";

import React from "react";
import { Clock, Search, UserCheck, Bike, AlertTriangle, Flame } from "lucide-react";
import type { AssignmentStatsData } from "./types";

export type AssignmentStatsProps = {
  stats?: AssignmentStatsData;
  isLoading?: boolean;
  liveOnlineRidersCount?: number;
  unassignedCount?: number;
  searchingCount?: number;
  assignedCount?: number;
  activeTripsCount?: number;
  onFilterClick?: (status: string) => void;
};

export function AssignmentStats({
  stats,
  isLoading,
  liveOnlineRidersCount = 0,
  unassignedCount,
  searchingCount,
  assignedCount,
  activeTripsCount,
  onFilterClick
}: AssignmentStatsProps) {
  // Use live numbers when provided or fallback to stats summary
  const pending = stats?.totalActive ?? 0;
  const searching = searchingCount ?? stats?.unassigned ?? 0;
  const assigned = assignedCount ?? stats?.assigned ?? 0;
  const availableRiders = liveOnlineRidersCount || 0;
  const unassigned = unassignedCount ?? stats?.unassigned ?? 0;
  const activeTrips = activeTripsCount ?? ((stats?.arriving ?? 0) + (stats?.arrived ?? 0));

  const cards = [
    {
      key: "all",
      label: "Pending Requests",
      value: pending,
      sub: "Total in queue",
      icon: Clock,
      color: "#F59E0B",
      bg: "rgba(245, 158, 11, 0.08)",
      border: "rgba(245, 158, 11, 0.2)"
    },
    {
      key: "searching",
      label: "Searching for Rider",
      value: searching,
      sub: "Awaiting candidate",
      icon: Search,
      color: "#8B5CF6",
      bg: "rgba(139, 92, 246, 0.08)",
      border: "rgba(139, 92, 246, 0.2)"
    },
    {
      key: "assigned",
      label: "Assigned Requests",
      value: assigned,
      sub: "Rider confirmed",
      icon: UserCheck,
      color: "#10B981",
      bg: "rgba(16, 185, 129, 0.08)",
      border: "rgba(16, 185, 129, 0.2)"
    },
    {
      key: "available_riders",
      label: "Available Riders",
      value: availableRiders,
      sub: "Online & ready",
      icon: Bike,
      color: "#22C55E",
      bg: "rgba(34, 197, 94, 0.08)",
      border: "rgba(34, 197, 94, 0.2)"
    },
    {
      key: "unassigned",
      label: "Unassigned Requests",
      value: unassigned,
      sub: "Needs urgent dispatch",
      icon: AlertTriangle,
      color: "#EF4444",
      bg: "rgba(239, 68, 68, 0.08)",
      border: "rgba(239, 68, 68, 0.2)"
    },
    {
      key: "active",
      label: "Active Trips",
      value: activeTrips,
      sub: "En route or riding",
      icon: Flame,
      color: "#0EA5E9",
      bg: "rgba(14, 165, 233, 0.08)",
      border: "rgba(14, 165, 233, 0.2)"
    }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: "12px",
        marginBottom: "16px"
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            onClick={() => onFilterClick && onFilterClick(card.key)}
            style={{
              padding: "14px 16px",
              borderRadius: "14px",
              background: "var(--card-bg, #0d1220)",
              border: `1px solid ${card.border}`,
              cursor: onFilterClick ? "pointer" : "default",
              transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={(e) => {
              if (onFilterClick) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 6px 18px ${card.bg}`;
              }
            }}
            onMouseLeave={(e) => {
              if (onFilterClick) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            {/* Top row: Icon + Label */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: card.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: card.color,
                  flexShrink: 0
                }}
              >
                <Icon size={18} strokeWidth={2.2} />
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted, #94A3B8)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  lineHeight: 1.2
                }}
              >
                {card.label}
              </span>
            </div>

            {/* Main Value */}
            <div
              style={{
                fontSize: "1.65rem",
                fontWeight: 800,
                color: "var(--text-primary, #FFFFFF)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1
              }}
            >
              {isLoading ? (
                <span
                  style={{
                    display: "inline-block",
                    width: "36px",
                    height: "22px",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "4px"
                  }}
                />
              ) : (
                card.value
              )}
            </div>

            {/* Subtitle / context */}
            <div
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted, #64748B)",
                marginTop: "4px",
                fontWeight: 500
              }}
            >
              {card.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
