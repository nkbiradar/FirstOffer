import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { Opportunity, OpportunityType, WorkMode } from "@/types/supabase";

export type OpportunityCompanySummary = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export type OpportunityWithCompany = Opportunity & {
  company: OpportunityCompanySummary | null;
};

export type ListOpportunitiesOptions = {
  query?: string;
  type?: OpportunityType;
  page?: number;
  pageSize?: number;
  // Additional listing filters (Discovery & SEO enhancement) — all optional
  // and additive; omitting them preserves the exact previous behavior.
  workMode?: WorkMode;
  batch?: string;
  location?: string;
};

export type ListOpportunitiesResult = {
  opportunities: OpportunityWithCompany[];
  total: number;
  page: number;
  pageSize: number;
};

const OPPORTUNITY_SELECT = "*, company:companies(id, name, slug, logo_url)";

/**
 * Removes characters that would otherwise break a PostgREST filter
 * expression (comma is the `or()` separator, parens/%/_ have filter
 * meaning). Keeps search "simple" on purpose — see Step 3 scope.
 */
function sanitizeSearchTerm(term: string) {
  return term
    .trim()
    .replace(/[,()%_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(term: string) {
  return term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryBuilder = any;

/**
 * Builds a PostgREST `or()` filter expression for a simple search across
 * role, company name, and skills — and ONLY returns that string. It must
 * never hand back (or await-and-return) the live query builder itself:
 * Supabase/PostgREST builders are "thenable", so awaiting one inside an
 * async function auto-executes the query instead of letting the caller
 * keep chaining .order()/.range() afterward. Returning a plain string
 * here sidesteps that trap entirely.
 *
 * Skills use array-contains (`cs`), which is case-sensitive, so a few
 * common casing variants are checked to cover typical input like
 * "python" matching a stored skill of "Python".
 */
async function buildSearchFilter(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rawTerm: string,
): Promise<string | null> {
  const term = sanitizeSearchTerm(rawTerm);
  if (!term) return null;

  const { data: matchingCompanies } = await supabase
    .from("companies")
    .select("id")
    .ilike("name", `%${term}%`);

  const companyIds = (matchingCompanies ?? []).map((row: { id: string }) => row.id);

  const skillVariants = Array.from(
    new Set([term, term.toLowerCase(), term.toUpperCase(), titleCase(term)]),
  );

  const orFilters = [
    `role.ilike.%${term}%`,
    ...skillVariants.map((variant) => `skills.cs.{${variant}}`),
  ];

  if (companyIds.length > 0) {
    orFilters.push(`company_id.in.(${companyIds.join(",")})`);
  }

  return orFilters.join(",");
}

/**
 * yyyy-mm-dd "today" in IST — used to compare against the `deadline` date
 * column (see the auto-expiry note below).
 */
function todayDateKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/**
 * Published + not expired. "Not expired" checks two independent things —
 * an opportunity must clear BOTH to stay visible:
 *  - `expires_at` (timestamp) — set automatically by
 *    createOpportunity()/updateOpportunity() in lib/data/admin-opportunities.ts
 *    to `published_at` + 2 days. This is the site's own "nothing stays
 *    listed for more than 2 days" freshness policy, independent of the
 *    job's own deadline.
 *  - `deadline` (date) — the job's own application deadline, entered by
 *    the admin via the form/bulk import. A published opportunity whose
 *    deadline has passed is excluded even if it's still within its 2-day
 *    window.
 * Either one passing is enough to hide it from every public read here,
 * even before the lazy admin-side sweep (see sweepExpiredOpportunities in
 * lib/data/admin-opportunities.ts) gets a chance to flip its `status` to
 * "expired" in the database.
 */
function applyPublishedFilter(builder: QueryBuilder): QueryBuilder {
  return builder
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .or(`deadline.is.null,deadline.gte.${todayDateKey()}`);
}

/** Latest published, non-expired opportunities — used on the homepage. */
export async function getLatestOpportunities(limit = 6): Promise<OpportunityWithCompany[]> {
  const supabase = await createPublicClient();
  const builder = applyPublishedFilter(
    supabase.from("opportunities").select(OPPORTUNITY_SELECT),
  );

  const { data, error } = await builder
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getLatestOpportunities failed:", error.message);
    return [];
  }

  return (data ?? []) as OpportunityWithCompany[];
}

/** yyyy-mm-dd in IST — the site is India-focused (₹, Bengaluru, etc.), so "today" is judged in IST rather than the server's UTC clock. */
function istDateKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export type HomepageOpportunities = {
  today: OpportunityWithCompany[];
  earlier: OpportunityWithCompany[];
  todayDateLabel: string;
};

/**
 * Published, non-expired opportunities split into "published today" (IST)
 * and "earlier" — for the homepage's Today's Opportunities / Earlier
 * Opportunities sections. Both newest-first. Nothing here is hardcoded:
 * every opportunity comes straight from Supabase on every request.
 */
export async function getHomepageOpportunities(limit = 30): Promise<HomepageOpportunities> {
  const supabase = await createPublicClient();
  const builder = applyPublishedFilter(
    supabase.from("opportunities").select(OPPORTUNITY_SELECT),
  );

  const { data, error } = await builder
    .order("published_at", { ascending: false })
    .limit(limit);

  const todayDateLabel = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (error) {
    console.error("getHomepageOpportunities failed:", error.message);
    return { today: [], earlier: [], todayDateLabel };
  }

  const rows = (data ?? []) as OpportunityWithCompany[];
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const today = rows.filter((row) => row.published_at && istDateKey(row.published_at) === todayKey);
  const earlier = rows.filter((row) => !row.published_at || istDateKey(row.published_at) !== todayKey);

  return { today, earlier, todayDateLabel };
}

export type SiteStats = {
  totalOpportunities: number;
  totalCompanies: number;
};

/**
 * Real, live counts for the homepage hero stat tiles — total published
 * (non-expired) opportunities, and how many distinct companies currently
 * have at least one. Purely additive/read-only: does not change any
 * existing query, just two cheap `count: "exact", head: true` lookups.
 */
export async function getSiteStats(): Promise<SiteStats> {
  const supabase = await createPublicClient();

  const [totalResult, companyRowsResult] = await Promise.all([
    applyPublishedFilter(
      supabase.from("opportunities").select("id", { count: "exact", head: true }),
    ),
    applyPublishedFilter(
      supabase.from("opportunities").select("company_id").not("company_id", "is", null),
    ),
  ]);

  if (totalResult.error) {
    console.error("getSiteStats (total) failed:", totalResult.error.message);
  }
  if (companyRowsResult.error) {
    console.error("getSiteStats (companies) failed:", companyRowsResult.error.message);
  }

  const companyIds = new Set(
    ((companyRowsResult.data ?? []) as { company_id: string | null }[]).map((row) => row.company_id),
  );

  return {
    totalOpportunities: totalResult.count ?? 0,
    totalCompanies: companyIds.size,
  };
}

/**
 * Published, non-expired opportunities with optional search/type filters
 * and simple offset pagination — used on the /opportunities listing page.
 */
export async function getPublishedOpportunities(
  options: ListOpportunitiesOptions = {},
): Promise<ListOpportunitiesResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = options.pageSize ?? 12;
  const supabase = await createPublicClient();

  let builder: QueryBuilder = supabase
    .from("opportunities")
    .select(OPPORTUNITY_SELECT, { count: "exact" });
  builder = applyPublishedFilter(builder);

  if (options.type) {
    builder = builder.eq("opportunity_type", options.type);
  }

  if (options.workMode) {
    builder = builder.eq("work_mode", options.workMode);
  }

  if (options.batch) {
    const batchTerm = sanitizeSearchTerm(options.batch);
    if (batchTerm) {
      builder = builder.contains("batch", [batchTerm]);
    }
  }

  if (options.location) {
    const locationTerm = sanitizeSearchTerm(options.location);
    if (locationTerm) {
      builder = builder.ilike("location", `%${locationTerm}%`);
    }
  }

  if (options.query) {
    const searchFilter = await buildSearchFilter(supabase, options.query);
    if (searchFilter) {
      builder = builder.or(searchFilter);
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await builder
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("getPublishedOpportunities failed:", error.message);
    return { opportunities: [], total: 0, page, pageSize };
  }

  return {
    opportunities: (data ?? []) as OpportunityWithCompany[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * A single opportunity by id, for the public detail page. Uses the normal
 * (RLS-scoped) client on purpose: there's no explicit status/expiry filter
 * here because the "Anyone can read published, non-expired opportunities"
 * RLS policy already enforces that — a direct hit on a draft or expired
 * opportunity's id correctly gets no row back, not just a client-side check.
 */
export async function getOpportunityById(id: string): Promise<OpportunityWithCompany | null> {
  const supabase = await createPublicClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select(OPPORTUNITY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getOpportunityById failed:", error.message);
    return null;
  }

  return data as OpportunityWithCompany | null;
}

export type OpportunitySitemapEntry = { id: string; updated_at: string };

/**
 * id + updated_at for every published, non-expired opportunity — used by
 * app/sitemap.ts. A dedicated lightweight query (no company join, no full
 * row) so the sitemap doesn't pull down every field for every opportunity.
 */
export async function getAllPublishedOpportunityIds(): Promise<OpportunitySitemapEntry[]> {
  const supabase = await createPublicClient();
  const builder = applyPublishedFilter(
    supabase.from("opportunities").select("id, updated_at"),
  );

  const { data, error } = await builder
    .order("published_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("getAllPublishedOpportunityIds failed:", error.message);
    return [];
  }

  return (data ?? []) as OpportunitySitemapEntry[];
}
