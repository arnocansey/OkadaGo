"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImmersivePage } from "@/components/layout/immersive-page";
import { fetchJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  parseNumber,
  riderDeficitWarningThreshold,
  riderDeficitOfflineThreshold,
  type WalletRecord,
  type RideRecord,
  type RiderRecord,
  type RiderPortalScreen,
} from "./rider-portal-types";
export type { RiderPortalScreen } from "./rider-portal-types";
import { RiderShell } from "./RiderShell";
import { RiderSidebar } from "./RiderSidebar";
import { RiderDashboardScreen } from "./screens/RiderDashboardScreen";
import { RiderEarningsScreen } from "./screens/RiderEarningsScreen";
import { RiderTripsScreen } from "./screens/RiderTripsScreen";
import { useRiderLocation } from "./hooks/useRiderLocation";

function AccessState({
  title,
  body,
  actionLabel,
  actionHref
}: {
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <ImmersivePage className="exact-rider-page">
      <div className="flow-auth-wall">
        <div className="flow-auth-wall-card">
          <p className="workspace-tag">rider access</p>
          <h2>{title}</h2>
          <p>{body}</p>
          <div className="button-row">
            <a href={actionHref} className="button">{actionLabel}</a>
          </div>
        </div>
      </div>
    </ImmersivePage>
  );
}

export function RiderPortalPage({ screen = "dashboard" }: { screen?: RiderPortalScreen }) {
  const { session, status, signOut } = useAuth();
  const isRider = session?.user.role === "rider";
  const userId = session?.user.id;
  const riderProfileId = session?.user.riderProfileId;

  const ridesQuery = useQuery({
    queryKey: ["rides"],
    queryFn: () => fetchJson<RideRecord[]>("/rides"),
    enabled: status === "authenticated" && Boolean(riderProfileId),
    refetchInterval: 10_000
  });

  const ridersQuery = useQuery({
    queryKey: ["riders"],
    queryFn: () => fetchJson<RiderRecord[]>("/bootstrap/riders?limit=100"),
    enabled: status === "authenticated" && Boolean(riderProfileId),
    refetchInterval: 10_000
  });

  const walletsQuery = useQuery({
    queryKey: ["wallets", userId],
    queryFn: () => fetchJson<WalletRecord[]>(`/wallets/users/${userId}`),
    enabled: status === "authenticated" && Boolean(userId)
  });

  const rider = useMemo(
    () => (ridersQuery.data ?? []).find((e) => e.id === riderProfileId) ?? null,
    [riderProfileId, ridersQuery.data]
  );

  const riderRides = useMemo(
    () =>
      (ridesQuery.data ?? [])
        .filter((r) => r.riderId === riderProfileId)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [riderProfileId, ridesQuery.data]
  );

  const activeRide =
    riderRides.find((r) => ["assigned", "arriving", "arrived", "started"].includes(r.status)) ?? null;
  const completedRides = riderRides.filter((r) => r.status === "completed");
  const completedCount = completedRides.length;
  const todayEarnings = completedRides.reduce(
    (sum, r) => sum + parseNumber(r.finalFare ?? r.estimatedFare), 0
  );
  const completionRate = riderRides.length === 0 ? 0 : Math.round((completedCount / riderRides.length) * 100);

  const settlementWallet =
    (walletsQuery.data ?? []).find((w) => w.type === "RIDER_SETTLEMENT") ?? walletsQuery.data?.[0] ?? null;
  const currency = settlementWallet?.currency ?? completedRides[0]?.currency ?? "GHS";
  const deficitAmount = Math.abs(Math.min(0, parseNumber(settlementWallet?.availableBalance)));
  const isDeficitWarning = deficitAmount >= riderDeficitWarningThreshold;
  const isDeficitLocked = deficitAmount >= riderDeficitOfflineThreshold;

  const { displayIsOnline, updateAvailability, advanceRideStatus } = useRiderLocation({
    riderProfileId: riderProfileId ?? undefined, rider, activeRide, userId: userId ?? undefined, isDeficitLocked
  });

  if (status === "loading") {
    return <AccessState title="Loading your rider workspace" body="Checking your rider session before opening the live dashboard." actionLabel="Go to rider login" actionHref="/rider/login" />;
  }

  if (status !== "authenticated" || !isRider) {
    return <AccessState title="Rider sign in required" body="Use a rider account to access the live rider operations portal." actionLabel="Go to rider login" actionHref="/rider/login" />;
  }

  return (
    <ImmersivePage className="exact-rider-page">
      <div className="exact-rider-statebar">
        {displayIsOnline ? "LIVE RIDER DASHBOARD - ONLINE" : "LIVE RIDER DASHBOARD - OFFLINE"}
      </div>
      <div className="exact-rider-shell">
        <RiderShell
          screen={screen}
          displayIsOnline={displayIsOnline}
          isDeficitLocked={isDeficitLocked}
          riderProfileId={riderProfileId ?? undefined}
          updateAvailabilityPending={updateAvailability.isPending}
          onToggleOnline={() => updateAvailability.mutate(!displayIsOnline)}
          rider={rider}
          session={session}
          signOut={signOut}
        />
        <div className="exact-rider-body">
          <RiderSidebar
            screen={screen}
            settlementWallet={settlementWallet}
            rider={rider}
            completedCount={completedCount}
            completionRate={completionRate}
            isDeficitLocked={isDeficitLocked}
            displayIsOnline={displayIsOnline}
            isDeficitWarning={isDeficitWarning}
            currency={currency}
            deficitAmount={deficitAmount}
            activeRide={activeRide}
            advanceRideStatus={advanceRideStatus}
          />
          {screen === "dashboard" && (
            <RiderDashboardScreen
              rider={rider}
              isDeficitLocked={isDeficitLocked}
              displayIsOnline={displayIsOnline}
              deficitAmount={deficitAmount}
              currency={currency}
              activeRide={activeRide}
            />
          )}
          {screen === "earnings" && (
            <RiderEarningsScreen
              settlementWallet={settlementWallet}
              completedRides={completedRides}
              todayEarnings={todayEarnings}
              completedCount={completedCount}
              riderCommissionPercent={parseNumber(rider?.commissionPercent) || 12}
              token={session.token}
              deficitAmount={deficitAmount}
              isDeficitWarning={isDeficitWarning}
              isDeficitLocked={isDeficitLocked}
            />
          )}
          {screen === "trips" && <RiderTripsScreen riderRides={riderRides} activeRide={activeRide} />}
        </div>
      </div>
    </ImmersivePage>
  );
}
