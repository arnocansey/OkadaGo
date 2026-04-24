import { Suspense } from "react";
import { PassengerWalletPage } from "@/components/passenger/passenger-wallet-page";

export const metadata = {
  title: "Passenger Wallet | OkadaGo"
};

export default function PassengerWalletRoute() {
  return (
    <Suspense fallback={null}>
      <PassengerWalletPage />
    </Suspense>
  );
}
