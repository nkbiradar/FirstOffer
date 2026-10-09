import { getAllClaims, getAllInternshipApplications } from "@/lib/data/referral-rewards";

export const metadata = { title: "Referral Internship Applications — Admin" };

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminReferralsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const [applications, claims] = await Promise.all([getAllInternshipApplications(), getAllClaims()]);

  return (
    <div className="admin-shell">
      <main className="admin-page admin-page-wide">
        <div className="admin-page-header">
          <h1>Referral Rewards</h1>
        </div>

        <h2>Reward claims</h2>
        <p className="hint">
          <strong>Profile push</strong> (15 sign-ups): share their resume with 5 hiring companies, then mark Done.{" "}
          <strong>Goodies</strong> (25 sign-ups): ship the pack, then mark Done.
        </p>
        {claims.length === 0 ? (
          <p className="hint">No claims yet.</p>
        ) : (
          <div className="table-scroll" style={{ marginBottom: 32 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reward</th>
                  <th>Details</th>
                  <th>Sign-ups</th>
                  <th>Claimed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c.id}>
                    <td>{c.kind === "profile_push" ? "Profile push (5 companies)" : "Goodies"}</td>
                    <td style={{ maxWidth: 360 }}>
                      {Object.entries(c.details)
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <div key={k}>
                            <strong>{k}:</strong>{" "}
                            {/^https?:\/\//.test(v) ? (
                              <a href={v} rel="noopener noreferrer" target="_blank">
                                {v}
                              </a>
                            ) : (
                              v
                            )}
                          </div>
                        ))}
                    </td>
                    <td>{c.signups_at_claim}</td>
                    <td>{new Date(c.created_at).toLocaleDateString("en-IN")}</td>
                    <td>
                      <form action={`/api/admin/referrals/claims/${c.id}`} method="post" style={{ display: "grid", gap: 6 }}>
                        <select defaultValue={c.status} name="status">
                          <option value="pending">Pending</option>
                          <option value="done">Done</option>
                        </select>
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

        <h2>Growth Internship applications</h2>
        <p className="hint">
          From Refer &amp; Earn (25+ friends signed up with their link). Tick <strong>Featured</strong> on a
          <strong>Completed</strong> intern to show them on the homepage.
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
                  <th>Friends referred</th>
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
