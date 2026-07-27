"use client";

import { useState, useMemo } from "react";
import { OperationsMap } from "@/components/maps/operations-map";
import { EmptyCard } from "./EmptyCard";
import { SkeletonKPI, SkeletonCard, SkeletonTable } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import type { RiderFinancialRow } from "./types";
import { parseNumber } from "./utils";
import { useAdminToast } from "./AdminToast";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import {
  MapPin,
  Wifi,
  Navigation,
  Users,
  Activity,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  Zap,
  Clock,
  X,
} from "lucide-react";

export type RiderActivityScreenProps = {
  activityRows: RiderFinancialRow[];
  ridersWithCoords: {
    id: string;
    user: { fullName: string };
    currentLatitude: string | number | null;
    currentLongitude: string | number | null;
    city: string | null;
    serviceZone: { name: string } | null;
    onlineStatus: boolean;
  }[];
  activeRidersCount: number;
  ridersWithCoordsCount: number;
  activeTripsCount: number;
  dataLoading?: boolean;
};

const ITEMS_PER_PAGE = 8;

const tabs = ["Live Map", "Rider Activity Feed", "Geofence Zones", "Heatmap"] as const;
type Tab = (typeof tabs)[number];

const quickFilters = ["All", "Online", "On Trip", "Idle"] as const;

const D = {
  bg: "var(--bg-primary)",
  surface: "var(--bg-card)",
  surfaceAlt: "var(--bg-card)",
  surfaceHover: "color-mix(in srgb, var(--bg-card) 90%, var(--text-primary))",
  border: "var(--border-color)",
  borderLight: "var(--border-color)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textMuted: "var(--text-muted)",
  green: "#22c55e",
  greenBg: "#0f3d1a",
  greenBorder: "#166534",
  yellow: "#eab308",
  yellowBg: "#3d2e0f",
  yellowBorder: "#854d0e",
  blue: "#3b82f6",
  blueBg: "#1e3a5f",
  blueBorder: "#1e40af",
  red: "#ef4444",
  redBg: "#3d0f0f",
  cyan: "#06b6d4",
  cyanBg: "#0c3547",
  orange: "#f97316",
  orangeBg: "#3d250f",
};

const cardBase: React.CSSProperties = {
  background: D.surface,
  border: `1px solid ${D.border}`,
  borderRadius: 12,
  overflow: "hidden",
};

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "8px 16px",
  borderRadius: 8,
  border: `1px solid ${D.border}`,
  background: D.surfaceAlt,
  color: D.textPrimary,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
};

