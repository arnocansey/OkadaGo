"use client";

import React, { useState, useMemo, useCallback } from "react";
import { FilterBar } from "./assignment/FilterBar";
import { AssignmentStats } from "./assignment/AssignmentStats";
import { RequestQueue } from "./assignment/RequestQueue";
import { RiderMap } from "./assignment/RiderMap";
import { AssignmentDrawer } from "./assignment/AssignmentDrawer";
import { AssignmentConfirmation } from "./assignment/AssignmentConfirmation";
import { AssignmentUnassignModal } from "./assignment/AssignmentUnassignModal";
import { AssignmentReassignModal } from "./assignment/AssignmentReassignModal";
import { AssignmentRulesDrawer } from "./assignment/AssignmentRulesDrawer";
import { RequestTimelineModal } from "./assignment/RequestTimelineModal";
import { AssignmentHistoryTable } from "./assignment/AssignmentHistoryTable";
import type { LeafletMapMarker } from "@/components/maps/leaflet-map";
import type {
  RideItem,
  RiderCandidate,
  AvailableRidersResponse,
  AssignmentStatsData,
  AssignmentHistoryRecord,
  AssignmentRuleItem,
  UseMutationResult
} from "./assignment/types";

export type RiderAssignmentScreenProps = {
  activeRides: RideItem[];
  activeRidesPending: boolean;
  selectedAssignmentRideId: string | null;
  setSelectedAssignmentRideId: (id: string | null) => void;
  availableRidersData: AvailableRidersResponse | undefined;
  availableRidersPending: boolean;
  assignRiderMutation: UseMutationResult;
  reassignRiderMutation: UseMutationResult;
  unassignRiderMutation: UseMutationResult;
  autoAssignMutation: UseMutationResult;
  assignmentStats: AssignmentStatsData | undefined;
  assignmentStatsPending: boolean;
  assignmentRules?: AssignmentRuleItem[];
  assignmentRulesPending?: boolean;
  createAssignmentRuleMutation?: UseMutationResult;
  updateAssignmentRuleMutation?: UseMutationResult;
  deleteAssignmentRuleMutation?: UseMutationResult;
  zones?: Array<{ id: string; name: string; city: string }>;
  allAssignmentHistory?: AssignmentHistoryRecord[];
  allAssignmentHistoryPending?: boolean;
  refetchAllAssignmentHistory?: () => void;
  autoAssignEnabled?: boolean;
  setAutoAssignEnabled?: (enabled: boolean) => void;
  mapMarkers?: LeafletMapMarker[];
  adminCurrency?: string;
  token?: string;
};

