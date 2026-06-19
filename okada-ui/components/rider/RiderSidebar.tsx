"use client";

import { Star, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/currency";
import {
  riderDeficitOfflineThreshold,
  formatStatus,
  getNextAction,
  type RideRecord
} from "./rider-portal-types";

export function RiderSidebarSkeleton() {
  return (
    <aside className="exact-rider-sidebar">
      <div className="exact-rider-week">
        <Skeleton style={{ width: 160, height: 22 }} />
        <Skeleton className="mt-2" style={{ width: 200, height: 14 }} />
      </div>

      <section className="exact-rider-hero-card">
        <div className="exact-rider-hero-head">
          <div>
            <Skeleton style={{ width: 100, height: 12 }} />
            <Skeleton className="mt-2" style={{ width: 120, height: 24 }} />
          </div>
          <Skeleton style={{ width: 36, height: 36, borderRadius: "50%" }} />
        </div>
        <div className="exact-rider-bonus-card">
          <Skeleton style={{ width: 140, height: 14 }} />
          <Skeleton className="mt-2" style={{ width: 200, height: 12 }} />
        </div>
      </section>

      <div className="exact-rider-metric-grid">
        <article className="exact-rider-metric-card">
          <Skeleton style={{ width: 40, height: 12 }} />
          <Skeleton className="mt-2" style={{ width: 32, height: 24 }} />
        </article>
        <article className="exact-rider-metric-card">
          <Skeleton style={{ width: 40, height: 12 }} />
          <Skeleton className="mt-2" style={{ width: 56, height: 24 }} />
        </article>
        <article className="exact-rider-metric-card wide">
          <Skeleton style={{ width: 80, height: 12 }} />
          <Skeleton className="mt-2" style={{ width: 100, height: 12 }} />
        </article>
      </div>

      <div className="exact-rider-module-stack">
        <section className="workbench-card">
          <div className="workbench-header">
            <Skeleton style={{ width: 80, height: 10 }} />
            <Skeleton className="mt-2" style={{ width: 120, height: 18 }} />
            <Skeleton className="mt-2" style={{ width: "100%", height: 12 }} />
          </div>
          <div style={{ marginTop: 20 }}>
            <Skeleton style={{ width: "100%", height: 48, borderRadius: 12 }} />
          </div>
        </section>
      </div>
    </aside>
  );
}

export function RiderSidebar({
  screen,
  settlementWallet,
  rider,
  completedCount,
  completionRate,
  isDeficitLocked,
  displayIsOnline,
  isDeficitWarning,
  currency,
  deficitAmount,
  activeRide,
  advanceRideStatus
}: {
  screen: "dashboard" | "earnings" | "trips";
  settlementWallet: { currency: string; availableBalance: string | number } | null;
  rider: { serviceZone: { name: string } | null; city: string | null } | null;
  completedCount: number;
  completionRate: number;
  isDeficitLocked: boolean;
  displayIsOnline: boolean;
  isDeficitWarning: boolean;
  currency: string;
  deficitAmount: number;
  activeRide: RideRecord | null;
  advanceRideStatus: {
    mutate: (status: string) => void;
    isPending: boolean;
    isError: boolean;
    error: { message: string } | null;
  };
}) {
  const { nextActionLabel, nextActionStatus } = getNextAction(activeRide);

  return (
    <aside className="exact-rider-sidebar">
      <div className="exact-rider-week">
        <h2>
          {screen === "dashboard"
            ? "Today's earnings"
            : screen === "earnings"
              ? "Earnings center"
              : "Trips center"}
        </h2>
        <p>
          {screen === "dashboard"
            ? "Live backend settlement"
            : screen === "earnings"
              ? "Separate earnings workspace"
              : "Separate trip history workspace"}
        </p>
      </div>

      <section className="exact-rider-hero-card">
        <div className="exact-rider-hero-head">
          <div>
            <span>Available balance</span>
            <h3>
              {settlementWallet
                ? formatMoney(settlementWallet.currency, settlementWallet.availableBalance)
                : "No settlement wallet"}
            </h3>
          </div>
          <div className="exact-rider-hero-icon">
            <Wallet size={18} />
          </div>
        </div>
        <div className="exact-rider-bonus-card">
          <span>{rider?.serviceZone?.name ?? "No service zone assigned"}</span>
          <p>{rider?.city ?? "Update your rider profile city to improve dispatch matching."}</p>
        </div>
      </section>

      <div className="exact-rider-metric-grid">
        <article className="exact-rider-metric-card">
          <span>Trips</span>
          <strong>{completedCount}</strong>
        </article>
        <article className="exact-rider-metric-card">
          <span>Status</span>
          <strong>
            {activeRide
              ? "Active"
              : isDeficitLocked
                ? "Locked"
                : displayIsOnline
                  ? "Online"
                  : "Offline"}
          </strong>
        </article>
        <article className="exact-rider-metric-card wide">
          <div className="exact-rating-row">
            <span>Completion</span>
            <div className="exact-stars">
              {[0, 1, 2, 3, 4].map((item) => (
                <Star
                  key={item}
                  size={12}
                  className={item < Math.max(1, Math.round(completionRate / 25)) ? "filled" : ""}
                />
              ))}
            </div>
          </div>
          <strong>{completionRate}% completed</strong>
        </article>
      </div>

      <div className="exact-rider-module-stack">
        {isDeficitWarning ? (
          <section className={`exact-rider-finance-alert ${isDeficitLocked ? "locked" : "warning"}`}>
            <strong>
              {isDeficitLocked
                ? `Offline locked at ${formatMoney(currency, deficitAmount)} deficit`
                : `Warning: ${formatMoney(currency, deficitAmount)} rider deficit`}
            </strong>
            <p>
              {isDeficitLocked
                ? `Pay the deficit from earnings to go back online. The hard lock triggers at GHS ${riderDeficitOfflineThreshold}.`
                : `Once the deficit reaches GHS ${riderDeficitOfflineThreshold}, the rider account is forced offline automatically.`}
            </p>
            <a href="/rider/earnings">Open earnings</a>
          </section>
        ) : null}

        <section className="workbench-card" id="rides">
          <div className="workbench-header">
            <p className="kicker">Current trip</p>
            <h4>Live ride state</h4>
            <p className="body-muted">
              Progress your currently assigned ride with real backend lifecycle updates.
            </p>
          </div>
          {!activeRide ? (
            <div className="empty-state empty-state-spaced">
              <strong>No active ride.</strong>
              <p>Go online and wait for a dispatch assignment to appear here.</p>
            </div>
          ) : (
            <div className="exact-rider-live-ride-details">
              <p className="body-muted">
                <strong>{formatStatus(activeRide.status)}</strong> for{" "}
                {activeRide.passenger.user.fullName}
              </p>
              <p className="body-muted">
                Pickup: <strong>{activeRide.pickupAddress}</strong>
              </p>
              <p className="body-muted">
                Destination: <strong>{activeRide.destinationAddress}</strong>
              </p>
              <p className="body-muted">
                Fare:{" "}
                <strong>
                  {formatMoney(
                    activeRide.currency,
                    activeRide.finalFare ?? activeRide.estimatedFare
                  )}
                </strong>
              </p>
              {nextActionLabel && nextActionStatus ? (
                <button
                  className="button"
                  type="button"
                  onClick={() => advanceRideStatus.mutate(nextActionStatus)}
                  disabled={advanceRideStatus.isPending}
                >
                  {advanceRideStatus.isPending ? "Updating..." : nextActionLabel}
                </button>
              ) : null}
            </div>
          )}
          {advanceRideStatus.isError ? (
            <div className="empty-state empty-state-spaced">
              <strong>Ride update failed.</strong>
              <p>{advanceRideStatus.error?.message}</p>
            </div>
          ) : null}
        </section>
      </div>
    </aside>
  );
}
