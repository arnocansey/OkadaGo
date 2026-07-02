import "@/components/passenger/styles.css";
import { GoogleMapsProvider } from "@/components/passenger/map/google-maps-provider";
import { PaxToaster } from "@/components/passenger/ui/pax-toaster";

export default function PassengerLayout({ children }: { children: React.ReactNode }) {
  return (
    <GoogleMapsProvider>
      {children}
      <PaxToaster />
    </GoogleMapsProvider>
  );
}
