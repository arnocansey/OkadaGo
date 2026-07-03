import { redirect } from "next/navigation";

const screenRedirects: Record<string, string> = {
  dashboard: "/rider",
  drive: "/rider",
  home: "/rider",
  earnings: "/rider/earnings",
  trips: "/rider/trips",
  history: "/rider/trips",
  profile: "/rider/profile",
  login: "/rider/login",
  signup: "/rider/signup"
};

export default async function RiderLegacyScreenPage({
  params
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  const destination = screenRedirects[screen.toLowerCase()];
  if (destination) {
    redirect(destination);
  }
  redirect("/rider");
}
