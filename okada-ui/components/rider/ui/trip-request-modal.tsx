"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, Navigation, ShieldCheck, Zap } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { parseNumber, type RideRecord } from "@/components/rider/types";

export function TripRequestModal({
  request,
  onAccept,
  onDecline,
  isPending = false,
  currency = "GHS"
}: {
  request: RideRecord | null;
  onAccept: (rideId: string) => void;
  onDecline: (rideId: string) => void;
  isPending?: boolean;
  currency?: string;
}) {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (!request) return;
    setCountdown(15);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline(request.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [request, onDecline]);

  if (!request) return null;

  const fare = parseNumber(request.estimatedFare ?? request.finalFare);
  const distanceKm = request.estimatedDistanceKm ? Number(request.estimatedDistanceKm).toFixed(1) : "2.5";
  const durationMins = request.estimatedDurationMinutes ? Math.round(Number(request.estimatedDurationMinutes)) : 8;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--rdr-border)] bg-[var(--rdr-surface,#18181b)] shadow-2xl transition-all">
        {/* Header Banner */}
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 text-black">
          <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
            <Zap size={18} className="animate-bounce" />
            <span>New Ride Request</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 font-semibold text-xs text-black">
            <Clock size={14} />
            <span>{countdown}s</span>
          </div>
        </div>

        <div className="p-6">
          {/* Estimated Fare Display */}
          <div className="mb-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimated Earnings</span>
            <div className="mt-1 text-4xl font-extrabold text-amber-400">
              {formatMoney(currency, fare)}
            </div>
          </div>

          {/* Location Breakdown */}
          <div className="mb-6 space-y-4 rounded-xl border border-[var(--rdr-border)] bg-black/30 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <MapPin size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-muted-foreground uppercase">Pickup</div>
                <div className="truncate text-sm font-semibold text-white">
                  {request.pickupAddress || "Pickup location"}
                </div>
              </div>
            </div>

            <div className="ml-3 h-4 border-l-2 border-dashed border-gray-600" />

            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                <Navigation size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-muted-foreground uppercase">Destination</div>
                <div className="truncate text-sm font-semibold text-white">
                  {request.destinationAddress || "Dropoff location"}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mb-6 flex items-center justify-around rounded-xl bg-white/5 p-3 text-center text-xs">
            <div>
              <div className="text-muted-foreground">Trip Distance</div>
              <div className="mt-0.5 font-bold text-white text-sm">{distanceKm} km</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-muted-foreground">Est. Time</div>
              <div className="mt-0.5 font-bold text-white text-sm">~{durationMins} min</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-muted-foreground">Payment</div>
              <div className="mt-0.5 font-bold text-emerald-400 text-sm">
                {(request.paymentMethod || "CASH").toUpperCase()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => onDecline(request.id)}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3.5 font-bold text-white hover:bg-white/10 transition-colors"
            >
              Decline
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => onAccept(request.id)}
              className="flex-[2] rounded-xl bg-amber-400 py-3.5 font-extrabold text-black hover:bg-amber-300 shadow-lg shadow-amber-400/20 transition-all"
            >
              {isPending ? "Accepting…" : "Accept Trip"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
