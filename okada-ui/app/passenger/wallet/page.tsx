import { Suspense } from "react";
import { WalletView } from "@/components/passenger/pages/wallet-view";
import { OkadaLoaderPage } from "@/components/ui/OkadaLoader";

export const metadata = {
  title: "OkadaGo | Wallet"
};

export default function PassengerWalletPage() {
  return (
    <Suspense fallback={<OkadaLoaderPage className="pax-app" />}>
      <WalletView />
    </Suspense>
  );
}
