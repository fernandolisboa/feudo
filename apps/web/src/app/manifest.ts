import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Feudo",
    short_name: "Feudo",
    description: "Finanças e inteligência bancária para o lar.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#262626",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
