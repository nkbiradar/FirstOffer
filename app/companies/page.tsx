import { getCompaniesWithPublishedCounts } from "@/lib/data/companies";

export default async function CompaniesPage() {
  const companies = await getCompaniesWithPublishedCounts();

  return (
    <main className="page companies-page">
      <h1>Companies</h1>

      {companies.length === 0 ? (
        <p className="empty-state">No companies available right now.</p>
      ) : (
        <div className="company-grid">
          {companies.map((company) => (
            <div className="company-card" key={company.id}>
              {company.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`${company.name} logo`}
                  className="company-logo"
                  src={company.logo_url}
                />
              )}
              <p className="company-name">{company.name}</p>
              <p className="company-count">
                {company.publishedOpportunityCount}{" "}
                {company.publishedOpportunityCount === 1 ? "opportunity" : "opportunities"}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
