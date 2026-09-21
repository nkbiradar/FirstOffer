import Link from "next/link";
import Image from "next/image";
import OpportunityCard from "@/components/OpportunityCard";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import SuccessStories from "@/components/SuccessStories";
import { getHomepageOpportunities, getSiteStats } from "@/lib/data/opportunities";
import { getCompaniesWithPublishedCounts } from "@/lib/data/companies";
import { getPublishedTestimonials } from "@/lib/data/testimonials";
import { getActiveAnnouncement } from "@/lib/data/site-announcement";
import { avatarGradient, initials, todayShortLabel } from "@/lib/ui-format";
import { getSiteUrl } from "@/lib/site-url";
import { getNonce } from "@/lib/security/csp";
import { getUser } from "@/lib/supabase/auth";
import { hasFullAccess } from "@/lib/data/opportunity-unlocks";
import { hasLegacyFullAccessPricing } from "@/lib/data/subscriptions";
import { MONTHLY_PRICE_INR, LEGACY_MONTHLY_PRICE_INR } from "@/lib/payments/razorpay";

export const metadata = {
  title: "FirstOffer — Find Fresher Jobs, Tech Openings & Off-Campus Drives",
  description:
    "Find your first offer faster. Discover fresher jobs, tech jobs, internships and off-campus opportunities from companies hiring across India. Updated daily.",
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    title: "Find Your First Offer Faster | FirstOffer",
    description:
      "Discover fresher jobs, tech jobs, internships and off-campus opportunities from companies hiring across India.",
    url: getSiteUrl(),
    type: "website",
    images: [{ url: "/images/hero-journey.webp", width: 1672, height: 941 }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Find Your First Offer Faster | FirstOffer",
    description:
      "Discover fresher jobs, tech jobs, internships and off-campus opportunities from companies hiring across India.",
  },
};

const HOW_IT_WORKS = [
  {
    title: "Browse, no sign-in needed",
    desc: "Search and filter every live internship, full-time role and off-campus drive — free, with no account required.",
  },
  {
    title: "Sign in when you're ready",
    desc: "One Google sign-in unlocks tracking — mark what you've applied to and get a nudge to log the outcome.",
  },
  {
    title: "Apply straight to the source",
    desc: "Every listing links to the company's own application link, form or email — no middlemen, no detours.",
  },
  {
    title: "Track it, hear back",
    desc: "Your applications page keeps a running list, so nothing you've sent out gets forgotten.",
  },
];

