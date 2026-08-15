"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { OperationsMap } from "@/components/maps/operations-map";
import { EmptyCard } from "./EmptyCard";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminPageHeader } from "./ui/AdminPageHeader";
import { AdminKpiRow } from "./ui/AdminKpiRow";
import type { RiderFinancialRow } from "./types";
import { parseNumber, ACCRA_MAP_CENTER, ACCRA_MAP_ZOOM_CITY, ACCRA_MAP_ZOOM_METRO } from "./utils";
import { useAdminToast } from "./AdminToast";
import { useBreakpoint } from "../../../hooks/use-breakpoint";
import { apiUrl } from "@/lib/api";
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
  History,
} from "lucide-react";

export type RiderActivityMapMarker = {
  id: string;
  position: [number, number];
  label: string;
  variant?:
    | "driver"
    | "driverOnline"
    | "driverTrip"
    | "driverIdle"
    | "passenger"
    | "pickup"
    | "destination";
};

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
  /** Prefer live SSE markers when available (full online fleet, not page sample). */
  mapMarkers?: RiderActivityMapMarker[];
  /** Rider display names currently on an active ride (for On Trip / Idle filters). */
  activeTripRiderNames?: string[];
  activeRidersCount: number;
  ridersWithCoordsCount: number;
  activeTripsCount: number;
  dataLoading?: boolean;
};

const ITEMS_PER_PAGE = 8;

