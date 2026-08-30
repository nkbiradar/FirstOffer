import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getOpportunityById } from "@/lib/data/opportunities";
import type { OpportunityWithCompany } from "@/lib/data/opportunities";
import { avatarGradient, initials } from "@/lib/ui-format";
import { getSiteUrl } from "@/lib/site-url";
import { getUser } from "@/lib/supabase/auth";
import { isOpportunityApplied } from "@/lib/data/user-applications";
import { hasUnlockedContact } from "@/lib/data/opportunity-unlocks";
import { CONTACT_UNLOCK_PRICE_INR } from "@/lib/payments/razorpay";
import ApplyTracker from "@/components/ApplyTracker";
import UnlockContactCard from "@/components/UnlockContactCard";

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

type Params = { id: string };

// generateMetadata() and the page component both need this opportunity —
// cache() (React's per-request memoization) means the second call reuses
// the first request's result instead of hitting Supabase twice.
const getCachedOpportunity = cache(getOpportunityById);

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

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const opportunity = await getCachedOpportunity(id);

  if (!opportunity) {
    return { title: "Opportunity not found — FirstOffer" };
  }

  const companyName = opportunity.company?.name ?? "";
  const title = companyName
    ? `${opportunity.role} at ${companyName} — FirstOffer`
    : `${opportunity.role} — FirstOffer`;

  const descriptionParts = [
    opportunity.opportunity_type && TYPE_LABELS[opportunity.opportunity_type],
    companyName && `at ${companyName}`,
    opportunity.location,
    opportunity.work_mode && WORK_MODE_LABELS[opportunity.work_mode],
  ].filter(Boolean);
  const description =
    descriptionParts.length > 0
      ? `${descriptionParts.join(" · ")}. Apply on FirstOffer.`
      : "Find internships and full-time opportunities for freshers on FirstOffer.";

  const url = `${getSiteUrl()}/opportunities/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

function ApplyButton({ action, className = "" }: { action: ApplyAction; className?: string }) {
  return (
    <a
      className={`btn btn-primary apply-now ${className}`}
      href={action.href}
      rel="noopener noreferrer"
      target={action.href.startsWith("mailto:") ? undefined : "_blank"}
    >
      {action.label}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

// Relies on RLS (status='published' and not expired) to hide drafts/expired
// opportunities — a direct hit on this URL for one of those correctly gets
// no row back from Supabase, not just a client-side check.
export default async function OpportunityDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const opportunity = await getCachedOpportunity(id);
  if (!opportunity) notFound();

  const user = await getUser();
  const isApplied = user ? await isOpportunityApplied(user.id, id) : false;
  // Every apply route — a direct application link, a Google Form, HR
  // email/contact, and the free-text "how to apply" instructions — is
  // gated behind a single ₹49 unlock now (previously only HR email/contact
  // were paywalled). `applyAction` below still resolves to the real
  // destination; `canShowApply` decides whether it's actually rendered.
  const hasApplyContent = Boolean(
    opportunity.application_url ||
      opportunity.google_form_url ||
      opportunity.hr_email ||
      opportunity.hr_contact ||
      opportunity.how_to_apply,
  );
  const applyUnlocked = user && hasApplyContent ? await hasUnlockedContact(user.id, id) : false;
  const canShowApply = !hasApplyContent || applyUnlocked;

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
  const companyName = company?.name ?? "";
  const { a, b } = avatarGradient(companyName || role);

  const overviewParts = [
    opportunity_type && TYPE_LABELS[opportunity_type],
    companyName && `at ${companyName}`,
    location,
    workModeLabel,
    batch.length > 0 && `open to the ${batch.join(" / ")} batch${batch.length > 1 ? "es" : ""}`,
  ].filter(Boolean);

  return (
    <main className="page opportunity-detail">
      <div className="container" style={{ maxWidth: 760, padding: 0 }}>
        <Link className="back-link" href="/opportunities">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Opportunities
        </Link>

        <header className="card detail-header">
          {companyName && (
            <div className="detail-company-row">
              <span
                className="company-avatar"
                style={{ ["--avatar-a" as string]: a, ["--avatar-b" as string]: b }}
              >
                {initials(companyName)}
              </span>
              <p className="opportunity-company" style={{ fontSize: 14 }}>
                {companyName}
              </p>
            </div>
          )}

          <h1>{role}</h1>

          <div className="detail-meta-row">
            {opportunity_type && <span className={`badge badge-${opportunity_type}`}>{TYPE_LABELS[opportunity_type]}</span>}
            {location && <span className="badge badge-neutral">{location}</span>}
            {workModeLabel && <span className="badge badge-neutral">{workModeLabel}</span>}
            {batch.length > 0 && <span className="badge badge-neutral">Batch {batch.join(" / ")}</span>}
          </div>

          {compensation.length > 0 && <p className="opportunity-comp">{compensation.join(" · ")}</p>}

          {canShowApply && applyAction && (
            <div className="apply-inline">
              <ApplyButton action={applyAction} />
              <ApplyTracker opportunityId={id} initialApplied={isApplied} isSignedIn={Boolean(user)} />
            </div>
          )}
          {canShowApply && !applyAction && (
            <div className="apply-inline">
              <ApplyTracker opportunityId={id} initialApplied={isApplied} isSignedIn={Boolean(user)} />
            </div>
          )}
          {!canShowApply && (
            <div className="apply-inline">
              <UnlockContactCard opportunityId={id} isSignedIn={Boolean(user)} price={CONTACT_UNLOCK_PRICE_INR} />
            </div>
          )}
        </header>

        {overviewParts.length > 0 && (
          <section className="card">
            <h2>About the opportunity</h2>
            <p>
              A {overviewParts.join(" · ")}
              {compensation.length > 0 ? ` — compensation: ${compensation.join(" · ")}.` : "."}
            </p>
          </section>
        )}

        {(degree.length > 0 || branches.length > 0 || eligibility) && (
          <section className="card">
            <h2>Eligibility</h2>
            {degree.length > 0 && <p>Degree: {degree.join(", ")}</p>}
            {branches.length > 0 && <p>Branch: {branches.join(", ")}</p>}
            {eligibility && <p className="preserve-whitespace">{eligibility}</p>}
          </section>
        )}

        {skills.length > 0 && (
          <section className="card">
            <h2>Skills</h2>
            <p className="opportunity-skills">
              {skills.map((skill) => (
                <span className="skill-chip" key={skill}>
                  {skill}
                </span>
              ))}
            </p>
          </section>
        )}

        {responsibilities.length > 0 && (
          <section className="card">
            <h2>Responsibilities</h2>
            <ul>
              {responsibilities.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {requirements.length > 0 && (
          <section className="card">
            <h2>Requirements</h2>
            <ul>
              {requirements.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {additional_details && (
          <section className="card">
            <h2>Additional Details</h2>
            <p className="preserve-whitespace">{additional_details}</p>
          </section>
        )}

        {(canShowApply ? Boolean(how_to_apply || hr_email || hr_contact) : hasApplyContent) || deadlineLabel ? (
          <section className="card">
            <h2>Application Information</h2>
            {canShowApply && how_to_apply && <p className="preserve-whitespace">{how_to_apply}</p>}
            {canShowApply && hr_email && (
              <p>
                HR Email: <a href={`mailto:${hr_email}`}>{hr_email}</a>
              </p>
            )}
            {canShowApply && hr_contact && <p>HR Contact: {hr_contact}</p>}
            {!canShowApply && hasApplyContent && (
              <p className="unlock-contact-desc">
                How to apply — including any email, contact, or application link — is locked. Unlock above to view it.
              </p>
            )}
            {deadlineLabel && <p>Application Deadline: {deadlineLabel}</p>}
          </section>
        ) : null}

        {canShowApply && applyAction && <ApplyButton action={applyAction} className="btn-block" />}
      </div>

      {canShowApply && applyAction && (
        <div className="apply-bar">
          <ApplyButton action={applyAction} />
        </div>
      )}
    </main>
  );
}
