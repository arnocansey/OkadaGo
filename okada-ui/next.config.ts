import type { NextConfig } from "next";

const adminAppUrl = (process.env.NEXT_PUBLIC_ADMIN_APP_URL || "https://admin.okadago.com").replace(
  /\/$/,
  ""
);

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/admin", destination: `${adminAppUrl}/`, permanent: false },
      { source: "/admin/:path*", destination: `${adminAppUrl}/:path*`, permanent: false },
      { source: "/passenger/history", destination: "/passenger/trips", permanent: true },
      { source: "/passenger/settings", destination: "/passenger/profile", permanent: true },
      { source: "/passenger/service", destination: "/passenger", permanent: true },
      { source: "/passenger/home", destination: "/passenger", permanent: true },
      { source: "/passenger/ride-history", destination: "/passenger/trips", permanent: true },
      { source: "/passenger/dashboard", destination: "/passenger", permanent: true },
      { source: "/passenger/saved-places", destination: "/passenger/places", permanent: true },
      { source: "/passenger/payment-methods", destination: "/passenger/payments", permanent: true },
      { source: "/passenger/emergency-contacts", destination: "/passenger/safety", permanent: true },
      { source: "/rider/dashboard", destination: "/rider", permanent: true },
      { source: "/rider/drive", destination: "/rider", permanent: true },
      { source: "/rider/home", destination: "/rider", permanent: true },
      { source: "/rider/history", destination: "/rider/trips", permanent: true }
    ];
  }
};

export default nextConfig;
