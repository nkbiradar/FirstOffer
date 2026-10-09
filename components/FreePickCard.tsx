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

/**
 * "Today's FREE opportunity" — the one listing the admin picked to show
 * fully unlocked to every visitor. Its real Google Form / HR email /
 * contact are visible right on the homepage, so a first-time visitor can
 * apply in one click and see FirstOffer is real, followed by an honest
 * "unlock the rest" CTA.
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

  return (
    <section className="free-pick" aria-labelledby="free-pick-title">
      <div className="free-pick-ribbon">
        <span className="free-pick-gift" aria-hidden="true">🎁</span>
        <span>
          <strong>Today&apos;s FREE opportunity</strong> — apply details unlocked for everyone, no payment
        </span>
      </div>

      <div className="free-pick-body">
        <div className="free-pick-head">
          <span className="free-pick-logo" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
            {company?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={company.logo_url} />
            ) : (
              initials(companyName || role)
            )}
          </span>
          <div>
            <p className="free-pick-company">{companyName}</p>
            <h2 className="free-pick-role" id="free-pick-title">
              {role}
            </h2>
          </div>
        </div>

        <div className="free-pick-meta">
          {opportunity_type && <span className="free-pick-chip">{TYPE_LABELS[opportunity_type] ?? opportunity_type}</span>}
          {location && <span className="free-pick-chip">📍 {location}</span>}
          {batch?.length > 0 && <span className="free-pick-chip">🎓 Batch {batch.join(" / ")}</span>}
          {pay && <span className="free-pick-chip">💰 {pay}</span>}
        </div>

        <div className="free-pick-apply">
          <p className="free-pick-apply-label">How to apply</p>
          {!isSignedIn ? (
            <div className="free-pick-apply-row">
              <Link className="btn free-pick-btn" href={loginHref}>
                {formUrl ? "📝 Apply on Google Form" : "🚀 Apply Now"}
              </Link>
              {opportunity.hr_email && <span className="free-pick-contact free-pick-locked">✉️ HR email</span>}
              {opportunity.hr_contact && <span className="free-pick-contact free-pick-locked">📞 HR contact</span>}
              <span className="free-pick-signin-note">Free — just sign in with Google to open it</span>
            </div>
          ) : (
          <div className="free-pick-apply-row">
            {formUrl && (
              <a className="btn free-pick-btn" href={formUrl} rel="noopener noreferrer" target="_blank">
                📝 Apply on Google Form
              </a>
            )}
            {applyUrl && (
              <a className="btn free-pick-btn" href={applyUrl} rel="noopener noreferrer" target="_blank">
                🚀 Apply Now
              </a>
            )}
            {opportunity.hr_email && (
              <a className="free-pick-contact" href={`mailto:${opportunity.hr_email}`}>
                ✉️ {opportunity.hr_email}
              </a>
            )}
            {opportunity.hr_contact && <span className="free-pick-contact">📞 {opportunity.hr_contact}</span>}
          </div>
          )}
          <Link className="free-pick-details" href={`/opportunities/${opportunity.id}`}>
            View full job details &rarr;
          </Link>
        </div>
      </div>

      {!hasAccess && (
        <div className="free-pick-upsell">
          <p className="free-pick-upsell-text">
            🔓 That&apos;s 1 free.{" "}
            {moreCount > 0 ? (
              <>
                <strong>{moreCount} more live opportunities</strong> have their HR emails, Google Forms &amp; apply
                links waiting.
              </>
            ) : (
              <>New opportunities go live every day — each with its HR email, Google Form &amp; apply link.</>
            )}
          </p>
          <div className="free-pick-upsell-actions">
            <Link className="btn free-pick-unlock" data-app-hide href="/opportunities">
              Unlock all — ₹{price}/month
            </Link>
            <Link className="free-pick-browse" href="/opportunities">
              Browse all opportunities &rarr;
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
