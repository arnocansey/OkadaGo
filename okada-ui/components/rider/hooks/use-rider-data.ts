"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson, fetchListJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  parseNumber,
  riderDeficitOfflineThreshold,
  riderDeficitWarningThreshold,
  ACTIVE_RIDE_STATUSES,
  type RideRecord,
  type RiderRecord,
  type WalletRecord
} from "@/components/rider/types";

export function useRiderData() {
  const { session, status } = useAuth();
  const isRider = session?.user.role === "rider";
  const userId = session?.user.id;
  const riderProfileId = session?.user.riderProfileId ?? undefined;
  const enabled = status === "authenticated" && Boolean(riderProfileId);

  const ridesQuery = useQuery({
    queryKey: ["rides"],
    queryFn: () => fetchJson<RideRecord[]>("/rides"),
    enabled,
    refetchInterval: 10_000
  });

  const ridersQuery = useQuery({
    queryKey: ["riders"],
    queryFn: () => fetchListJson<RiderRecord>("/bootstrap/riders?limit=100"),
    enabled,
    refetchInterval: 10_000
  });

  const walletsQuery = useQuery({
    queryKey: ["wallets", userId],
    queryFn: () => fetchJson<WalletRecord[]>(`/wallets/users/${userId}`),
    enabled: status === "authenticated" && Boolean(userId)
  });

  const rider = useMemo(
    () => (ridersQuery.data ?? []).find((entry) => entry.id === riderProfileId) ?? null,
    [riderProfileId, ridersQuery.data]
  );

  const riderRides = useMemo(
    () =>
      (ridesQuery.data ?? [])
        .filter((ride) => ride.riderId === riderProfileId)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [riderProfileId, ridesQuery.data]
  );

  const activeRide = useMemo(
    () => riderRides.find((ride) => ACTIVE_RIDE_STATUSES.has(ride.status)) ?? null,
    [riderRides]
  );

  const completedRides = useMemo(
    () => riderRides.filter((ride) => ride.status === "completed"),
    [riderRides]
  );

  const completedCount = completedRides.length;
  const todayEarnings = completedRides.reduce(
    (sum, ride) => sum + parseNumber(ride.finalFare ?? ride.estimatedFare),
    0
  );
  const completionRate =
    riderRides.length === 0 ? 0 : Math.round((completedCount / riderRides.length) * 100);

  const settlementWallet =
    (walletsQuery.data ?? []).find((wallet) => wallet.type === "RIDER_SETTLEMENT") ??
    walletsQuery.data?.[0] ??
    null;

  const currency = settlementWallet?.currency ?? completedRides[0]?.currency ?? "GHS";
  const deficitAmount = Math.abs(Math.min(0, parseNumber(settlementWallet?.availableBalance)));
  const isDeficitWarning = deficitAmount >= riderDeficitWarningThreshold;
  const isDeficitLocked = deficitAmount >= riderDeficitOfflineThreshold;

  return {
    session,
    status,
    isRider,
    userId,
    riderProfileId,
    rider,
    riderRides,
    activeRide,
    completedRides,
    completedCount,
    todayEarnings,
    completionRate,
    settlementWallet,
    currency,
    deficitAmount,
    isDeficitWarning,
    isDeficitLocked,
    isLoading: ridesQuery.isLoading || ridersQuery.isLoading,
    riderCommissionPercent: parseNumber(rider?.commissionPercent) || 12
  };
}
