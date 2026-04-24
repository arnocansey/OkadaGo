import { AuthPages } from "@/okada-ui/screens/okada-auth/AuthPages";

export const metadata = {
  title: "Forgot Password | OkadaGo"
};

export default function ForgotPasswordPage() {
  return <AuthPages initialAuthState="forgot" audience="passenger" />;
}
