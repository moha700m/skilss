import type { MetadataRoute } from "next";
import { skills, snapshot } from "@/lib/skills";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://skillatlas.dev").replace(/\/$/, "");
  const lastModified = new Date(snapshot.upstreamCommitDate || snapshot.syncedAt);
  const staticRoutes = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/agent", priority: 0.95, changeFrequency: "daily" as const },
    { path: "/explore", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/learn", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route.path}`,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...skills.map((skill) => ({
      url: `${baseUrl}/skills/${skill.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: skill.featured ? 0.8 : 0.6,
    })),
  ];
}
