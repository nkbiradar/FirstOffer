import { getAllInternshipApplications } from "@/lib/data/referral-rewards";

export const metadata = { title: "Referral Internship Applications — Admin" };

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminReferralsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const applications = await getAllInternshipApplications();

  return (
    <div className="admin-shell">
      <main className="admin-page admin-page-wide">
        <div className="admin-page-header">
          <h1>Growth Internship Applications</h1>
        </div>
        <p className="hint">
          From Refer &amp; Earn (25+ friends bought Full Access). Set <strong>Completed</strong> once the internship
          is done — that issues their verifiable internship certificate. Tick <strong>Featured</strong> to show them
          on the homepage.
        </p>
        {error && <p className="admin-login-error">{error}</p>}

        {applications.length === 0 ? (
          <p className="hint">No applications yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>College</th>
                  <th>Paying referrals</th>
                  <th>Why</th>
                  <th>Applied</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.full_name}
                      {a.linkedin_url && (
                        <>
                          <br />
                          <a href={a.linkedin_url} rel="noopener noreferrer" target="_blank">
                            LinkedIn
                          </a>
                        </>
                      )}
                    </td>
                    <td>
                      <a href={`mailto:${a.email}`}>{a.email}</a>
                      <br />
                      {a.phone}
                    </td>
                    <td>{a.college}</td>
                    <td>{a.paid_referrals}</td>
                    <td style={{ maxWidth: 280, whiteSpace: "pre-wrap" }}>{a.why ?? "—"}</td>
                    <td>{new Date(a.created_at).toLocaleDateString("en-IN")}</td>
                    <td>
                      <form action={`/api/admin/referrals/${a.id}`} method="post" style={{ display: "grid", gap: 6 }}>
                        <select defaultValue={a.status} name="status">
                          <option value="applied">Applied</option>
                          <option value="interview">Interview</option>
                          <option value="selected">Selected</option>
                          <option value="rejected">Rejected</option>
                          <option value="completed">Completed</option>
                        </select>
                        <label style={{ display: "flex", gap: 6, alignItems: "center", flexDirection: "row" }}>
                          <input defaultChecked={a.featured} name="featured" style={{ width: "auto" }} type="checkbox" />
                          Featured
                        </label>
                        <button className="btn btn-secondary btn-sm" type="submit">
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
