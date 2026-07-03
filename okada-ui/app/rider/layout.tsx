import "@/components/rider/styles.css";
import { RiderProviders } from "@/components/rider/layout/rider-providers";

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return <RiderProviders>{children}</RiderProviders>;
}
