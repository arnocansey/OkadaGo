import { AuthPages } from "@/okada-ui/screens/okada-auth/AuthPages";

export const metadata = {
  title: "Rider Login | OkadaGo"
};

export default function RiderLoginPage() {
  return <AuthPages initialAuthState="login" audience="rider" />;
}
