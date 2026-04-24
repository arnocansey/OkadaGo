"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, CreditCard, MapPin, UserRound } from "lucide-react";
import { fetchJson } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/currency";
import { PassengerAccessState, PassengerShell } from "@/components/passenger/passenger-shell";

type WalletRecord = {
  id: string;
  currency: string;
  availableBalance: string | number;
};

type RideRecord = {
  id: string;
  status: string;
  passengerId: string;
  paymentMethod: string | null;
  destinationAddress: string;
  pickupAddress: string;
  finalFare: string | number | null;
  estimatedFare: string | number | null;
  currency: string;
  createdAt: string;
  rider: {
    user: {
      fullName: string;
    };
  } | null;
};

type RideFilter = "all" | "completed" | "cancelled";

function formatStatus(status: string) {
  return status
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatRideDate(value: string) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatPaymentMethod(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return value
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PassengerHistoryPage() {
  const { session, status, signOut } = useAuth();
  const [filter, setFilter] = useState<RideFilter>("all");
  const [expandedRide, setExpandedRide] = useState<string | null>(null);
  const isPassenger = session?.user.role === "passenger";
  const userId = session?.user.id;
  const passengerProfileId = session?.user.passengerProfileId;

  const ridesQuery = useQuery({
    queryKey: ["rides"],
    queryFn: () => fetchJson<RideRecord[]>("/rides"),
    enabled: status === "authenticated" && Boolean(passengerProfileId)
  });

  const walletsQuery = useQuery({
    queryKey: ["wallets", userId],
    queryFn: () => fetchJson<WalletRecord[]>(`/wallets/users/${userId}`),
    enabled: status === "authenticated" && Boolean(userId)
  });

  const preferredWallet =
    (walletsQuery.data ?? []).find((wallet) => wallet.currency === session?.user.preferredCurrency) ??
    walletsQuery.data?.[0] ??
    null;

  const passengerRides = useMemo(
    () =>
      (ridesQuery.data ?? [])
        .filter((ride) => ride.passengerId === passengerProfileId)
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [passengerProfileId, ridesQuery.data]
  );

  const filteredRides = useMemo(() => {
    if (filter === "all") {
      return passengerRides;
    }

    return passengerRides.filter((ride) => ride.status === filter);
  }, [filter, passengerRides]);

  const completedCount = passengerRides.filter((ride) => ride.status === "completed").length;
  const cancelledCount = passengerRides.filter((ride) => ride.status === "cancelled").length;

  if (status === "loading") {
    return (
      <PassengerAccessState
        title="Loading your ride history"
        body="Checking your passenger session before opening trip history."
        actionLabel="Go to login"
        actionHref="/login"
      />
    );
  }

  if (status !== "authenticated" || !isPassenger || !session) {
    return (
      <PassengerAccessState
        title="Passenger sign in required"
        body="Use a passenger account to access your trip history."
        actionLabel="Go to passenger login"
        actionHref="/login"
      />
    );
  }

  return (
    <PassengerShell
      session={session}
      preferredWallet={preferredWallet}
      activeTab="history"
      signOut={signOut}
    >
      <section className="exact-passenger-content">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="kicker">Trip history</p>
            <h1 className="m-0 font-display text-[clamp(2rem,4vw,3rem)] tracking-[-0.05em] text-slate-900">
              Ride History
            </h1>
            <p className="body-muted mt-2 max-w-2xl">
              View your real completed and cancelled trips from the backend ride ledger.
            </p>
          </div>

          <label className="flex w-full max-w-[220px] flex-col gap-2 text-sm font-medium text-slate-500">
            Filter rides
            <select
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm outline-none"
              value={filter}
              onChange={(event) => setFilter(event.target.value as RideFilter)}
            >
              <option value="all">All rides</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="block text-sm text-slate-500">Total rides</span>
            <strong className="mt-2 block text-3xl text-slate-900">{passengerRides.length}</strong>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="block text-sm text-slate-500">Completed</span>
            <strong className="mt-2 block text-3xl text-slate-900">{completedCount}</strong>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="block text-sm text-slate-500">Cancelled</span>
            <strong className="mt-2 block text-3xl text-slate-900">{cancelledCount}</strong>
          </article>
        </div>

        {filteredRides.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <strong className="block text-lg text-slate-900">No rides match this filter yet.</strong>
            <p className="mt-2 text-slate-500">
              Once you complete or cancel a trip, it will appear in this history timeline automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRides.map((ride) => {
              const isExpanded = expandedRide === ride.id;

              return (
                <article
                  key={ride.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    className="flex w-full flex-col gap-4 p-5 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-start sm:justify-between"
                    onClick={() => setExpandedRide(isExpanded ? null : ride.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 rounded-full bg-slate-100 p-3 text-slate-500">
                        <MapPin className="h-5 w-5" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">{formatRideDate(ride.createdAt)}</span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              ride.status === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : ride.status === "cancelled"
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {formatStatus(ride.status)}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-600" />
                            <span>{ride.pickupAddress}</span>
                          </div>
                          <div className="ml-1 h-4 w-px bg-slate-300" />
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-sm bg-orange-500" />
                            <span>{ride.destinationAddress}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                      <div>
                        <div className="text-right text-2xl font-bold text-slate-900">
                          {formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {isExpanded ? "Hide details" : "Show details"}
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="grid gap-4 border-t border-slate-200 bg-slate-50 p-5 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-3xl border border-slate-200 bg-white p-5">
                        <p className="kicker mb-3">Route Summary</p>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-1 h-3 w-3 rounded-full bg-emerald-600" />
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pickup</p>
                              <p className="mt-1 text-sm text-slate-700">{ride.pickupAddress}</p>
                            </div>
                          </div>
                          <div className="ml-1.5 h-8 w-px bg-slate-300" />
                          <div className="flex items-start gap-3">
                            <span className="mt-1 h-3 w-3 rounded-sm bg-orange-500" />
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Destination</p>
                              <p className="mt-1 text-sm text-slate-700">{ride.destinationAddress}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-5">
                        <p className="kicker mb-3">Trip Details</p>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">Trip ID</span>
                            <span className="font-medium text-slate-900">{ride.id}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">Rider</span>
                            <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                              <UserRound className="h-4 w-4 text-slate-400" />
                              {ride.rider?.user.fullName ?? "Not assigned"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">Payment</span>
                            <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                              <CreditCard className="h-4 w-4 text-slate-400" />
                              {formatPaymentMethod(ride.paymentMethod)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">Fare</span>
                            <span className="font-medium text-slate-900">
                              {formatMoney(ride.currency, ride.finalFare ?? ride.estimatedFare)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PassengerShell>
  );
}
