const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

export function hasGoogleMapsKey() {
  return Boolean(googleMapsKey);
}
