import Link from "next/link";
import { getCompaniesWithPublishedCounts } from "@/lib/data/companies";
import { avatarGradient, initials } from "@/lib/ui-format";

export default async function CompaniesPage() {
  const companies = await getCompaniesWithPublishedCounts();

  return (
    <main className="page page-wide companies-page">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            {companies.length} companies
          </span>
          <h1>Companies</h1>
          <p>Every company with opportunities currently listed on FirstOffer.</p>
        </div>

        {companies.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h3>No companies yet</h3>
            <p>Companies show up here as soon as opportunities are published.</p>
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
                  {company.publishedOpportunityCount > 0 && (
                    <Link
                      className="company-card-link"
                      href={`/opportunities?q=${encodeURIComponent(company.name)}`}
                    >
                      View Opportunities &rarr;
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
