import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OkadaGo",
    short_name: "OkadaGo",
    description: "A progressive web app control surface for motorcycle mobility operations.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f19",
    theme_color: "#facc15",
    icons: [
      {
        src: "/branding/okadago-icon-dark.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
