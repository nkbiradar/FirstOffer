import Link from "next/link";
import Image from "next/image";
import OpportunityCard from "@/components/OpportunityCard";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import TestimonialsMarquee from "@/components/TestimonialsMarquee";
import { getHomepageOpportunities, getSiteStats } from "@/lib/data/opportunities";
import { getCompaniesWithPublishedCounts } from "@/lib/data/companies";
import { getPublishedTestimonials } from "@/lib/data/testimonials";
import { avatarGradient, initials } from "@/lib/ui-format";

// Static — describes real site mechanics (Google sign-in, direct-apply
// links, the applications tracker), not a fabricated "profile/skills" flow.
// No live data needed here, unlike the companies/stats sections below.
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

  // Real companies with at least one live, published opportunity right
  // now — sorted by how many they have open. No fixed roster, no fake
  // "Verified" claim; whatever's actually live is what shows up here.
  const topCompanies = companies
    .filter((company) => company.publishedOpportunityCount > 0)
    .sort((a, b) => b.publishedOpportunityCount - a.publishedOpportunityCount)
    .slice(0, 8);

  return (
    <main>
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-top">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="eyebrow-dot" />
                Built for freshers, updated daily
              </span>

              <h1>
                Fresher opportunities.
                <br />
                <span className="highlight">One place.</span>
              </h1>

              {/* Fixed marketing line, not tied to today's actual published count
                  (that's what the "Opportunities today" stat tile below already
                  shows live) — a stated freshness promise, not a live figure. */}
              <p className="hero-tagline">50+ new opportunities added every day</p>

              {/* Explains *why* listings only stay up 2 days (see the
                  expires_at logic in lib/data/admin-opportunities.ts) — frames
                  it as the real-world reason (companies close hiring), not a
                  site limitation, and nudges urgency without being alarming. */}
              <p className="hero-note">
                Older opportunities expire within 2 days as companies close hiring — apply fast.
              </p>

              <p className="hero-sub">
                FirstOffer collects internships, full-time roles and off-campus opportunities from
                everywhere and organizes them in one clean, searchable feed — so you spend less time
                hunting and more time applying.
              </p>

              {/* The marketing hook the user asked for directly — honest, not a
                  guarantee: the real differentiator is speed/directness (apply
                  same-day, no placement-cell queue), not a promised outcome like
                  "guaranteed interview calls," which nothing here can actually
                  back up and isn't claimed. */}
              <p className="hero-hook">Skip the placement cell. Apply directly, the same day it goes live.</p>

              <div className="hero-actions">
                <Link className="btn btn-primary" href="/opportunities">
                  Explore Opportunities
                </Link>
                <Link className="btn btn-secondary" href="/companies">
                  Browse Companies
                </Link>
              </div>
            </div>

            <Image
              className="hero-photo"
              alt=""
              src="/images/hero-illustration.webp"
              width={560}
              height={1085}
              priority
            />
          </div>

          {/* Leads with the 48-hour auto-expiry (Step 9) as the actual trust
              pitch, not just a tagline — the real differentiator against
              stale listings elsewhere is that nothing here can go stale.
              Purely additive/presentational; no data or query changes. */}
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
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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
                <Link className="btn btn-secondary btn-sm" href="/opportunities">
                  View all opportunities
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
                <Link className="btn btn-secondary btn-sm" href="/opportunities">
                  See what&apos;s live right now
                </Link>
              </div>
              <Image
                className="mission-photo"
                alt=""
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
                alt=""
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
            <section className="section testimonials-section">
              <div className="section-header">
                <div>
                  <span className="eyebrow">
                    <span className="eyebrow-dot" />
                    Success stories
                  </span>
                  <h2 style={{ marginTop: 10 }}>Real students, real outcomes</h2>
                </div>
              </div>
              <TestimonialsMarquee testimonials={testimonials} />
            </section>
          </Reveal>
        )}

        <Reveal>
          <section className="section closing-section">
            <div className="closing-panel">
              <Image
                className="closing-photo"
                alt="Students reviewing an opportunity together"
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
                <Link className="btn btn-primary" href="/opportunities">
                  Explore Opportunities
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
