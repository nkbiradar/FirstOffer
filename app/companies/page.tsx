import Link from "next/link";
import { getCompaniesWithPublishedCounts } from "@/lib/data/companies";
import { getLiveRoleIndex } from "@/lib/data/opportunities";
import { ROLE_CATEGORIES, ROLE_LABELS, isRoleSlug } from "@/lib/roles";
import { avatarGradient, initials } from "@/lib/ui-format";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const roleParam = Array.isArray(params.role) ? params.role[0] : params.role;
  const role = isRoleSlug(roleParam) ? roleParam : undefined;

  const [allCompanies, roleIndex] = await Promise.all([getCompaniesWithPublishedCounts(), getLiveRoleIndex()]);

  // Which role categories each company is hiring for right now, and how many
  // live openings it has in the selected role.
  const rolesByCompany = new Map<string, Map<string, number>>();
  for (const row of roleIndex) {
    if (!row.company_id) continue;
    const counts = rolesByCompany.get(row.company_id) ?? new Map<string, number>();
    for (const slug of row.categories) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    rolesByCompany.set(row.company_id, counts);
  }

  // Role pills: only categories at least one company is hiring for.
  const roleOptions = ROLE_CATEGORIES.map((c) => ({
    ...c,
    companies: [...rolesByCompany.values()].filter((m) => m.has(c.slug)).length,
  })).filter((c) => c.companies > 0);

  // Only companies with at least one live opportunity right now (and, with a
  // role picked, at least one in that role), busiest first.
  const companies = allCompanies
    .filter((company) => company.publishedOpportunityCount > 0)
    .filter((company) => !role || (rolesByCompany.get(company.id)?.get(role) ?? 0) > 0)
    .sort((x, y) => {
      const xc = role ? rolesByCompany.get(x.id)?.get(role) ?? 0 : x.publishedOpportunityCount;
      const yc = role ? rolesByCompany.get(y.id)?.get(role) ?? 0 : y.publishedOpportunityCount;
      return yc - xc || x.name.localeCompare(y.name);
    });

  return (
    <main className="page page-wide companies-page">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            {companies.length} {companies.length === 1 ? "company" : "companies"} hiring now
            {role ? ` · ${ROLE_LABELS[role]}` : ""}
          </span>
          <h1>Companies</h1>
          <p>Companies with open opportunities on FirstOffer right now. Pick your role to see who&apos;s hiring for it.</p>
        </div>

        {roleOptions.length > 0 && (
          <div className="role-filters" role="group" aria-label="Filter companies by role">
            <span className="role-filters-label">Role</span>
            <div className="role-filters-scroll">
              <Link className={`filter-pill ${!role ? "active" : ""}`} href="/companies">
                All roles
              </Link>
              {roleOptions.map((c) => (
                <Link
                  className={`filter-pill ${role === c.slug ? "active" : ""}`}
                  href={`/companies?role=${c.slug}`}
                  key={c.slug}
                >
                  {c.label} <span className="role-filter-count">{c.companies}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {companies.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h3>No companies hiring right now</h3>
            <p>Companies show up here as soon as new opportunities are published — check back soon.</p>
          </div>
        ) : (
          <div className="company-grid">
            {companies.map((company) => {
              const { a, b } = avatarGradient(company.name);
              return (
                <div
                  className="company-card"
                  key={company.id}
                  style={{ ["--avatar-a" as string]: a, ["--avatar-b" as string]: b }}
                >
                  <span className="company-avatar">
                    {company.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={company.logo_url} />
                    ) : (
                      initials(company.name)
                    )}
                  </span>
                  <p className="company-name">{company.name}</p>
                  <p className="company-count">
                    {company.publishedOpportunityCount}{" "}
                    {company.publishedOpportunityCount === 1 ? "opportunity" : "opportunities"}
                  </p>
                  {(() => {
                    const tags = ROLE_CATEGORIES.filter((c) => rolesByCompany.get(company.id)?.has(c.slug)).map(
                      (c) => c.label,
                    );
                    return tags.length > 0 ? (
                      <div className="company-role-tags" aria-label="Hiring for">
                        {tags.slice(0, 3).map((t) => (
                          <span className="company-role-tag" key={t}>
                            {t}
                          </span>
                        ))}
                        {tags.length > 3 && <span className="company-role-tag">+{tags.length - 3}</span>}
                      </div>
                    ) : null;
                  })()}
                  <Link
                    className="company-card-link"
                    href={`/opportunities?q=${encodeURIComponent(company.name)}${role ? `&role=${role}` : ""}`}
                  >
                    View Opportunities &rarr;
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
