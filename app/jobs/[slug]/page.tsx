import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import OpportunityCard from "@/components/OpportunityCard";
import { getUser } from "@/lib/supabase/auth";
import { getPublishedOpportunities } from "@/lib/data/opportunities";
import { getSiteUrl } from "@/lib/site-url";
import { KEYWORD_PAGES, getKeywordPage, type KeywordPage } from "@/lib/seo/keyword-pages";
import { CITY_PAGES } from "@/lib/seo/cities";
import { getNonce } from "@/lib/security/csp";
import { todayShortLabel } from "@/lib/ui-format";

type Params = { slug: string };

// Only the pages in lib/seo/keyword-pages.ts exist; anything else is a 404.
export const dynamicParams = false;
export function generateStaticParams(): Params[] {
  return KEYWORD_PAGES.map((p) => ({ slug: p.slug }));
}

const YEAR = 2026;

/** Heading with the year, unless it already names a year ("2026 Batch"). */
function withYear(page: KeywordPage) {
  return /\b20\d\d\b/.test(page.heading) ? page.heading : `${page.heading} (${YEAR})`;
}

function pageTitle(page: KeywordPage, total: number) {
  return total > 0 ? `${withYear(page)} — ${total} Live Openings` : withYear(page);
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const page = getKeywordPage((await params).slug);
  if (!page) return {};
  const { total } = await getPublishedOpportunities({ ...page.filter, pageSize: 1 });
  const title = pageTitle(page, total);
  const description = `${total > 0 ? `${total} live` : "Live"} ${page.heading.toLowerCase()} — hand-checked, updated daily, with direct company application links (careers page, Google Form or HR email). Apply before they close.`;
  const url = `${getSiteUrl()}/jobs/${page.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    // No live jobs = thin content: keep it out of the index until it has openings.
    robots: total > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: `${title} | FirstOffer`, description, url, type: "website" },
    twitter: { card: "summary_large_image", title: `${title} | FirstOffer`, description },
  };
}

export default async function KeywordJobsPage({ params }: { params: Promise<Params> }) {
  const page = getKeywordPage((await params).slug);
  if (!page) notFound();

  const [nonce, user, { opportunities, total }] = await Promise.all([
    getNonce(),
    getUser(),
    getPublishedOpportunities({ ...page.filter, pageSize: 24 }),
  ]);

  const siteUrl = getSiteUrl();
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Jobs", item: `${siteUrl}/opportunities` },
      { "@type": "ListItem", position: 3, name: page.heading, item: `${siteUrl}/jobs/${page.slug}` },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: opportunities.map((o, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}/opportunities/${o.id}`,
      name: `${o.role}${o.company?.name ? ` at ${o.company.name}` : ""}`,
    })),
  };

  return (
    <main className="page page-wide opportunities-page">
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {opportunities.length > 0 && (
        // eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content
        <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      )}

      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <Link href="/opportunities">Jobs</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <span className="breadcrumbs-current" aria-current="page">{page.label}</span>
        </nav>

        <section className="opportunities-hero">
          <div className="opportunities-hero-text">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              {total} Live Roles • Updated {todayShortLabel()}
            </span>
            <h1>{withYear(page)}</h1>
            <p>{page.intro}</p>
          </div>

          <div className="type-filters" style={{ marginTop: 16 }}>
            {KEYWORD_PAGES.map((p) => (
              <Link key={p.slug} className={`filter-pill ${p.slug === page.slug ? "active" : ""}`} href={`/jobs/${p.slug}`}>
                {p.label}
              </Link>
            ))}
          </div>
        </section>

        <p className="result-count">
          Showing {opportunities.length} of {total} live openings
        </p>

        {opportunities.length === 0 ? (
          <div className="empty-state">
            <h3>No live openings here right now</h3>
            <p>New roles are added every day. Meanwhile, browse every live opening.</p>
            <Link className="btn btn-secondary btn-sm" href="/opportunities">
              All live openings
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
          <h2>{page.heading}: FAQs</h2>
          <div className="seo-faq-grid">
            {page.faqs.map((faq) => (
              <div className="seo-faq-item" key={faq.q}>
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="seo-faq-section">
          <h2>Fresher jobs by city</h2>
          <div className="type-filters">
            {CITY_PAGES.map((c) => (
              <Link key={c.slug} className="filter-pill" href={`/fresher-jobs/${c.slug}`}>
                {c.remote ? "Remote / Work from home" : `Jobs in ${c.name}`}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
