import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SkillAtlas — أطلس المهارات",
    short_name: "SkillAtlas",
    description: "Discover practical skills for AI agents.",
    start_url: "/",
    display: "standalone",
    background_color: "#111117",
    theme_color: "#8b70f7",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
