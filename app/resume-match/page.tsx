import type { Metadata } from "next";
import Link from "next/link";
import { getOpportunityById } from "@/lib/data/opportunities";
import { getSiteUrl } from "@/lib/site-url";
import { buildLandingBreadcrumbsJsonLd } from "@/lib/seo/job-posting";
import ResumeMatchTool from "@/components/ResumeMatchTool";
import { getNonce } from "@/lib/security/csp";

export const metadata: Metadata = {
  title: "Resume Keyword Matcher — Check Your Resume Against Any Job | FirstOffer",
  description:
    "Upload your resume and compare it against any fresher job on FirstOffer. See which required keywords you already have, which are missing, and related skills worth mentioning — free, instant, no rewriting.",
  alternates: { canonical: `${getSiteUrl()}/resume-match` },
  openGraph: {
    title: "Resume Keyword Matcher | FirstOffer",
    description: "Compare your resume's keywords against any FirstOffer job listing in seconds.",
    url: `${getSiteUrl()}/resume-match`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Resume Keyword Matcher | FirstOffer",
    description: "Compare your resume's keywords against any FirstOffer job listing in seconds.",
  },
};

const FAQS = [
  {
    q: "Does this rewrite my resume or add fake skills to it?",
    a: "No. The matcher never edits your resume and never invents skills or experience. It only compares words that are already in your resume against the keywords a job actually lists, and clearly tells you to add a missing keyword only if you genuinely have that skill or experience.",
  },
  {
    q: "Is my resume stored anywhere?",
    a: "No. Your resume is read in memory just long enough to compare it against the job you picked, and the result is sent back to your browser. It is never saved to a database or file storage.",
  },
  {
    q: "What's the difference between missing and related keywords?",
    a: "Missing means the job's keyword doesn't appear anywhere in your resume. Related means you don't have that exact keyword, but your resume mentions something genuinely comparable (for example the job wants PostgreSQL and your resume has MySQL) — worth a mention only if it's true for you.",
  },
  {
    q: "What resume file formats are supported?",
    a: "PDF, DOCX, and plain text (.txt). If a scanned/image-only PDF doesn't extract any readable text, try a text-based PDF or DOCX export instead.",
  },
];

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function ResumeMatchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const nonce = await getNonce();
  const params = await searchParams;
  const opportunityIdParam = Array.isArray(params.opportunityId) ? params.opportunityId[0] : params.opportunityId;

  const initialOpportunity =
    opportunityIdParam && typeof opportunityIdParam === "string"
      ? await getOpportunityById(opportunityIdParam)
      : null;

  const breadcrumbsJsonLd = buildLandingBreadcrumbsJsonLd("Resume Keyword Matcher", "/resume-match");

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <main className="page page-wide opportunities-page">
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      {/* eslint-disable-next-line react/no-danger -- JSON-LD requires raw script content */}
      <script type="application/ld+json"
        nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <span className="breadcrumbs-current" aria-current="page">Resume Keyword Matcher</span>
        </nav>

        <section className="opportunities-hero">
          <div className="opportunities-hero-text">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              Free tool
            </span>
            <h1>Resume Keyword Matcher</h1>
            <p>
              Upload your resume, pick any job on FirstOffer, and see exactly which required keywords you
              already have, which are missing, and which related skills are worth mentioning — before you
              apply.
            </p>
          </div>
        </section>

        <ResumeMatchTool
          initialOpportunity={
            initialOpportunity && initialOpportunity.status === "published"
              ? {
                  id: initialOpportunity.id,
                  role: initialOpportunity.role,
                  company: initialOpportunity.company?.name ?? null,
                }
              : null
          }
        />

        <section className="seo-faq-section">
          <h2>Frequently Asked Questions</h2>
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
