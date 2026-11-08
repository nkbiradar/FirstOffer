// Thin-content guard for the keyword (/jobs/<slug>) and city
// (/fresher-jobs/<city>) landing pages.
//
// The site only has a few dozen live listings at a time, so many landing
// pages end up showing the same handful of jobs. Google treats lots of
// near-empty / near-duplicate pages as low quality, which can pull down
// rankings for the whole site. So a landing page is only indexed (and only
// listed in the sitemap) when it has enough live openings to be genuinely
// useful, and pages that duplicate another page point their canonical there.
import type { ListOpportunitiesOptions } from "@/lib/data/opportunities";
import { getPublishedOpportunities } from "@/lib/data/opportunities";

/** Fewer live openings than this = thin page: noindex + left out of the sitemap. */
export const MIN_INDEXABLE_LISTINGS = 5;

export function isIndexable(total: number, canonicalPath?: string): boolean {
  return !canonicalPath && total >= MIN_INDEXABLE_LISTINGS;
}

export async function liveCount(filter: ListOpportunitiesOptions): Promise<number> {
  const { total } = await getPublishedOpportunities({ ...filter, pageSize: 1 });
  return total;
}
