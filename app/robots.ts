import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

// Wasn't present before — search engines had no explicit guidance and
// would happily crawl /admin/* and /api/* (harmless since those are
// already auth-gated, but wasteful crawl budget and noisy in search
// results). Everything public stays open.
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
