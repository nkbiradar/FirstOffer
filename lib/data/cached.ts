// Cross-request caches for PUBLIC data that every visitor sees the same way
// (homepage stats, live opportunities, companies, testimonials...). Without
// these, every page view ran ~15 Supabase queries before sending any HTML,
// which made the homepage take 3+ seconds. None of these functions read
// cookies, so they are safe to share between visitors.
// Freshness: opportunities / free pick / announcement refresh every 60s;
// counts, companies and stories every 5 minutes.
import { unstable_cache } from "next/cache";
import { getFreePickOpportunity, getHomepageOpportunities, getSiteStats } from "@/lib/data/opportunities";
import { getCompaniesWithPublishedCounts } from "@/lib/data/companies";
import { getPublishedTestimonials } from "@/lib/data/testimonials";
import { getActiveAnnouncement } from "@/lib/data/site-announcement";
import { getFeaturedInterns } from "@/lib/data/referral-rewards";
import { getPublishedWhatWorked } from "@/lib/data/what-worked";

const MINUTE = 60;

export const getHomepageOpportunitiesCached = unstable_cache(
  (limit: number) => getHomepageOpportunities(limit),
  ["home-opportunities-v1"],
  { revalidate: MINUTE },
);
export const getFreePickOpportunityCached = unstable_cache(() => getFreePickOpportunity(), ["free-pick-v1"], {
  revalidate: MINUTE,
});
export const getActiveAnnouncementCached = unstable_cache(() => getActiveAnnouncement(), ["announcement-v1"], {
  revalidate: MINUTE,
});
export const getSiteStatsCached = unstable_cache(() => getSiteStats(), ["site-stats-v1"], { revalidate: 5 * MINUTE });
export const getCompaniesWithPublishedCountsCached = unstable_cache(
  () => getCompaniesWithPublishedCounts(),
  ["companies-counts-v1"],
  { revalidate: 5 * MINUTE },
);
export const getPublishedTestimonialsCached = unstable_cache(() => getPublishedTestimonials(), ["testimonials-v1"], {
  revalidate: 5 * MINUTE,
});
export const getFeaturedInternsCached = unstable_cache(() => getFeaturedInterns(), ["featured-interns-v1"], {
  revalidate: 5 * MINUTE,
});
export const getPublishedWhatWorkedCached = unstable_cache(
  (limit: number) => getPublishedWhatWorked(limit),
  ["what-worked-v1"],
  { revalidate: 5 * MINUTE },
);
