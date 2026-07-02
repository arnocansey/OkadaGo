import { fetchJson } from "./api";

export type LocationResult = {
  label: string;
  displayName?: string | null;
  formattedAddress?: string | null;
  shortLabel?: string | null;
  latitude: number;
  longitude: number;
};

/** Strip trailing country/postcode noise while keeping street-level detail. */
export function trimAddressForDisplay(value: string): string {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  while (parts.length > 1 && /^(ghana|gh)$/i.test(parts[parts.length - 1] ?? "")) {
    parts.pop();
  }

  while (parts.length > 1 && /^[\dA-Z-]{3,}$/.test(parts[parts.length - 1] ?? "")) {
    parts.pop();
  }

  return parts.join(", ");
}

/** Turn reverse-geocode API result into a human-readable street-level address. */
export function formatReverseGeocodeAddress(result: LocationResult): string {
  const full = result.formattedAddress?.trim() || result.displayName?.trim() || "";
  if (full) return trimAddressForDisplay(full);

  const compact = result.shortLabel?.trim() ?? "";
  if (compact) return compact;

  const label = result.label?.trim() ?? "";
  const stripped = label.replace(/^Current location,?\s*/i, "").trim();
  if (stripped && stripped.toLowerCase() !== "current location") return stripped;

  return label || "Current location";
}

export async function reverseGeocode(lat: number, lon: number): Promise<LocationResult> {
  return fetchJson<LocationResult>(`/bootstrap/reverse-geocode?lat=${lat}&lon=${lon}`);
}

export async function forwardGeocode(query: string): Promise<LocationResult | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;
  return fetchJson<LocationResult>(`/bootstrap/forward-geocode?q=${encodeURIComponent(trimmed)}`);
}

export async function resolveAddressLabel(lat: number, lon: number): Promise<string> {
  try {
    const result = await reverseGeocode(lat, lon);
    return formatReverseGeocodeAddress(result);
  } catch {
    return "Current location";
  }
}
