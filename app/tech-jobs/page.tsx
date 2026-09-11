import type { Metadata } from "next";
import Link from "next/link";
import OpportunityCard from "@/components/OpportunityCard";
import { getTechOpportunities } from "@/lib/data/opportunities";
import { getSiteUrl } from "@/lib/site-url";
import { buildLandingBreadcrumbsJsonLd } from "@/lib/seo/job-posting";

export const metadata: Metadata = {
  title: "Tech Jobs for Freshers — Software Engineer & IT Openings | FirstOffer",
  description:
    "Browse live software jobs for freshers, junior developer openings, frontend/backend roles, and tech internships across India. Direct application links with no middleman.",
  alternates: { canonical: `${getSiteUrl()}/tech-jobs` },
  openGraph: {
    title: "Tech Jobs for Freshers — Software Engineer & IT Openings | FirstOffer",
    description:
      "Find entry-level tech and software jobs for freshers in India. Updated daily with direct application links.",
    url: `${getSiteUrl()}/tech-jobs`,
    type: "website",
    images: [{ url: "/images/hero-journey.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Jobs for Freshers — Software Engineer & IT Openings",
    description: "Verified tech & software openings for freshers across India.",
  },
};

const TECH_FAQS = [
  {
    q: "What tech jobs are most commonly open to freshers?",
    a: "Common fresher tech roles include Software Development Engineer (SDE 1 / Junior SDE), Frontend Developer (React, Next.js, JavaScript), Backend Developer (Python, Java, Node.js), QA/Automation Engineer, and Data Analyst Intern.",
  },
  {
    q: "Do tech jobs for freshers require DSA or specific project experience?",
    a: "Most technical screening rounds evaluate foundational Data Structures & Algorithms, core problem-solving ability, and 2-3 genuine personal projects demonstrating full-stack or domain competence.",
  },
  {
    q: "Are remote software jobs available for freshers in India?",
    a: "Yes. Many startups and tech organizations hire remote software engineers and interns across India, offering competitive stipends and market salaries.",
  },
];

export default async function TechJobsLandingPage() {
  const { opportunities, total } = await getTechOpportunities(24);

  const breadcrumbsJsonLd = buildLandingBreadcrumbsJsonLd("Tech Jobs", "/tech-jobs");

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: TECH_FAQS.map((faq) => ({
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
          <span className="breadcrumbs-current" aria-current="page">Tech Jobs</span>
        </nav>

        <section className="opportunities-hero">
          <div className="opportunities-hero-text">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              {total} Live Tech Openings
            </span>
            <h1>Tech Jobs &amp; Software Openings for Freshers</h1>
            <p>
              Explore entry-level software engineering, web development, data analyst, and IT roles
              curated for freshers and 2026 graduates across India.
            </p>
          </div>

          <div className="type-filters" style={{ marginTop: 16 }}>
            <Link className="filter-pill" href="/fresher-jobs">
              All Fresher Jobs
            </Link>
            <Link className="filter-pill active" href="/tech-jobs">
              Tech &amp; Software Jobs
            </Link>
            <Link className="filter-pill" href="/off-campus-jobs">
              Off-Campus Drives
            </Link>
            <Link className="filter-pill" href="/opportunities?type=internship">
              Internships
            </Link>
            <Link className="filter-pill" href="/opportunities?mode=remote">
              Remote Tech Jobs
            </Link>
          </div>
        </section>

        <div className="seo-categories-grid" style={{ marginBottom: 32 }}>
          <Link href="/fresher-jobs" className="seo-category-card">
            <div className="seo-category-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h3>
              Fresher Jobs Hub
              <span>&rarr;</span>
            </h3>
            <p>Browse all open roles for 2026 batch and recent graduates across every industry.</p>
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
            <p>Discover open hiring challenges, hackathons, and direct off-campus application links.</p>
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
            <p>Check which tech startups and product companies have live openings right now.</p>
          </Link>
        </div>

        <p className="result-count">
          Showing {opportunities.length} live software and tech roles
        </p>

        {opportunities.length === 0 ? (
          <div className="empty-state">
            <h3>No tech jobs found matching current filters</h3>
            <p>New developer and IT listings are published daily. Browse all available roles below.</p>
            <Link className="btn btn-secondary btn-sm" href="/opportunities">
              View All Opportunities
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

        {/* Tech SEO FAQ Section */}
        <section className="seo-faq-section">
          <h2>Tech Jobs for Freshers: Guide &amp; FAQ</h2>
          <div className="seo-faq-grid">
            {TECH_FAQS.map((faq) => (
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
