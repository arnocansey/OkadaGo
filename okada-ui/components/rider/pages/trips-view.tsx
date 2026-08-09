"use client";

import { CalendarClock } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { RiderAppFrame } from "@/components/rider/layout/app-frame";
import { useRiderData } from "@/components/rider/hooks/use-rider-data";
import { ActiveRidePanel } from "@/components/rider/ui/dashboard-panel";
import { useRiderLocation } from "@/components/rider/hooks/use-rider-location";
import { TripsListSkeleton } from "@/components/rider/ui/skeletons";
import { formatDateTime, formatStatus } from "@/components/rider/types";

export function TripsView() {
  const data = useRiderData();
  const { advanceRideStatus } = useRiderLocation({
    riderProfileId: data.riderProfileId,
    rider: data.rider,
    activeRide: data.activeRide,
    userId: data.userId,
    isDeficitLocked: data.isDeficitLocked
  });

  return (
    <RiderAppFrame>
      <div className="rdr-page">
        <div className="rdr-page-header">
          <h1>Trips</h1>
        </div>
        <div className="rdr-page-content">
          <h1 className="rdr-page-title">Trip history</h1>

          {data.isLoading ? (
            <TripsListSkeleton />
          ) : (
            <>
              {data.activeRide ? (
                <div className="mb-6">
                  <h3 className="rdr-section-title">Active trip</h3>
                  <ActiveRidePanel
                    ride={data.activeRide}
                    onAdvance={(status) => advanceRideStatus.mutate(status)}
                    isPending={advanceRideStatus.isPending}
                  />
                </div>
              ) : null}

              {data.riderRides.length === 0 ? (
                <div className="rdr-empty">
                  <strong>No trips yet</strong>
                  <p>Completed and assigned rides will show up here.</p>
                </div>
              ) : (
                <div className="rdr-trip-list">
                  {data.riderRides.map((ride) => (
                    <article key={ride.id} className="rdr-trip-card">
                      <div className="rdr-trip-card-icon">
                        <CalendarClock size={18} />
                      </div>
                      <div className="rdr-trip-card-body">
                        <div className="rdr-trip-card-head">
                          <strong>{ride.passenger.user.fullName}</strong>
                          <span className={`rdr-badge rdr-badge--${ride.status?.toLowerCase() === "completed" ? "success" : "muted"}`}>
                            {formatStatus(ride.status)}
                          </span>
                        </div>
                        <p className="rdr-text-secondary text-sm">
                          {ride.pickupAddress} → {ride.destinationAddress}
                        </p>
                        <span className="rdr-text-muted text-xs">{formatDateTime(ride.createdAt)}</span>
                      </div>
                      <div className="rdr-trip-card-fare">
                        {formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RiderAppFrame>
  );
}
