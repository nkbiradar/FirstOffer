import Link from "next/link";
import OpportunityCard from "@/components/OpportunityCard";
import { getPublishedOpportunities } from "@/lib/data/opportunities";
import type { OpportunityType, WorkMode } from "@/types/supabase";

const VALID_TYPES: OpportunityType[] = ["internship", "full_time"];
const VALID_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];

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
  const modeParam = firstValue(params.mode);
  const workMode = VALID_MODES.includes(modeParam as WorkMode) ? (modeParam as WorkMode) : undefined;
  const batch = firstValue(params.batch)?.trim() || "";
  const location = firstValue(params.location)?.trim() || "";
  const page = Math.max(1, Number(firstValue(params.page)) || 1);

  const { opportunities, total, pageSize } = await getPublishedOpportunities({
    query,
    type,
    workMode,
    batch: batch || undefined,
    location: location || undefined,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(query || type || workMode || batch || location);

  // Builds an /opportunities URL carrying every currently-active filter,
  // with the given overrides applied (a key set to undefined clears that
  // filter). Keeps every filter link/pagination link in sync with q, type,
  // mode, batch, and location at once instead of dropping the others.
  function buildHref(overrides: { type?: string; mode?: string; page?: number } = {}) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);

    const nextType = "type" in overrides ? overrides.type : type;
    if (nextType) next.set("type", nextType);

    const nextMode = "mode" in overrides ? overrides.mode : workMode;
    if (nextMode) next.set("mode", nextMode);

    if (batch) next.set("batch", batch);
    if (location) next.set("location", location);

    const nextPage = overrides.page ?? page;
    if (nextPage > 1) next.set("page", String(nextPage));

    const qs = next.toString();
    return qs ? `/opportunities?${qs}` : "/opportunities";
  }

  return (
    <main className="page page-wide opportunities-page">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            {total} live right now
          </span>
          <h1>Fresher Opportunities</h1>
          <p>Search and filter internships, full-time roles, and off-campus opportunities.</p>
        </div>

        <div className="toolbar">
          <form action="/opportunities" className="search-form" method="get">
            {type && <input name="type" type="hidden" value={type} />}
            {workMode && <input name="mode" type="hidden" value={workMode} />}
            {batch && <input name="batch" type="hidden" value={batch} />}
            {location && <input name="location" type="hidden" value={location} />}
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              aria-label="Search by company, role, or skill"
              defaultValue={query}
              name="q"
              placeholder="Search by company, role, or skill"
              type="search"
            />
            <button type="submit">Search</button>
          </form>

          <div className="type-filters">
            <Link className={`filter-pill ${!type ? "active" : ""}`} href={buildHref({ type: undefined })}>
              All
            </Link>
            <Link
              className={`filter-pill ${type === "internship" ? "active" : ""}`}
              href={buildHref({ type: "internship" })}
            >
              Internships
            </Link>
            <Link
              className={`filter-pill ${type === "full_time" ? "active" : ""}`}
              href={buildHref({ type: "full_time" })}
            >
              Full-Time
            </Link>
          </div>
        </div>

        <div className="toolbar" style={{ marginTop: -8, flexWrap: "wrap", gap: 12 }}>
          <div className="type-filters">
            <Link className={`filter-pill ${!workMode ? "active" : ""}`} href={buildHref({ mode: undefined })}>
              Any Work Mode
            </Link>
            <Link className={`filter-pill ${workMode === "remote" ? "active" : ""}`} href={buildHref({ mode: "remote" })}>
              Remote
            </Link>
            <Link className={`filter-pill ${workMode === "hybrid" ? "active" : ""}`} href={buildHref({ mode: "hybrid" })}>
              Hybrid
            </Link>
            <Link className={`filter-pill ${workMode === "onsite" ? "active" : ""}`} href={buildHref({ mode: "onsite" })}>
              On-site
            </Link>
          </div>

          <form
            action="/opportunities"
            method="get"
            style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
          >
            {query && <input name="q" type="hidden" value={query} />}
            {type && <input name="type" type="hidden" value={type} />}
            {workMode && <input name="mode" type="hidden" value={workMode} />}
            <input name="batch" defaultValue={batch} placeholder="Batch (e.g. 2026)" type="text" style={{ width: 140 }} />
            <input name="location" defaultValue={location} placeholder="Location" type="text" style={{ width: 160 }} />
            <button className="btn btn-secondary btn-sm" type="submit">
              Apply
            </button>
          </form>
        </div>

        <p className="result-count">
          {total} opportunit{total === 1 ? "y" : "ies"} found
        </p>

        {opportunities.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
            </span>
            <h3>No opportunities match yet</h3>
            <p>
              {hasFilters
                ? "Try a different search term or clear your filters to see everything that's live."
                : "No opportunities are available right now — check back soon."}
            </p>
            {hasFilters && (
              <Link className="btn btn-secondary btn-sm" href="/opportunities">
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="opportunity-grid">
              {opportunities.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Pagination" className="pagination">
                {page > 1 ? <Link href={buildHref({ page: page - 1 })}>&larr; Previous</Link> : <span />}
                <span>
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? <Link href={buildHref({ page: page + 1 })}>Next &rarr;</Link> : <span />}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
