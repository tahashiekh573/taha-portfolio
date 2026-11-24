import type { MetadataRoute } from "next";
import { getPublishedProjects, getSiteContent } from "@/lib/content";
import { resolveSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ settings }, projects] = await Promise.all([getSiteContent(), getPublishedProjects()]);
  const base = resolveSiteUrl(settings.siteUrl);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: "monthly" as const,
      priority: p.featured ? 0.8 : 0.6,
    })),
  ];
}
