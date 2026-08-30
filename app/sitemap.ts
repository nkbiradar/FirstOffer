import type { MetadataRoute } from "next";
import { getAllPublishedOpportunityIds } from "@/lib/data/opportunities";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/opportunities`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/companies`, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/refund-policy`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const opportunities = await getAllPublishedOpportunityIds();
  const opportunityRoutes: MetadataRoute.Sitemap = opportunities.map((opportunity) => ({
    url: `${siteUrl}/opportunities/${opportunity.id}`,
    lastModified: opportunity.updated_at,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticRoutes, ...opportunityRoutes];
}
