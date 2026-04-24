"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson, hasExternalApiBaseUrl, patchJson } from "@/lib/api";

interface RiderRecord {
  id: string;
  onlineStatus: boolean;
  user: {
    fullName: string;
  };
  serviceZone: {
    id: string;
    name: string;
  } | null;
}

interface RideRecord {
  id: string;
  status: string;
  rider: {
    id: string;
    user: {
      fullName: string;
    };
  } | null;
  passenger: {
    user: {
      fullName: string;
    };
  };
}

export function RiderOperationsWorkbench() {
  const queryClient = useQueryClient();
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [selectedRideId, setSelectedRideId] = useState("");
  const [statusForm, setStatusForm] = useState({
    nextStatus: "arriving",
    actorRole: "rider",
    actorUserId: ""
  });

  const ridersQuery = useQuery({
    queryKey: ["riders"],
    queryFn: () => fetchJson<RiderRecord[]>("/bootstrap/riders?limit=100"),
    enabled: hasExternalApiBaseUrl
  });

  const ridesQuery = useQuery({
    queryKey: ["rides"],
    queryFn: () => fetchJson<RideRecord[]>("/rides"),
    enabled: hasExternalApiBaseUrl
  });

  const selectedRider = useMemo(
    () => (ridersQuery.data ?? []).find((rider) => rider.id === selectedRiderId),
    [ridersQuery.data, selectedRiderId]
  );

  const selectedRide = useMemo(
    () => (ridesQuery.data ?? []).find((ride) => ride.id === selectedRideId),
    [ridesQuery.data, selectedRideId]
  );

  const updateRideStatus = useMutation({
    mutationFn: async () =>
      patchJson(`/rides/${selectedRideId}/status`, {
        nextStatus: statusForm.nextStatus,
        actorRole: statusForm.actorRole,
        actorUserId: statusForm.actorUserId || undefined
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rides"] });
      void queryClient.invalidateQueries({ queryKey: ["riders"] });
    }
  });

  return (
    <section className="workbench-card">
      <div className="workbench-header">
        <p className="kicker">Rider ops surface</p>
        <h4>Progress live rides</h4>
        <p className="body-muted">
          Use this after creating a persisted ride. It lets you act as rider operations and move the ride through its lifecycle.
        </p>
      </div>

      {!hasExternalApiBaseUrl ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>Set `NEXT_PUBLIC_API_BASE_URL` to use rider operations.</strong>
          <p>The rider control workbench depends on the standalone backend.</p>
        </div>
      ) : null}

      <div className="two-up" style={{ marginTop: 18 }}>
        <div className="field-group">
          <label className="field-label">Rider</label>
          <select
            className="select"
            value={selectedRiderId}
            onChange={(event) => {
              const nextId = event.target.value;
              setSelectedRiderId(nextId);
              const rider = (ridersQuery.data ?? []).find((item) => item.id === nextId);
              setStatusForm((current) => ({
                ...current,
                actorUserId: rider?.id ? "" : current.actorUserId
              }));
            }}
          >
            <option value="">Select rider</option>
            {(ridersQuery.data ?? []).map((rider) => (
              <option key={rider.id} value={rider.id}>
                {rider.user.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label">Assigned ride</label>
          <select
            className="select"
            value={selectedRideId}
            onChange={(event) => setSelectedRideId(event.target.value)}
          >
            <option value="">Select ride</option>
            {(ridesQuery.data ?? [])
              .filter((ride) => (selectedRiderId ? ride.rider?.id === selectedRiderId : true))
              .map((ride) => (
                <option key={ride.id} value={ride.id}>
                  {ride.passenger.user.fullName} - {ride.status}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="button-row" style={{ marginTop: 18 }}>
        <select
          className="select"
          value={statusForm.nextStatus}
          onChange={(event) =>
            setStatusForm((current) => ({ ...current, nextStatus: event.target.value }))
          }
        >
          <option value="arriving">Arriving</option>
          <option value="arrived">Arrived</option>
          <option value="started">Started</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          className="button"
          type="button"
          onClick={() => updateRideStatus.mutate()}
          disabled={!selectedRideId}
        >
          {updateRideStatus.isPending ? "Updating..." : "Update ride status"}
        </button>
      </div>

      {selectedRider ? (
        <p className="workbench-inline-note" style={{ marginTop: 18 }}>
          {selectedRider.user.fullName} is currently{" "}
          <strong>{selectedRider.onlineStatus ? "online" : "offline"}</strong>
          {selectedRider.serviceZone ? ` in ${selectedRider.serviceZone.name}` : ""}.
        </p>
      ) : null}

      {selectedRide ? (
        <p className="workbench-inline-note">
          Selected ride for <strong>{selectedRide.passenger.user.fullName}</strong> is{" "}
          <strong>{selectedRide.status}</strong>.
        </p>
      ) : null}

      {updateRideStatus.isError ? (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>Status update failed.</strong>
          <p>{updateRideStatus.error.message}</p>
        </div>
      ) : null}
    </section>
  );
}
