"use client";

import React, { useState, useMemo } from "react";
import {
  History,
  Search,
  Zap,
  User,
  ExternalLink,
  Clock,
  CheckCircle2,
  Bike,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { AssignmentHistoryRecord } from "./types";

export type AssignmentHistoryTableProps = {
  history: AssignmentHistoryRecord[];
  isLoading?: boolean;
  onViewDetails: (rideId: string) => void;
};

export function AssignmentHistoryTable({
  history,
  isLoading,
  onViewDetails
}: AssignmentHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<"ALL" | "AUTO" | "MANUAL">("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return history.filter((item) => {
      const matchSearch =
        searchTerm === "" ||
        item.rideId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.riderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.destinationAddress.toLowerCase().includes(searchTerm.toLowerCase());

      const matchMethod =
        methodFilter === "ALL" || item.assignmentMethod === methodFilter;

      return matchSearch && matchMethod;
    });
  }, [history, searchTerm, methodFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div
      style={{
        background: "var(--card-bg, #0d1220)",
        border: "1px solid var(--border-color, #1a2235)",
        borderRadius: "16px",
        overflow: "hidden",
        marginTop: "16px"
      }}
    >
      {/* Table Header Controls */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border-color, #1a2235)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <History size={18} color="#10B981" />
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 800,
              color: "#FFFFFF",
              margin: 0
            }}
          >
            Assignment Dispatch History
          </h3>
          <span
            style={{
              fontSize: "0.72rem",
              padding: "2px 8px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.06)",
              color: "#94A3B8",
              fontWeight: 700
            }}
          >
            {filtered.length} entries
          </span>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Method Filter */}
          <div style={{ display: "flex", background: "rgba(0, 0, 0, 0.3)", borderRadius: "8px", padding: "2px" }}>
            {(["ALL", "AUTO", "MANUAL"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMethodFilter(m);
                  setPage(1);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "none",
                  background: methodFilter === m ? "#10B981" : "transparent",
                  color: methodFilter === m ? "#FFFFFF" : "#94A3B8",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {m === "ALL" ? "All Methods" : m === "AUTO" ? "⚡ Auto" : "👤 Manual"}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div style={{ position: "relative", minWidth: "200px" }}>
            <Search
              size={13}
              color="#64748B"
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              style={{
                width: "100%",
                padding: "6px 10px 6px 30px",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #1a2235)",
                background: "rgba(15, 23, 42, 0.6)",
                color: "#FFFFFF",
                fontSize: "0.75rem",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
          <thead>
            <tr
              style={{
                background: "rgba(15, 23, 42, 0.4)",
                textAlign: "left",
                color: "#64748B",
                borderBottom: "1px solid var(--border-color, #1a2235)"
              }}
            >
              <th style={{ padding: "12px 16px" }}>Request ID</th>
              <th style={{ padding: "12px 16px" }}>Passenger</th>
              <th style={{ padding: "12px 16px" }}>Assigned Rider</th>
              <th style={{ padding: "12px 16px" }}>Pickup & Dropoff</th>
              <th style={{ padding: "12px 16px" }}>Method</th>
              <th style={{ padding: "12px 16px" }}>Time / Latency</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px" }}>Actor</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={{ padding: "32px", textAlign: "center", color: "#94A3B8" }}>
                  Loading dispatch history...
                </td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>
                  No assignment history records found.
                </td>
              </tr>
            ) : (
              pageItems.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                    transition: "background 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Request ID */}
                  <td style={{ padding: "12px 16px", fontWeight: 700, fontFamily: "monospace", color: "#10B981" }}>
                    #OG-{item.rideId.slice(-6).toUpperCase()}
                  </td>

                  {/* Passenger */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#F1F5F9" }}>{item.passengerName}</div>
                    <div style={{ fontSize: "0.68rem", color: "#64748B" }}>{item.passengerPhone}</div>
                  </td>

                  {/* Rider */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#E2E8F0" }}>{item.riderName}</div>
                    {item.riderPlate && (
                      <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>
                        🏍️ {item.riderPlate}
                      </div>
                    )}
                  </td>

                  {/* Route */}
                  <td style={{ padding: "12px 16px", maxWidth: "220px" }}>
                    <div
                      style={{
                        color: "#CBD5E1",
                        fontSize: "0.72rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                      title={item.pickupAddress}
                    >
                      🟢 {item.pickupAddress}
                    </div>
                    <div
                      style={{
                        color: "#94A3B8",
                        fontSize: "0.72rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginTop: "2px"
                      }}
                      title={item.destinationAddress}
                    >
                      🔴 {item.destinationAddress}
                    </div>
                  </td>

                  {/* Method badge */}
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        background:
                          item.assignmentMethod === "AUTO"
                            ? "rgba(16, 185, 129, 0.12)"
                            : "rgba(139, 92, 246, 0.12)",
                        color:
                          item.assignmentMethod === "AUTO"
                            ? "#10B981"
                            : "#A78BFA",
                        border: `1px solid ${
                          item.assignmentMethod === "AUTO"
                            ? "rgba(16, 185, 129, 0.3)"
                            : "rgba(139, 92, 246, 0.3)"
                        }`
                      }}
                    >
                      {item.assignmentMethod === "AUTO" ? <Zap size={11} /> : <User size={11} />}
                      {item.assignmentMethod}
                    </span>
                  </td>

                  {/* Time & Response Time */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ color: "#E2E8F0", fontSize: "0.72rem" }}>
                      {new Intl.DateTimeFormat("en-GH", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      }).format(new Date(item.assignmentTime))}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: item.responseTimeSec > 60 ? "#F59E0B" : "#10B981" }}>
                      ⚡ {item.responseTimeSec}s response
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={item.status} size="sm" />
                  </td>

                  {/* Admin / Actor */}
                  <td style={{ padding: "12px 16px", color: "#94A3B8", fontSize: "0.72rem" }}>
                    {item.adminName}
                  </td>

                  {/* Action */}
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => onViewDetails(item.rideId)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--border-color, #1a2235)",
                        color: "#E2E8F0",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      <ExternalLink size={11} />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border-color, #1a2235)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "#64748B" }}>
            Showing page {page} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: "5px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border-color, #1a2235)",
                background: "rgba(255, 255, 255, 0.04)",
                color: page <= 1 ? "#475569" : "#E2E8F0",
                cursor: page <= 1 ? "not-allowed" : "pointer"
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: "5px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border-color, #1a2235)",
                background: "rgba(255, 255, 255, 0.04)",
                color: page >= totalPages ? "#475569" : "#E2E8F0",
                cursor: page >= totalPages ? "not-allowed" : "pointer"
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
