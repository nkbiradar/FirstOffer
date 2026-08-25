import Link from "next/link";
import OpportunityCard from "@/components/OpportunityCard";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import { getHomepageOpportunities, getSiteStats } from "@/lib/data/opportunities";

export default async function HomePage() {
  const [{ today, earlier, todayDateLabel }, stats] = await Promise.all([
    getHomepageOpportunities(),
    getSiteStats(),
  ]);

  return (
    <main>
      <section className="hero">
        <div className="container hero-content">
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
          <p className="hero-note">Older opportunities expire within 2 days as companies close hiring — apply fast.</p>

          <p className="hero-sub">
            FirstOffer collects internships, full-time roles and off-campus opportunities from
            everywhere and organizes them in one clean, searchable feed — so you spend less time
            hunting and more time applying.
          </p>

          <div className="hero-actions">
            <Link className="btn btn-primary" href="/opportunities">
              Explore Opportunities
            </Link>
            <Link className="btn btn-secondary" href="/companies">
              Browse Companies
            </Link>
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
                <CountUp value={today.length} />
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
      </div>
    </main>
  );
}
