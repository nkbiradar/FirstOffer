import { getAllReferralOpeningsForAdmin, REFERRAL_EXTRA_FIELDS } from "@/lib/data/referral-openings";

export const metadata = { title: "Referral Openings — Admin" };

type SearchParams = { [key: string]: string | string[] | undefined };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Companies where our employees can refer Internal HR members. Each one shows
// up in the "Referral openings" section of /internal-openings, where members
// share their resume + email + mobile, plus whichever extra details are
// switched on below (each one Off / Optional / Required).
const DEFAULT_ON: Record<string, string> = { linkedin: "optional", github: "optional", coding: "optional" };

export default async function AdminReferralOpeningsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const error = first(params.error);
  const added = first(params.added) === "1";
  const updated = first(params.updated) === "1";
  const openings = await getAllReferralOpeningsForAdmin();
  const labelOf = Object.fromEntries(REFERRAL_EXTRA_FIELDS.map((f) => [f.key, f.label]));

  return (
    <div className="admin-shell">
      <main className="admin-page admin-page-wide">
        <div className="admin-page-header">
          <h1>Referral Openings</h1>
        </div>
        <p className="hint">
          Add a company where our employees can refer people. It appears for Internal HR members on{" "}
          <a href="/internal-openings#referral-openings">/internal-openings</a>. Resume, email and mobile are always asked;
          pick which other details to ask for. Each application arrives in your inbox with the resume attached.
        </p>

        {error && <p className="form-error">{error}</p>}
        {added && <p className="broadcast-success">✅ Referral company added — it&apos;s live for members now.</p>}
        {updated && <p className="broadcast-success">✅ Updated.</p>}

        <form action="/api/admin/referral-openings" className="card broadcast-form" method="post" style={{ marginBottom: 32 }}>
          <h2 style={{ margin: 0 }}>Add referral company</h2>
          <div className="broadcast-row">
            <label>
              Company *
              <input maxLength={120} name="company" placeholder="Infosys" required />
            </label>
            <label>
              Role (optional)
              <input maxLength={160} name="role" placeholder="Software Engineer (Fresher)" />
            </label>
            <label>
              Location (optional)
              <input maxLength={120} name="location" placeholder="Bengaluru / Remote" />
            </label>
            <label>
              Apply by (optional)
              <input name="apply_by" type="date" />
            </label>
          </div>
          <label>
            Details for members (optional)
            <textarea
              maxLength={3000}
              name="details"
              placeholder={"Eligibility: 2025/2026 B.Tech, CSE/IT\nSkills: Java or Python, DSA basics\nCTC: ~6 LPA"}
              rows={5}
            />
          </label>

          <div>
            <strong style={{ fontSize: 14 }}>Details to ask from members</strong>
            <p className="hint" style={{ margin: "4px 0 10px" }}>
              Always asked: Resume, Email ID, Mobile number.
            </p>
            <div className="referral-admin-fields">
              {REFERRAL_EXTRA_FIELDS.map((f) => (
                <label key={f.key}>
                  {f.label}
                  <select defaultValue={DEFAULT_ON[f.key] ?? "off"} name={`field_${f.key}`}>
                    <option value="off">Don&apos;t ask</option>
                    <option value="optional">Optional</option>
                    <option value="required">Required</option>
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="broadcast-actions">
            <button className="btn btn-primary" type="submit">
              Add referral company
            </button>
          </div>
        </form>

        <h2>All referral companies</h2>
        {openings.length === 0 ? (
          <p className="hint">None yet — add your first one above.</p>
        ) : (
          <div className="bulk-items">
            {openings.map((o) => {
              const asked = Object.entries(o.fields ?? {})
                .map(([k, mode]) => `${labelOf[k] ?? k}${mode === "required" ? " *" : ""}`)
                .join(", ");
              return (
                <div className="card referral-admin-card" key={o.id}>
                  <div className="referral-admin-card-head">
                    <div>
                      <strong style={{ fontSize: 16 }}>{o.company}</strong>{" "}
                      <span className={`referral-admin-status ${o.is_active ? "is-live" : "is-closed"}`}>
                        {o.is_active ? "Live" : "Closed"}
                      </span>
                      <div className="hint">
                        {[o.role, o.location, o.apply_by ? `Apply by ${o.apply_by}` : null].filter(Boolean).join(" · ") ||
                          "No role / location set"}
                      </div>
                      <div className="hint">Asks: Resume, Email, Mobile{asked ? `, ${asked}` : ""}</div>
                    </div>
                    <form action={`/api/admin/referral-openings/${o.id}`} method="post" className="referral-admin-actions">
                      {o.is_active ? (
                        <button className="btn btn-secondary btn-sm" name="action" type="submit" value="close">
                          Close
                        </button>
                      ) : (
                        <button className="btn btn-secondary btn-sm" name="action" type="submit" value="reopen">
                          Reopen
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm" name="action" type="submit" value="delete">
                        Delete
                      </button>
                    </form>
                  </div>

                  <details>
                    <summary>
                      {o.applications.length} applicant{o.applications.length === 1 ? "" : "s"}
                    </summary>
                    {o.applications.length > 0 && (
                      <div className="table-scroll">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Mobile</th>
                              <th>Links &amp; details</th>
                              <th>Applied</th>
                            </tr>
                          </thead>
                          <tbody>
                            {o.applications.map((a) => (
                              <tr key={a.id}>
                                <td>{a.details.name}</td>
                                <td>{a.details.email}</td>
                                <td>{a.details.mobile ? `+91 ${a.details.mobile}` : ""}</td>
                                <td>
                                  {REFERRAL_EXTRA_FIELDS.filter((f) => a.details[f.key]).map((f) => (
                                    <div key={f.key}>
                                      <span className="hint">{f.label}: </span>
                                      {f.type === "url" ? (
                                        <a href={a.details[f.key]} rel="noreferrer" target="_blank">
                                          {a.details[f.key]}
                                        </a>
                                      ) : (
                                        a.details[f.key]
                                      )}
                                    </div>
                                  ))}
                                </td>
                                <td>{new Date(a.updated_at).toLocaleDateString("en-IN")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
