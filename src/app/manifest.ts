import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WaterSense · Chihuahua",
    short_name: "WaterSense",
    description: "Audita y optimiza el riego: energía, agua y futuro de tu pozo.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#EEF4F4",
    theme_color: "#2270B8",
    lang: "es",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
