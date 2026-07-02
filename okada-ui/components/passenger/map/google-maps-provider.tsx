"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  if (!googleMapsKey) {
    return children;
  }

  return (
    <APIProvider apiKey={googleMapsKey} libraries={["marker"]}>
      {children}
    </APIProvider>
  );
}

export function hasGoogleMapsKey() {
  return Boolean(googleMapsKey);
}
