import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "March Madness 2026 Tracker",
    short_name: "Madness 2026",
    description: "Every game. Every channel. Every stream. Auto-updating NCAA tournament schedule.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a1628",
    theme_color: "#4a90e2",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
