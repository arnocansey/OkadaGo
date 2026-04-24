"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson, hasExternalApiBaseUrl, postJson } from "@/lib/api";

interface ServiceZoneRecord {
  id: string;
  name: string;
  city: string;
  currency: string;
}

interface PassengerRecord {
  id: string;
  user: {
    fullName: string;
    preferredCurrency: string;
  };
}

interface RideCreationResponse {
  ride: {
    id: string;
    status: string;
    finalFare: string | null;
    estimatedFare: string | null;
    currency: string;
    rider: {
      user: {
        fullName: string;
      };
    } | null;
  };
  matching: {
    rankedCandidates: Array<{
      riderId: string;
      displayName: string;
      score: number;
    }>;
  };
}

export function PersistedRideWorkbench() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    passengerProfileId: "",
    serviceZoneId: "",
    paymentMethod: "wallet",
    pickupAddress: "",
    pickupLatitude: "",
    pickupLongitude: "",
    destinationAddress: "",
    destinationLatitude: "",
    destinationLongitude: "",
    estimatedDistanceKm: "",
    estimatedDurationMinutes: "",
    rideType: "standard_bike"
  });

  const zonesQuery = useQuery({
    queryKey: ["service-zones"],
    queryFn: () => fetchJson<ServiceZoneRecord[]>("/bootstrap/service-zones?limit=100"),
    enabled: hasExternalApiBaseUrl
  });

  const passengersQuery = useQuery({
    queryKey: ["passengers"],
    queryFn: () => fetchJson<PassengerRecord[]>("/bootstrap/passengers?limit=100"),
    enabled: hasExternalApiBaseUrl
  });

  const ridesQuery = useQuery({
    queryKey: ["rides"],
    queryFn: () =>
      fetchJson<Array<{ id: string; status: string; pickupAddress: string; destinationAddress: string }>>(
        "/rides"
      ),
    enabled: hasExternalApiBaseUrl
  });

  const createRide = useMutation({
    mutationFn: async () =>
      postJson<RideCreationResponse, unknown>("/rides/request", {
        passengerProfileId: form.passengerProfileId,
        serviceZoneId: form.serviceZoneId,
        paymentMethod: form.paymentMethod,
        pickup: {
          address: form.pickupAddress,
          latitude: Number(form.pickupLatitude),
          longitude: Number(form.pickupLongitude)
        },
        destination: {
          address: form.destinationAddress,
          latitude: Number(form.destinationLatitude),
          longitude: Number(form.destinationLongitude)
        },
        estimatedDistanceKm: Number(form.estimatedDistanceKm),
        estimatedDurationMinutes: Number(form.estimatedDurationMinutes),
        rideType: form.rideType
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rides"] });
    }
  });

  const selectedPassenger = useMemo(
    () => (passengersQuery.data ?? []).find((passenger) => passenger.id === form.passengerProfileId),
    [form.passengerProfileId, passengersQuery.data]
  );

  return (
    <section className="workbench-card">
      <div className="workbench-header">
        <p className="kicker">Passenger booking surface</p>
        <h4>Create a real ride request</h4>
        <p className="body-muted">
          This requests a ride against the live backend, persists it in Postgres, and assigns a rider if one is available in the selected zone.
        </p>
      </div>

      {!hasExternalApiBaseUrl ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>Set `NEXT_PUBLIC_API_BASE_URL` to use persisted ride booking.</strong>
          <p>The live ride flow uses the standalone backend service.</p>
        </div>
      ) : null}

      <div className="two-up" style={{ marginTop: 18 }}>
        <div className="field-group">
          <label className="field-label">Passenger</label>
          <select
            className="select"
            value={form.passengerProfileId}
            onChange={(event) =>
              setForm((current) => ({ ...current, passengerProfileId: event.target.value }))
            }
          >
            <option value="">Select passenger</option>
            {(passengersQuery.data ?? []).map((passenger) => (
              <option key={passenger.id} value={passenger.id}>
                {passenger.user.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label">Service zone</label>
          <select
            className="select"
            value={form.serviceZoneId}
            onChange={(event) =>
              setForm((current) => ({ ...current, serviceZoneId: event.target.value }))
            }
          >
            <option value="">Select zone</option>
            {(zonesQuery.data ?? []).map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="two-up" style={{ marginTop: 18 }}>
        <div className="field-group">
          <label className="field-label">Pickup address</label>
          <input
            className="input"
            value={form.pickupAddress}
            onChange={(event) =>
              setForm((current) => ({ ...current, pickupAddress: event.target.value }))
            }
            placeholder="Pickup address"
          />
        </div>
        <div className="field-group">
          <label className="field-label">Destination address</label>
          <input
            className="input"
            value={form.destinationAddress}
            onChange={(event) =>
              setForm((current) => ({ ...current, destinationAddress: event.target.value }))
            }
            placeholder="Destination address"
          />
        </div>
      </div>

      <div className="four-up" style={{ marginTop: 18 }}>
        {[
          ["pickupLatitude", "Pickup latitude"],
          ["pickupLongitude", "Pickup longitude"],
          ["destinationLatitude", "Destination latitude"],
          ["destinationLongitude", "Destination longitude"],
          ["estimatedDistanceKm", "Distance km"],
          ["estimatedDurationMinutes", "Duration minutes"]
        ].map(([name, label]) => (
          <div className="field-group" key={name}>
            <label className="field-label">{label}</label>
            <input
              className="input"
              value={form[name as keyof typeof form]}
              onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
              placeholder={label}
            />
          </div>
        ))}
      </div>

      <div className="button-row" style={{ marginTop: 18 }}>
        <select
          className="select"
          value={form.paymentMethod}
          onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
        >
          <option value="wallet">Wallet</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="mobile_money">Mobile money</option>
        </select>
        <select
          className="select"
          value={form.rideType}
          onChange={(event) => setForm((current) => ({ ...current, rideType: event.target.value }))}
        >
          <option value="standard_bike">Standard bike</option>
          <option value="express_bike">Express bike</option>
        </select>
        <button className="button" type="button" onClick={() => createRide.mutate()}>
          {createRide.isPending ? "Requesting..." : "Create ride"}
        </button>
      </div>

      {selectedPassenger ? (
        <p className="workbench-inline-note" style={{ marginTop: 18 }}>
          Selected passenger currency: <strong>{selectedPassenger.user.preferredCurrency}</strong>
        </p>
      ) : null}

      {createRide.isError ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>Ride creation failed.</strong>
          <p>{createRide.error.message}</p>
        </div>
      ) : null}

      {createRide.data ? (
        <div className="two-up" style={{ marginTop: 18 }}>
          <article className="workbench-subcard">
            <h4>Created ride</h4>
            <div className="workbench-metric-list">
              <p className="body-muted">
                Status: <strong>{createRide.data.ride.status}</strong>
              </p>
              <p className="body-muted">
                Fare:{" "}
                <strong>
                  {createRide.data.ride.finalFare ?? createRide.data.ride.estimatedFare} {createRide.data.ride.currency}
                </strong>
              </p>
              <p className="body-muted">
                Rider: <strong>{createRide.data.ride.rider?.user.fullName ?? "Unassigned"}</strong>
              </p>
            </div>
          </article>
          <article className="workbench-subcard">
            <h4>Matching result</h4>
            {createRide.data.matching.rankedCandidates.length === 0 ? (
              <p className="body-muted">No eligible riders were online in the selected zone.</p>
            ) : (
              <ul className="workbench-list">
                {createRide.data.matching.rankedCandidates.map((candidate) => (
                  <li key={candidate.riderId}>
                    <span>{candidate.displayName}</span>
                    <strong>score {candidate.score}</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      ) : null}

      <div style={{ marginTop: 18 }}>
        <h4>Recent rides</h4>
        {(ridesQuery.data ?? []).length === 0 ? (
          <div className="empty-state">
            <strong>No rides yet.</strong>
            <p>Create a persisted ride to see it here.</p>
          </div>
        ) : (
          <ul className="workbench-list">
            {(ridesQuery.data ?? []).map((ride) => (
              <li key={ride.id}>
                <span>
                  {ride.status} - {ride.pickupAddress} to {ride.destinationAddress}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
