import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuide } from "@/lib/guides";
import { getSiteUrl } from "@/lib/site-url";
import { getNonce } from "@/lib/security/csp";

type Params = { slug: string };

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide not found", robots: { index: false, follow: true } };
  const url = `${getSiteUrl()}/guides/${guide.slug}`;
  return {
    title: { absolute: `${guide.title} | FirstOffer` },
    description: guide.description,
    alternates: { canonical: url },
    openGraph: { title: guide.title, description: guide.description, url, type: "article", siteName: "FirstOffer" },
    twitter: { card: "summary_large_image", title: guide.title, description: guide.description },
  };
}

function fmt(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  const nonce = await getNonce();
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/guides/${guide.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        datePublished: guide.updated,
        dateModified: guide.updated,
        inLanguage: "en-IN",
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "FirstOffer", url: siteUrl },
        publisher: { "@type": "Organization", name: "FirstOffer", logo: { "@type": "ImageObject", url: `${siteUrl}/icon.png` } },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Guides", item: `${siteUrl}/guides` },
          { "@type": "ListItem", position: 3, name: guide.title, item: url },
        ],
      },
    ],
  };

  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <main className="page">
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="guide">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <Link href="/guides">Guides</Link>
        </nav>
        <h1>{guide.title}</h1>
        <p className="guide-meta">
          By the FirstOffer team · Updated {fmt(guide.updated)} · {guide.readMins} min read
        </p>
        <p className="guide-intro">{guide.intro}</p>

        {guide.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p?.map((para) => <p key={para.slice(0, 40)}>{para}</p>)}
            {s.list && (
              <ul>
                {s.list.map((li) => (
                  <li key={li.slice(0, 40)}>{li}</li>
                ))}
              </ul>
            )}
            {s.example && <pre className="guide-example">{s.example}</pre>}
          </section>
        ))}

        <section>
          <h2>Frequently asked questions</h2>
          {guide.faqs.map((f) => (
            <div className="guide-faq" key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>

        <aside className="guide-related">
          <h2>Next steps</h2>
          <ul>
            {guide.related.map((r) => (
              <li key={r.href}>
                <Link href={r.href}>{r.label} →</Link>
              </li>
            ))}
          </ul>
        </aside>

        <aside className="guide-more">
          <h2>More guides</h2>
          <ul>
            {others.map((g) => (
              <li key={g.slug}>
                <Link href={`/guides/${g.slug}`}>{g.title}</Link>
              </li>
            ))}
          </ul>
        </aside>
      </article>
    </main>
  );
}
