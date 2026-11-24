import type { MetadataRoute } from "next";
import { getSiteContent } from "@/lib/content";
import { resolveSiteUrl } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { settings } = await getSiteContent();
  const base = resolveSiteUrl(settings.siteUrl);
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
