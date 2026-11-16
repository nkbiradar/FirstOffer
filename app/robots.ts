import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/*",
        "/api",
        "/api/*",
        "/dashboard",
        "/dashboard/*",
        "/login",
        "/auth",
        "/auth/*",
        // Endless search/filter combinations of the listing pages: their
        // canonical is the clean URL, so crawling every variant only wastes
        // Google's crawl budget (and our database quota). Clean landing pages
        // like /jobs/* and /fresher-jobs/* stay fully crawlable.
        "/opportunities?*",
        "/companies?*",
        "/*?q=*",
        "/*&q=*",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
