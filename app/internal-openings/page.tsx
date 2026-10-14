import type { Metadata } from "next";
import Link from "next/link";
import OpportunityCard from "@/components/OpportunityCard";
import UnlockContactCard from "@/components/UnlockContactCard";
import AppMembersOnlyNote from "@/components/AppMembersOnlyNote";
import { isAppRequest } from "@/lib/nativeAppServer";
import { getInternalOpportunities } from "@/lib/data/opportunities";
import { getUser } from "@/lib/supabase/auth";
import { hasInternalAccess } from "@/lib/data/subscriptions";
import { DASARA_SALE_END_LABEL, INTERNAL_PRICE_INR, getInternalPriceInr, isDasaraSaleActive } from "@/lib/payments/razorpay";
import { getSiteUrl } from "@/lib/site-url";
import { getNonce } from "@/lib/security/csp";
import { buildLandingBreadcrumbsJsonLd } from "@/lib/seo/job-posting";

const DATA_AI_KITS = [
  { slug: "sql", emoji: "🗄️", title: "SQL for Data Analysts", topics: "Joins · ranking · window functions · duplicates" },
  { slug: "python", emoji: "🐼", title: "Python & Pandas", topics: "Cleaning · groupby · merge · dates · outliers" },
  { slug: "excel", emoji: "📊", title: "Excel, Statistics & Power BI", topics: "Lookups · pivots · p-values · A/B tests · DAX" },
  { slug: "ml", emoji: "🤖", title: "Machine Learning Basics", topics: "Overfitting · metrics · trees · scaling · K-means" },
  { slug: "genai", emoji: "✨", title: "Generative AI & LLMs", topics: "Prompting · embeddings · RAG · evaluation · safety" },
];

