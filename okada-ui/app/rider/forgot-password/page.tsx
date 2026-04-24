import { AuthPages } from "@/okada-ui/screens/okada-auth/AuthPages";

export const metadata = {
  title: "Rider Forgot Password | OkadaGo"
};

export default function RiderForgotPasswordPage() {
  return <AuthPages initialAuthState="forgot" audience="rider" />;
}
