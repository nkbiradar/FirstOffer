import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import OpportunityCard from "@/components/OpportunityCard";
import { getUser } from "@/lib/supabase/auth";
import { getPublishedOpportunities, type ListOpportunitiesOptions } from "@/lib/data/opportunities";
import { getSiteUrl } from "@/lib/site-url";
import { CITY_PAGES, getCityPage, type CityPage } from "@/lib/seo/cities";
import { getNonce } from "@/lib/security/csp";
import { todayShortLabel } from "@/lib/ui-format";

type Params = { city: string };

// Only the cities in lib/seo/cities.ts exist; anything else is a 404.
export const dynamicParams = false;
export function generateStaticParams(): Params[] {
  return CITY_PAGES.map((c) => ({ city: c.slug }));
}

function listOptions(city: CityPage): ListOpportunitiesOptions {
  return city.remote ? { workMode: "remote" } : { locations: city.terms };
}

function pageTitle(city: CityPage) {
  return city.remote ? "Remote Fresher Jobs in India (2026 Batch)" : `Fresher Jobs in ${city.name} (2026 Batch)`;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const city = getCityPage((await params).city);
  if (!city) return {};
  const { total } = await getPublishedOpportunities({ ...listOptions(city), pageSize: 1 });
  const title = pageTitle(city);
  const where = city.remote ? "remote (work from home)" : `in ${city.name}`;
  const description = `${total > 0 ? `${total} live` : "Live"} fresher jobs and internships ${where} — hand-checked, updated daily, with direct company application links. For 2025 & 2026 batch graduates.`;
  const url = `${getSiteUrl()}/fresher-jobs/${city.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    // A city page with no live jobs is thin content — keep it out of the
    // index until it has openings again (links are still followed).
    robots: total > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: `${title} | FirstOffer`, description, url, type: "website" },
    twitter: { card: "summary_large_image", title: `${title} | FirstOffer`, description },
  };
}

export default async function CityJobsPage({ params }: { params: Promise<Params> }) {
  const city = getCityPage((await params).city);
  if (!city) notFound();

  const [nonce, user, { opportunities, total }] = await Promise.all([
    getNonce(),
    getUser(),
    getPublishedOpportunities({ ...listOptions(city), pageSize: 24 }),
  ]);

  const siteUrl = getSiteUrl();
  const title = pageTitle(city);
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Fresher Jobs", item: `${siteUrl}/fresher-jobs` },
      { "@type": "ListItem", position: 3, name: city.name, item: `${siteUrl}/fresher-jobs/${city.slug}` },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: city.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <main className="page page-wide opportunities-page">
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <Link href="/fresher-jobs">Fresher Jobs</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <span className="breadcrumbs-current" aria-current="page">{city.name}</span>
        </nav>

        <section className="opportunities-hero">
          <div className="opportunities-hero-text">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              {total} Live {city.remote ? "Remote" : city.name} Roles • Updated {todayShortLabel()}
            </span>
            <h1>{title}</h1>
            <p>{city.intro}</p>
          </div>

          <div className="type-filters" style={{ marginTop: 16 }}>
            {CITY_PAGES.map((c) => (
              <Link
                key={c.slug}
                className={`filter-pill ${c.slug === city.slug ? "active" : ""}`}
                href={`/fresher-jobs/${c.slug}`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        <p className="result-count">
          Showing {opportunities.length} of {total} live fresher openings {city.remote ? "(remote)" : `in ${city.name}`}
        </p>

        {opportunities.length === 0 ? (
          <div className="empty-state">
            <h3>No live openings {city.remote ? "for remote roles" : `in ${city.name}`} right now</h3>
            <p>New roles are added every day. Meanwhile, browse openings across India.</p>
            <Link className="btn btn-secondary btn-sm" href="/fresher-jobs">
              All fresher jobs
            </Link>
          </div>
        ) : (
          <div className="opportunity-grid">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} isSignedIn={Boolean(user)} />
            ))}
          </div>
        )}

        {total > opportunities.length && (
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link className="btn btn-secondary" href="/opportunities">
              View all live opportunities &rarr;
            </Link>
          </div>
        )}

        <section className="seo-faq-section">
          <h2>{city.remote ? "Remote fresher jobs" : `Fresher jobs in ${city.name}`}: FAQs</h2>
          <div className="seo-faq-grid">
            {city.faqs.map((faq) => (
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
