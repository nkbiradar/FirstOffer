import type { Metadata } from "next";
import Link from "next/link";
import WhatWorkedCard from "@/components/WhatWorkedCard";
import { getPublishedWhatWorked } from "@/lib/data/what-worked";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "What Worked For Me — how freshers started getting interview calls",
  description:
    "Applying everywhere but no interview calls? Real freshers share exactly what they changed — resume, referrals, HR emails, projects — and what happened next.",
  alternates: { canonical: `${getSiteUrl()}/what-worked` },
};

// Free, read-only "What Worked For Me" page. Stories are added by the admin
// at /admin/what-worked; visitors can only read them.
export default async function WhatWorkedPage() {
  const stories = await getPublishedWhatWorked(100);

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
        </section>

        {stories.length === 0 ? (
          <div className="empty-state ww-empty">
            <h3>Stories are on their way</h3>
            <p>New stories are added regularly — check back soon.</p>
          </div>
        ) : (
          <div className="ww-grid">
            {stories.map((s) => (
              <WhatWorkedCard key={s.id} story={s} />
            ))}
          </div>
        )}

        <p className="ww-disclaimer">
          Stories are shared with FirstOffer by students and published with their permission. What worked for one person
          may not work the same way for everyone.
        </p>
      </div>
    </main>
  );
}