// Deliberately excluded from Google's index (see the noindex comment in
// generateMetadata below) — this product is meant to be discovered by
// visitors of the site itself, not search engines, since the entire pitch
// is "these roles aren't posted publicly."
export const metadata: Metadata = {
  title: "Internal HR Openings — Exclusive Roles",
  description:
    `Exclusive openings shared directly by HRs and recruiters, with significantly lower competition than public listings. ₹${INTERNAL_PRICE_INR} for 3 months.`,
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
// Fixed number of locked "mystery" teaser slots shown to a visitor who
// hasn't unlocked yet — deliberately NOT tied to the real count of internal
// openings that day (see MYSTERY_SLOT_COUNT below). The actual number of
// openings is still shown honestly as text; only the identity of the
// companies/roles behind that number is withheld, which is the actual
// paywall — see applyInternalFilter/getInternalOpportunities for the
// exclusion that backs this on the public listings side too.
const MYSTERY_SLOT_COUNT = 6;

export default async function InternalOpeningsPage() {
  const nonce = await getNonce();
  const user = await getUser();
  const isUnlocked = user ? await hasInternalAccess(user.id) : false;
  // Android app: no prices or purchase buttons (Google Play policy).
  const inApp = await isAppRequest();
  // A locked visitor never needs the actual company/role rows — only the
  // total count for the "N exclusive openings" line — so this fetches just
  // 1 row (discarded below) instead of the real listing data whenever
  // locked. Real rows are only ever fetched, and only ever rendered, once
  // isUnlocked is true.
  const { opportunities, total } = await getInternalOpportunities(isUnlocked ? 50 : 1);

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
          <h1 className="internal-hr-hero-title">Get Jobs Before Everyone Else</h1>
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
            <li>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Bonus: 6 Interview Question Kits (PDF)
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
            <div id="unlock-internal-hr">
              {inApp ? (
                <AppMembersOnlyNote
                  isSignedIn={Boolean(user)}
                  next="/internal-openings"
                  what="Internal HR Openings are available to FirstOffer Internal HR members."
                />
              ) : (
                <UnlockContactCard
                  isSignedIn={Boolean(user)}
                  price={getInternalPriceInr()}
                  priceNote={
                    isDasaraSaleActive()
                      ? `🪔 Dasara Offer — ₹${INTERNAL_PRICE_INR} → ₹${getInternalPriceInr()} for 3 months, till ${DASARA_SALE_END_LABEL}.`
                      : undefined
                  }
                  product="internal_hr"
                />
              )}
            </div>
          )}
        </section>

        {/* Members-only perk: the Coding Interview Kit PDF (served by
            app/api/internal/interview-kit, which re-checks access). */}
        <section className={`interview-kit ${isUnlocked ? "is-unlocked" : "is-locked"}`}>
          <span aria-hidden="true" className="interview-kit-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" strokeLinejoin="round" />
              <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5ZM9 8h7M9 11.5h5" strokeLinecap="round" />
            </svg>
          </span>
          <div className="interview-kit-body">
            <span className="interview-kit-eyebrow">Internal Interview Questions · Members only</span>
            <h2>Coding Interview Kit — 30 questions companies keep asking</h2>
            <p>
              24 must-practice problems plus 6 bonus fresher favourites — each with a simple explanation, tested Python
              solution, complexity, edge cases and the follow-up the interviewer may ask next.
            </p>
          </div>
          {isUnlocked ? (
            <a className="btn btn-primary interview-kit-cta" href="/api/internal/interview-kit">
              Download PDF
            </a>
          ) : (
            <a className="btn btn-secondary interview-kit-cta" href="#unlock-internal-hr">
              🔒 Unlock to download
            </a>
          )}
        </section>

        {/* Data Analytics & AI kits — same members-only route (?kit=…). */}
        <section className={`kit-list ${isUnlocked ? "is-unlocked" : "is-locked"}`}>
          <div className="kit-list-head">
            <span className="interview-kit-eyebrow">Data Analytics &amp; AI · Members only</span>
            <h2>5 more interview kits — 20 questions each</h2>
            <p>Written from the interviewer&apos;s side, easy to medium, with tested queries and code.</p>
          </div>
          <ul className="kit-list-grid">
            {DATA_AI_KITS.map((k) => (
              <li className="kit-list-item" key={k.slug}>
                <span aria-hidden="true" className="kit-list-emoji">
                  {k.emoji}
                </span>
                <div className="kit-list-text">
                  <strong>{k.title}</strong>
                  <span>{k.topics}</span>
                </div>
                {isUnlocked ? (
                  <a className="btn btn-sm btn-primary" href={`/api/internal/interview-kit?kit=${k.slug}`}>
                    Download
                  </a>
                ) : (
                  <a className="btn btn-sm btn-secondary" href="#unlock-internal-hr">
                    🔒 Unlock
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>

        <div className="dashboard-section-header" style={{ marginTop: 40 }}>
          <h2>Internal Openings</h2>
          <p className="section-sub">
            {total === 0
              ? "No internal openings live right now."
              : `${total} exclusive opening${total === 1 ? "" : "s"} shared by HRs today.`}
          </p>
        </div>

        {/* Sets the right expectation for update cadence: unlike the rest of
            the site (new public opportunities appear continuously and get
            one combined digest email a day), this section has no fixed
            schedule — it only changes when an HR actually shares a new
            internal opening with us, which could be daily or could be a
            gap of several days. Without this, "why hasn't this updated in
            2 days?" reads as a bug rather than the expected behavior. */}
        <div className="internal-hr-update-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" strokeLinecap="round" />
            <circle cx="12" cy="16" r="0.5" fill="currentColor" />
          </svg>
          <p>
            This list doesn&apos;t refresh daily like the rest of the site — it updates only when an HR shares a new
            internal opening with us directly, so it may stay the same for a few days at a time.
          </p>
        </div>

        {total === 0 ? (
          <div className="empty-state">
            <h3>No internal openings live right now</h3>
            <p>
              New HR-shared roles are added as they come in — check back soon
              {inApp ? "." : ", or unlock above to get notified first."}
            </p>
          </div>
        ) : isUnlocked ? (
          <div className="opportunity-grid">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} isSignedIn={Boolean(user)} />
            ))}
          </div>
        ) : (
          // The suspense/paywall grid: real openings exist (total > 0,
          // confirmed above), but not one real company name or role title
          // renders here — every card shows the exact same generic
          // "Company Hidden" label and the same three value-prop tags,
          // never anything pulled from the actual opportunity rows, so
          // nothing here could be mistaken for genuine content. This
          // replaced an earlier version that used blank shimmering bars
          // instead of readable text/tags — visitors read those as a
          // rendering bug rather than an intentional paywall. Each card
          // still links back up to the unlock card rather than anywhere
          // real, since there's nothing real to link to yet.
          <div className="internal-mystery-grid">
            {Array.from({ length: MYSTERY_SLOT_COUNT }).map((_, index) => (
              <Link
                href="#unlock-internal-hr"
                className="internal-mystery-card"
                key={index}
                aria-label="Locked internal opening — unlock to see the company and role"
              >
                <span className="internal-mystery-lock" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="internal-mystery-company">Company Hidden</span>
                <span className="internal-mystery-role">{inApp ? "Members only" : "Role locked until unlock"}</span>
                <div className="internal-mystery-tags" aria-hidden="true">
                  <span className="internal-mystery-tag">Special Hiring</span>
                  <span className="internal-mystery-tag">Low Competition</span>
                  <span className="internal-mystery-tag">Shared by HR</span>
                </div>
                <span className="internal-mystery-cta" aria-hidden="true">{inApp ? "Members only" : "Unlock to Reveal"}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
