import Link from "next/link";
import OpportunityCard from "@/components/OpportunityCard";
import { getPublishedOpportunities } from "@/lib/data/opportunities";
import type { OpportunityType } from "@/types/supabase";

const VALID_TYPES: OpportunityType[] = ["internship", "full_time"];

type SearchParams = { [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = firstValue(params.q)?.trim() || "";
  const typeParam = firstValue(params.type);
  const type = VALID_TYPES.includes(typeParam as OpportunityType)
    ? (typeParam as OpportunityType)
    : undefined;
  const page = Math.max(1, Number(firstValue(params.page)) || 1);

  const { opportunities, total, pageSize } = await getPublishedOpportunities({
    query,
    type,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(nextPage: number) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (type) next.set("type", type);
    next.set("page", String(nextPage));
    return `/opportunities?${next.toString()}`;
  }

  return (
    <main className="page opportunities-page">
      <h1>Fresher Opportunities</h1>

      <form action="/opportunities" className="search-form" method="get">
        {type && <input name="type" type="hidden" value={type} />}
        <input
          aria-label="Search by company, role, or skill"
          defaultValue={query}
          name="q"
          placeholder="Search by company, role, or skill"
          type="search"
        />
        <button type="submit">Search</button>
      </form>

      <p className="type-filters">
        <Link href="/opportunities">All</Link>
        <Link href="/opportunities?type=internship">Internships</Link>
        <Link href="/opportunities?type=full_time">Full-Time</Link>
      </p>

      {opportunities.length === 0 ? (
        <p className="empty-state">No opportunities available right now.</p>
      ) : (
        <>
          <div className="opportunity-grid">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="pagination">
              {page > 1 && <Link href={pageHref(page - 1)}>Previous</Link>}
              <span>
                Page {page} of {totalPages}
              </span>
              {page < totalPages && <Link href={pageHref(page + 1)}>Next</Link>}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
