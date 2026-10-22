import type { MetadataRoute } from "next";

import { config } from "@/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: config.app.name,
    short_name: config.app.name,
    description: config.app.description,
    // Signed-out visitors are sent on to /login?redirectTo=/dashboard.
    start_url: "/dashboard",
    scope: "/",
    display: "browser",
    orientation: "portrait",
    background_color: "#f6efd9",
    theme_color: "#f6efd9",
    // Poofsy brand icons (SVG scales to every size the install prompt asks for).
    icons: [
      { src: "/images/poofsy-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
