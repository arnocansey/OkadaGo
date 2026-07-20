import { Suspense } from "react";
import { DeliveryView } from "@/components/passenger/pages/delivery-view";

export const metadata = {
  title: "OkadaGo | Send a package"
};

export default function PassengerDeliveryPage() {
  return (
    <Suspense
      fallback={
        <div className="pax-app flex min-h-dvh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#0D6B4A] border-t-transparent" />
        </div>
      }
    >
      <DeliveryView />
    </Suspense>
  );
}
