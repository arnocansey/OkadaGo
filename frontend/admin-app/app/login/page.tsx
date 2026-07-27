import { AuthPages } from "@/okada-ui/screens/okada-auth/AuthPages";

export const metadata = {
  title: "Admin Login | OkadaGo"
};

export default function AdminLoginPage() {
  return <AuthPages initialAuthState="login" audience="admin" />;
}
