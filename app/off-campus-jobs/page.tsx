import type { Metadata } from "next";
import Link from "next/link";
import OpportunityCard from "@/components/OpportunityCard";
import { getOffCampusOpportunities } from "@/lib/data/opportunities";
import { getSiteUrl } from "@/lib/site-url";
import { buildLandingBreadcrumbsJsonLd } from "@/lib/seo/job-posting";

export const metadata: Metadata = {
  title: "Off-Campus Jobs & Hiring Drives for Freshers (2026) | FirstOffer",
  description:
    "Find active off-campus jobs, direct recruitment drives, and walk-in openings for freshers across India. Apply directly on verified company portals without placement cell queues.",
  alternates: { canonical: `${getSiteUrl()}/off-campus-jobs` },
  openGraph: {
    title: "Off-Campus Jobs & Hiring Drives for Freshers (2026) | FirstOffer",
    description:
      "Explore off-campus fresher hiring drives, engineering openings, and internships. Updated daily across top Indian companies.",
    url: `${getSiteUrl()}/off-campus-jobs`,
    type: "website",
    images: [{ url: "/images/hero-journey.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Off-Campus Jobs & Hiring Drives for Freshers (2026) | FirstOffer",
    description: "Verified off-campus drives for freshers and 2026 batch candidates.",
  },
};

const OFF_CAMPUS_FAQS = [
  {
    q: "What is the difference between on-campus and off-campus jobs?",
    a: "On-campus hiring happens through your college placement cell for registered students only. Off-campus hiring is open to candidates nationwide, where anyone meeting the eligibility criteria can apply directly via official portals.",
  },
  {
    q: "When do companies start off-campus hiring for 2026 batch freshers?",
    a: "Off-campus hiring runs year-round. Major tech firms and growing startups open early talent drives, off-campus challenges, and graduate trainee positions several months ahead of graduation.",
  },
  {
    q: "How does FirstOffer help with off-campus jobs?",
    a: "FirstOffer collects live off-campus openings from across India and links directly to each company's application form or careers portal, automatically pulling down closed listings after 48 hours.",
  },
];

export default async function OffCampusJobsLandingPage() {
  const { opportunities, total } = await getOffCampusOpportunities(24);

  const breadcrumbsJsonLd = buildLandingBreadcrumbsJsonLd("Off-Campus Jobs", "/off-campus-jobs");

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: OFF_CAMPUS_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <main className="page page-wide opportunities-page">
      {/* Structured data: Breadcrumbs & FAQ */}
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <Link href="/fresher-jobs">Fresher Jobs</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <span className="breadcrumbs-current" aria-current="page">Off-Campus Jobs</span>
        </nav>

        <section className="opportunities-hero">
          <div className="opportunities-hero-text">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              {total} Live Off-Campus Roles
            </span>
            <h1>Off-Campus Jobs &amp; Hiring Drives for Freshers</h1>
            <p>
              Skip the college placement cell queue. Discover direct off-campus drives, startup openings,
              and entry-level opportunities across India with direct application links.
            </p>
          </div>

          <div className="type-filters" style={{ marginTop: 16 }}>
            <Link className="filter-pill" href="/fresher-jobs">
              All Fresher Jobs
            </Link>
            <Link className="filter-pill" href="/tech-jobs">
              Tech &amp; Software Jobs
            </Link>
            <Link className="filter-pill active" href="/off-campus-jobs">
              Off-Campus Drives
            </Link>
            <Link className="filter-pill" href="/opportunities?type=internship">
              Internships
            </Link>
            <Link className="filter-pill" href="/opportunities?type=full_time">
              Full-Time
            </Link>
          </div>
        </section>

        <div className="seo-categories-grid" style={{ marginBottom: 32 }}>
          <Link href="/fresher-jobs" className="seo-category-card">
            <div className="seo-category-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3>
              Fresher Jobs Hub
              <span>&rarr;</span>
            </h3>
            <p>Full catalog of entry-level positions open to 2026 batch and recent graduates.</p>
          </Link>

          <Link href="/tech-jobs" className="seo-category-card">
            <div className="seo-category-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h3>
              Tech &amp; Software Openings
              <span>&rarr;</span>
            </h3>
            <p>Software engineer, frontend, backend, QA, and cloud engineer roles for freshers.</p>
          </Link>

          <Link href="/companies" className="seo-category-card">
            <div className="seo-category-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h3>
              Hiring Companies
              <span>&rarr;</span>
            </h3>
            <p>Explore verified companies running active recruitment drives across India.</p>
          </Link>
        </div>

        <p className="result-count">
          Showing {opportunities.length} live off-campus opportunities
        </p>

        {opportunities.length === 0 ? (
          <div className="empty-state">
            <h3>No off-campus listings currently active</h3>
            <p>Fresh off-campus drives are curated each morning. Check back shortly!</p>
            <Link className="btn btn-secondary btn-sm" href="/opportunities">
              Browse All Opportunities
            </Link>
          </div>
        ) : (
          <div className="opportunity-grid">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        )}

        {total > opportunities.length && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link className="btn btn-secondary" href="/opportunities">
              View All {total} Live Opportunities &rarr;
            </Link>
          </div>
        )}

        {/* Off-Campus FAQ Section */}
        <section className="seo-faq-section">
          <h2>Off-Campus Jobs Guide &amp; FAQ</h2>
          <div className="seo-faq-grid">
            {OFF_CAMPUS_FAQS.map((faq) => (
              <div className="seo-faq-item" key={faq.q}>
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
