"use client";

import { GoogleMapsProvider } from "@/components/passenger/map/google-maps-provider";
import { RdrToaster } from "@/components/rider/ui/rdr-toaster";

export function RiderProviders({ children }: { children: React.ReactNode }) {
  return (
    <GoogleMapsProvider>
      {children}
      <RdrToaster />
    </GoogleMapsProvider>
  );
}
