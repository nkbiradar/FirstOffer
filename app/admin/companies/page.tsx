import { getAllCompaniesForAdmin } from "@/lib/data/companies";
import LogoSuggestButton from "@/components/admin/LogoSuggestButton";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Lets an admin set/edit a company's logo — the field already existed in
// the schema and is already rendered on the public site (OpportunityCard,
// /companies) whenever it's set, but nothing anywhere let an admin set it
// until now. New companies can also get a logo at creation time via the
// "New Company Logo URL" field on the opportunity form.
export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const errorMessage = firstValue(params.error);
  const updated = firstValue(params.updated) === "1";
  const companies = await getAllCompaniesForAdmin();

  return (
    <div className="admin-shell">
      <main className="admin-page admin-page-wide">
        <div className="admin-page-header">
          <h1>Companies</h1>
        </div>

        {errorMessage && <p className="form-error">{errorMessage}</p>}
        {updated && <p className="bulk-summary">Logo updated.</p>}

        {companies.length === 0 ? (
          <div className="empty-state">
            <h3>No companies yet</h3>
            <p>Companies are created automatically when you add an opportunity.</p>
          </div>
        ) : (
          <div className="bulk-items">
            {companies.map((company) => (
              <div className="card" key={company.id}>
                <div className="form-grid-2" style={{ alignItems: "end" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {company.logo_url ? (
                      <img
                        alt=""
                        src={company.logo_url}
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: "contain", background: "var(--color-surface-2, #f4f4f5)" }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: "var(--color-surface-2, #f4f4f5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          color: "var(--color-text-muted, #888)",
                        }}
                      >
                        No logo
                      </span>
                    )}
                    <strong>{company.name}</strong>
                  </div>

                  <form className="bulk-field" method="post" action={`/api/admin/companies/${company.id}`} style={{ display: "flex", flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <input
                      name="logo_url"
                      type="url"
                      defaultValue={company.logo_url ?? ""}
                      placeholder="https://.../logo.png"
                      style={{ flex: 1 }}
                    />
                    <LogoSuggestButton logoFieldName="logo_url" companyName={company.name} />
                    <button className="btn btn-secondary btn-sm" type="submit">
                      Save
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
