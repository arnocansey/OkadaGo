"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin } from "lucide-react";
import { fetchJson } from "@/lib/api";
import { formatMoney } from "@/lib/currency";
import { PassengerAppFrame } from "@/components/passenger/layout/app-frame";
import { TripsListSkeleton } from "@/components/passenger/ui/skeletons";
import { ACTIVE_RIDE_STATUSES, type Ride } from "@/components/passenger/types";

type Filter = "all" | "active" | "completed" | "cancelled";

function statusBadge(status: string) {
  if (ACTIVE_RIDE_STATUSES.has(status)) {
    return { label: "Active", className: "pax-badge pax-badge--active" };
  }
  if (status === "COMPLETED") {
    return { label: "Completed", className: "pax-badge pax-badge--muted" };
  }
  if (status === "CANCELLED") {
    return { label: "Cancelled", className: "pax-badge pax-badge--danger" };
  }
  return { label: status.replace(/_/g, " "), className: "pax-badge pax-badge--muted" };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function TripsView() {
  const [filter, setFilter] = useState<Filter>("all");

  const ridesQuery = useQuery({
    queryKey: ["rides"],
    queryFn: () => fetchJson<Ride[]>("/rides")
  });

  const filtered = useMemo(() => {
    const rides = ridesQuery.data ?? [];
    if (filter === "active") return rides.filter((r) => ACTIVE_RIDE_STATUSES.has(r.status));
    if (filter === "completed") return rides.filter((r) => r.status === "COMPLETED");
    if (filter === "cancelled") return rides.filter((r) => r.status === "CANCELLED");
    return rides;
  }, [ridesQuery.data, filter]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" }
  ];

  return (
    <PassengerAppFrame>
      <div className="pax-page">
        <div className="pax-page-header">
          <h1>Your trips</h1>
        </div>

        <div className="pax-page-content">
          <h1 className="pax-page-title">Your trips</h1>

          <div className="mb-6 flex gap-2 overflow-x-auto">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`pax-filter-chip${filter === key ? " pax-filter-chip--active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          {ridesQuery.isLoading ? (
            <TripsListSkeleton />
          ) : filtered.length === 0 ? (
            <div className="pax-empty">
              <MapPin size={40} />
              <p className="pax-empty-title">No trips yet</p>
              <p className="text-sm">Your ride history will appear here.</p>
            </div>
          ) : (
            <div className="pax-trips-grid">
              {filtered.map((ride) => {
                const badge = statusBadge(ride.status);
                return (
                  <article key={ride.id} className="pax-card p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{ride.destinationAddress.split(",")[0]}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-xs pax-text-secondary">
                          <Calendar size={12} />
                          {formatDate(ride.createdAt)}
                        </div>
                      </div>
                      <span className={badge.className}>{badge.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm pax-text-secondary">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--pax-primary)]" />
                      <span className="truncate">{ride.pickupAddress.split(",")[0]}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm pax-text-secondary">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--pax-danger)]" />
                      <span className="truncate">{ride.destinationAddress.split(",")[0]}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-[var(--pax-border)] pt-3">
                      <span className="truncate text-xs pax-text-secondary">
                        {ride.rider?.user.fullName ?? "No rider assigned"}
                      </span>
                      <span className="shrink-0 font-bold">
                        {formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PassengerAppFrame>
  );
}
