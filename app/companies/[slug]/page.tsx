import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import OpportunityCard from "@/components/OpportunityCard";
import { getUser } from "@/lib/supabase/auth";
import { getPublishedOpportunities } from "@/lib/data/opportunities";
import { getCompanyBySlug, getCompanyHistory, isCompanyIndexable, type PastOpening } from "@/lib/data/company-pages";
import { getSiteUrl } from "@/lib/site-url";
import { getNonce } from "@/lib/security/csp";
import { avatarGradient, initials, todayShortLabel } from "@/lib/ui-format";

type Params = { slug: string };

const YEAR = 2026;

const TYPE_WORDS: Record<string, string> = {
  internship: "internship",
  full_time: "full-time role",
};

function formatMonth(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

/** Distinct role titles from the company's history, most recent first. */
function distinctRoles(history: PastOpening[], max = 5): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of history) {
    const key = h.role.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(h.role.trim());
    if (out.length >= max) break;
  }
  return out;
}

function pageTitle(name: string, live: number) {
  const base = `${name} Jobs for Freshers ${YEAR}`;
  return live > 0 ? `${base} — ${live} Live ${live === 1 ? "Opening" : "Openings"}` : base;
}

async function loadCompany(slug: string) {
  const company = await getCompanyBySlug(slug);
  if (!company) return null;
  const [history, live] = await Promise.all([
    getCompanyHistory(company.id),
    getPublishedOpportunities({ companyId: company.id, pageSize: 24 }),
  ]);
  // A company that has never had a public opening has nothing to show.
  if (history.total === 0 && live.total === 0) return null;
  return { company, history, live };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await loadCompany((await params).slug);
  if (!data) return { title: "Company not found", robots: { index: false, follow: true } };
  const { company, history, live } = data;
  const title = pageTitle(company.name, live.total);
  const roles = distinctRoles(history.recent, 3);
  const description =
    live.total > 0
      ? `${live.total} live ${company.name} ${live.total === 1 ? "opening" : "openings"} for freshers — ${roles.join(", ")}. Hand-checked, with direct application links. ${history.total} roles posted on FirstOffer so far.`
      : `${company.name} fresher jobs, internships and off-campus drives. ${history.total} roles posted on FirstOffer so far, including ${roles.join(", ")}. Check back for new openings.`;
  const url = `${getSiteUrl()}/companies/${company.slug}`;
  return {
    title: { absolute: `${title} | FirstOffer` },
    description: description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description,
    alternates: { canonical: url },
    // Only companies with enough history are indexed — see lib/data/company-pages.ts.
    robots: isCompanyIndexable(history.total) ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: `${title} | FirstOffer`,
      description,
      url,
      type: "website",
      siteName: "FirstOffer",
      locale: "en_IN",
      ...(company.logo_url ? { images: [{ url: company.logo_url, alt: `${company.name} logo` }] } : {}),
    },
    twitter: { card: "summary_large_image", title: `${title} | FirstOffer`, description },
  };
}

