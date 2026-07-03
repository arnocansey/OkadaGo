"use client";

import { GoogleMapsProvider } from "@/components/passenger/map/google-maps-provider";
import { PaxToaster } from "@/components/passenger/ui/pax-toaster";

export function PassengerProviders({ children }: { children: React.ReactNode }) {
  return (
    <GoogleMapsProvider>
      {children}
      <PaxToaster />
    </GoogleMapsProvider>
  );
}
