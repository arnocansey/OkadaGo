const googleMapsKey =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
  "AIzaSyCk4zYXEm-ziJQmYH-PuaEp4qS0mj99QV4";

export function hasGoogleMapsKey() {
  return Boolean(googleMapsKey);
}
