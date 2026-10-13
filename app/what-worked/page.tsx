import type { Metadata } from "next";
import Link from "next/link";
import WhatWorkedCard from "@/components/WhatWorkedCard";
import { WHAT_WORKED_TAGS, getPublishedWhatWorked } from "@/lib/data/what-worked";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "What Worked For Me — how freshers started getting interview calls",
  description:
    "Applying everywhere but no interview calls? Real freshers share exactly what they changed — resume, referrals, HR emails, projects — and what happened next.",
  alternates: { canonical: `${getSiteUrl()}/what-worked` },
};

type SearchParams = { [key: string]: string | string[] | undefined };

// Free, public "What Worked For Me" page. Every story is submitted by a
// real student at /what-worked/share and published by the admin.
export default async function WhatWorkedPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const rawTag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const tag = WHAT_WORKED_TAGS.some((t) => t.slug === rawTag) ? rawTag : undefined;
  const stories = await getPublishedWhatWorked(100, tag);

  return (
    <main className="page page-wide">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <span className="breadcrumbs-current" aria-current="page">What Worked For Me</span>
        </nav>

        <section className="ww-hero">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            Free · From students like you
          </span>
          <h1>Applied everywhere. No calls. Then this changed.</h1>
          <p>
            Real freshers who were stuck with zero interview calls share exactly what they changed — and what happened
            next. No theory, just what actually worked for them.
          </p>
          <Link className="btn btn-primary" href="/what-worked/share">
            Share what worked for you
          </Link>
        </section>

        <div aria-label="Filter by what they changed" className="ww-filters">
          <Link className={`ww-chip ${!tag ? "is-active" : ""}`} href="/what-worked">
            All
          </Link>
          {WHAT_WORKED_TAGS.map((t) => (
            <Link className={`ww-chip ${tag === t.slug ? "is-active" : ""}`} href={`/what-worked?tag=${t.slug}`} key={t.slug}>
              {t.label}
            </Link>
          ))}
        </div>

        {stories.length === 0 ? (
          <div className="empty-state ww-empty">
            <h3>{tag ? "No stories for this one yet" : "Stories are on their way"}</h3>
            <p>
              Went from no calls to interview calls? Your story could be the one that helps another fresher keep going.
            </p>
            <Link className="btn btn-primary" href="/what-worked/share">
              Share your story
            </Link>
          </div>
        ) : (
          <div className="ww-grid">
            {stories.map((s) => (
              <WhatWorkedCard key={s.id} story={s} />
            ))}
          </div>
        )}

        <p className="ww-disclaimer">
          Stories are written by the students themselves and reviewed by FirstOffer before publishing. What worked for one
          person may not work the same way for everyone.
        </p>
      </div>
    </main>
  );
}
