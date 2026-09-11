import type { MetadataRoute } from "next";
import { getAllPublishedOpportunityIds } from "@/lib/data/opportunities";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/fresher-jobs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/tech-jobs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/off-campus-jobs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/opportunities`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/companies`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/terms`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${siteUrl}/refund-policy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const opportunities = await getAllPublishedOpportunityIds();
  const opportunityRoutes: MetadataRoute.Sitemap = opportunities.map((opportunity) => ({
    url: `${siteUrl}/opportunities/${opportunity.id}`,
    lastModified: opportunity.updated_at,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...opportunityRoutes];
}
