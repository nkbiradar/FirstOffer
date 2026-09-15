import type { Metadata } from "next";
import Link from "next/link";
import OpportunityCard from "@/components/OpportunityCard";
import UnlockContactCard from "@/components/UnlockContactCard";
import { getInternalOpportunities } from "@/lib/data/opportunities";
import { getUser } from "@/lib/supabase/auth";
import { hasInternalAccess } from "@/lib/data/subscriptions";
import { INTERNAL_PRICE_INR } from "@/lib/payments/razorpay";
import { getSiteUrl } from "@/lib/site-url";
import { getNonce } from "@/lib/security/csp";
import { buildLandingBreadcrumbsJsonLd } from "@/lib/seo/job-posting";

// Deliberately excluded from Google's index (see the noindex comment in
// generateMetadata below) — this product is meant to be discovered by
// visitors of the site itself, not search engines, since the entire pitch
// is "these roles aren't posted publicly."
export const metadata: Metadata = {
  title: "Internal HR Openings — Exclusive Roles | FirstOffer",
  description:
    "Exclusive openings shared directly by HRs and recruiters, with significantly lower competition than public listings. ₹39/month.",
  alternates: { canonical: `${getSiteUrl()}/internal-openings` },
  robots: { index: false, follow: true },
};

// The paywall/marketing page for the site's second, fully independent
// subscription product (see lib/payments/razorpay.ts's getProductConfig
// and the design note on the `subscriptions` table in supabase/schema.sql).
// Anyone signed in or out can browse this page and see which internal
// roles exist — OpportunityCard never renders apply details (HR email,
// application link, how-to-apply text), so nothing gated leaks here. The
// actual unlock happens on an individual opportunity's detail page
// (app/opportunities/[id]/page.tsx), exactly like the ₹49/month product.
export default async function InternalOpeningsPage() {
  const nonce = await getNonce();
  const [user, { opportunities, total }] = await Promise.all([
    getUser(),
    getInternalOpportunities(),
  ]);
  const isUnlocked = user ? await hasInternalAccess(user.id) : false;

  const breadcrumbsJsonLd = buildLandingBreadcrumbsJsonLd("Internal HR Openings", "/internal-openings");

  return (
    <main className="page page-wide">
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <span className="breadcrumbs-current" aria-current="page">Internal HR Openings</span>
        </nav>

        <section className="internal-hr-hero">
          <span className="internal-hr-hero-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Exclusive Access
          </span>
          <h1 className="internal-hr-hero-title">Get Jobs Before Everyone Else 🚀</h1>
          <p className="internal-hr-hero-sub">
            Exclusive openings shared directly by HRs &amp; recruiters — with significantly lower competition.
          </p>

          <ul className="internal-hr-hero-checklist">
            <li>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Direct HR-shared openings
            </li>
            <li>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Low-competition opportunities
            </li>
            <li>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Early access to fresh roles
            </li>
            <li>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Roles that may not be widely posted
            </li>
          </ul>

          {isUnlocked ? (
            <p className="internal-hr-hero-unlocked">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              You&apos;re unlocked — open any opening below to see the full apply details.
            </p>
          ) : (
            <UnlockContactCard isSignedIn={Boolean(user)} price={INTERNAL_PRICE_INR} product="internal_hr" />
          )}
        </section>

        <div className="dashboard-section-header" style={{ marginTop: 40 }}>
          <h2>Internal Openings</h2>
          <p className="section-sub">{total} exclusive opening{total === 1 ? "" : "s"} shared by HRs right now.</p>
        </div>

        {opportunities.length === 0 ? (
          <div className="empty-state">
            <h3>No internal openings live right now</h3>
            <p>New HR-shared roles are added as they come in — check back soon, or unlock above to get notified first.</p>
          </div>
        ) : (
          <div className="opportunity-grid">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
