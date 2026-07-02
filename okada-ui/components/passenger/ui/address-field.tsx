"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Search } from "lucide-react";
import { useAddressSearch } from "@/components/passenger/hooks/use-address-search";

type AddressFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  kind: "pickup" | "dropoff";
  proximity?: { lat: number; lng: number } | null;
  onChange: (value: string) => void;
  onSelect: (place: { label: string; lat: number; lng: number }) => void;
  showUseCurrentLocation?: boolean;
  onUseCurrentLocation?: () => void;
  useCurrentLocationLoading?: boolean;
};

export function AddressField({
  label,
  value,
  placeholder,
  kind,
  proximity,
  onChange,
  onSelect,
  showUseCurrentLocation = false,
  onUseCurrentLocation,
  useCurrentLocationLoading = false
}: AddressFieldProps) {
  const { suggestions, loading, search, pick, clear } = useAddressSearch(proximity);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        clear();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [clear]);

  return (
    <div ref={wrapRef} className="pax-address-field">
      <label className="pax-field-label">{label}</label>
      <div className="pax-address-input-wrap">
        <div className={`pax-address-dot pax-address-dot--${kind === "pickup" ? "pickup" : "dropoff"}`} />
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          className="pax-address-input"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            void search(e.target.value);
          }}
        />
        {loading ? <div className="pax-spinner" style={{ width: "1rem", height: "1rem", borderWidth: "2px" }} /> : (
          <Search className="h-4 w-4 shrink-0 pax-text-muted" />
        )}
      </div>

      {showUseCurrentLocation ? (
        <button
          type="button"
          className="pax-use-location-btn"
          disabled={useCurrentLocationLoading}
          onClick={onUseCurrentLocation}
        >
          <Navigation size={14} className={useCurrentLocationLoading ? "animate-pulse" : ""} />
          {useCurrentLocationLoading ? "Getting location…" : "Use current location"}
        </button>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul className="pax-suggestions">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="pax-suggestion-item"
                onClick={async () => {
                  const resolved = await pick(item);
                  if (resolved) {
                    onSelect({
                      label: resolved.fullAddress || resolved.name,
                      lat: resolved.lat,
                      lng: resolved.lng
                    });
                    onChange(resolved.fullAddress || resolved.name);
                  } else {
                    onChange(item.fullAddress || item.name);
                  }
                  setOpen(false);
                  clear();
                }}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 pax-text-primary" />
                <div>
                  <div className="pax-suggestion-name">{item.name}</div>
                  <div className="pax-suggestion-address">{item.fullAddress}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
