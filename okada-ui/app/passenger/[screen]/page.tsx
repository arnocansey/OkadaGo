import { redirect } from "next/navigation";

const screenRedirects: Record<string, string> = {
  home: "/passenger",
  dashboard: "/passenger",
  history: "/passenger/trips",
  "ride-history": "/passenger/trips",
  trips: "/passenger/trips",
  wallet: "/passenger/wallet",
  profile: "/passenger/profile",
  settings: "/passenger/profile",
  service: "/passenger",
  book: "/passenger/book",
  login: "/login",
  signup: "/signup",
  places: "/passenger/places",
  "saved-places": "/passenger/places",
  notifications: "/passenger/notifications",
  payments: "/passenger/payments",
  "payment-methods": "/passenger/payments",
  safety: "/passenger/safety",
  "emergency-contacts": "/passenger/safety"
};

export default async function PassengerLegacyScreenPage({
  params
}: {
  params: Promise<{ screen: string }>;
}) {
  const { screen } = await params;
  const destination = screenRedirects[screen.toLowerCase()];
  if (destination) {
    redirect(destination);
  }
  redirect("/passenger");
}
