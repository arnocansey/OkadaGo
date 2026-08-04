import { Suspense } from "react";
import { BookView } from "@/components/passenger/pages/book-view";
import { OkadaLoaderPage } from "@/components/ui/OkadaLoader";

export const metadata = {
  title: "OkadaGo | Book a ride"
};

export default function PassengerBookPage() {
  return (
    <Suspense fallback={<OkadaLoaderPage className="pax-app" />}>
      <BookView />
    </Suspense>
  );
}
