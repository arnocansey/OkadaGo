"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import type { PlaceSuggestion } from "@/lib/place-search";
import { Skeleton } from "@/components/ui/skeleton";
import { currencySymbol } from "@/lib/currency";
import { type FormState } from "./hooks/usePlaceSearch";
import { PickupDestinationInput } from "./pickup-destination-input";
import { RideTypeSelector } from "./ride-type-selector";
import { DeliveryForm } from "./delivery-form";

export function BookingSidebarSkeleton() {
  return (
    <aside className="exact-passenger-sidebar">
      <div className="exact-sidebar-scroll">
        <section className="exact-sidebar-block">
          <Skeleton style={{ width: 180, height: 22 }} />

          <div className="button-row" style={{ marginTop: 18 }}>
            <Skeleton style={{ width: 80, height: 48, borderRadius: 999 }} />
            <Skeleton style={{ width: 96, height: 48, borderRadius: 999 }} />
          </div>

          <div className="exact-zone-card" style={{ marginTop: 18 }}>
            <Skeleton style={{ width: 100, height: 12 }} />
            <Skeleton className="mt-2" style={{ width: 160, height: 16 }} />
            <Skeleton className="mt-2" style={{ width: "100%", height: 12 }} />
          </div>

          <div style={{ marginTop: 18 }}>
            <Skeleton style={{ width: "100%", height: 56, borderRadius: 12 }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <Skeleton style={{ width: "100%", height: 56, borderRadius: 12 }} />
          </div>

          <div style={{ marginTop: 18 }}>
            <Skeleton style={{ width: "100%", height: 48, borderRadius: 999 }} />
          </div>

          <div className="button-row" style={{ marginTop: 18 }}>
            <Skeleton style={{ flex: 1, height: 48, borderRadius: 999 }} />
            <Skeleton style={{ width: 120, height: 48, borderRadius: 999 }} />
          </div>
        </section>
      </div>

      <footer className="exact-passenger-footer">
        <div className="exact-payment-row">
          <Skeleton style={{ width: 56, height: 24, borderRadius: 999 }} />
          <Skeleton style={{ width: 120, height: 14 }} />
        </div>
        <Skeleton style={{ width: "100%", height: 52, borderRadius: 999 }} />
      </footer>
    </aside>
  );
}

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

type FareEstimateResponse = {
  pricing: {
    totalFare: number;
    riderEarnings: number;
    platformCommission: number;
  };
};

type RideCreationResponse = {
  ride: { id: string };
};

type DeliveryCreationResponse = {
  delivery: { id: string };
};

type DeliveryFormState = {
  recipientName: string;
  recipientPhoneE164: string;
  packageType: string;
  packageDescription: string;
};

function getRideTypeLabel(rideType: string) {
  return rideType === "express_bike" ? "Express Bike" : "Standard Bike";
}

type BookingSidebarProps = {
  bookingMode: "ride" | "delivery";
  setBookingMode: (mode: "ride" | "delivery") => void;
  rideType: "standard_bike" | "express_bike";
  setRideType: (rideType: "standard_bike" | "express_bike") => void;
  paymentMethod: "wallet" | "cash" | "card" | "mobile_money";
  setPaymentMethod: (method: "wallet" | "cash" | "card" | "mobile_money") => void;
  deliveryForm: DeliveryFormState;
  setDeliveryForm: React.Dispatch<React.SetStateAction<DeliveryFormState>>;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  selectedZone: ServiceZoneRecord | null;
  zones: ServiceZoneRecord[];
  estimateMutation: UseMutationResult<FareEstimateResponse, Error, void>;
  createRideMutation: UseMutationResult<RideCreationResponse, Error, void>;
  createDeliveryMutation: UseMutationResult<DeliveryCreationResponse, Error, void>;
  recentDestinations: string[];
  pickupSuggestions: PlaceSuggestion[];
  pickupSuggestionsPending: boolean;
  pickupSuggestionsError: string | null;
  choosePickupSuggestion: (suggestion: PlaceSuggestion) => Promise<void>;
  destinationSuggestions: PlaceSuggestion[];
  destinationSuggestionsPending: boolean;
  destinationSuggestionsError: string | null;
  chooseDestinationSuggestion: (suggestion: PlaceSuggestion) => Promise<void>;
  preferredCurrency: string;
};

export function BookingSidebar({
  bookingMode,
  setBookingMode,
  rideType,
  setRideType,
  paymentMethod,
  setPaymentMethod,
  deliveryForm,
  setDeliveryForm,
  form,
  setForm,
  selectedZone,
  zones,
  estimateMutation,
  createRideMutation,
  createDeliveryMutation,
  recentDestinations,
  pickupSuggestions,
  pickupSuggestionsPending,
  pickupSuggestionsError,
  choosePickupSuggestion,
  destinationSuggestions,
  destinationSuggestionsPending,
  destinationSuggestionsError,
  chooseDestinationSuggestion,
  preferredCurrency
}: BookingSidebarProps) {
  return (
    <aside className="exact-passenger-sidebar">
      <div className="exact-sidebar-scroll">
        <section className="exact-sidebar-block">
          <h2>{bookingMode === "delivery" ? "Book a delivery" : "Book a live ride"}</h2>

          <div className="button-row" style={{ marginTop: 18 }}>
            {(["ride", "delivery"] as const).map((mode) => (
              <button
                key={mode}
                className={bookingMode === mode ? "button" : "button-secondary"}
                type="button"
                onClick={() => setBookingMode(mode)}
              >
                {mode === "delivery" ? "Delivery" : "Ride"}
              </button>
            ))}
          </div>

          <div className="exact-zone-card" style={{ marginTop: 18 }}>
            <span className="exact-zone-label">Operating zone</span>
            <strong>
              {selectedZone ? `${selectedZone.name} - ${selectedZone.city}` : "Loading zone"}
            </strong>
            <p>
              {selectedZone
                ? `Ride pricing and nearby rider matching are currently using ${selectedZone.city}.`
                : "Waiting for the live service zone feed from the backend."}
            </p>
          </div>

          <PickupDestinationInput
            pickupAddress={form.pickupAddress}
            destinationAddress={form.destinationAddress}
            bookingMode={bookingMode}
            recentDestinations={recentDestinations}
            setForm={setForm}
            pickupSuggestions={pickupSuggestions}
            pickupSuggestionsPending={pickupSuggestionsPending}
            pickupSuggestionsError={pickupSuggestionsError}
            choosePickupSuggestion={choosePickupSuggestion}
            destinationSuggestions={destinationSuggestions}
            destinationSuggestionsPending={destinationSuggestionsPending}
            destinationSuggestionsError={destinationSuggestionsError}
            chooseDestinationSuggestion={chooseDestinationSuggestion}
          />

          <details className="exact-dev-disclosure">
            <summary>Advanced route inputs</summary>
            <p className="body-muted">
              The service zone selector and raw route fields are only for manual testing while
              map search and route calculation are still being wired up.
            </p>
            <div className="field-group" style={{ marginTop: 18 }}>
              <label className="field-label" htmlFor="service-zone-select">Service zone</label>
              <select
                id="service-zone-select"
                className="select"
                value={form.serviceZoneId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    serviceZoneId: event.target.value
                  }))
                }
              >
                <option value="">Select a zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} - {zone.city}
                  </option>
                ))}
              </select>
            </div>
            <div className="four-up" style={{ marginTop: 18 }}>
              {[
                ["pickupLatitude", "Pickup lat"],
                ["pickupLongitude", "Pickup lng"],
                ["destinationLatitude", "Destination lat"],
                ["destinationLongitude", "Destination lng"],
                ["estimatedDistanceKm", "Distance km"],
                ["estimatedDurationMinutes", "Duration min"]
              ]              .map(([name, label]) => (
                <div className="field-group" key={name}>
                  <label className="field-label" htmlFor={`route-${name}`}>{label}</label>
                  <input
                    id={`route-${name}`}
                    className="input"
                    value={form[name as keyof typeof form]}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [name]: event.target.value
                      }))
                    }
                    placeholder={label}
                  />
                </div>
              ))}
            </div>
          </details>

          {bookingMode === "delivery" ? (
            <DeliveryForm
              deliveryForm={deliveryForm}
              setDeliveryForm={setDeliveryForm}
            />
          ) : null}

          {bookingMode === "ride" ? (
            <RideTypeSelector
              rideType={rideType}
              setRideType={setRideType}
              selectedZone={selectedZone}
              estimateFare={estimateMutation.data?.pricing.totalFare ?? null}
              preferredCurrency={preferredCurrency}
            />
          ) : null}

          <div className="button-row" style={{ marginTop: 18 }}>
            <select
              id="payment-method-select"
              className="select"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(
                  event.target.value as "wallet" | "cash" | "card" | "mobile_money"
                )
              }
              aria-label="Payment method"
            >
              <option value="wallet">Wallet</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile_money">Mobile money</option>
            </select>
            <button
              className="button-secondary"
              type="button"
              onClick={() => estimateMutation.mutate()}
              disabled={estimateMutation.isPending}
            >
              {estimateMutation.isPending ? "Calculating..." : "Estimate fare"}
            </button>
          </div>

          {estimateMutation.isError ? (
            <div className="empty-state" style={{ marginTop: 18 }} aria-live="polite">
              <strong>Fare estimate failed.</strong>
              <p>{estimateMutation.error.message}</p>
            </div>
          ) : null}

          {createRideMutation.isError ? (
            <div className="empty-state" style={{ marginTop: 18 }}>
              <strong>Ride request failed.</strong>
              <p>{createRideMutation.error.message}</p>
            </div>
          ) : null}

          {createDeliveryMutation.isError ? (
            <div className="empty-state" style={{ marginTop: 18 }}>
              <strong>Delivery request failed.</strong>
              <p>{createDeliveryMutation.error.message}</p>
            </div>
          ) : null}
        </section>
      </div>

      <footer className="exact-passenger-footer">
        <div className="exact-payment-row">
          <div className="exact-cash-badge">{paymentMethod.toUpperCase()}</div>
          <span>
            {selectedZone
              ? `${selectedZone.city} - ${currencySymbol(selectedZone.currency)}`
              : "Select a service zone"}
          </span>
        </div>
        <button
          className="exact-primary-cta"
          type="button"
          onClick={() =>
            bookingMode === "delivery"
              ? createDeliveryMutation.mutate()
              : createRideMutation.mutate()
          }
          disabled={createRideMutation.isPending || createDeliveryMutation.isPending}
        >
          {createRideMutation.isPending
            ? "Requesting ride..."
            : createDeliveryMutation.isPending
              ? "Requesting delivery..."
              : bookingMode === "delivery"
                ? "Book delivery"
                : `Book ${getRideTypeLabel(rideType)}`}
        </button>
      </footer>
    </aside>
  );
}
