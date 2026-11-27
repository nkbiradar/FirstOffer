// Data for the company landing pages: /companies/<slug> (app/companies/[slug]).
//
// Each page targets "<company> jobs for freshers" / "<company> off campus
// drive" searches. It shows the company's live openings plus a short history
// of the roles it has posted on FirstOffer before — that history is what
// keeps the page useful (and not thin content) between hiring rounds.
//
// Past (expired) rows aren't readable with the public key (RLS only exposes
// live listings), so the history is read server-side with the admin client.
// Only harmless public fields are selected (role, location, type, date) and
// Internal HR Openings are always excluded, exactly like the public listings.
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/server";

/** A company page is indexed (and listed in the sitemap) only once the
 * company has posted at least this many public openings on FirstOffer. */
export const MIN_COMPANY_LISTINGS = 5;

export type CompanySummary = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
};

export type PastOpening = {
  id: string;
  role: string;
  location: string | null;
  opportunity_type: string | null;
  published_at: string | null;
};

export async function getCompanyBySlug(slug: string): Promise<CompanySummary | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  const supabase = await createPublicClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, logo_url, website")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getCompanyBySlug failed:", error.message);
    return null;
  }
  return (data as CompanySummary | null) ?? null;
}

/** Every public opening this company has posted (live + expired), newest first. */
export async function getCompanyHistory(
  companyId: string,
  limit = 12,
): Promise<{ total: number; recent: PastOpening[] }> {
  const admin = createAdminClient();
  const { data, error, count } = await admin
    .from("opportunities")
    .select("id, role, location, opportunity_type, published_at", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_internal", false)
    .in("status", ["published", "expired"])
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) {
    console.error("getCompanyHistory failed:", error.message);
    return { total: 0, recent: [] };
  }
  return { total: count ?? 0, recent: (data ?? []) as PastOpening[] };
}

export function isCompanyIndexable(totalPosted: number): boolean {
  return totalPosted >= MIN_COMPANY_LISTINGS;
}

/**
 * Slugs (with their latest posting date) of every company with enough public
 * openings to be indexed — for the sitemap. Paged because PostgREST caps a
 * single response at 1,000 rows.
 */
async function loadIndexableCompanies(): Promise<{ slug: string; lastPublished: string | null }[]> {
  const admin = createAdminClient();
  const stats = new Map<string, { count: number; last: string | null }>();
  const PAGE = 1000;
  for (let from = 0; from < 50_000; from += PAGE) {
    const { data, error } = await admin
      .from("opportunities")
      .select("company_id, published_at")
      .eq("is_internal", false)
      .in("status", ["published", "expired"])
      .not("company_id", "is", null)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("loadIndexableCompanies failed:", error.message);
      break;
    }
    const rows = (data ?? []) as { company_id: string; published_at: string | null }[];
    for (const row of rows) {
      const cur = stats.get(row.company_id) ?? { count: 0, last: null };
      cur.count += 1;
      if (row.published_at && (!cur.last || row.published_at > cur.last)) cur.last = row.published_at;
      stats.set(row.company_id, cur);
    }
    if (rows.length < PAGE) break;
  }

  const ids = [...stats.entries()].filter(([, v]) => isCompanyIndexable(v.count)).map(([id]) => id);
  if (ids.length === 0) return [];

  const result: { slug: string; lastPublished: string | null }[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await admin.from("companies").select("id, slug").in("id", ids.slice(i, i + 200));
    if (error) {
      console.error("loadIndexableCompanies (companies) failed:", error.message);
      continue;
    }
    for (const c of (data ?? []) as { id: string; slug: string | null }[]) {
      if (c.slug) result.push({ slug: c.slug, lastPublished: stats.get(c.id)?.last ?? null });
    }
  }
  return result;
}

export const getIndexableCompaniesCached = unstable_cache(loadIndexableCompanies, ["indexable-companies-v1"], {
  revalidate: 60 * 60,
  tags: ["public-data"],
});
