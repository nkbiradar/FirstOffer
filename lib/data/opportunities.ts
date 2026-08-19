import { createClient } from "@/lib/supabase/server";
import type { Opportunity, OpportunityType } from "@/types/supabase";

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

function applyPublishedFilter(builder: QueryBuilder): QueryBuilder {
  return builder
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
}

/** Latest published, non-expired opportunities — used on the homepage. */
export async function getLatestOpportunities(limit = 6): Promise<OpportunityWithCompany[]> {
  const supabase = await createClient();
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

/**
 * Published, non-expired opportunities with optional search/type filters
 * and simple offset pagination — used on the /opportunities listing page.
 */
export async function getPublishedOpportunities(
  options: ListOpportunitiesOptions = {},
): Promise<ListOpportunitiesResult> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = options.pageSize ?? 12;
  const supabase = await createClient();

  let builder: QueryBuilder = supabase
    .from("opportunities")
    .select(OPPORTUNITY_SELECT, { count: "exact" });
  builder = applyPublishedFilter(builder);

  if (options.type) {
    builder = builder.eq("opportunity_type", options.type);
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