export default async function CompanyJobsPage({ params }: { params: Promise<Params> }) {
  const data = await loadCompany((await params).slug);
  if (!data) notFound();
  const { company, history, live } = data;

  const [nonce, user] = await Promise.all([getNonce(), getUser()]);
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/companies/${company.slug}`;
  const title = pageTitle(company.name, live.total);
  const roles = distinctRoles(history.recent);
  const liveIds = new Set(live.opportunities.map((o) => o.id));
  const past = history.recent.filter((h) => !liveIds.has(h.id));
  const locations = [...new Set(history.recent.map((h) => h.location?.trim()).filter(Boolean) as string[])].slice(0, 4);
  const { a, b } = avatarGradient(company.name);

  const faqs = [
    {
      q: `Is ${company.name} hiring freshers right now?`,
      a:
        live.total > 0
          ? `Yes. ${company.name} has ${live.total} live ${live.total === 1 ? "opening" : "openings"} on FirstOffer right now. Each one links to the company's own application route, so apply directly before it closes.`
          : `There are no live ${company.name} openings on FirstOffer at the moment. New roles are added every day, so check back soon or browse other companies hiring freshers.`,
    },
    {
      q: `What roles has ${company.name} hired freshers for?`,
      a: roles.length
        ? `Recent ${company.name} openings posted on FirstOffer include ${roles.join(", ")}.`
        : `${company.name} has posted entry-level roles on FirstOffer; see the list on this page.`,
    },
    {
      q: `How do I apply for ${company.name} jobs?`,
      a: `Open any ${company.name} listing on this page and use its application link, which goes straight to the company's careers page, Google Form or HR contact. Read the eligibility and batch details first, and apply with an ATS-friendly resume.`,
    },
  ];

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Companies", item: `${siteUrl}/companies` },
      { "@type": "ListItem", position: 3, name: company.name, item: url },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: live.opportunities.map((o, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}/opportunities/${o.id}`,
      name: `${o.role} at ${company.name}`,
    })),
  };

  return (
    <main className="page page-wide opportunities-page">
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {live.opportunities.length > 0 && (
        // eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content
        <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      )}

      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <Link href="/companies">Companies</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <span className="breadcrumbs-current" aria-current="page">{company.name}</span>
        </nav>

        <section className="opportunities-hero">
          <div className="opportunities-hero-text">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              {live.total} Live {live.total === 1 ? "Opening" : "Openings"} • {history.total} posted on FirstOffer • Updated {todayShortLabel()}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                className="company-avatar"
                style={{ ["--avatar-a" as string]: a, ["--avatar-b" as string]: b, flexShrink: 0 }}
              >
                {company.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={`${company.name} logo`} src={company.logo_url} />
                ) : (
                  initials(company.name)
                )}
              </span>
              <h1>{title}</h1>
            </div>
            <p>
              Fresher jobs, internships and off-campus openings at {company.name}, hand-checked and listed with the
              company&apos;s own application link.
              {roles.length > 0 && <> Recent roles include {roles.slice(0, 3).join(", ")}.</>}
              {locations.length > 0 && <> Locations: {locations.join(", ")}.</>}
            </p>
            {company.website && (
              <p style={{ marginTop: 8 }}>
                <a href={company.website} rel="nofollow noopener noreferrer" target="_blank">
                  {company.name} official website &rarr;
                </a>
              </p>
            )}
          </div>
        </section>

        <h2 className="result-count" style={{ fontSize: "1rem" }}>
          {live.total > 0
            ? `Live ${company.name} openings (${live.total})`
            : `No live ${company.name} openings right now`}
        </h2>

        {live.opportunities.length === 0 ? (
          <div className="empty-state">
            <h3>No live openings at {company.name} right now</h3>
            <p>New roles are added every day. Meanwhile, browse other companies hiring freshers.</p>
            <Link className="btn btn-secondary btn-sm" href="/companies">
              Companies hiring now
            </Link>
          </div>
        ) : (
          <div className="opportunity-grid">
            {live.opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} isSignedIn={Boolean(user)} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <section className="seo-faq-section">
            <h2>Previous {company.name} openings on FirstOffer</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {past.map((p) => (
                <li key={p.id}>
                  <strong>{p.role}</strong>
                  {p.opportunity_type && TYPE_WORDS[p.opportunity_type] ? ` · ${TYPE_WORDS[p.opportunity_type]}` : ""}
                  {p.location ? ` · ${p.location}` : ""}
                  {p.published_at ? ` · ${formatMonth(p.published_at)}` : ""}
                  {" "}
                  <span style={{ opacity: 0.7 }}>(closed)</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="seo-faq-section">
          <h2>{company.name} jobs for freshers: FAQs</h2>
          <div className="seo-faq-grid">
            {faqs.map((faq) => (
              <div className="seo-faq-item" key={faq.q}>
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link className="btn btn-secondary" href="/companies">
            See all companies hiring freshers &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
