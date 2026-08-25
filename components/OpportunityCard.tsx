import Link from "next/link";
import type { OpportunityWithCompany } from "@/lib/data/opportunities";
import { avatarGradient, formatRelativeTime, initials } from "@/lib/ui-format";

const TYPE_LABELS: Record<string, string> = {
  internship: "Internship",
  full_time: "Full-time",
};

const WORK_MODE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

// Links by id (schema has no opportunity slug, only companies do).
export default function OpportunityCard({
  opportunity,
}: {
  opportunity: OpportunityWithCompany;
}) {
  const {
    id,
    role,
    opportunity_type,
    batch,
    stipend,
    salary,
    location,
    work_mode,
    skills,
    published_at,
    company,
  } = opportunity;

  const compensation = stipend || salary;
  const postedLabel = formatRelativeTime(published_at);
  const workModeLabel = work_mode ? WORK_MODE_LABELS[work_mode] : null;
  const companyName = company?.name ?? "";
  const { a, b } = avatarGradient(companyName || role);

  return (
    <Link
      className="opportunity-card"
      href={`/opportunities/${id}`}
      style={{ ["--avatar-a" as string]: a, ["--avatar-b" as string]: b }}
    >
      <div className="opportunity-card-top">
        <div className="opportunity-company-row">
          <span className="company-avatar">
            {company?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={company.logo_url} />
            ) : (
              initials(companyName || role)
            )}
          </span>
          {companyName && <p className="opportunity-company">{companyName}</p>}
        </div>
        {postedLabel && <span className="opportunity-posted">{postedLabel}</span>}
      </div>

      <h3 className="opportunity-role">{role}</h3>

      {(opportunity_type || batch.length > 0) && (
        <div className="badge-row">
          {opportunity_type && (
            <span className={`badge badge-${opportunity_type}`}>{TYPE_LABELS[opportunity_type]}</span>
          )}
          {batch.length > 0 && <span className="badge badge-neutral">Batch {batch.join(" / ")}</span>}
        </div>
      )}

      {(location || workModeLabel) && (
        <p className="opportunity-meta">
          {location && <span>{location}</span>}
          {workModeLabel && <span>{workModeLabel}</span>}
        </p>
      )}

      {compensation && <p className="opportunity-comp">{compensation}</p>}

      {skills.length > 0 && (
        <p className="opportunity-skills">
          {skills.slice(0, 4).map((skill) => (
            <span className="skill-chip" key={skill}>
              {skill}
            </span>
          ))}
          {skills.length > 4 && <span className="skill-chip">+{skills.length - 4}</span>}
        </p>
      )}

      <span className="opportunity-card-link">
        View Opportunity
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
