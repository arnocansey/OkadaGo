"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Clock,
  CheckCircle2,
  Circle,
  MapPin,
  Bike,
  User,
  Activity,
  Calendar,
  AlertCircle
} from "lucide-react";
import { requestJson } from "@/lib/api";
import { QK } from "../adminQueryKeys";
import { StatusBadge } from "./StatusBadge";
import type { RideTimelineData } from "./types";

export type RequestTimelineModalProps = {
  isOpen: boolean;
  onClose: () => void;
  rideId: string | null;
  token?: string;
  adminCurrency?: string;
};

function formatEventDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function RequestTimelineModal({
  isOpen,
  onClose,
  rideId,
  token,
  adminCurrency = "GHS"
}: RequestTimelineModalProps) {
  const { data: timelineData, isPending } = useQuery<RideTimelineData>({
    queryKey: QK.rideTimeline(rideId ?? ""),
    queryFn: () => requestJson(`/admin/rides/${rideId}/timeline`, { token }),
    enabled: isOpen && !!rideId && !!token,
    staleTime: 5000
  });

  if (!isOpen || !rideId) return null;

  const shortId = `#OG-${rideId.slice(-6).toUpperCase()}`;

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

      {/* Modal Dialog */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "92%",
          maxWidth: "680px",
          maxHeight: "88vh",
          background: "var(--card-bg, #0d1220)",
          border: "1px solid var(--border-color, #1a2235)",
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          zIndex: 10001,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
          overflow: "hidden",
          animation: "scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)"
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
            background: "rgba(15, 23, 42, 0.6)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.85rem",
                fontWeight: 800,
                color: "#10B981",
                background: "rgba(16, 185, 129, 0.12)",
                padding: "3px 8px",
                borderRadius: "6px"
              }}
            >
              {shortId}
            </span>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#FFFFFF",
                margin: 0
              }}
            >
              Ride Lifecycle & Timeline
            </h3>
            {timelineData?.status && <StatusBadge status={timelineData.status} size="sm" />}
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

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}
        >
          {isPending ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "20px" }}>
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  style={{
                    height: "40px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.04)",
                    animation: "pulse 1.5s infinite"
                  }}
                />
              ))}
            </div>
          ) : !timelineData ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#94A3B8" }}>
              Unable to load ride timeline.
            </div>
          ) : (
            <>
              {/* Route & Passenger/Rider Summary */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "12px",
                  background: "rgba(15, 23, 42, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "14px",
                  padding: "16px"
                }}
              >
                <div>
                  <span style={{ fontSize: "0.68rem", color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
                    Passenger
                  </span>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#F8FAFC", marginTop: "2px" }}>
                    {timelineData.passenger?.name || "Passenger"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                    {timelineData.passenger?.phone || "—"}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.68rem", color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
                    Assigned Rider
                  </span>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#10B981", marginTop: "2px" }}>
                    {timelineData.rider?.name || "Unassigned"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                    {timelineData.rider ? `${timelineData.rider.model || "Motorcycle"} · ${timelineData.rider.plate || ""}` : "Awaiting assignment"}
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <div style={{ fontSize: "0.78rem", color: "#CBD5E1", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
                    <strong>Pickup:</strong> {timelineData.pickupAddress}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#CBD5E1", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "2px", background: "#EF4444" }} />
                    <strong>Dropoff:</strong> {timelineData.destinationAddress}
                  </div>
                </div>
              </div>

              {/* 8-Stage Visual Timeline */}
              <div>
                <h4
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#94A3B8",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    margin: "0 0 14px 0"
                  }}
                >
                  8-Stage Dispatch Lifecycle
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {timelineData.stages.map((stage, idx) => {
                    const isLast = idx === timelineData.stages.length - 1;
                    return (
                      <div
                        key={stage.key}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "14px",
                          position: "relative",
                          paddingBottom: isLast ? "0" : "18px"
                        }}
                      >
                        {/* Connecting vertical line */}
                        {!isLast && (
                          <div
                            style={{
                              position: "absolute",
                              left: "11px",
                              top: "22px",
                              bottom: "0",
                              width: "2px",
                              background: stage.completed
                                ? "rgba(16, 185, 129, 0.4)"
                                : "rgba(255, 255, 255, 0.08)"
                            }}
                          />
                        )}

                        {/* Stage circle icon */}
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: stage.completed
                              ? "#10B981"
                              : "rgba(255, 255, 255, 0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: stage.completed ? "#FFFFFF" : "#64748B",
                            zIndex: 2,
                            flexShrink: 0
                          }}
                        >
                          {stage.completed ? <CheckCircle2 size={14} /> : <Circle size={10} />}
                        </div>

                        {/* Stage Content */}
                        <div style={{ flex: 1, minWidth: 0, marginTop: "2px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: stage.completed ? 700 : 500,
                                color: stage.completed ? "#F8FAFC" : "#64748B"
                              }}
                            >
                              {stage.label}
                            </span>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                color: stage.completed ? "#10B981" : "#64748B",
                                fontFamily: "monospace"
                              }}
                            >
                              {formatEventDate(stage.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Granular Audit Event Logs */}
              {timelineData.events && timelineData.events.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  <h4
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      margin: "0 0 10px 0"
                    }}
                  >
                    Granular Audit Log ({timelineData.events.length})
                  </h4>

                  <div
                    style={{
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: "rgba(0, 0, 0, 0.2)"
                    }}
                  >
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
                      <thead>
                        <tr style={{ background: "rgba(255, 255, 255, 0.03)", textAlign: "left", color: "#64748B" }}>
                          <th style={{ padding: "8px 12px" }}>Event</th>
                          <th style={{ padding: "8px 12px" }}>Details</th>
                          <th style={{ padding: "8px 12px", textAlign: "right" }}>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timelineData.events.map((evt) => {
                          const payloadObj =
                            evt.payload && typeof evt.payload === "object"
                              ? (evt.payload as Record<string, unknown>)
                              : {};
                          const actor = (payloadObj.actorName as string) || (payloadObj.method as string) || "System";
                          return (
                            <tr
                              key={evt.id}
                              style={{
                                borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                                color: "#CBD5E1"
                              }}
                            >
                              <td style={{ padding: "8px 12px", fontWeight: 700, color: "#10B981" }}>
                                {evt.eventType}
                              </td>
                              <td style={{ padding: "8px 12px" }}>
                                Actor: {actor}
                                {payloadObj.reason ? ` · Reason: ${String(payloadObj.reason)}` : ""}
                              </td>
                              <td style={{ padding: "8px 12px", textAlign: "right", color: "#64748B" }}>
                                {formatEventDate(evt.createdAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
