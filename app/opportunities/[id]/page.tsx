import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getOpportunityWithExpiryStatus,
  getRelatedOpportunities,
} from "@/lib/data/opportunities";
import type { OpportunityWithCompany } from "@/lib/data/opportunities";
import { avatarGradient, initials } from "@/lib/ui-format";
import { getSiteUrl } from "@/lib/site-url";
import { getUser } from "@/lib/supabase/auth";
import { isOpportunityApplied } from "@/lib/data/user-applications";
import { hasFullAccess } from "@/lib/data/opportunity-unlocks";
import { CONTACT_UNLOCK_PRICE_INR } from "@/lib/payments/razorpay";
import {
  buildJobPostingJsonLd,
  buildJobBreadcrumbsJsonLd,
} from "@/lib/seo/job-posting";
import ApplyTracker from "@/components/ApplyTracker";
import UnlockContactCard from "@/components/UnlockContactCard";
import OpportunityCard from "@/components/OpportunityCard";

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

const getCachedOpportunityDetail = cache(getOpportunityWithExpiryStatus);

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
  const { opportunity, isExpired } = await getCachedOpportunityDetail(id);

  if (!opportunity) {
    return { title: "Opportunity not found — FirstOffer" };
  }

  const companyName = opportunity.company?.name ?? "";
  const is2026Batch = opportunity.batch?.some((b) => b.includes("2026"));
  const batchKeyword = is2026Batch ? "2026 Batch" : "Freshers";

  const title = companyName
    ? `${opportunity.role} at ${companyName} — Fresher Jobs ${is2026Batch ? "2026 " : ""}| FirstOffer`
    : `${opportunity.role} — Fresher Jobs in India | FirstOffer`;

  const descriptionParts = [
    opportunity.opportunity_type && TYPE_LABELS[opportunity.opportunity_type],
    companyName && `at ${companyName}`,
    opportunity.location,
    opportunity.work_mode && WORK_MODE_LABELS[opportunity.work_mode],
    `Open for ${batchKeyword}`,
  ].filter(Boolean);

  const description =
    descriptionParts.length > 0
      ? `${opportunity.role} ${descriptionParts.join(" · ")} — find fresher jobs, tech jobs, and off-campus opportunities on FirstOffer.`
      : "Find internships, full-time tech roles and off-campus opportunities for freshers on FirstOffer.";

  const url = `${getSiteUrl()}/opportunities/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: isExpired
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "FirstOffer",
      images: [
        {
          url: opportunity.company?.logo_url || "/images/hero-journey.webp",
          width: 1200,
          height: 630,
          alt: `${opportunity.role} at ${companyName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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

export default async function OpportunityDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const { opportunity, isExpired } = await getCachedOpportunityDetail(id);
  if (!opportunity) notFound();

  const [user, relatedOpportunities] = await Promise.all([
    getUser(),
    getRelatedOpportunities(opportunity, 3),
  ]);

  const isApplied = user ? await isOpportunityApplied(user.id, id) : false;

  const hasApplyContent = Boolean(
    opportunity.application_url ||
      opportunity.google_form_url ||
      opportunity.hr_email ||
      opportunity.hr_contact ||
      opportunity.how_to_apply,
  );
  const applyUnlocked = user && hasApplyContent ? await hasFullAccess(user.id) : false;
  const canShowApply = !isExpired && (!hasApplyContent || applyUnlocked);

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

  const applyAction = !isExpired ? getApplyAction(opportunity) : null;
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

  // Structured data:
  // Valid JobPosting schema is only applied to ACTIVE opportunities.
  // Google guidance explicitly says to remove JobPosting schema or set validThrough in past for expired jobs.
  const jobPostingJsonLd = !isExpired ? buildJobPostingJsonLd(opportunity) : null;
  const breadcrumbsJsonLd = buildJobBreadcrumbsJsonLd(opportunity);

  return (
    <main className="page opportunity-detail">
      {/* BreadcrumbList schema */}
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      {/* JobPosting schema for Google for Jobs */}
      {jobPostingJsonLd && (
        /* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
        />
      )}

      <div className="container" style={{ maxWidth: 760, padding: 0 }}>
        {/* Visual Breadcrumbs */}
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <Link href="/fresher-jobs">Fresher Jobs</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <span className="breadcrumbs-current" aria-current="page">
            {companyName ? `${role} at ${companyName}` : role}
          </span>
        </nav>

        {isExpired && (
          <div className="expired-banner" role="alert">
            <div className="expired-banner-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Applications Closed for This Position</span>
            </div>
            <p>
              This job opening at {companyName || "the company"} has reached its deadline or expired.
              FirstOffer updates listings daily so you only spend time on active fresher jobs. Explore
              similar live openings below.
            </p>
            <div className="expired-banner-actions">
              <Link className="btn btn-primary btn-sm" href="/fresher-jobs">
                Browse Live Fresher Jobs
              </Link>
              <Link className="btn btn-secondary btn-sm" href="/tech-jobs">
                Tech Jobs
              </Link>
            </div>
          </div>
        )}

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
            {isExpired && <span className="badge badge-urgency-critical">Expired</span>}
          </div>

          {compensation.length > 0 && <p className="opportunity-comp">{compensation.join(" · ")}</p>}

          {!isExpired && (
            <>
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
            </>
          )}

          <div className="resume-tip-banner">
            <span className="resume-tip-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path
                  d="M9 18h6M10 21h4M12 3a6 6 0 00-6 6c0 2.5 1.5 4 2.5 5.2.5.6.5 1 .5 1.8h6c0-.8 0-1.2.5-1.8C16.5 13 18 11.5 18 9a6 6 0 00-6-6z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p>
              <strong>Tailor your resume to the JD.</strong> That&apos;s what actually gets freshers shortlisted.
            </p>
          </div>
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
            <h2>Eligibility Criteria</h2>
            {degree.length > 0 && <p>Degree: {degree.join(", ")}</p>}
            {branches.length > 0 && <p>Branch: {branches.join(", ")}</p>}
            {eligibility && <p className="preserve-whitespace">{eligibility}</p>}
          </section>
        )}

        {skills.length > 0 && (
          <section className="card">
            <h2>Required Skills</h2>
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

        {!isExpired && ((canShowApply ? Boolean(how_to_apply || hr_email || hr_contact) : hasApplyContent) || deadlineLabel) && (
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
        )}

        {!isExpired && canShowApply && applyAction && (
          <ApplyButton action={applyAction} className="btn-block" />
        )}

        {/* Related Opportunities Section */}
        {relatedOpportunities.length > 0 && (
          <section className="related-jobs-section">
            <div className="related-jobs-header">
              <div>
                <h2>Related Fresher Jobs &amp; Opportunities</h2>
                <p>Explore more live openings matching your background and interests.</p>
              </div>
              <Link href="/fresher-jobs">
                View all jobs
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
            <div className="opportunity-grid">
              {relatedOpportunities.map((relOpp) => (
                <OpportunityCard key={relOpp.id} opportunity={relOpp} />
              ))}
            </div>
          </section>
        )}
      </div>

      {!isExpired && canShowApply && applyAction && (
        <div className="apply-bar">
          <ApplyButton action={applyAction} />
        </div>
      )}
    </main>
  );
}