export default async function HomePage() {
  const nonce = await getNonce();
  const user = await getUser();
  const [
    { today, earlier, todayDateLabel, todayCount },
    stats,
    companies,
    testimonials,
    announcement,
    alreadyHasFullAccess,
    isLegacyFullAccessUser,
  ] = await Promise.all([
    getHomepageOpportunities(),
    getSiteStats(),
    getCompaniesWithPublishedCounts(),
    getPublishedTestimonials(),
    getActiveAnnouncement(),
    user ? hasFullAccess(user.id) : Promise.resolve(false),
    user ? hasLegacyFullAccessPricing(user.id) : Promise.resolve(false),
  ]);

  // Short "14 Sep" form for the hero pill -- todayDateLabel ("14 September
  // 2026") above is already computed for the "Today's Opportunities"
  // heading further down, but that's too long for a one-line pill.
  const heroDateLabel = todayShortLabel();

  const topCompanies = companies
    .filter((company) => company.publishedOpportunityCount > 0)
    .sort((a, b) => b.publishedOpportunityCount - a.publishedOpportunityCount)
    .slice(0, 8);

  const siteUrl = getSiteUrl();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FirstOffer",
    url: siteUrl,
    description:
      "Find your first offer faster. Discover fresher jobs, tech jobs, internships and off-campus opportunities from companies hiring across India.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/opportunities?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main>
      {/* WebSite Schema for SearchAction */}
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <div className="top-credibility-strip">
        <div className="top-credibility-inner">
          <span aria-hidden="true">🔐</span>
          <span className="top-credibility-text">Built by members from</span>
          <span className="top-credibility-institute">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="top-credibility-logo" alt="" src="/images/logos/iiit-dharwad.jpg" />
            IIIT Dharwad
          </span>
          <span className="top-credibility-text">,</span>
          <span className="top-credibility-institute">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="top-credibility-logo" alt="" src="/images/logos/iit-bombay.webp" />
            IIT Bombay
          </span>
          <span className="top-credibility-text">&amp;</span>
          <span className="top-credibility-institute">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="top-credibility-logo" alt="" src="/images/logos/iit-madras.jpg" />
            IIT Madras
          </span>
        </div>
      </div>

      <section className="hero">
        <div className="container hero-content">
          <div className="hero-copy hero-copy-centered">
            <p className="apply-channels-kicker">Not Just Another Job Listing</p>
            <p className="apply-channels-headline">
              Every Opportunity Comes With a Real Way In — HR&apos;s Email, Number, Form, or Link.
            </p>

            <div className="apply-channels" role="list" aria-label="Ways to apply on every listing">
              <div className="apply-channel-card" role="listitem">
                <span className="apply-channel-icon" aria-hidden="true">
                  📧
                </span>
                <p className="apply-channel-title">HR Email IDs</p>
                <p className="apply-channel-desc">Apply directly through available HR email IDs</p>
              </div>
              <div className="apply-channel-card" role="listitem">
                <span className="apply-channel-icon" aria-hidden="true">
                  📞
                </span>
                <p className="apply-channel-title">HR / Recruiter Numbers</p>
                <p className="apply-channel-desc">Direct contact details wherever available</p>
              </div>
              <div className="apply-channel-card" role="listitem">
                <span className="apply-channel-icon" aria-hidden="true">
                  📝
                </span>
                <p className="apply-channel-title">Direct Google Forms</p>
                <p className="apply-channel-desc">Application forms shared directly by companies</p>
              </div>
              <div className="apply-channel-card" role="listitem">
                <span className="apply-channel-icon" aria-hidden="true">
                  🔗
                </span>
                <p className="apply-channel-title">Direct Company Links</p>
                <p className="apply-channel-desc">Apply through official career/application links</p>
              </div>
            </div>

            <span className="eyebrow">
              <span className="eyebrow-dot" />
              {todayCount > 0 ? `${todayCount} New Today` : "Live"} • Updated {heroDateLabel}
            </span>

            <h1>
              Find Your First Offer
              <br />
              <span className="highlight-swoosh">
                Faster.
                <svg className="swoosh-svg" viewBox="0 0 320 24" fill="none" aria-hidden="true">
                  <path d="M4 15c48-12 240-16 312 3" stroke="var(--color-accent)" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="hero-sub" style={{ fontSize: 17, maxWidth: 640 }}>
              Discover fresher jobs, tech jobs, internships and off-campus opportunities from companies hiring across India.
            </p>

            <p className="hero-note">
              Older opportunities expire within 2 days as companies close hiring — apply fast.
            </p>

            <div className="hero-actions">
              <Link className="btn btn-primary" href="/fresher-jobs">
                Find Fresher Jobs
              </Link>
              <Link className="btn btn-secondary" href="/tech-jobs">
                Browse Tech Jobs
              </Link>
            </div>
          </div>

          <div className="hero-journey">
            <Image
              className="hero-journey-img"
              alt="Students navigating fresh opportunities towards sunrise skyline with FirstOffer"
              src="/images/hero-journey.webp"
              width={1672}
              height={941}
              priority
            />
            <span className="hero-spark hero-spark-1" />
            <span className="hero-spark hero-spark-2" />
            <span className="hero-spark hero-spark-3" />
            <span className="hero-spark hero-spark-4" />
            <span className="hero-spark hero-spark-5" />
          </div>

          <div className="trust-bar">
            <div className="trust-item">
              <span className="trust-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 8v4l3 3M12 3a9 9 0 100 18 9 9 0 000-18z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="trust-item-title">Live for 48 hours, then gone</p>
              <p className="trust-item-desc">
                Every listing is pulled automatically two days after it goes up — nothing you see here has already
                closed.
              </p>
            </div>
            <div className="trust-item">
              <span className="trust-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="trust-item-title">Straight to the source</p>
              <p className="trust-item-desc">
                Apply directly through the company&apos;s own link, form, or email — no middlemen, no detours.
              </p>
            </div>
            <div className="trust-item">
              <span className="trust-item-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path
                    d="M12 4.5c-4.5 0-8.3 3-9.5 7.5 1.2 4.5 5 7.5 9.5 7.5s8.3-3 9.5-7.5c-1.2-4.5-5-7.5-9.5-7.5z M12 15a3 3 0 100-6 3 3 0 000 6z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p className="trust-item-title">Browse free, forever</p>
              <p className="trust-item-desc">
                Search every listing with no account. Sign in free with Google to open a role&apos;s full details, or to track what you&apos;ve applied to.
              </p>
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat-tile">
              <span className="stat-value">
                <CountUp value={todayCount} />
              </span>
              <span className="stat-label">Opportunities today</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value">
                <CountUp value={stats.totalCompanies} />
              </span>
              <span className="stat-label">Companies hiring</span>
            </div>
            <div className="stat-tile">
              <span className="stat-value">
                <CountUp value={stats.totalOpportunities} />
              </span>
              <span className="stat-label">Live opportunities</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Explore by Category: SEO Internal Linking Hub */}
        <Reveal>
          <section className="section" style={{ paddingTop: 16 }}>
            <div className="section-header">
              <div>
                <span className="eyebrow">
                  <span className="eyebrow-dot" />
                  Explore Opportunities
                </span>
                <h2 style={{ marginTop: 8 }}>Find Your Next Opportunity by Category</h2>
                <p className="section-sub">
                  Targeted pathways for freshers, engineers, and recent graduates looking for verified roles.
                </p>
              </div>
            </div>

            <div className="seo-categories-grid">
              <Link href="/fresher-jobs" className="seo-category-card">
                <div className="seo-category-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <h3>
                  Fresher Jobs
                  <span>&rarr;</span>
                </h3>
                <p>Entry-level jobs and internships tailored for freshers and the 2026 batch.</p>
              </Link>

              <Link href="/tech-jobs" className="seo-category-card">
                <div className="seo-category-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <h3>
                  Tech &amp; Software Jobs
                  <span>&rarr;</span>
                </h3>
                <p>Software development, frontend, backend, QA, and data roles across India.</p>
              </Link>

              <Link href="/off-campus-jobs" className="seo-category-card">
                <div className="seo-category-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3>
                  Off-Campus Drives
                  <span>&rarr;</span>
                </h3>
                <p>Open recruitment drives and direct application links with no placement cell queue.</p>
              </Link>

              <Link href="/companies" className="seo-category-card">
                <div className="seo-category-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <h3>
                  Companies Hiring
                  <span>&rarr;</span>
                </h3>
                <p>Browse active companies with live, verified openings on FirstOffer.</p>
              </Link>

              <Link href="/resume-match" className="seo-category-card">
                <div className="seo-category-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3>
                  Resume Keyword Matcher
                  <span>&rarr;</span>
                </h3>
                <p>Free tool — see how your resume matches any job&apos;s required keywords before you apply.</p>
              </Link>
            </div>
          </section>
        </Reveal>

        {/* Full-access membership pricing announcement — ₹99/month is the
            regular price; anyone with a completed payment on record at the
            old ₹49 rate (see hasLegacyFullAccessPricing() in
            lib/data/subscriptions.ts) keeps ₹49 on every future renewal,
            forever. Personalized for a signed-in visitor who already
            qualifies or already has access; a signed-out or brand-new
            visitor sees the current regular price plus the honest reason it
            moved — no countdown or "before it changes" framing, since the
            new price is already in effect for anyone without that history. */}
        <Reveal>
          <section className="section" style={{ paddingTop: 8 }}>
            <div className="pricing-promo">
              <span className="pricing-promo-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Membership Pricing
              </span>
              {alreadyHasFullAccess ? (
                <>
                  <h2 className="pricing-promo-title">
                    {isLegacyFullAccessUser
                      ? `You're on founding-member pricing — ₹${LEGACY_MONTHLY_PRICE_INR}/month`
                      : "Your full access is active"}
                  </h2>
                  <p className="pricing-promo-sub">
                    Every direct HR email, recruiter number, Google Form, and application link on FirstOffer stays
                    unlocked while your access is active.
                    {isLegacyFullAccessUser && " Your rate is locked in for as long as you stay subscribed."}
                  </p>
                  <Link href="/dashboard" className="btn btn-primary pricing-promo-cta">
                    View my membership
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="pricing-promo-title">
                    {isLegacyFullAccessUser
                      ? `Your founding-member price: ₹${LEGACY_MONTHLY_PRICE_INR}/month`
                      : `Full access is ₹${MONTHLY_PRICE_INR}/month`}
                  </h2>
                  <p className="pricing-promo-sub">
                    {isLegacyFullAccessUser
                      ? `Unlocks every direct HR email, recruiter number, Google Form, and application link on FirstOffer — at the rate you already locked in, for as long as you stay subscribed.`
                      : `Unlocks every direct HR email, recruiter number, Google Form, and application link on FirstOffer. Members who joined earlier locked in ₹${LEGACY_MONTHLY_PRICE_INR}/month for as long as they stay subscribed — pricing moved to ₹${MONTHLY_PRICE_INR}/month as FirstOffer added Internal HR Openings, the Resume Keyword Matcher, and more categories.`}
                  </p>
                  <Link href="/opportunities" className="btn btn-primary pricing-promo-cta">
                    {isLegacyFullAccessUser ? "Continue at your price" : `Unlock full access — ₹${MONTHLY_PRICE_INR}/month`}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </>
              )}
            </div>
          </section>
        </Reveal>

        {/* Internal HR Openings — a separately-sold, deliberately
            higher-contrast promo distinct from the rest of the site's
            indigo/teal branding, linking to /internal-openings. The copy
            here mirrors PRODUCT_COPY.internal_hr in UnlockContactCard.tsx
            and is only truthful because getInternalOpportunities() /
            applyInternalFilter() (lib/data/opportunities.ts) structurally
            keep these roles out of every other listing on the site. */}
        <Reveal>
          <section className="section" style={{ paddingTop: 8 }}>
            <Link href="/internal-openings" className="internal-hr-promo">
              <span className="internal-hr-promo-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Exclusive Access
              </span>
              <h2 className="internal-hr-promo-heading">🔥 Internal HR Openings</h2>
              <p className="internal-hr-promo-title">Get Jobs Before Everyone Else 🚀</p>
              <p className="internal-hr-promo-sub">
                Exclusive openings shared directly by HRs &amp; recruiters — with significantly lower competition.
              </p>
              <ul className="internal-hr-promo-checklist">
                <li>Direct HR-shared openings</li>
                <li>Low-competition opportunities</li>
                <li>Early access to fresh roles</li>
                <li>Roles that may not be widely posted</li>
              </ul>
              <span className="btn btn-primary internal-hr-promo-cta">
                Unlock Internal Openings — ₹39/month
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          </section>
        </Reveal>

        <Reveal>
          <section className="section" style={{ paddingTop: 8 }}>
            <div className="section-header">
              <div>
                <h2>Today&apos;s Opportunities</h2>
                <p className="section-sub">{todayDateLabel}</p>
              </div>
            </div>

            {announcement && (
              <div className="homepage-announcement-banner">
                <span className="homepage-announcement-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path
                      d="M3 11v2a2 2 0 002 2h1l3.5 5v-5H15l5 3V6l-5 3H9.5L6 4v5H5a2 2 0 00-2 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <p>{announcement}</p>
              </div>
            )}

            {today.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 8v4l3 3M12 3a9 9 0 100 18 9 9 0 000-18z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h3>Nothing published today just yet</h3>
                <p>Check back soon, or browse everything that&apos;s currently live.</p>
                <Link className="btn btn-secondary btn-sm" href="/fresher-jobs">
                  View all fresher jobs
                </Link>
              </div>
            ) : (
              <div className="opportunity-grid">
                {today.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} isSignedIn={Boolean(user)} />
                ))}
              </div>
            )}
          </section>
        </Reveal>

        {earlier.length > 0 && (
          <Reveal>
            <section className="section" style={{ paddingTop: 0 }}>
              <div className="section-header">
                <h2>Earlier Opportunities</h2>
              </div>
              <div className="opportunity-grid">
                {earlier.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} isSignedIn={Boolean(user)} />
                ))}
              </div>
            </section>
          </Reveal>
        )}

        <Reveal>
          <section className="section mission-section">
            <div className="mission-panel">
              <div className="mission-content">
                <span className="eyebrow">
                  <span className="eyebrow-dot" />
                  Why FirstOffer
                </span>
                <h2 style={{ marginTop: 10 }}>Because your first offer shouldn&apos;t take a semester to find</h2>
                <p>
                  Every listing here is checked and published by hand, not scraped and dumped — and if it goes
                  stale, it&apos;s pulled within 48 hours. No account walls, no recruiter middlemen — just a direct
                  line from what&apos;s hiring to where you apply.
                </p>
                <Link className="btn btn-secondary btn-sm" href="/fresher-jobs">
                  See what&apos;s live right now
                </Link>
              </div>
              <Image
                className="mission-photo"
                alt="Direct application to fresher jobs on FirstOffer"
                src="/images/apply-illustration.webp"
                width={500}
                height={745}
              />
            </div>
          </section>
        </Reveal>

        {topCompanies.length > 0 && (
          <Reveal>
            <section className="section companies-section">
              <div className="section-header">
                <div>
                  <span className="eyebrow">
                    <span className="eyebrow-dot" />
                    Companies hiring right now
                  </span>
                  <h2 style={{ marginTop: 10 }}>Real companies, live on FirstOffer today</h2>
                  <p className="section-sub">
                    Pulled straight from what&apos;s actually published — no fixed roster, updated as often as new
                    opportunities come in.
                  </p>
                </div>
              </div>
              <div className="company-chip-grid">
                {topCompanies.map((company) => {
                  const { a, b } = avatarGradient(company.name);
                  return (
                    <Link
                      key={company.id}
                      href={`/opportunities?q=${encodeURIComponent(company.name)}`}
                      className="company-chip"
                      style={{ ["--avatar-a" as string]: a, ["--avatar-b" as string]: b }}
                    >
                      <span className="company-avatar">
                        {company.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="" src={company.logo_url} />
                        ) : (
                          initials(company.name)
                        )}
                      </span>
                      <span className="company-chip-name">{company.name}</span>
                      <span className="company-chip-count">
                        {company.publishedOpportunityCount} open
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </Reveal>
        )}

        <Reveal>
          <section className="section steps-section">
            <div className="section-header">
              <div>
                <span className="eyebrow">
                  <span className="eyebrow-dot" />
                  How it works
                </span>
                <h2 style={{ marginTop: 10 }}>From browsing to your first offer</h2>
              </div>
            </div>
            <div className="steps-panel">
              <Image
                className="steps-photo"
                alt="Student journey to finding their first job"
                src="/images/journey-illustration.webp"
                width={520}
                height={729}
              />
              <div className="steps-list">
                {HOW_IT_WORKS.map((step, index) => (
                  <div className="step-row" key={step.title}>
                    <span className="step-number">{index + 1}</span>
                    <div>
                      <p className="step-title">{step.title}</p>
                      <p className="step-desc">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        {testimonials.length > 0 && (
          <Reveal>
            <section className="section success-stories-section">
              <div className="section-header">
                <div>
                  <span className="eyebrow">
                    <span className="eyebrow-dot" />
                    Success stories
                  </span>
                  <h2 style={{ marginTop: 10 }}>Students Who Found Their Next Opportunity</h2>
                  <p className="section-sub">
                    Real experiences shared by students who used FirstOffer — submitted by them, not
                    written by us.
                  </p>
                </div>
              </div>
              <SuccessStories testimonials={testimonials} />
            </section>
          </Reveal>
        )}

        <Reveal>
          <section className="section closing-section">
            <div className="closing-panel">
              <Image
                className="closing-photo"
                alt="Students reviewing a fresher job opportunity together"
                src="/images/students.jpg"
                width={1200}
                height={800}
              />
              <div className="closing-content">
                <h2>Built for students figuring out what&apos;s next</h2>
                <p>
                  No account walls, no stale listings, no guessing whether a posting is still open. Just every live
                  fresher opportunity, in one place, for as long as it&apos;s actually hiring.
                </p>
                <Link className="btn btn-primary" href="/fresher-jobs">
                  Find Fresher Jobs
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
