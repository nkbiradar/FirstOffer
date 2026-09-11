import type { Metadata } from "next";
import Link from "next/link";
import OpportunityCard from "@/components/OpportunityCard";
import { getPublishedOpportunities } from "@/lib/data/opportunities";
import { getSiteUrl } from "@/lib/site-url";
import { buildLandingBreadcrumbsJsonLd } from "@/lib/seo/job-posting";

export const metadata: Metadata = {
  title: "Fresher Jobs & Openings in India (2026 Batch) | FirstOffer",
  description:
    "Explore live fresher jobs, IT openings, internships, and off-campus opportunities from top companies hiring across India. Updated daily, direct applications only.",
  alternates: { canonical: `${getSiteUrl()}/fresher-jobs` },
  openGraph: {
    title: "Fresher Jobs & Openings in India (2026 Batch) | FirstOffer",
    description:
      "Find entry-level fresher jobs, software engineering roles, and internships updated daily. Apply directly to companies across India.",
    url: `${getSiteUrl()}/fresher-jobs`,
    type: "website",
    images: [{ url: "/images/hero-journey.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fresher Jobs & Openings in India (2026 Batch) | FirstOffer",
    description: "Verified fresher jobs and off-campus drives updated daily.",
  },
};

const FAQS = [
  {
    q: "How can 2026 batch freshers find verified off-campus jobs?",
    a: "Check FirstOffer daily for curated fresher listings that link straight to company application portals, Google forms, and official HR channels. Older listings are cleared within 48 hours so you never apply to closed roles.",
  },
  {
    q: "Are these fresher jobs available across India?",
    a: "Yes. Listings include remote tech roles as well as on-site and hybrid opportunities across Bengaluru, Hyderabad, Pune, Delhi NCR, Mumbai, Chennai, and other tech hubs in India.",
  },
  {
    q: "Do I need prior work experience for these roles?",
    a: "No. All roles featured under Fresher Jobs are specifically tailored for college seniors, new graduates, and candidates with 0 to 1 year of experience.",
  },
];

export default async function FresherJobsLandingPage() {
  const { opportunities, total } = await getPublishedOpportunities({
    pageSize: 24,
  });

  const breadcrumbsJsonLd = buildLandingBreadcrumbsJsonLd("Fresher Jobs", "/fresher-jobs");

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
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
          <span className="breadcrumbs-current" aria-current="page">Fresher Jobs</span>
        </nav>

        <section className="opportunities-hero">
          <div className="opportunities-hero-text">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              {total} Live Fresher Roles
            </span>
            <h1>Fresher Jobs &amp; Opportunities in India (2026 Batch)</h1>
            <p>
              Discover active fresher jobs, IT openings, full-time engineering roles, and internships.
              Every listing connects directly to the hiring company with zero intermediaries.
            </p>
          </div>

          <div className="type-filters" style={{ marginTop: 16 }}>
            <Link className="filter-pill active" href="/fresher-jobs">
              All Fresher Jobs
            </Link>
            <Link className="filter-pill" href="/tech-jobs">
              Tech &amp; Software Jobs
            </Link>
            <Link className="filter-pill" href="/off-campus-jobs">
              Off-Campus Drives
            </Link>
            <Link className="filter-pill" href="/opportunities?type=internship">
              Internships
            </Link>
            <Link className="filter-pill" href="/opportunities?mode=remote">
              Remote Roles
            </Link>
          </div>
        </section>

        <div className="seo-categories-grid" style={{ marginBottom: 32 }}>
          <Link href="/tech-jobs" className="seo-category-card">
            <div className="seo-category-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h3>
              Tech Jobs for Freshers
              <span>&rarr;</span>
            </h3>
            <p>Software development, frontend, backend, AI/ML, QA, and data engineering positions.</p>
          </Link>

          <Link href="/off-campus-jobs" className="seo-category-card">
            <div className="seo-category-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>
              Off-Campus Hiring Drives
              <span>&rarr;</span>
            </h3>
            <p>Direct hiring links, walk-in drives, and off-campus recruitment campaigns for freshers.</p>
          </Link>

          <Link href="/companies" className="seo-category-card">
            <div className="seo-category-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h3>
              Companies Hiring Freshers
              <span>&rarr;</span>
            </h3>
            <p>Explore startups, mid-sized firms, and enterprise companies currently active on FirstOffer.</p>
          </Link>
        </div>

        <p className="result-count">
          Showing {opportunities.length} of {total} live fresher openings
        </p>

        {opportunities.length === 0 ? (
          <div className="empty-state">
            <h3>No fresher opportunities active right now</h3>
            <p>New roles are posted each morning as companies publish openings. Check back shortly!</p>
            <Link className="btn btn-secondary btn-sm" href="/opportunities">
              Browse All Listings
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

        {/* Informative SEO FAQ Section */}
        <section className="seo-faq-section">
          <h2>Frequently Asked Questions about Fresher Jobs</h2>
          <div className="seo-faq-grid">
            {FAQS.map((faq) => (
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
