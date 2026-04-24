import { AuthPages } from "@/okada-ui/screens/okada-auth/AuthPages";

export const metadata = {
  title: "Rider Signup | OkadaGo"
};

export default function RiderSignupPage() {
  return <AuthPages initialAuthState="signup" audience="rider" />;
}
