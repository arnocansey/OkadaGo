import { Suspense } from "react";
import { DeliveryView } from "@/components/passenger/pages/delivery-view";
import { OkadaLoaderPage } from "@/components/ui/OkadaLoader";

export const metadata = {
  title: "OkadaGo | Send a package"
};

export default function PassengerDeliveryPage() {
  return (
    <Suspense fallback={<OkadaLoaderPage className="pax-app" />}>
      <DeliveryView />
    </Suspense>
  );
}
