"use client";

import React from "react";
import { Search, RefreshCw, Calendar, Filter, Zap, User } from "lucide-react";

export type FilterBarProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  riderFilter: string;
  onRiderFilterChange: (value: string) => void;
  autoAssignEnabled: boolean;
  onToggleAutoAssign: (enabled: boolean) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  totalRequestsCount: number;
};

export function FilterBar({
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  statusFilter,
  onStatusFilterChange,
  riderFilter,
  onRiderFilterChange,
  autoAssignEnabled,
  onToggleAutoAssign,
  onRefresh,
  isRefreshing,
  totalRequestsCount
}: FilterBarProps) {
  return (
    <div
      style={{
        background: "var(--card-bg, #0d1220)",
        border: "1px solid var(--border-color, #1a2235)",
        borderRadius: "16px",
        padding: "16px 20px",
        marginBottom: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}
    >
      {/* Top row: Title + Subtitle + Auto-Assign Toggle + Refresh Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "var(--text-primary, #FFFFFF)",
                margin: 0,
                letterSpacing: "-0.01em"
              }}
            >
              Rider Assignment
            </h1>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                borderRadius: "9999px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10B981",
                fontWeight: 700,
                border: "1px solid rgba(16, 185, 129, 0.3)"
              }}
            >
              LIVE DISPATCH
            </span>
          </div>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--text-muted, #94A3B8)",
              margin: "4px 0 0 0"
            }}
          >
            Monitor requests and assign available riders in real time.
          </p>
        </div>

        {/* Action Controls: Auto-Assign Toggle & Refresh Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Automatic Assignment Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 12px",
              borderRadius: "10px",
              background: autoAssignEnabled ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.04)",
              border: `1px solid ${autoAssignEnabled ? "rgba(16, 185, 129, 0.3)" : "var(--border-color, #1a2235)"}`,
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Zap size={14} color={autoAssignEnabled ? "#10B981" : "#64748B"} />
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: autoAssignEnabled ? "#10B981" : "#94A3B8"
                }}
              >
                Auto-Assign: {autoAssignEnabled ? "ON" : "OFF"}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={autoAssignEnabled}
              onClick={() => onToggleAutoAssign(!autoAssignEnabled)}
              style={{
                position: "relative",
                width: "36px",
                height: "20px",
                borderRadius: "10px",
                background: autoAssignEnabled ? "#10B981" : "#334155",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "background 0.2s ease"
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: autoAssignEnabled ? "18px" : "2px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  transition: "left 0.2s ease"
                }}
              />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: "var(--card-bg, #0d1220)",
              border: "1px solid var(--border-color, #232d42)",
              color: "var(--text-primary, #E2E8F0)",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: isRefreshing ? "not-allowed" : "pointer",
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#10B981";
              e.currentTarget.style.color = "#10B981";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-color, #232d42)";
              e.currentTarget.style.color = "var(--text-primary, #E2E8F0)";
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: isRefreshing ? "spin 1s linear infinite" : "none"
              }}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Bottom Filter Controls Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap"
        }}
      >
        {/* Search Request */}
        <div
          style={{
            position: "relative",
            flex: "1 1 240px",
            minWidth: "200px"
          }}
        >
          <Search
            size={15}
            color="#64748B"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)"
            }}
          />
          <input
            type="text"
            placeholder="Search request #ID, passenger, or location..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              borderRadius: "10px",
              border: "1px solid var(--border-color, #232d42)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "#F8FAFC",
              fontSize: "0.8rem",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        {/* Date Filter */}
        <div style={{ position: "relative", minWidth: "140px" }}>
          <select
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border-color, #232d42)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "#E2E8F0",
              fontSize: "0.8rem",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="all">Date: All Time</option>
            <option value="today">Date: Today</option>
            <option value="yesterday">Date: Yesterday</option>
            <option value="7days">Date: Last 7 Days</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ position: "relative", minWidth: "150px" }}>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border-color, #232d42)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "#E2E8F0",
              fontSize: "0.8rem",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="all">Status: All Statuses</option>
            <option value="searching">Status: Searching</option>
            <option value="unassigned">Status: Unassigned</option>
            <option value="assigned">Status: Assigned</option>
            <option value="arriving">Status: En Route</option>
            <option value="active">Status: Active Trips</option>
            <option value="completed">Status: Completed</option>
            <option value="cancelled">Status: Cancelled</option>
          </select>
        </div>

        {/* Rider Filter */}
        <div style={{ position: "relative", minWidth: "150px" }}>
          <select
            value={riderFilter}
            onChange={(e) => onRiderFilterChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border-color, #232d42)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "#E2E8F0",
              fontSize: "0.8rem",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="all">Rider: All Riders</option>
            <option value="assigned">Rider: Assigned Only</option>
            <option value="unassigned">Rider: Unassigned Only</option>
          </select>
        </div>
      </div>
    </div>
  );
}
