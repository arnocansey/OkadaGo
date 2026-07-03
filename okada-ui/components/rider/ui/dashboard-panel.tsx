"use client";

import { formatMoney } from "@/lib/currency";
import { getNextAction, formatStatus, type RideRecord } from "@/components/rider/types";

type ActiveRidePanelProps = {
  ride: RideRecord;
  onAdvance: (status: string) => void;
  isPending: boolean;
};

export function ActiveRidePanel({ ride, onAdvance, isPending }: ActiveRidePanelProps) {
  const { nextActionLabel, nextActionStatus } = getNextAction(ride);

  return (
    <div className="rdr-active-ride">
      <div className="rdr-active-ride-head">
        <span className="rdr-status-pulse" />
        <strong>{formatStatus(ride.status)}</strong>
      </div>
      <p className="rdr-active-ride-passenger">{ride.passenger.user.fullName}</p>
      <div className="rdr-active-ride-route">
        <div>
          <span className="rdr-route-label">Pickup</span>
          <p>{ride.pickupAddress}</p>
        </div>
        <div>
          <span className="rdr-route-label">Dropoff</span>
          <p>{ride.destinationAddress}</p>
        </div>
      </div>
      <div className="rdr-active-ride-fare">
        {formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}
      </div>
      {nextActionLabel && nextActionStatus ? (
        <button
          type="button"
          className="rdr-btn-primary w-full"
          disabled={isPending}
          onClick={() => onAdvance(nextActionStatus)}
        >
          {isPending ? "Updating…" : nextActionLabel}
        </button>
      ) : null}
    </div>
  );
}

type DashboardStatsProps = {
  balanceLabel: string;
  balance: string;
  trips: number;
  completionRate: number;
  zoneLabel: string;
  deficitWarning?: string;
};

export function DashboardStats({
  balanceLabel,
  balance,
  trips,
  completionRate,
  zoneLabel,
  deficitWarning
}: DashboardStatsProps) {
  return (
    <div className="rdr-dashboard-stats">
      <div className="rdr-wallet-card">
        <div className="rdr-wallet-card-label">{balanceLabel}</div>
        <div className="text-2xl font-bold">{balance}</div>
        <div className="rdr-text-secondary text-sm mt-1">{zoneLabel}</div>
      </div>
      <div className="rdr-mini-stat-grid">
        <div className="rdr-mini-stat">
          <span>Trips</span>
          <strong>{trips}</strong>
        </div>
        <div className="rdr-mini-stat">
          <span>Completion</span>
          <strong>{completionRate}%</strong>
        </div>
      </div>
      {deficitWarning ? <div className="rdr-alert rdr-alert--warning">{deficitWarning}</div> : null}
    </div>
  );
}