export function RiderActivityScreen({
  activityRows,
  ridersWithCoords,
  activeRidersCount,
  ridersWithCoordsCount,
  activeTripsCount,
  dataLoading = false,
}: RiderActivityScreenProps) {
  const { addToast } = useAdminToast();
  const { isMobile, isTablet } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<Tab>("Live Map");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRider, setSelectedRider] = useState<RiderFinancialRow | null>(null);

  const filteredRows = useMemo(() => {
    let rows = activityRows;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.rider.user.fullName.toLowerCase().includes(q) ||
          r.rider.displayCode.toLowerCase().includes(q) ||
          (r.rider.city ?? "").toLowerCase().includes(q)
      );
    }
    if (quickFilter === "Online") rows = rows.filter((r) => r.rider.onlineStatus);
    if (quickFilter === "Offline") rows = rows.filter((r) => !r.rider.onlineStatus);
    if (quickFilter === "On Trip") rows = rows.filter((r) => r.activeCount > 0);
    if (quickFilter === "Idle") rows = rows.filter((r) => r.rider.onlineStatus && r.activeCount === 0);
    return rows;
  }, [activityRows, searchQuery, quickFilter]);

  const timelineEvents = useMemo(() => {
    const events: { id: string; rider: string; action: string; time: string; color: string }[] = [];
    activityRows.slice(0, 20).forEach((r) => {
      if (r.activeCount > 0) {
        events.push({
          id: r.rider.id + "-active",
          rider: r.rider.user.fullName,
          action: `Has ${r.activeCount} active trip${r.activeCount > 1 ? "s" : ""}`,
          time: "Now",
          color: D.green,
        });
      }
      if (r.completedCount > 0) {
        events.push({
          id: r.rider.id + "-completed",
          rider: r.rider.user.fullName,
          action: `Completed ${r.completedCount} trip${r.completedCount > 1 ? "s" : ""} today`,
          time: "Today",
          color: D.blue,
        });
      }
    });
    return events.slice(0, 15);
  }, [activityRows]);

  if (dataLoading) {
    return (
      <div style={{ padding: "24px 28px", minHeight: "100vh", display: "flex", flexDirection: "column", gap: 20 }}>
        <SkeletonKPI count={4} />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 16 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, height: 300 }} />
          <SkeletonCard lines={5} />
        </div>
        <SkeletonTable rows={5} cols={5} />
      </div>
    );
  }

  const mapMarkers = ridersWithCoords.map((rider) => ({
    id: rider.id,
    position: [parseNumber(rider.currentLatitude), parseNumber(rider.currentLongitude)] as [number, number],
    label: rider.user.fullName,
    variant: "driver" as const,
  }));

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = filteredRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const kpis = [
    {
      label: "Online Riders",
      value: activeRidersCount,
      sub: "Currently dispatching",
      icon: <Wifi size={20} />,
      color: D.green,
      bg: D.greenBg,
      border: D.greenBorder,
    },
    {
      label: "GPS Located",
      value: ridersWithCoordsCount,
      sub: "With live coordinates",
      icon: <MapPin size={20} />,
      color: D.yellow,
      bg: D.yellowBg,
      border: D.yellowBorder,
    },
    {
      label: "Active Trips",
      value: activeTripsCount,
      sub: "In motion now",
      icon: <Navigation size={20} />,
      color: D.blue,
      bg: D.blueBg,
      border: D.blueBorder,
    },
    {
      label: "Total Riders",
      value: activityRows.length,
      sub: "All registered",
      icon: <Users size={20} />,
      color: D.cyan,
      bg: D.cyanBg,
      border: D.cyan,
    },
    {
      label: "Total Activity",
      value: activityRows.reduce((s, r) => s + r.rideCount, 0),
      sub: "Lifetime trips",
      icon: <Activity size={20} />,
      color: D.orange,
      bg: D.orangeBg,
      border: D.orange,
    },
  ];

  return (
    <div className="exact-admin-screen" style={{ background: D.bg, minHeight: "100vh", padding: isMobile ? "0 12px" : 24, color: D.textPrimary, fontFamily: "var(--font-family)" }}>
      <div style={{ maxWidth: isMobile ? "100%" : 1400, margin: "0 auto" }}>
        <AdminPageHeader
          title="Activity Tracking"
          subtitle="Track online state, location availability, zone coverage, and active trip load."
        />

        {/* KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(auto-fit, minmax(160px, 1fr))" : "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              style={{
                ...cardBase,
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "default",
                transition: "border-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = kpi.border)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = D.border)}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: kpi.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: kpi.color,
                  flexShrink: 0,
                }}
              >
                {kpi.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, color: D.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: D.textMuted }}>{kpi.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: D.surface,
            border: `1px solid ${D.border}`,
            borderRadius: 10,
            padding: 4,
            marginBottom: 20,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                addToast(`Switched to ${tab}`, "info");
              }}
              style={{
                ...btnBase,
                background: activeTab === tab ? D.surfaceHover : "transparent",
                border: "none",
                color: activeTab === tab ? D.textPrimary : D.textMuted,
                fontWeight: activeTab === tab ? 600 : 400,
                padding: "8px 16px",
                borderRadius: 8,
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) e.currentTarget.style.color = D.textSecondary;
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) e.currentTarget.style.color = D.textMuted;
              }}
            >
              {tab === "Live Map" && <MapPin size={14} />}
              {tab === "Rider Activity Feed" && <Activity size={14} />}
              {tab === "Geofence Zones" && <Layers size={14} />}
              {tab === "Heatmap" && <Zap size={14} />}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "Live Map" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : selectedRider ? "1fr 380px" : "1fr", gap: 16 }}>
            {/* Map + Quick Filters */}
            <div>
              {/* Quick Filters */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {quickFilters.map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setQuickFilter(f);
                      setCurrentPage(1);
                      addToast(`Filter: ${f}`, "info");
                    }}
                    style={{
                      ...btnBase,
                      padding: "6px 14px",
                      fontSize: 12,
                      background: quickFilter === f ? D.blueBg : D.surfaceAlt,
                      border: `1px solid ${quickFilter === f ? D.blue : D.border}`,
                      color: quickFilter === f ? D.blue : D.textSecondary,
                    }}
                    onMouseEnter={(e) => {
                      if (quickFilter !== f) {
                        e.currentTarget.style.background = D.surfaceHover;
                        e.currentTarget.style.borderColor = D.borderLight;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (quickFilter !== f) {
                        e.currentTarget.style.background = D.surfaceAlt;
                        e.currentTarget.style.borderColor = D.border;
                      }
                    }}
                  >
                    {f === "Online" && <Wifi size={12} />}
                    {f === "On Trip" && <Navigation size={12} />}
                    {f === "Idle" && <Clock size={12} />}
                    {f}
                  </button>
                ))}
              </div>

              {/* Map Card */}
              <div style={cardBase}>
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: `1px solid ${D.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Live Activity Map</div>
                    <div style={{ fontSize: 12, color: D.textMuted, marginTop: 2 }}>
                      {ridersWithCoordsCount} riders with GPS coordinates
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      style={{ ...btnBase, padding: "6px 10px", fontSize: 11 }}
                      onClick={() => addToast("Refreshing map data...", "info")}
                      onMouseEnter={(e) => (e.currentTarget.style.background = D.surfaceHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = D.surfaceAlt)}
                    >
                      <Eye size={12} /> Refresh
                    </button>
                  </div>
                </div>
                <div style={{ height: 420, position: "relative" }}>
                  <OperationsMap
                    center={mapMarkers[0]?.position ?? [5.6037, -0.187]}
                    zoom={mapMarkers.length > 0 ? 11 : 6}
                    markers={mapMarkers}
                    emptyTitle="No riders with live coordinates."
                    emptyDescription="Riders appear on the map when they enable GPS and go online."
                  />
                </div>
              </div>

              {/* Legend */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  padding: "10px 0",
                  fontSize: 12,
                  color: D.textMuted,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: D.green,
                      display: "inline-block",
                    }}
                  />{" "}
                  Online
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: D.yellow,
                      display: "inline-block",
                    }}
                  />{" "}
                  On Trip
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: D.textMuted,
                      display: "inline-block",
                    }}
                  />{" "}
                  Idle / Offline
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: D.red,
                      display: "inline-block",
                    }}
                  />{" "}
                  Alert
                </div>
              </div>
            </div>

            {/* Selected Rider Panel */}
            {selectedRider && (
              <div style={cardBase}>
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: `1px solid ${D.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Rider Detail</div>
                  <button
                    onClick={() => {
                      setSelectedRider(null);
                      addToast("Panel closed", "info");
                    }}
                    style={{
                      ...btnBase,
                      padding: "4px 8px",
                      fontSize: 11,
                      background: "transparent",
                      border: "none",
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div style={{ padding: 18 }}>
                  {/* Rider avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: D.surfaceHover,
                        border: `2px solid ${selectedRider.rider.onlineStatus ? D.green : D.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 700,
                        color: D.textPrimary,
                      }}
                    >
                      {selectedRider.rider.user.fullName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{selectedRider.rider.user.fullName}</div>
                      <div style={{ fontSize: 12, color: D.textMuted }}>{selectedRider.rider.displayCode}</div>
                    </div>
                    <div
                      style={{
                        marginLeft: "auto",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                        background: selectedRider.rider.onlineStatus ? D.greenBg : D.surfaceHover,
                        color: selectedRider.rider.onlineStatus ? D.green : D.textMuted,
                        border: `1px solid ${selectedRider.rider.onlineStatus ? D.greenBorder : D.border}`,
                      }}
                    >
                      {selectedRider.rider.onlineStatus ? "Online" : "Offline"}
                    </div>
                  </div>

                  {/* Info grid */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    {[
                      { label: "City", value: selectedRider.rider.city ?? "N/A" },
                      { label: "Zone", value: selectedRider.rider.serviceZone?.name ?? "N/A" },
                      { label: "Active Trips", value: selectedRider.activeCount },
                      { label: "Completed", value: selectedRider.completedCount },
                      { label: "Revenue", value: `$${selectedRider.revenue.toFixed(2)}` },
                      { label: "Earnings", value: `$${selectedRider.earnings.toFixed(2)}` },
                      { label: "Rating", value: `${selectedRider.averageRating.toFixed(1)} (${selectedRider.ratingCount})` },
                      { label: "Payouts", value: `$${selectedRider.payoutTotal.toFixed(2)}` },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          background: D.surfaceAlt,
                          borderRadius: 8,
                          padding: "10px 12px",
                          border: `1px solid ${D.border}`,
                        }}
                      >
                        <div style={{ fontSize: 10, color: D.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      style={{ ...btnBase, background: D.blueBg, border: `1px solid ${D.blueBorder}`, color: D.blue, flex: 1 }}
                      onClick={() => addToast(`Viewing trip history for ${selectedRider.rider.user.fullName}`, "info")}
                      onMouseEnter={(e) => (e.currentTarget.style.background = D.blueBg)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = D.blueBg)}
                    >
                      <Eye size={13} /> Trip History
                    </button>
                    <button
                      style={{ ...btnBase, background: D.greenBg, border: `1px solid ${D.greenBorder}`, color: D.green, flex: 1 }}
                      onClick={() => addToast(`Contacting ${selectedRider.rider.user.fullName}...`, "success")}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#14532d")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = D.greenBg)}
                    >
                      <Wifi size={13} /> Contact
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Rider Activity Feed" && (
          <div style={cardBase}>
            {/* Search + Filter Bar */}
            <div
              style={{
                padding: "14px 18px",
                borderBottom: `1px solid ${D.border}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 200,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Search
                  size={14}
                  style={{ position: "absolute", left: 12, color: D.textMuted, pointerEvents: "none" }}
                />
                <input
                  type="text"
                  placeholder="Search riders by name, code, or city..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 34px",
                    borderRadius: 8,
                    border: `1px solid ${D.border}`,
                    background: D.surfaceAlt,
                    color: D.textPrimary,
                    fontSize: 13,
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = D.blue)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = D.border)}
                />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {quickFilters.map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setQuickFilter(f);
                      setCurrentPage(1);
                    }}
                    style={{
                      ...btnBase,
                      padding: "6px 12px",
                      fontSize: 12,
                      background: quickFilter === f ? D.blueBg : D.surfaceAlt,
                      border: `1px solid ${quickFilter === f ? D.blue : D.border}`,
                      color: quickFilter === f ? D.blue : D.textSecondary,
                    }}
                    onMouseEnter={(e) => {
                      if (quickFilter !== f) e.currentTarget.style.background = D.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      if (quickFilter !== f) e.currentTarget.style.background = D.surfaceAlt;
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {filteredRows.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center" }}>
                <EmptyCard title="No riders found." body="Try adjusting your search or filters." />
              </div>
            ) : (
              <>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                        {["Rider", "Status", "Location", "Active", "Completed", "Revenue", "Rating", "Action"].map(
                          (h) => (
                            <th
                              key={h}
                              style={{
                                padding: "12px 16px",
                                textAlign: "left",
                                fontSize: 11,
                                fontWeight: 600,
                                color: D.textMuted,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row, idx) => (
                        <tr
                          key={row.rider.id}
                          onClick={() => {
                            setSelectedRider(row);
                            addToast(`Selected ${row.rider.user.fullName}`, "info");
                          }}
                          style={{
                            borderBottom: `1px solid ${D.border}`,
                            background: selectedRider?.rider.id === row.rider.id ? D.surfaceHover : "transparent",
                            cursor: "pointer",
                            transition: "background 0.1s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = D.surfaceHover)}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              selectedRider?.rider.id === row.rider.id ? D.surfaceHover : "transparent";
                          }}
                        >
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  background: D.surfaceHover,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: D.textPrimary,
                                  border: `1px solid ${D.border}`,
                                }}
                              >
                                {row.rider.user.fullName.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: D.textPrimary }}>{row.rider.user.fullName}</div>
                                <div style={{ fontSize: 11, color: D.textMuted }}>{row.rider.displayCode}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                background: row.rider.onlineStatus ? D.greenBg : D.surfaceHover,
                                color: row.rider.onlineStatus ? D.green : D.textMuted,
                                border: `1px solid ${row.rider.onlineStatus ? D.greenBorder : D.border}`,
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: row.rider.onlineStatus ? D.green : D.textMuted,
                                }}
                              />
                              {row.rider.onlineStatus ? "Online" : "Offline"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: D.textSecondary, whiteSpace: "nowrap" }}>
                            {row.rider.city ?? row.rider.serviceZone?.name ?? "N/A"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                background: row.activeCount > 0 ? D.greenBg : D.surfaceAlt,
                                color: row.activeCount > 0 ? D.green : D.textMuted,
                              }}
                            >
                              {row.activeCount}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: D.textSecondary, fontWeight: 500 }}>
                            {row.completedCount}
                          </td>
                          <td style={{ padding: "12px 16px", color: D.textPrimary, fontWeight: 600 }}>
                            ${row.revenue.toFixed(2)}
                          </td>
                          <td style={{ padding: "12px 16px", color: D.yellow, fontWeight: 600 }}>
                            {row.averageRating.toFixed(1)}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRider(row);
                                addToast(`Viewing ${row.rider.user.fullName}`, "info");
                              }}
                              style={{
                                ...btnBase,
                                padding: "5px 10px",
                                fontSize: 11,
                                background: D.blueBg,
                                border: `1px solid ${D.blueBorder}`,
                                color: D.blue,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#1e40af")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = D.blueBg)}
                            >
                              <Eye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div
                  style={{
                    padding: "12px 18px",
                    borderTop: `1px solid ${D.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: D.textMuted,
                  }}
                >
                  <span>
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredRows.length)} of {filteredRows.length}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      style={{
                        ...btnBase,
                        padding: "5px 8px",
                        fontSize: 12,
                        opacity: currentPage === 1 ? 0.4 : 1,
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        style={{
                          ...btnBase,
                          padding: "5px 10px",
                          fontSize: 12,
                          background: currentPage === pg ? D.blue : D.surfaceAlt,
                          color: currentPage === pg ? "#fff" : D.textSecondary,
                          border: `1px solid ${currentPage === pg ? D.blue : D.border}`,
                        }}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      style={{
                        ...btnBase,
                        padding: "5px 8px",
                        fontSize: 12,
                        opacity: currentPage === totalPages ? 0.4 : 1,
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "Geofence Zones" && (
          <div style={cardBase}>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Geofence Zones</div>
              <div style={{ fontSize: 12, color: D.textMuted, marginBottom: 16 }}>
                View and manage geofenced service zones for rider tracking.
              </div>
              <div
                style={{
                  height: 300,
                  background: D.surfaceAlt,
                  borderRadius: 10,
                  border: `1px solid ${D.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: D.textMuted,
                  fontSize: 13,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <Layers size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                  <div>Geofence zone management coming soon.</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>
                    Define zones to auto-assign riders and track area coverage.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Heatmap" && (
          <div style={cardBase}>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Trip Heatmap</div>
              <div style={{ fontSize: 12, color: D.textMuted, marginBottom: 16 }}>
                Visual density of completed trips across zones.
              </div>
              <div
                style={{
                  height: 300,
                  background: D.surfaceAlt,
                  borderRadius: 10,
                  border: `1px solid ${D.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: D.textMuted,
                  fontSize: 13,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <Zap size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                  <div>Heatmap visualization coming soon.</div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>
                    Analyze trip density to optimize zone allocation and rider positioning.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div style={{ ...cardBase, marginTop: 20 }}>
          <div
            style={{
              padding: "14px 18px",
              borderBottom: `1px solid ${D.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Activity Timeline</div>
              <div style={{ fontSize: 12, color: D.textMuted, marginTop: 2 }}>
                Recent rider activity and trip events.
              </div>
            </div>
            <button
              style={{ ...btnBase, padding: "5px 10px", fontSize: 11 }}
              onClick={() => addToast("Timeline refreshed", "success")}
              onMouseEnter={(e) => (e.currentTarget.style.background = D.surfaceHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = D.surfaceAlt)}
            >
              <Activity size={12} /> Refresh
            </button>
          </div>
          {timelineEvents.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: D.textMuted, fontSize: 13 }}>
              No recent activity.
            </div>
          ) : (
            <div style={{ padding: "8px 18px" }}>
              {timelineEvents.map((evt, i) => (
                <div
                  key={evt.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: i < timelineEvents.length - 1 ? `1px solid ${D.border}` : "none",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: evt.color,
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: D.textPrimary }}>
                      <strong>{evt.rider}</strong>{" "}
                      <span style={{ color: D.textSecondary }}>{evt.action}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: D.textMuted, whiteSpace: "nowrap" }}>{evt.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
