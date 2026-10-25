import Link from "next/link";
import Image from "next/image";
import OpportunityCard from "@/components/OpportunityCard";
import Reveal from "@/components/Reveal";
import SuccessStories from "@/components/SuccessStories";
import FreePickCard from "@/components/FreePickCard";
import DirectFlow from "@/components/DirectFlow";
import WhatWorkedCard from "@/components/WhatWorkedCard";
import HomeDarkHero from "@/components/HomeDarkHero";
import { ROLE_CATEGORIES, categorizeRole, isRoleSlug } from "@/lib/roles";
import { avatarGradient, initials, todayShortLabel } from "@/lib/ui-format";
import { getSiteUrl } from "@/lib/site-url";
import { getNonce } from "@/lib/security/csp";
import { getUser } from "@/lib/supabase/auth";
import { hasFullAccess } from "@/lib/data/opportunity-unlocks";
import PricingPlans from "@/components/PricingPlans";
import OffCampusCompare from "@/components/OffCampusCompare";
import {
  getActiveAnnouncementCached,
  getCompaniesWithPublishedCountsCached,
  getFeaturedInternsCached,
  getFreePickOpportunityCached,
  getHomepageOpportunitiesCached,
  getPublishedTestimonialsCached,
  getPublishedWhatWorkedCached,
  getSiteStatsCached,
} from "@/lib/data/cached";
import { getFullAccessPriceInr } from "@/lib/payments/razorpay";

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

type HomeSearchParams = { [key: string]: string | string[] | undefined };

