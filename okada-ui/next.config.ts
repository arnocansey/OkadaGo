import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/passenger/history", destination: "/passenger/trips", permanent: true },
      { source: "/passenger/settings", destination: "/passenger/profile", permanent: true },
      { source: "/passenger/service", destination: "/passenger", permanent: true },
      { source: "/passenger/home", destination: "/passenger", permanent: true },
      { source: "/passenger/ride-history", destination: "/passenger/trips", permanent: true },
      { source: "/passenger/dashboard", destination: "/passenger", permanent: true },
      { source: "/passenger/saved-places", destination: "/passenger/places", permanent: true },
      { source: "/passenger/payment-methods", destination: "/passenger/payments", permanent: true },
      { source: "/passenger/emergency-contacts", destination: "/passenger/safety", permanent: true }
    ];
  }
};

export default nextConfig;
