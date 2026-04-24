import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OkadaGo",
    short_name: "OkadaGo",
    description: "A progressive web app control surface for motorcycle mobility operations.",
    start_url: "/",
    display: "standalone",
    background_color: "#061610",
    theme_color: "#1b6d3e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
