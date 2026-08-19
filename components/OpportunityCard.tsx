import Link from "next/link";
import type { OpportunityWithCompany } from "@/lib/data/opportunities";

const TYPE_LABELS: Record<string, string> = {
  internship: "Internship",
  full_time: "Full-time",
};

const WORK_MODE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

function formatPostedDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Detail page isn't built yet (Step 3 scope). The schema has no opportunity
// slug (only companies have one), so this links by id — that route will be
// app/opportunities/[id]/ when the detail page is built.
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
  const postedDate = formatPostedDate(published_at);
  const workModeLabel = work_mode ? WORK_MODE_LABELS[work_mode] : null;

  return (
    <article className="opportunity-card">
      {company?.name && <p className="opportunity-company">{company.name}</p>}
      <h3 className="opportunity-role">{role}</h3>

      {(opportunity_type || batch.length > 0) && (
        <p className="opportunity-meta">
          {opportunity_type && <span>{TYPE_LABELS[opportunity_type]}</span>}
          {batch.length > 0 && <span>{batch.join(" / ")}</span>}
        </p>
      )}

      {compensation && <p className="opportunity-comp">{compensation}</p>}

      {(location || workModeLabel) && (
        <p className="opportunity-location">
          {[location, workModeLabel].filter(Boolean).join(" · ")}
        </p>
      )}

      {skills.length > 0 && (
        <p className="opportunity-skills">{skills.slice(0, 5).join(" · ")}</p>
      )}

      {postedDate && <p className="opportunity-posted">Posted {postedDate}</p>}

      <Link className="opportunity-card-link" href={`/opportunities/${id}`}>
        View Details
      </Link>
    </article>
  );
}