const tabs = ["Live Map", "Rider Activity Feed", "Status History", "Geofence Zones", "Heatmap"] as const;
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
  yellow: "var(--accent-yellow)",
  yellowBg: "var(--accent-yellow-light)",
  yellowBorder: "var(--accent-yellow)",
  blue: "var(--accent-orange)",
  blueBg: "color-mix(in srgb, var(--accent-orange) 18%, transparent)",
  blueBorder: "var(--accent-orange)",
  red: "#ef4444",
  redBg: "#3d0f0f",
  cyan: "var(--accent-orange)",
  cyanBg: "color-mix(in srgb, var(--accent-orange) 18%, transparent)",
  orange: "var(--accent-orange)",
  orangeBg: "color-mix(in srgb, var(--accent-orange) 18%, transparent)",
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
  mapMarkers: liveMapMarkers,
  activeTripRiderNames = [],
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
  const [onlineLog, setOnlineLog] = useState<Array<{
    id: string;
    status: boolean;
    latitude: string | number | null;
    longitude: string | number | null;
    isMocked: boolean;
    createdAt: string;
    riderProfile: { id: string; user: { fullName: string }; displayCode: string };
  }>>([]);
  const [onlineLogLoading, setOnlineLogLoading] = useState(false);
  const [onlineLogFilter, setOnlineLogFilter] = useState<"all" | "online" | "offline">("all");

  const fetchOnlineLog = useCallback(async () => {
    setOnlineLogLoading(true);
    try {
      const res = await fetch(apiUrl("/admin/riders/online-log?limit=100"));
      if (res.ok) {
        const data = await res.json();
        setOnlineLog(data.logs ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setOnlineLogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "Status History") {
      fetchOnlineLog();
    }
  }, [activeTab, fetchOnlineLog]);

  const filteredOnlineLog = useMemo(() => {
    if (onlineLogFilter === "all") return onlineLog;
    return onlineLog.filter((log) =>
      onlineLogFilter === "online" ? log.status : !log.status
    );
  }, [onlineLog, onlineLogFilter]);

  const onTripNames = useMemo(() => {
    const names = new Set(activeTripRiderNames);
    for (const row of activityRows) {
      if (row.activeCount > 0) names.add(row.rider.user.fullName);
    }
    return names;
  }, [activityRows, activeTripRiderNames]);

  const activityById = useMemo(() => {
    const map = new Map(activityRows.map((row) => [row.rider.id, row]));
    return map;
  }, [activityRows]);

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
    if (quickFilter === "Online") {
      rows = rows.filter((r) => r.rider.onlineStatus || onTripNames.has(r.rider.user.fullName));
    }
    if (quickFilter === "Offline") rows = rows.filter((r) => !r.rider.onlineStatus);
    if (quickFilter === "On Trip") {
      rows = rows.filter((r) => r.activeCount > 0 || onTripNames.has(r.rider.user.fullName));
    }
    if (quickFilter === "Idle") {
      rows = rows.filter(
        (r) => r.rider.onlineStatus && r.activeCount === 0 && !onTripNames.has(r.rider.user.fullName)
      );
    }
    return rows;
  }, [activityRows, searchQuery, quickFilter, onTripNames]);

  const mapMarkers = useMemo((): RiderActivityMapMarker[] => {
    const fromLive = Boolean(liveMapMarkers && liveMapMarkers.length > 0);
    const base: RiderActivityMapMarker[] = fromLive
      ? liveMapMarkers!
      : ridersWithCoords.flatMap((rider) => {
          const lat = parseNumber(rider.currentLatitude);
          const lng = parseNumber(rider.currentLongitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
            return [];
          }
          return [
            {
              id: rider.id,
              position: [lat, lng] as [number, number],
              label: rider.user.fullName,
              variant: "driver" as const
            }
          ];
        });

    return base.flatMap((marker) => {
      const row = activityById.get(marker.id);
      const onTrip = (row?.activeCount ?? 0) > 0 || onTripNames.has(marker.label);
      const online = fromLive
        ? true
        : Boolean(row?.rider.onlineStatus ?? ridersWithCoords.find((r) => r.id === marker.id)?.onlineStatus);

      if (quickFilter === "Online" && !online && !onTrip) return [];
      if (quickFilter === "On Trip" && !onTrip) return [];
      if (quickFilter === "Idle" && !(online && !onTrip)) return [];

      const variant = onTrip
        ? ("driverTrip" as const)
        : online
          ? ("driverOnline" as const)
          : ("driverIdle" as const);

      return [{ ...marker, variant }];
    });
  }, [
    liveMapMarkers,
    ridersWithCoords,
    activityById,
    onTripNames,
    quickFilter
  ]);

  const timelineEvents = useMemo(() => {
    const events: { id: string; rider: string; action: string; time: string; color: string }[] = [];
    activityRows.slice(0, 20).forEach((r) => {
      if (r.activeCount > 0 || onTripNames.has(r.rider.user.fullName)) {
        events.push({
          id: r.rider.id + "-active",
          rider: r.rider.user.fullName,
          action: `Has ${Math.max(r.activeCount, 1)} active trip${r.activeCount > 1 ? "s" : ""}`,
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
  }, [activityRows, onTripNames]);

  if (dataLoading) {
    return <AdminPageSkeleton variant="split" kpis={4} rows={5} cols={5} />;
  }

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = filteredRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="exact-admin-screen">
        <AdminPageHeader
          title="Live Monitoring"
          subtitle="Real-time GPS and online rider status across Accra service zones."
        />

        <AdminKpiRow
          items={[
            { label: "Online Riders", value: activeRidersCount, hint: "Currently dispatching", icon: <Wifi size={18} />, tone: "green" },
            { label: "GPS Located", value: ridersWithCoordsCount, hint: "With live coordinates", icon: <MapPin size={18} />, tone: "yellow" },
            { label: "Active Trips", value: activeTripsCount, hint: "In motion now", icon: <Navigation size={18} />, tone: "yellow" },
            { label: "Total Riders", value: activityRows.length, hint: "All registered", icon: <Users size={18} />, tone: "neutral" },
            { label: "Total Activity", value: activityRows.reduce((s, r) => s + r.rideCount, 0), hint: "Lifetime trips", icon: <Activity size={18} />, tone: "yellow" },
          ]}
        />

        <div className="admin-tabs" style={{ marginBottom: 20, overflowX: "auto" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-tab${activeTab === tab ? " active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                addToast(`Switched to ${tab}`, "info");
              }}
            >
              {tab === "Live Map" && <MapPin size={13} />}
              {tab === "Rider Activity Feed" && <Activity size={13} />}
              {tab === "Status History" && <History size={13} />}
              {tab === "Geofence Zones" && <Layers size={13} />}
              {tab === "Heatmap" && <Zap size={13} />}
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
                      {mapMarkers.length} shown
                      {quickFilter !== "All" ? ` · ${quickFilter}` : ""}
                      {" · "}
                      {ridersWithCoordsCount} GPS total
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      style={{ ...btnBase, padding: "6px 10px", fontSize: 11 }}
                      onClick={() => addToast("Refreshing map data...", "info")}
                      onMouseEnter={(e) => (e.currentTarget.style.background = D.surfaceHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = D.surfaceAlt)}
                    >
                      <Eye size={13} /> Refresh
                    </button>
                  </div>
                </div>
                <div style={{ height: 420, position: "relative" }}>
                  <OperationsMap
                    basemap="auto"
                    emptyPlacement="bottom"
                    center={ACCRA_MAP_CENTER}
                    zoom={mapMarkers.length > 0 ? ACCRA_MAP_ZOOM_METRO : ACCRA_MAP_ZOOM_CITY}
                    markers={mapMarkers}
                    showFitAll
                    emptyTitle="Waiting for Accra GPS pings"
                    emptyDescription="Riders appear when the rider app is online with location enabled."
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
                  Idle
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
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = D.blueBg)}
                            >
                               <Eye size={13} /> View
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
                       <ChevronLeft size={13} />
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
                       <ChevronRight size={13} />
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

        {activeTab === "Status History" && (
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
                <div style={{ fontSize: 15, fontWeight: 600 }}>Rider Online/Offline History</div>
                <div style={{ fontSize: 12, color: D.textMuted, marginTop: 2 }}>
                  Timestamps of every rider status change across the platform.
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["all", "online", "offline"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setOnlineLogFilter(f)}
                    style={{
                      ...btnBase,
                      padding: "5px 12px",
                      fontSize: 11,
                      background: onlineLogFilter === f ? D.blueBg : D.surfaceAlt,
                      border: `1px solid ${onlineLogFilter === f ? D.blue : D.border}`,
                      color: onlineLogFilter === f ? D.blue : D.textSecondary,
                    }}
                  >
                    {f === "online" && <Wifi size={10} />}
                    {f === "offline" && <Clock size={10} />}
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                <button
                  style={{ ...btnBase, padding: "5px 10px", fontSize: 11 }}
                  onClick={fetchOnlineLog}
                  onMouseEnter={(e) => (e.currentTarget.style.background = D.surfaceHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = D.surfaceAlt)}
                >
                      <Activity size={13} /> Refresh
                </button>
              </div>
            </div>

            {onlineLogLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: D.textMuted, fontSize: 13 }}>
                Loading status history...
              </div>
            ) : filteredOnlineLog.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: D.textMuted, fontSize: 13 }}>
                No status changes recorded yet.
              </div>
            ) : (
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: D.textSecondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Rider</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: D.textSecondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: D.textSecondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Time</th>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: D.textSecondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOnlineLog.map((log, i) => {
                      const ts = new Date(log.createdAt);
                      const timeStr = ts.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      });
                      const lat = parseNumber(log.latitude);
                      const lng = parseNumber(log.longitude);
                      return (
                        <tr
                          key={log.id}
                          style={{
                            borderBottom: i < filteredOnlineLog.length - 1 ? `1px solid ${D.border}` : "none",
                          }}
                        >
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: D.surfaceAlt,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 700,
                                  fontSize: 12,
                                  color: D.textPrimary,
                                  border: `1px solid ${D.border}`,
                                }}
                              >
                                {log.riderProfile.user.fullName.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: D.textPrimary }}>{log.riderProfile.user.fullName}</div>
                                <div style={{ fontSize: 11, color: D.textMuted }}>{log.riderProfile.displayCode}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 600,
                                background: log.status ? D.greenBg : D.surfaceHover,
                                color: log.status ? D.green : D.textMuted,
                                border: `1px solid ${log.status ? D.greenBorder : D.border}`,
                              }}
                            >
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: log.status ? D.green : D.textMuted,
                                }}
                              />
                              {log.status ? "Went Online" : "Went Offline"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 16px", color: D.textSecondary, whiteSpace: "nowrap" }}>
                            {timeStr}
                          </td>
                          <td style={{ padding: "10px 16px", color: D.textMuted, fontSize: 11 }}>
                            {Number.isFinite(lat) && Number.isFinite(lng)
                              ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
                              : "N/A"}
                            {log.isMocked ? " (mocked)" : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
              <Activity size={13} /> Refresh
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
  );
}
