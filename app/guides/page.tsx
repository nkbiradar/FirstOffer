import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Career Guides for Freshers — HR Emails, Referrals, Resume & Interviews",
  description:
    "Free, practical guides for freshers in India: how to email HR, get job referrals, crack off-campus hiring, build an ATS-friendly resume and prepare for interviews.",
  alternates: { canonical: `${getSiteUrl()}/guides` },
};

export default function GuidesPage() {
  return (
    <main className="page page-wide">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <span className="breadcrumbs-current" aria-current="page">Guides</span>
        </nav>
        <header className="guide-hub-head">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            Career guides
          </span>
          <h1>Guides to get your first job faster</h1>
          <p>Practical, no-fluff guides for freshers — written from what actually gets HRs to reply.</p>
        </header>
        <div className="guide-grid">
          {GUIDES.map((g) => (
            <Link className="guide-card" href={`/guides/${g.slug}`} key={g.slug}>
              <h2>{g.title}</h2>
              <p>{g.description}</p>
              <span className="guide-meta">{g.readMins} min read →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
