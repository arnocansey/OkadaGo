import "@/components/passenger/styles.css";
import { PassengerProviders } from "@/components/passenger/layout/passenger-providers";

export default function PassengerLayout({ children }: { children: React.ReactNode }) {
  return <PassengerProviders>{children}</PassengerProviders>;
}
