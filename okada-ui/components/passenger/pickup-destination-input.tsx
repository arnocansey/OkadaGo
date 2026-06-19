"use client";

import { useRef, useState } from "react";
import { MapPin, Search, Clock } from "lucide-react";
import { fetchJson } from "@/lib/api";
import { type PlaceSuggestion } from "@/lib/place-search";
import {
  type FormState,
  type ForwardGeocodeResponse
} from "./hooks/usePlaceSearch";

type ReverseGeocodeResponse = {
  label: string;
  displayName: string | null;
  latitude: number;
  longitude: number;
};

function tryParseCoordinate(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isWithinGhanaBounds(latitude: number, longitude: number) {
  return latitude >= 4.4 && latitude <= 11.3 && longitude >= -3.4 && longitude <= 1.4;
}

function haversineDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
) {
  const earthRadiusKm = 6371;
  const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLatitude = degreesToRadians(toLatitude - fromLatitude);
  const deltaLongitude = degreesToRadians(toLongitude - fromLongitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(degreesToRadians(fromLatitude)) *
      Math.cos(degreesToRadians(toLatitude)) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDurationMinutes(distanceKm: number) {
  return Math.max(4, Math.round((distanceKm / 22) * 60));
}

type PickupDestinationInputProps = {
  pickupAddress: string;
  destinationAddress: string;
  bookingMode: "ride" | "delivery";
  recentDestinations: string[];
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  pickupSuggestions: PlaceSuggestion[];
  pickupSuggestionsPending: boolean;
  pickupSuggestionsError: string | null;
  choosePickupSuggestion: (suggestion: PlaceSuggestion) => Promise<void>;
  destinationSuggestions: PlaceSuggestion[];
  destinationSuggestionsPending: boolean;
  destinationSuggestionsError: string | null;
  chooseDestinationSuggestion: (suggestion: PlaceSuggestion) => Promise<void>;
};

export function PickupDestinationInput({
  pickupAddress,
  destinationAddress,
  bookingMode,
  recentDestinations,
  setForm,
  pickupSuggestions,
  pickupSuggestionsPending,
  pickupSuggestionsError,
  choosePickupSuggestion,
  destinationSuggestions,
  destinationSuggestionsPending,
  destinationSuggestionsError,
  chooseDestinationSuggestion
}: PickupDestinationInputProps) {
  const [pickupLocationPending, setPickupLocationPending] = useState(false);
  const [pickupLocationError, setPickupLocationError] = useState<string | null>(null);
  const [pickupHighlightIndex, setPickupHighlightIndex] = useState(-1);
  const [destinationHighlightIndex, setDestinationHighlightIndex] = useState(-1);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);

  async function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPickupLocationError("Your browser does not support location access.");
      return;
    }

    setPickupLocationPending(true);
    setPickupLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        let resolvedAddress = "Current location";

        if (
          !isWithinGhanaBounds(latitude, longitude) ||
          !Number.isFinite(accuracy) ||
          accuracy <= 0 ||
          accuracy > 1500
        ) {
          setPickupLocationError(
            "We could not verify a precise Ghana pickup from your device yet. Move to an open area or enter the pickup manually."
          );
          setPickupLocationPending(false);
          return;
        }

        try {
          const lookup = await fetchJson<ReverseGeocodeResponse>(
            `/bootstrap/reverse-geocode?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
          );
          if (!lookup.displayName || lookup.label.trim().toLowerCase() === "current location") {
            throw new Error("Current location could not be resolved to a real place yet.");
          }
          resolvedAddress = lookup.label || resolvedAddress;
        } catch {
          setPickupLocationError(
            "We could not resolve your current location to a reliable place name yet. Please try again or enter the pickup manually."
          );
          setPickupLocationPending(false);
          return;
        }

        setForm((current) => {
          const destLat = tryParseCoordinate(current.destinationLatitude);
          const destLng = tryParseCoordinate(current.destinationLongitude);
          const nextDistance =
            destLat != null && destLng != null
              ? haversineDistanceKm(latitude, longitude, destLat, destLng)
              : null;

          return {
            ...current,
            pickupAddress: resolvedAddress,
            pickupLatitude: latitude.toFixed(6),
            pickupLongitude: longitude.toFixed(6),
            estimatedDistanceKm:
              nextDistance != null ? nextDistance.toFixed(1) : current.estimatedDistanceKm,
            estimatedDurationMinutes:
              nextDistance != null
                ? `${estimateDurationMinutes(nextDistance)}`
                : current.estimatedDurationMinutes
          };
        });
        setPickupLocationPending(false);
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied."
            : "Unable to read your current location right now.";
        setPickupLocationError(message);
        setPickupLocationPending(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }

  function handlePickupKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const count = pickupSuggestions.length;
    if (count === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setPickupHighlightIndex((prev) => (prev + 1) % count);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setPickupHighlightIndex((prev) => (prev - 1 + count) % count);
    } else if (event.key === "Enter" && pickupHighlightIndex >= 0) {
      event.preventDefault();
      void choosePickupSuggestion(pickupSuggestions[pickupHighlightIndex]);
      setPickupHighlightIndex(-1);
    } else if (event.key === "Escape") {
      setPickupHighlightIndex(-1);
    }
  }

  function handleDestinationKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const count = destinationSuggestions.length;
    if (count === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setDestinationHighlightIndex((prev) => (prev + 1) % count);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setDestinationHighlightIndex((prev) => (prev - 1 + count) % count);
    } else if (event.key === "Enter" && destinationHighlightIndex >= 0) {
      event.preventDefault();
      void chooseDestinationSuggestion(destinationSuggestions[destinationHighlightIndex]);
      setDestinationHighlightIndex(-1);
    } else if (event.key === "Escape") {
      setDestinationHighlightIndex(-1);
    }
  }

  return (
    <>
      <div className="exact-location-stack" style={{ marginTop: 18 }}>
        <label className="exact-location-field pickup">
          <span className="exact-location-marker" />
          <input
            ref={pickupInputRef}
            id="pickup-address-input"
            value={pickupAddress}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                pickupAddress: event.target.value,
                pickupLatitude: "",
                pickupLongitude: ""
              }))
            }
            onKeyDown={handlePickupKeyDown}
            placeholder="Pickup address"
            aria-label="Pickup address"
            aria-autocomplete="list"
            aria-expanded={pickupSuggestions.length > 0}
            aria-controls="pickup-suggestions-listbox"
            aria-activedescendant={pickupHighlightIndex >= 0 ? `pickup-option-${pickupHighlightIndex}` : undefined}
            role="combobox"
          />
        </label>
        {pickupSuggestionsPending ||
        pickupSuggestionsError ||
        pickupSuggestions.length > 0 ? (
          <div className="exact-place-suggestion-panel">
            {pickupSuggestionsPending ? (
              <div className="exact-place-suggestion-status">
                Looking up Ghana pickup points...
              </div>
            ) : null}
            {pickupSuggestionsError ? (
              <div className="exact-place-suggestion-status error">
                {pickupSuggestionsError}
              </div>
            ) : null}
            {pickupSuggestions.length > 0 ? (
              <div
                className="exact-place-suggestion-list"
                role="listbox"
                id="pickup-suggestions-listbox"
                aria-label="Pickup suggestions"
              >
                {pickupSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    id={`pickup-option-${index}`}
                    className="exact-place-suggestion-item"
                    type="button"
                    role="option"
                    aria-selected={index === pickupHighlightIndex}
                    onClick={() => {
                      void choosePickupSuggestion(suggestion);
                      setPickupHighlightIndex(-1);
                    }}
                  >
                    <strong>{suggestion.name}</strong>
                    <span>{suggestion.fullAddress}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="exact-location-helper-row">
          <button
            className="exact-location-helper-button"
            type="button"
            onClick={useCurrentLocation}
            disabled={pickupLocationPending}
          >
            <MapPin size={16} />
            {pickupLocationPending ? "Locating..." : "Use current location"}
          </button>
        </div>
        {pickupLocationError ? (
          <p className="body-muted" style={{ color: "#b91c1c", marginTop: 8 }}>
            {pickupLocationError}
          </p>
        ) : null}
        <label className="exact-location-field destination">
          <span className="exact-location-marker square" />
          <input
            ref={destinationInputRef}
            id="destination-address-input"
            value={destinationAddress}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                destinationAddress: event.target.value,
                destinationLatitude: "",
                destinationLongitude: ""
              }))
            }
            onKeyDown={handleDestinationKeyDown}
            placeholder={bookingMode === "delivery" ? "Dropoff address" : "Destination address"}
            aria-label={bookingMode === "delivery" ? "Dropoff address" : "Destination address"}
            aria-autocomplete="list"
            aria-expanded={destinationSuggestions.length > 0}
            aria-controls="destination-suggestions-listbox"
            aria-activedescendant={destinationHighlightIndex >= 0 ? `destination-option-${destinationHighlightIndex}` : undefined}
            role="combobox"
          />
          <Search size={16} />
        </label>
        {destinationSuggestionsPending ||
        destinationSuggestionsError ||
        destinationSuggestions.length > 0 ? (
          <div className="exact-place-suggestion-panel">
            {destinationSuggestionsPending ? (
              <div className="exact-place-suggestion-status">
                Looking up Ghana destinations...
              </div>
            ) : null}
            {destinationSuggestionsError ? (
              <div className="exact-place-suggestion-status error">
                {destinationSuggestionsError}
              </div>
            ) : null}
            {destinationSuggestions.length > 0 ? (
              <div
                className="exact-place-suggestion-list"
                role="listbox"
                id="destination-suggestions-listbox"
                aria-label="Destination suggestions"
              >
                {destinationSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    id={`destination-option-${index}`}
                    className="exact-place-suggestion-item"
                    type="button"
                    role="option"
                    aria-selected={index === destinationHighlightIndex}
                    onClick={() => {
                      void chooseDestinationSuggestion(suggestion);
                      setDestinationHighlightIndex(-1);
                    }}
                  >
                    <strong>{suggestion.name}</strong>
                    <span>{suggestion.fullAddress}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {recentDestinations.length > 0 ? (
        <div className="exact-saved-places">
          {recentDestinations.map((destination) => (
            <button
              key={destination}
              className="exact-saved-place"
              type="button"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  destinationAddress: destination
                }))
              }
            >
              <div className="exact-saved-icon">
                <Clock size={18} />
              </div>
              <div>
                <strong>Recent destination</strong>
                <span>{destination}</span>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
