import type { OpportunityWithCompany } from "@/lib/data/opportunities";
import type { CompanyOption } from "@/lib/data/companies";

type Props = {
  mode: "create" | "edit";
  opportunity?: OpportunityWithCompany;
  companies: CompanyOption[];
  errorMessage?: string;
};

// Plain HTML <form method="post">, no client JS — keeps the daily-workflow
// path (the thing that has to work every single day) simple and robust.
// Multi-value fields (batch/degree/branches/skills) are comma-separated text
// inputs; bullet-point fields (responsibilities/requirements) are one item
// per line in a textarea. Both get parsed server-side in
// lib/data/opportunity-form-data.ts.
export default function OpportunityForm({ mode, opportunity, companies, errorMessage }: Props) {
  const action =
    mode === "create" ? "/api/admin/opportunities" : `/api/admin/opportunities/${opportunity!.id}`;
  const o = opportunity;

  return (
    <form className="opportunity-form" method="post" action={action}>
      {errorMessage && <p className="form-error">{errorMessage}</p>}

      <section>
        <h2>Basic Information</h2>
        <label>
          Company
          <select name="company_id" defaultValue={o?.company_id ?? ""}>
            <option value="">— Create a new company (type the name below) —</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          New Company Name{" "}
          <span className="hint">(only used if "Create a new company" is selected above)</span>
          <input name="new_company_name" type="text" placeholder="e.g. Vedantu" />
        </label>
        <label>
          Role
          <input
            name="role"
            type="text"
            defaultValue={o?.role ?? ""}
            placeholder="Associate Software Engineer"
            required
          />
        </label>
        <label>
          Opportunity Type
          <select name="opportunity_type" defaultValue={o?.opportunity_type ?? ""}>
            <option value="">— Not specified —</option>
            <option value="internship">Internship</option>
            <option value="full_time">Full-time</option>
          </select>
        </label>
        <label>
          Batch <span className="hint">(comma-separated — do not force one batch)</span>
          <input
            name="batch"
            type="text"
            defaultValue={(o?.batch ?? []).join(", ")}
            placeholder="2025, 2026, 2027"
          />
        </label>
        <label>
          Degree <span className="hint">(optional, comma-separated)</span>
          <input
            name="degree"
            type="text"
            defaultValue={(o?.degree ?? []).join(", ")}
            placeholder="B.Tech, BCA, MCA"
          />
        </label>
        <label>
          Branch <span className="hint">(optional, comma-separated)</span>
          <input
            name="branches"
            type="text"
            defaultValue={(o?.branches ?? []).join(", ")}
            placeholder="CSE, IT, ECE"
          />
        </label>
      </section>

      <section>
        <h2>Compensation</h2>
        <label>
          Stipend <span className="hint">(free text)</span>
          <input
            name="stipend"
            type="text"
            defaultValue={o?.stipend ?? ""}
            placeholder="₹30,000 - ₹40,000/month"
          />
        </label>
        <label>
          Salary / CTC <span className="hint">(free text)</span>
          <input name="salary" type="text" defaultValue={o?.salary ?? ""} placeholder="₹8 LPA" />
        </label>
      </section>

      <section>
        <h2>Location</h2>
        <label>
          Location
          <input name="location" type="text" defaultValue={o?.location ?? ""} placeholder="Bengaluru" />
        </label>
        <label>
          Work Mode
          <select name="work_mode" defaultValue={o?.work_mode ?? ""}>
            <option value="">— Not specified —</option>
            <option value="onsite">On-site</option>
            <option value="hybrid">Hybrid</option>
            <option value="remote">Remote</option>
          </select>
        </label>
      </section>

      <section>
        <h2>Skills &amp; Eligibility</h2>
        <label>
          Skills <span className="hint">(comma-separated)</span>
          <input
            name="skills"
            type="text"
            defaultValue={(o?.skills ?? []).join(", ")}
            placeholder="Python, SQL, React"
          />
        </label>
        <label>
          Eligibility
          <textarea name="eligibility" defaultValue={o?.eligibility ?? ""} rows={4} />
        </label>
      </section>

      <section>
        <h2>Job Information</h2>
        <label>
          Responsibilities
          <textarea
            name="responsibilities"
            defaultValue={(o?.responsibilities ?? []).join("\n")}
            rows={6}
          />
        </label>
        <label>
          Requirements
          <textarea name="requirements" defaultValue={(o?.requirements ?? []).join("\n")} rows={6} />
        </label>
        <label>
          Additional Details{" "}
          <span className="hint">(anything that doesn't fit elsewhere — don't lose it)</span>
          <textarea name="additional_details" defaultValue={o?.additional_details ?? ""} rows={4} />
        </label>
      </section>

      <section>
        <h2>Application Information</h2>
        <label>
          Application URL <span className="hint">(optional)</span>
          <input
            name="application_url"
            type="url"
            defaultValue={o?.application_url ?? ""}
            placeholder="https://company.com/careers/..."
          />
        </label>
        <label>
          Google Form URL <span className="hint">(optional)</span>
          <input
            name="google_form_url"
            type="url"
            defaultValue={o?.google_form_url ?? ""}
            placeholder="https://forms.gle/..."
          />
        </label>
        <label>
          HR Email <span className="hint">(optional)</span>
          <input name="hr_email" type="email" defaultValue={o?.hr_email ?? ""} placeholder="hr@company.com" />
        </label>
        <label>
          HR Contact <span className="hint">(optional)</span>
          <input name="hr_contact" type="text" defaultValue={o?.hr_contact ?? ""} placeholder="+91 XXXXX XXXXX" />
        </label>
        <label>
          How to Apply <span className="hint">(preserve instructions exactly)</span>
          <textarea name="how_to_apply" defaultValue={o?.how_to_apply ?? ""} rows={4} />
        </label>
      </section>

      <section>
        <h2>Deadline</h2>
        <label>
          Application Deadline <span className="hint">(optional — leave empty if there isn't one)</span>
          <input name="deadline" type="date" defaultValue={o?.deadline ?? ""} />
        </label>
      </section>

      <section>
        <h2>Original Telegram Message</h2>
        <label>
          Paste whatever original content you have — never overwritten by editing other fields
          <textarea name="source_text" defaultValue={o?.source_text ?? ""} rows={12} required />
        </label>
      </section>

      {mode === "edit" && (
        <section>
          <h2>Status</h2>
          <label>
            Status
            <select name="status" defaultValue={o?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="expired">Expired</option>
            </select>
          </label>
        </section>
      )}

      <div className="form-actions">
        {mode === "create" ? (
          <>
            <button name="intent" value="draft" type="submit">
              Save Draft
            </button>
            <button className="btn-primary" name="intent" value="publish" type="submit">
              Publish Opportunity
            </button>
          </>
        ) : (
          <button className="btn-primary" type="submit">
            Save Changes
          </button>
        )}
      </div>
    </form>
  );
}
