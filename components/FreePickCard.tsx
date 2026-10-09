import Link from "next/link";
import type { OpportunityWithCompany } from "@/lib/data/opportunities";
import { avatarGradient, initials } from "@/lib/ui-format";

const TYPE_LABELS: Record<string, string> = {
  internship: "Internship",
  full_time: "Full-time",
  off_campus: "Off-campus",
};

function isGoogleForm(url: string | null | undefined) {
  return Boolean(url && /forms\.gle|docs\.google\.com\/forms/i.test(url));
}

function ExternalIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="15">
      <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * "Today's free opportunity" — the one listing the admin picked (is_free_pick)
 * whose apply details are open to everyone after a free Google sign-in,
 * followed by a quiet "unlock the rest" footer.
 */
export default function FreePickCard({
  opportunity,
  moreCount,
  price,
  hasAccess,
  isSignedIn,
}: {
  opportunity: OpportunityWithCompany;
  /** How many OTHER live opportunities are locked behind membership. */
  moreCount: number;
  price: number;
  hasAccess: boolean;
  /** Signed-out visitors must sign in with Google before the apply details open. */
  isSignedIn: boolean;
}) {
  const { company, role, opportunity_type, location, batch, stipend, salary } = opportunity;
  const companyName = company?.name ?? "";
  const { a, b } = avatarGradient(companyName || role);
  const formUrl = opportunity.google_form_url || (isGoogleForm(opportunity.application_url) ? opportunity.application_url : null);
  const applyUrl = !formUrl ? opportunity.application_url : null;
  const pay = stipend || salary;
  const loginHref = `/login?next=${encodeURIComponent(`/opportunities/${opportunity.id}`)}`;
  const applyLabel = formUrl ? "Apply on Google Form" : "Apply now";

  const meta = [
    opportunity_type ? TYPE_LABELS[opportunity_type] ?? opportunity_type : null,
    location,
    batch?.length > 0 ? `Batch ${batch.join(", ")}` : null,
    pay,
  ].filter(Boolean) as string[];

  return (
    <section aria-labelledby="free-pick-title" className="free-pick">
      <div className="free-pick-top">
        <span className="free-pick-tag">Free today</span>
        <span className="free-pick-top-text">One opportunity a day with apply details open to everyone</span>
      </div>

      <div className="free-pick-body">
        <div className="free-pick-head">
          <span className="free-pick-logo" style={company?.logo_url ? undefined : { background: `linear-gradient(135deg, ${a}, ${b})` }}>
            {company?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={company.logo_url} />
            ) : (
              initials(companyName || role)
            )}
          </span>
          <div className="free-pick-titles">
            <p className="free-pick-company">{companyName}</p>
            <h2 className="free-pick-role" id="free-pick-title">
              {role}
            </h2>
            {meta.length > 0 && (
              <ul className="free-pick-meta">
                {meta.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="free-pick-apply">
          {!isSignedIn ? (
            <>
              <Link className="free-pick-btn" href={loginHref}>
                {applyLabel}
                <ExternalIcon />
              </Link>
              <span className="free-pick-hint">Free — sign in with Google to open the application.</span>
            </>
          ) : (
            <>
              {(formUrl || applyUrl) && (
                <a className="free-pick-btn" href={(formUrl || applyUrl) as string} rel="noopener noreferrer" target="_blank">
                  {applyLabel}
                  <ExternalIcon />
                </a>
              )}
              {opportunity.hr_email && (
                <a className="free-pick-contact" href={`mailto:${opportunity.hr_email}`}>
                  {opportunity.hr_email}
                </a>
              )}
              {opportunity.hr_contact && <span className="free-pick-contact">{opportunity.hr_contact}</span>}
            </>
          )}
          <Link className="free-pick-details" href={`/opportunities/${opportunity.id}`}>
            View details
          </Link>
        </div>
      </div>

      {!hasAccess && (
        <div className="free-pick-footer">
          <p className="free-pick-footer-text">
            {moreCount > 0 ? (
              <>
                <strong>{moreCount} more live opportunities</strong> — Full Access unlocks HR emails, Google Forms and
                apply links for all of them.
              </>
            ) : (
              <>Full Access unlocks HR emails, Google Forms and apply links for every opportunity.</>
            )}
          </p>
          <div className="free-pick-footer-actions">
            <Link className="free-pick-btn free-pick-btn-dark" data-app-hide href="/opportunities">
              Get Full Access · ₹{price}/month
            </Link>
            <Link className="free-pick-details" href="/opportunities">
              Browse all
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
