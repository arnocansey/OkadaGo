"use client";

import { CalendarClock } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { formatStatus, formatDateTime, type RideRecord } from "../rider-portal-types";

export function RiderTripsScreen({
  riderRides,
  activeRide
}: {
  riderRides: RideRecord[];
  activeRide: RideRecord | null;
}) {
  return (
    <main className="exact-rider-content">
      <section className="exact-rider-page-head">
        <div>
          <p className="workspace-tag">rider trips</p>
          <h1>Trip history</h1>
          <p className="body-muted">
            Separate trip management view inspired by the reference rider history state, now wired to live ride records.
          </p>
        </div>
      </section>

      {activeRide ? (
        <section className="workbench-card">
          <div className="workbench-header">
            <p className="kicker">Active trip</p>
            <h3>Current ride in progress</h3>
          </div>
          <div className="exact-rider-highlight">
            <div>
              <strong>{activeRide.passenger.user.fullName}</strong>
              <span>{formatStatus(activeRide.status)}</span>
            </div>
            <p>
              {activeRide.pickupAddress} to {activeRide.destinationAddress}
            </p>
          </div>
        </section>
      ) : null}

      <section className="workbench-card">
        <div className="workbench-header">
          <p className="kicker">All rider trips</p>
          <h3>Ride history timeline</h3>
          <p className="body-muted">
            Every ride assigned to this rider profile, sorted newest first from the backend.
          </p>
        </div>
        {riderRides.length === 0 ? (
          <div className="empty-state empty-state-spaced">
            <strong>No rides assigned yet.</strong>
            <p>Trip history will populate here as soon as dispatch starts assigning rides to this rider.</p>
          </div>
        ) : (
          <div className="exact-rider-records">
            {riderRides.map((ride) => (
              <article className="exact-rider-record-card" key={ride.id}>
                <div className="exact-rider-record-main">
                  <div className="exact-rider-record-icon muted">
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <strong>{ride.passenger.user.fullName}</strong>
                    <span>
                      {ride.pickupAddress} to {ride.destinationAddress}
                    </span>
                  </div>
                </div>
                <div className="exact-rider-record-side">
                  <strong>{formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}</strong>
                  <span>{formatStatus(ride.status)}</span>
                  <small>{formatDateTime(ride.createdAt)}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