export function RiderAssignmentScreen({
  activeRides = [],
  activeRidesPending = false,
  selectedAssignmentRideId,
  setSelectedAssignmentRideId,
  availableRidersData,
  availableRidersPending = false,
  assignRiderMutation,
  reassignRiderMutation,
  unassignRiderMutation,
  autoAssignMutation,
  assignmentStats,
  assignmentStatsPending = false,
  assignmentRules = [],
  assignmentRulesPending = false,
  createAssignmentRuleMutation,
  updateAssignmentRuleMutation,
  deleteAssignmentRuleMutation,
  zones = [],
  allAssignmentHistory = [],
  allAssignmentHistoryPending = false,
  refetchAllAssignmentHistory,
  autoAssignEnabled = true,
  setAutoAssignEnabled,
  mapMarkers = [],
  adminCurrency = "GHS",
  token = ""
}: RiderAssignmentScreenProps) {
  // ── Filter states ──
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riderFilter, setRiderFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Modal & Drawer states ──
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [timelineRideId, setTimelineRideId] = useState<string | null>(null);
  const [confirmCandidate, setConfirmCandidate] = useState<RiderCandidate | null>(null);
  const [unassignRideId, setUnassignRideId] = useState<string | null>(null);
  const [reassignCandidate, setReassignCandidate] = useState<RiderCandidate | null>(null);
  const [isRulesDrawerOpen, setIsRulesDrawerOpen] = useState(false);

  // ── Refresh Handler ──
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetchAllAssignmentHistory?.();
    setTimeout(() => setIsRefreshing(false), 800);
  }, [refetchAllAssignmentHistory]);

  // ── Selected Ride Object ──
  const selectedRide = useMemo(() => {
    if (!selectedAssignmentRideId) return null;
    return activeRides.find((r) => r.id === selectedAssignmentRideId) || null;
  }, [activeRides, selectedAssignmentRideId]);

  // ── Unassign Ride Object ──
  const unassignRide = useMemo(() => {
    if (!unassignRideId) return null;
    return activeRides.find((r) => r.id === unassignRideId) || null;
  }, [activeRides, unassignRideId]);

  // ── Filtered Ride Requests ──
  const filteredRides = useMemo(() => {
    return activeRides.filter((ride) => {
      // 1. Search filter (ID, passenger, pickup, dest)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchId = ride.id.toLowerCase().includes(query);
        const matchPassenger = ride.passenger?.name?.toLowerCase().includes(query) ?? false;
        const matchPickup = ride.pickupAddress?.toLowerCase().includes(query) ?? false;
        const matchDest = ride.destinationAddress?.toLowerCase().includes(query) ?? false;
        if (!matchId && !matchPassenger && !matchPickup && !matchDest) return false;
      }

      // 2. Status filter
      if (statusFilter !== "all") {
        const rideStatus = (ride.status || "").toLowerCase();
        if (statusFilter === "searching" && rideStatus !== "searching" && rideStatus !== "scheduled") return false;
        if (statusFilter === "unassigned" && ride.assignedRider) return false;
        if (statusFilter === "assigned" && rideStatus !== "assigned") return false;
        if (statusFilter === "arriving" && rideStatus !== "arriving" && rideStatus !== "arrived") return false;
        if (statusFilter === "active" && !["started", "arrived", "arriving", "assigned"].includes(rideStatus)) return false;
        if (statusFilter === "completed" && rideStatus !== "completed") return false;
        if (statusFilter === "cancelled" && rideStatus !== "cancelled") return false;
      }

      // 3. Rider filter
      if (riderFilter === "assigned" && !ride.assignedRider) return false;
      if (riderFilter === "unassigned" && ride.assignedRider) return false;

      // 4. Date filter
      if (dateFilter !== "all" && ride.requestedAt) {
        const rideDate = new Date(ride.requestedAt);
        const now = new Date();
        if (dateFilter === "today") {
          if (rideDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === "yesterday") {
          const yest = new Date(now.getTime() - 86400000);
          if (rideDate.toDateString() !== yest.toDateString()) return false;
        } else if (dateFilter === "7days") {
          if (now.getTime() - rideDate.getTime() > 7 * 86400000) return false;
        }
      }

      return true;
    });
  }, [activeRides, searchTerm, statusFilter, riderFilter, dateFilter]);

  // ── Calculated Real-Time Counts for Stats ──
  const searchingCount = useMemo(
    () => activeRides.filter((r) => r.status === "SEARCHING" || r.status === "SCHEDULED").length,
    [activeRides]
  );
  const unassignedCount = useMemo(
    () => activeRides.filter((r) => !r.assignedRider && r.status !== "CANCELLED" && r.status !== "COMPLETED").length,
    [activeRides]
  );
  const assignedCount = useMemo(
    () => activeRides.filter((r) => r.status === "ASSIGNED").length,
    [activeRides]
  );
  const activeTripsCount = useMemo(
    () => activeRides.filter((r) => ["ARRIVING", "ARRIVED", "STARTED"].includes(r.status)).length,
    [activeRides]
  );
  const liveOnlineRidersCount = useMemo(() => {
    return mapMarkers.filter((m) => m.variant === "driverOnline" || m.status === "ONLINE").length;
  }, [mapMarkers]);

  // ── Action Handlers ──
  const handleSelectRide = useCallback(
    (rideId: string) => {
      setSelectedAssignmentRideId(rideId);
    },
    [setSelectedAssignmentRideId]
  );

  const handleOpenAssignDrawer = useCallback(
    (rideId: string) => {
      setSelectedAssignmentRideId(rideId);
      setIsDrawerOpen(true);
    },
    [setSelectedAssignmentRideId]
  );

  const handleOpenTimeline = useCallback((rideId: string) => {
    setTimelineRideId(rideId);
  }, []);

  const handleOpenUnassign = useCallback((rideId: string) => {
    setUnassignRideId(rideId);
  }, []);

  const handleConfirmUnassign = useCallback(() => {
    if (!unassignRideId) return;
    unassignRiderMutation.mutate(
      { rideId: unassignRideId },
      {
        onSuccess: () => {
          setUnassignRideId(null);
          setIsDrawerOpen(false);
        }
      }
    );
  }, [unassignRideId, unassignRiderMutation]);

  const handleAutoAssign = useCallback(
    (rideId: string) => {
      autoAssignMutation.mutate(
        { rideId },
        {
          onSuccess: () => {
            setIsDrawerOpen(false);
          }
        }
      );
    },
    [autoAssignMutation]
  );

  const handleSelectCandidateToAssign = useCallback(
    (candidate: RiderCandidate) => {
      if (selectedRide?.assignedRider) {
        setReassignCandidate(candidate);
      } else {
        setConfirmCandidate(candidate);
      }
    },
    [selectedRide]
  );

  const handleConfirmAssignment = useCallback(() => {
    if (!selectedRide || !confirmCandidate) return;
    assignRiderMutation.mutate(
      {
        rideId: selectedRide.id,
        riderProfileId: confirmCandidate.riderId
      },
      {
        onSuccess: () => {
          setConfirmCandidate(null);
          setIsDrawerOpen(false);
        }
      }
    );
  }, [selectedRide, confirmCandidate, assignRiderMutation]);

  const handleConfirmReassign = useCallback(
    ({ reason, reasonNote }: { reason: string; reasonNote?: string }) => {
      if (!selectedRide || !reassignCandidate) return;
      reassignRiderMutation.mutate(
        {
          rideId: selectedRide.id,
          riderProfileId: reassignCandidate.riderId,
          reason,
          reasonNote
        },
        {
          onSuccess: () => {
            setReassignCandidate(null);
            setIsDrawerOpen(false);
          }
        }
      );
    },
    [selectedRide, reassignCandidate, reassignRiderMutation]
  );

  return (
    <div
      style={{
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        minHeight: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* 1. TOP HEADER & FILTER BAR */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        riderFilter={riderFilter}
        onRiderFilterChange={setRiderFilter}
        autoAssignEnabled={autoAssignEnabled}
        onToggleAutoAssign={(val) => setAutoAssignEnabled?.(val)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        totalRequestsCount={activeRides.length}
        onOpenRulesDrawer={() => setIsRulesDrawerOpen(true)}
        rulesCount={assignmentRules.length || assignmentStats?.rulesCount}
      />

      {/* 2. REAL-TIME SUMMARY KPI CARDS */}
      <AssignmentStats
        stats={assignmentStats}
        isLoading={assignmentStatsPending}
        liveOnlineRidersCount={liveOnlineRidersCount}
        searchingCount={searchingCount}
        unassignedCount={unassignedCount}
        assignedCount={assignedCount}
        activeTripsCount={activeTripsCount}
        onFilterClick={(statusKey) => {
          if (statusKey === "all") setStatusFilter("all");
          else if (statusKey === "searching") setStatusFilter("searching");
          else if (statusKey === "assigned") setStatusFilter("assigned");
          else if (statusKey === "unassigned") setStatusFilter("unassigned");
          else if (statusKey === "active") setStatusFilter("active");
        }}
      />

      {/* 3. MAIN DISPATCH AREA (TWO-COLUMN LAYOUT) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(340px, 420px) 1fr",
          gap: "16px",
          alignItems: "stretch",
          marginBottom: "16px"
        }}
      >
        {/* LEFT: Ride Requests Queue */}
        <RequestQueue
          rides={filteredRides}
          isLoading={activeRidesPending}
          selectedRideId={selectedAssignmentRideId}
          onSelectRide={handleSelectRide}
          onAssignClick={handleOpenAssignDrawer}
          onViewDetailsClick={handleOpenTimeline}
          onUnassignClick={handleOpenUnassign}
          onReassignClick={handleOpenAssignDrawer}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          adminCurrency={adminCurrency}
        />

        {/* RIGHT: Live Rider Map */}
        <RiderMap
          activeRides={activeRides}
          selectedRide={selectedRide}
          mapMarkers={mapMarkers}
          candidateRiders={availableRidersData?.availableRiders ?? []}
          onAssignRider={(riderId) => {
            if (!selectedRide) return;
            const matched = availableRidersData?.availableRiders?.find((c) => c.riderId === riderId);
            if (matched) {
              if (selectedRide.assignedRider) {
                setReassignCandidate(matched);
              } else {
                setConfirmCandidate(matched);
              }
            } else {
              if (selectedRide.assignedRider) {
                reassignRiderMutation.mutate({
                  rideId: selectedRide.id,
                  riderProfileId: riderId,
                  reason: "admin_override"
                });
              } else {
                assignRiderMutation.mutate({ rideId: selectedRide.id, riderProfileId: riderId });
              }
            }
          }}
          height="100%"
        />
      </div>

      {/* 4. ASSIGNMENT HISTORY TABLE */}
      <AssignmentHistoryTable
        history={allAssignmentHistory}
        isLoading={allAssignmentHistoryPending}
        onViewDetails={handleOpenTimeline}
      />

      {/* 5. RIDER ASSIGNMENT PANEL (SIDE DRAWER) */}
      <AssignmentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        ride={selectedRide}
        availableData={availableRidersData}
        isLoading={availableRidersPending}
        onAutoAssign={handleAutoAssign}
        onManualAssignSelect={handleSelectCandidateToAssign}
        onUnassignClick={handleOpenUnassign}
        isAssigning={assignRiderMutation.isPending || autoAssignMutation.isPending || reassignRiderMutation.isPending}
        adminCurrency={adminCurrency}
      />

      {/* 6. CONFIRMATION MODAL BEFORE MANUAL ASSIGNMENT (NEW ASSIGNMENT) */}
      <AssignmentConfirmation
        isOpen={Boolean(confirmCandidate && selectedRide && !selectedRide.assignedRider)}
        onClose={() => setConfirmCandidate(null)}
        onConfirm={handleConfirmAssignment}
        ride={selectedRide}
        rider={confirmCandidate}
        isAssigning={assignRiderMutation.isPending}
        adminCurrency={adminCurrency}
      />

      {/* 7. UNASSIGN CONFIRMATION MODAL */}
      <AssignmentUnassignModal
        isOpen={Boolean(unassignRideId && unassignRide)}
        onClose={() => setUnassignRideId(null)}
        onConfirm={handleConfirmUnassign}
        ride={unassignRide}
        isUnassigning={unassignRiderMutation.isPending}
      />

      {/* 8. REASSIGN CONFIRMATION MODAL */}
      <AssignmentReassignModal
        isOpen={Boolean(reassignCandidate && selectedRide)}
        onClose={() => setReassignCandidate(null)}
        onConfirm={handleConfirmReassign}
        ride={selectedRide}
        newRider={reassignCandidate}
        isReassigning={reassignRiderMutation.isPending}
      />

      {/* 9. DISPATCH RULES & ALGORITHM CONTROLS DRAWER (SECTION 5) */}
      <AssignmentRulesDrawer
        isOpen={isRulesDrawerOpen}
        onClose={() => setIsRulesDrawerOpen(false)}
        rules={assignmentRules}
        isLoading={assignmentRulesPending}
        createRuleMutation={createAssignmentRuleMutation}
        updateRuleMutation={updateAssignmentRuleMutation}
        deleteRuleMutation={deleteAssignmentRuleMutation}
        zones={zones}
      />

      {/* 10. REQUEST LIFECYCLE TIMELINE MODAL */}
      <RequestTimelineModal
        isOpen={Boolean(timelineRideId)}
        onClose={() => setTimelineRideId(null)}
        rideId={timelineRideId}
        token={token}
        adminCurrency={adminCurrency}
      />
    </div>
  );
}

