"use client";

import { Bike, User } from "lucide-react";
import { formatMoney } from "@/lib/currency";

type ServiceZoneRecord = {
  id: string;
  name: string;
  city: string;
  countryCode: "GH" | "NG";
  currency: "GHS" | "NGN";
  baseFare: string | number;
  perKmFee: string | number;
  perMinuteFee: string | number;
  minimumFare: string | number;
  cancellationFee: string | number;
  waitingFeePerMin: string | number;
};

function getRideTypeLabel(rideType: string) {
  return rideType === "express_bike" ? "Express Bike" : "Standard Bike";
}

type RideTypeSelectorProps = {
  rideType: "standard_bike" | "express_bike";
  setRideType: (rideType: "standard_bike" | "express_bike") => void;
  selectedZone: ServiceZoneRecord | null;
  estimateFare: number | null;
  preferredCurrency: string;
};

export function RideTypeSelector({
  rideType,
  setRideType,
  selectedZone,
  estimateFare,
  preferredCurrency
}: RideTypeSelectorProps) {
  return (
    <div className="exact-ride-options">
      <h3>Choose a ride</h3>
      {(["standard_bike", "express_bike"] as const).map((option) => {
        const active = rideType === option;
        const fare =
          estimateFare != null
            ? formatMoney(selectedZone?.currency ?? preferredCurrency, estimateFare)
            : "Estimate fare";

        return (
          <article
            key={option}
            className={`exact-ride-option${active ? " active" : ""}`}
            onClick={() => setRideType(option)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setRideType(option);
              }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`${getRideTypeLabel(option)} ride, ${fare}`}
          >
            {option === "express_bike" ? (
              <div className="exact-option-badge">Priority</div>
            ) : null}
            <div className="exact-ride-icon">
              <Bike size={24} />
            </div>
            <div className="exact-ride-copy">
              <div className="exact-ride-title-row">
                <strong>{getRideTypeLabel(option)}</strong>
                <User size={14} />
              </div>
              <span>
                {selectedZone
                  ? `${selectedZone.city} live pricing`
                  : "Select a zone first"}
              </span>
            </div>
            <div className="exact-ride-fare">{fare}</div>
          </article>
        );
      })}
    </div>
  );
}
