import { AuthPages } from "@/okada-ui/screens/okada-auth/AuthPages";

export const metadata = {
  title: "Passenger Signup | OkadaGo"
};

export default function SignupPage() {
  return <AuthPages initialAuthState="signup" audience="passenger" />;
}
