import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OkadaGo Operations Console",
    short_name: "OkadaGo Admin",
    description: "Real-time dispatch, rider verification, fleet management, and emergency response console.",
    start_url: "/",
    display: "standalone",
    background_color: "#090d16",
    theme_color: "#090d16",
    orientation: "any",
    scope: "/",
    icons: [
      {
        src: "/branding/okadago-icon-dark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/branding/okadago-icon-yellow.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "Ride Requests",
        short_name: "Rides",
        url: "/requests",
        icons: [{ src: "/branding/okadago-icon-dark.png", sizes: "512x512" }]
      },
      {
        name: "Deliveries",
        short_name: "Deliveries",
        url: "/deliveries",
        icons: [{ src: "/branding/okadago-icon-dark.png", sizes: "512x512" }]
      },
      {
        name: "SOS Incidents",
        short_name: "SOS",
        url: "/sos",
        icons: [{ src: "/branding/okadago-icon-yellow.png", sizes: "512x512" }]
      }
    ]
  };
}