export default async function HomePage({ searchParams }: { searchParams: Promise<HomeSearchParams> }) {
  const homeParams = await searchParams;
  const roleParam = Array.isArray(homeParams.role) ? homeParams.role[0] : homeParams.role;
  const selectedRole = isRoleSlug(roleParam) ? roleParam : undefined;
  const nonce = await getNonce();
  const user = await getUser();
  const [
    { today, earlier, todayDateLabel, todayCount },
    stats,
    companies,
    testimonials,
    announcement,
    alreadyHasFullAccess,
    freePick,
    featuredInterns,
    whatWorked,
  ] = await Promise.all([
    // Every live opportunity (they expire after 48h, so this stays small) —
    // the role counts and filters must cover all of them, not just the newest 30.
    getHomepageOpportunitiesCached(500),
    getSiteStatsCached(),
    getCompaniesWithPublishedCountsCached(),
    getPublishedTestimonialsCached(),
    getActiveAnnouncementCached(),
    user ? hasFullAccess(user.id) : Promise.resolve(false),
    getFreePickOpportunityCached(),
    getFeaturedInternsCached(),
    getPublishedWhatWorkedCached(3),
  ]);

  // Short "14 Sep" form for the hero pill -- todayDateLabel ("14 September
  // 2026") above is already computed for the "Today's Opportunities"
  // heading further down, but that's too long for a one-line pill.
  const heroDateLabel = todayShortLabel();

  // Role filter for Today's / Earlier Opportunities (?role=software etc.),
  // categories from the job title — see lib/roles.ts.
  const liveForRoles = [...today, ...earlier];
  const homeRoleOptions = ROLE_CATEGORIES.map((c) => ({
    slug: c.slug,
    label: c.label,
    count: liveForRoles.filter((o) => categorizeRole(o.role).includes(c.slug)).length,
  })).filter((c) => c.count > 0);
  const matchesRole = (o: { role: string }) => !selectedRole || categorizeRole(o.role).includes(selectedRole);
  const todayShown = today.filter(matchesRole);
  const earlierMatching = earlier.filter(matchesRole);
  // Without a role filter, keep the homepage a sensible length: show the
  // first 24 earlier openings and link to the full list for the rest.
  const EARLIER_CAP = 24;
  const earlierShown = selectedRole ? earlierMatching : earlierMatching.slice(0, EARLIER_CAP);
  const earlierHidden = earlierMatching.length - earlierShown.length;

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

      <HomeDarkHero
        dateLabel={heroDateLabel}
        openings={today.length > 0 ? today : earlier}
        stats={stats}
        todayCount={todayCount}
      />

      {/* Today's FREE opportunity — picked by the admin (see the
          is_free_pick column). Shown to every visitor, signed in or not,
          with its real apply details, right after the dark hero. */}
      {freePick && (
        <section className="free-pick-section">
          <div className="container">
            <FreePickCard
              opportunity={freePick}
              moreCount={Math.max(stats.totalOpportunities - 1, 0)}
              price={getFullAccessPriceInr()}
              hasAccess={alreadyHasFullAccess}
              isSignedIn={Boolean(user)}
            />
          </div>
        </section>
      )}

      {/* "No middlemen" animation: student → live jobs → HR, just below the hero. */}
      <div className="container dflow-wrap">
        <DirectFlow />
      </div>

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
            </div>
          </section>
        </Reveal>

        {/* Dark three-plan pricing (Full Access / Internal HR / Resume
            Makeover) + "why off-campus" comparison. Prices and offers come
            from lib/payments/razorpay.ts. */}
        <Reveal>
          <section className="section" style={{ paddingTop: 8 }}>
            <PricingPlans hasFullAccess={alreadyHasFullAccess} />
            <OffCampusCompare totalInterviews={stats.totalInterviews} totalStartups={stats.totalStartups} />
          </section>
        </Reveal>

        <Reveal>
          <section className="section home-opps-section" id="todays-opportunities" style={{ paddingTop: 8 }}>
            <div className="section-header">
              <div>
                <h2>Today&apos;s Opportunities</h2>
                <p className="section-sub">{todayDateLabel}</p>
              </div>
            </div>

            {homeRoleOptions.length > 0 && (
              <div className="role-filters home-role-filters" role="group" aria-label="Filter by role">
                <span className="role-filters-label">Role</span>
                <div className="role-filters-scroll">
                  <Link
                    className={`filter-pill ${!selectedRole ? "active" : ""}`}
                    href="/#todays-opportunities"
                    scroll={false}
                  >
                    All roles <span className="role-filter-count">{liveForRoles.length}</span>
                  </Link>
                  {homeRoleOptions.map((c) => (
                    <Link
                      className={`filter-pill ${selectedRole === c.slug ? "active" : ""}`}
                      href={`/?role=${c.slug}#todays-opportunities`}
                      key={c.slug}
                      scroll={false}
                    >
                      {c.label} <span className="role-filter-count">{c.count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

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

            {todayShown.length === 0 && selectedRole ? (
              <div className="empty-state">
                <h3>No new {ROLE_CATEGORIES.find((c) => c.slug === selectedRole)?.label} roles today</h3>
                <p>{earlierShown.length > 0 ? "See the earlier ones below, or browse all live roles." : "Browse all live roles for this category."}</p>
                <Link className="btn btn-secondary btn-sm" href={`/opportunities?role=${selectedRole}`}>
                  View all {ROLE_CATEGORIES.find((c) => c.slug === selectedRole)?.label} jobs
                </Link>
              </div>
            ) : today.length === 0 ? (
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
                {todayShown.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} isSignedIn={Boolean(user)} />
                ))}
              </div>
            )}
          </section>
        </Reveal>

        {earlierShown.length > 0 && (
          <Reveal>
            <section className="section" style={{ paddingTop: 0 }}>
              <div className="section-header">
                <h2>Earlier Opportunities</h2>
              </div>
              <div className="opportunity-grid">
                {earlierShown.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} isSignedIn={Boolean(user)} />
                ))}
              </div>
              {earlierHidden > 0 && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                  <Link className="btn btn-secondary" href="/opportunities">
                    View all {liveForRoles.length} live openings
                  </Link>
                </div>
              )}
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
            <div className="steps-panel steps-panel-no-photo">
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

        {/* "What Worked For Me" — free, read-only advice from students who
            went from no calls to interview calls (/what-worked). Latest 3
            published stories; hidden until the admin has published one. */}
        {whatWorked.length > 0 && (
          <Reveal>
            <section className="section">
              <div className="section-header">
                <div>
                  <span className="eyebrow">
                    <span className="eyebrow-dot" />
                    What worked for me · Free
                  </span>
                  <h2 style={{ marginTop: 10 }}>Not getting interview calls? Here&apos;s what changed it for them</h2>
                  <p className="section-sub">
                    Freshers who were stuck at zero calls share exactly what they changed — in their own words.
                  </p>
                </div>
              </div>
              <div className="ww-grid">
                {whatWorked.map((s) => (
                  <WhatWorkedCard compact key={s.id} story={s} />
                ))}
              </div>
              <div className="ww-home-actions">
                <Link className="btn btn-primary" href="/what-worked">
                  Read all stories
                </Link>
              </div>
            </section>
          </Reveal>
        )}

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

        {/* Refer & Earn → Growth Internship graduates, ticked "Featured" by
            the admin at /admin/referrals. Hidden until there's at least one. */}
        {featuredInterns.length > 0 && (
          <section className="section featured-interns">
            <div className="section-header">
              <div>
                <span className="eyebrow">
                  <span className="eyebrow-dot" />
                  FirstOffer Growth Interns
                </span>
                <h2 style={{ marginTop: 10 }}>Students who built FirstOffer with us</h2>
              </div>
            </div>
            <div className="featured-interns-row">
              {featuredInterns.map((intern) => (
                <div className="featured-intern" key={`${intern.full_name}-${intern.college}`}>
                  <span className="featured-intern-avatar">{initials(intern.full_name)}</span>
                  <div>
                    <p className="featured-intern-name">{intern.full_name}</p>
                    <p className="featured-intern-college">{intern.college}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
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
