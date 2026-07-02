import { Suspense } from "react";
import { BookView } from "@/components/passenger/pages/book-view";

export const metadata = {
  title: "OkadaGo | Book a ride"
};

export default function PassengerBookPage() {
  return (
    <Suspense
      fallback={
        <div className="pax-app flex min-h-dvh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#0D6B4A] border-t-transparent" />
        </div>
      }
    >
      <BookView />
    </Suspense>
  );
}
