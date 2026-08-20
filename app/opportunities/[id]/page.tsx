import { notFound } from "next/navigation";
import Link from "next/link";
import { getOpportunityById } from "@/lib/data/opportunities";
import type { OpportunityWithCompany } from "@/lib/data/opportunities";

const TYPE_LABELS: Record<string, string> = {
  internship: "Internship",
  full_time: "Full-time",
};

const WORK_MODE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Work From Office",
};

type ApplyAction = { label: string; href: string };

// Priority: Application Link -> Google Form -> HR Email (mailto). No
// internal application system — this just points at the real destination.
function getApplyAction(
  opportunity: Pick<OpportunityWithCompany, "application_url" | "google_form_url" | "hr_email">,
): ApplyAction | null {
  if (opportunity.application_url) {
    return { label: "Apply Now", href: opportunity.application_url };
  }
  if (opportunity.google_form_url) {
    return { label: "Apply Now (Google Form)", href: opportunity.google_form_url };
  }
  if (opportunity.hr_email) {
    return { label: "Apply via Email", href: `mailto:${opportunity.hr_email}` };
  }
  return null;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type Params = { id: string };

// Relies on RLS (status='published' and not expired) to hide drafts/expired
// opportunities — a direct hit on this URL for one of those correctly gets
// no row back from Supabase, not just a client-side check.
export default async function OpportunityDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const opportunity = await getOpportunityById(id);
  if (!opportunity) notFound();

  const {
    role,
    opportunity_type,
    batch,
    stipend,
    salary,
    location,
    work_mode,
    degree,
    branches,
    eligibility,
    skills,
    responsibilities,
    requirements,
    additional_details,
    how_to_apply,
    hr_email,
    hr_contact,
    deadline,
    company,
  } = opportunity;

  const applyAction = getApplyAction(opportunity);
  const compensation = [stipend, salary].filter(Boolean);
  const workModeLabel = work_mode ? WORK_MODE_LABELS[work_mode] : null;
  const deadlineLabel = formatDate(deadline);

  return (
    <main className="page opportunity-detail">
      <Link className="back-link" href="/opportunities">
        ← Back to Opportunities
      </Link>

      {company?.name && <p className="opportunity-company">{company.name}</p>}
      <h1>{role}</h1>

      {(opportunity_type || batch.length > 0) && (
        <p className="opportunity-meta">
          {opportunity_type && <span>{TYPE_LABELS[opportunity_type]}</span>}
          {batch.length > 0 && <span>Batch: {batch.join(" / ")}</span>}
        </p>
      )}

      {compensation.length > 0 && <p className="opportunity-comp">{compensation.join(" · ")}</p>}

      {(location || workModeLabel) && (
        <p className="opportunity-location">
          {[location, workModeLabel].filter(Boolean).join(" · ")}
        </p>
      )}

      {applyAction && (
        <a
          className="btn-primary apply-now"
          href={applyAction.href}
          rel="noopener noreferrer"
          target={applyAction.href.startsWith("mailto:") ? undefined : "_blank"}
        >
          {applyAction.label}
        </a>
      )}

      {(degree.length > 0 || branches.length > 0 || eligibility) && (
        <section>
          <h2>Eligibility</h2>
          {degree.length > 0 && <p>Degree: {degree.join(", ")}</p>}
          {branches.length > 0 && <p>Branch: {branches.join(", ")}</p>}
          {eligibility && <p className="preserve-whitespace">{eligibility}</p>}
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <h2>Skills</h2>
          <p>{skills.join(" · ")}</p>
        </section>
      )}

      {responsibilities.length > 0 && (
        <section>
          <h2>Responsibilities</h2>
          <ul>
            {responsibilities.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {requirements.length > 0 && (
        <section>
          <h2>Requirements</h2>
          <ul>
            {requirements.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {additional_details && (
        <section>
          <h2>Additional Details</h2>
          <p className="preserve-whitespace">{additional_details}</p>
        </section>
      )}

      {(how_to_apply || hr_email || hr_contact) && (
        <section>
          <h2>How to Apply</h2>
          {how_to_apply && <p className="preserve-whitespace">{how_to_apply}</p>}
          {hr_email && (
            <p>
              HR Email: <a href={`mailto:${hr_email}`}>{hr_email}</a>
            </p>
          )}
          {hr_contact && <p>HR Contact: {hr_contact}</p>}
        </section>
      )}

      {deadlineLabel && (
        <section>
          <h2>Application Deadline</h2>
          <p>{deadlineLabel}</p>
        </section>
      )}

      {applyAction && (
        <a
          className="btn-primary apply-now"
          href={applyAction.href}
          rel="noopener noreferrer"
          target={applyAction.href.startsWith("mailto:") ? undefined : "_blank"}
        >
          {applyAction.label}
        </a>
      )}
    </main>
  );
}
