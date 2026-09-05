"use client";

import React from "react";
import { Inbox, AlertCircle } from "lucide-react";
import { RequestCard } from "./RequestCard";
import type { RideItem } from "./types";

export type RequestQueueProps = {
  rides: RideItem[];
  isLoading?: boolean;
  selectedRideId: string | null;
  onSelectRide: (rideId: string) => void;
  onAssignClick: (rideId: string) => void;
  onViewDetailsClick: (rideId: string) => void;
  onUnassignClick?: (rideId: string) => void;
  onReassignClick?: (rideId: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  adminCurrency?: string;
};

export function RequestQueue({
  rides,
  isLoading,
  selectedRideId,
  onSelectRide,
  onAssignClick,
  onViewDetailsClick,
  onUnassignClick,
  onReassignClick,
  statusFilter = "all",
  onStatusFilterChange,
  adminCurrency = "GHS"
}: RequestQueueProps) {
  const tabs = [
    { key: "all", label: "All" },
    { key: "unassigned", label: "Unassigned" },
    { key: "searching", label: "Searching" },
    { key: "assigned", label: "Assigned" },
    { key: "active", label: "Active Trips" }
  ];

  return (
    <div
      style={{
        background: "var(--card-bg, #0d1220)",
        border: "1px solid var(--border-color, #1a2235)",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "560px",
        maxHeight: "780px",
        overflow: "hidden"
      }}
    >
      {/* Queue Header */}
      <div
        style={{
          padding: "16px 20px 12px 20px",
          borderBottom: "1px solid var(--border-color, #1a2235)",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "var(--text-primary, #FFFFFF)",
                margin: 0
              }}
            >
              Ride Requests
            </h2>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "9999px",
                background: "rgba(255, 255, 255, 0.08)",
                color: "#94A3B8"
              }}
            >
              {rides.length}
            </span>
          </div>

          <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
            Click card to focus on map
          </div>
        </div>

        {/* Quick Filter Tabs */}
        {onStatusFilterChange && (
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {tabs.map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onStatusFilterChange(tab.key)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: isActive ? "none" : "1px solid rgba(255, 255, 255, 0.07)",
                    background: isActive
                      ? tab.key === "unassigned"
                        ? "#EF4444"
                        : "#10B981"
                      : "rgba(255, 255, 255, 0.03)",
                    color: isActive ? "#FFFFFF" : "#94A3B8",
                    whiteSpace: "nowrap",
                    transition: "all 0.12s ease"
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Scrollable Queue Body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "10px"
            }}
          >
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  height: "140px",
                  borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.03)",
                  animation: "pulse 1.5s infinite"
                }}
              />
            ))}
          </div>
        ) : rides.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              textAlign: "center",
              color: "#64748B",
              height: "100%"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px"
              }}
            >
              <Inbox size={24} color="#64748B" />
            </div>
            <strong
              style={{
                fontSize: "0.95rem",
                color: "#94A3B8",
                marginBottom: "4px"
              }}
            >
              No requests found
            </strong>
            <p style={{ fontSize: "0.78rem", margin: 0, maxWidth: "240px" }}>
              No active ride requests matching your current filters.
            </p>
          </div>
        ) : (
          rides.map((ride) => (
            <RequestCard
              key={ride.id}
              ride={ride}
              isSelected={selectedRideId === ride.id}
              onSelect={onSelectRide}
              onAssignClick={onAssignClick}
              onViewDetailsClick={onViewDetailsClick}
              onUnassignClick={onUnassignClick}
              onReassignClick={onReassignClick}
              adminCurrency={adminCurrency}
            />
          ))
        )}
      </div>
    </div>
  );
}
