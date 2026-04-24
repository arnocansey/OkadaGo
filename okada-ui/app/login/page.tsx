import { AuthPages } from "@/okada-ui/screens/okada-auth/AuthPages";

export const metadata = {
  title: "Passenger Login | OkadaGo"
};

export default function LoginPage() {
  return <AuthPages initialAuthState="login" audience="passenger" />;
}
