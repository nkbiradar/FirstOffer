import Link from "next/link";
import Image from "next/image";
import OpportunityCard from "@/components/OpportunityCard";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import SuccessStories from "@/components/SuccessStories";
import { getHomepageOpportunities, getSiteStats } from "@/lib/data/opportunities";
import { getCompaniesWithPublishedCounts } from "@/lib/data/companies";
import { getPublishedTestimonials } from "@/lib/data/testimonials";
import { avatarGradient, initials } from "@/lib/ui-format";
import { getSiteUrl } from "@/lib/site-url";

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
  const [{ today, earlier, todayDateLabel, todayCount }, stats, companies, testimonials] = await Promise.all([
    getHomepageOpportunities(),
    getSiteStats(),
    getCompaniesWithPublishedCounts(),
    getPublishedTestimonials(),
  ]);

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <section className="hero">
        <div className="container hero-content">
          <div className="hero-copy hero-copy-centered">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Built for Freshers • Updated Daily
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
                No account needed to search or apply. Sign in only if you want to track what you&apos;ve applied to.
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
            </div>
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
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
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
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
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
