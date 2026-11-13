import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAppRequest } from "@/lib/nativeAppServer";
import { FULL_ACCESS_PERIOD_MS, getFullAccessPriceInr } from "@/lib/payments/razorpay";
import { hasFullAccess } from "@/lib/data/opportunity-unlocks";
import ResumeMakeoverCard from "@/components/ResumeMakeoverCard";

// Resume Makeover is included with Full Access (13 Nov 2026) — no separate price.
const FULL_PRICE = getFullAccessPriceInr();

export const metadata: Metadata = {
  title: "Resume Help for Freshers — Free ATS Resume Template & Resume Makeover",
  description:
    "Getting no interview calls? Download a free one-page ATS-friendly resume template, or get your resume rebuilt professionally for the role you want — included with FirstOffer Full Access.",
  alternates: { canonical: `${getSiteUrl()}/resume` },
  openGraph: {
    title: "Getting no interview calls? Fix your resume | FirstOffer",
    description: "Free ATS-friendly resume template, or a full resume makeover included with Full Access.",
    url: `${getSiteUrl()}/resume`,
    type: "website",
  },
};

const FREE_POINTS = [
  "One clean page, the length recruiters expect from a fresher",
  "Simple single-column layout that ATS software reads correctly",
  "Sections in the order recruiters actually scan",
  "Ready-made bullet points — just swap in your own details",
  "Same format used by freshers placed at Deloitte, IBM, Accenture, MathCo & top startups",
];

const MAKEOVER_POINTS = [
  "Your raw resume rewritten in a clean, professional format",
  "Reviewed by HR professionals from top companies",
  "Keywords and bullet points matched to the role you're targeting",
  "Fully renewed summary, skills, projects and experience",
  "Built to score 90%+ on ATS resume checks",
];

const STEPS = [
  { title: "Share your details", body: "Tell us the role you want and attach your current resume — any format, even a rough one." },
  { title: "Included with Full Access", body: `No extra payment — 1 makeover with every ₹${FULL_PRICE} Full Access plan (3 months).` },
  { title: "Get your new resume", body: "We rebuild it and email the ATS-ready version to your sign-in email — within 24 hours." },
];

// Resume Help hub: a free downloadable ATS template (public/resume/*) and
// the paid Resume Makeover (components/ResumeMakeoverCard.tsx →
// app/api/resume-review/*). Inside the Android app the paid half is not
// rendered at all (Google Play payments policy — see lib/nativeAppServer.ts).
export default async function ResumePage() {
  const [user, inApp] = await Promise.all([getUser(), isAppRequest()]);

  // An old ₹199 paid order still waiting for its resume file keeps its upload
  // step. Full Access members get 1 makeover per 3-month plan; usedAt is the
  // one they've already used in that window, if any.
  let pendingOrderId: string | null = null;
  let isMember = false;
  let usedAt: string | null = null;
  if (user && !inApp) {
    const admin = createAdminClient();
    const since = new Date(Date.now() - FULL_ACCESS_PERIOD_MS).toISOString();
    const [{ data: pending }, member, { data: used }] = await Promise.all([
      admin
        .from("resume_orders")
        .select("razorpay_order_id")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .order("paid_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      hasFullAccess(user.id),
      admin
        .from("resume_orders")
        .select("created_at")
        .eq("user_id", user.id)
        .like("razorpay_order_id", "member_%")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    pendingOrderId = pending?.razorpay_order_id ?? null;
    isMember = member;
    usedAt = used?.created_at ?? null;
  }

  return (
    <main className="page page-wide">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <span className="breadcrumbs-current" aria-current="page">Resume Help</span>
        </nav>

        <section className="resume-hero">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            Resume Help
          </span>
          <h1>
            Applying everywhere but getting <span className="resume-hero-mark">no calls?</span>
          </h1>
          <p>
            Your resume might be the reason. Most companies run every resume through ATS software before a recruiter
            ever reads it — a messy format or missing keywords can get you rejected in seconds, even when you&apos;re a
            great fit.
          </p>
          <p className="resume-hero-sub">Fix it today — do it yourself for free, or let us do it for you.</p>
        </section>

        <section className={`resume-options ${inApp ? "resume-options-single" : ""}`}>
          <article className="resume-option">
            <span className="resume-badge resume-badge-free">Free</span>
            <h2>Download our ATS-friendly resume template</h2>
            <p className="resume-option-lead">
              The same one-page format recruiters at top companies like to see. Open it, replace the brackets with
              your details, and you&apos;re ready to apply.
            </p>
            <ul className="resume-checklist">
              {FREE_POINTS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div className="resume-actions">
              <a className="btn btn-primary" href="/resume/FirstOffer-ATS-Resume-Template.docx" download>
                Download Word (editable)
              </a>
              <a className="btn btn-secondary" href="/resume/FirstOffer-ATS-Resume-Template.pdf" download>
                Download PDF
              </a>
            </div>
            <p className="resume-option-foot">
              Already have a resume? <Link href="/resume-match">Check it against any job&apos;s keywords →</Link>
            </p>
          </article>

          {!inApp && (
            <article className="resume-option resume-option-paid" id="makeover">
              <span className="resume-badge resume-badge-paid">Done for you</span>
              <h2>Confused? Send us your raw resume — we&apos;ll make it professional</h2>
              <div className="resume-price">
                <strong>Included in Full Access</strong>
                <span className="resume-price-note">₹{FULL_PRICE} for 3 months · 1 makeover per plan</span>
              </div>
              <p className="resume-value">
                <span aria-hidden="true">💡</span> A professional resume writer charges <strong>₹3,000–₹5,000</strong> and
                takes days. With Full Access it&apos;s <strong>included</strong> — delivered within{" "}
                <strong>24 hours</strong>, along with HR emails, recruiter numbers and apply links.
              </p>
              <ul className="resume-checklist">
                {MAKEOVER_POINTS.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <ResumeMakeoverCard
                fullAccessPrice={FULL_PRICE}
                isMember={isMember}
                isSignedIn={Boolean(user)}
                pendingOrderId={pendingOrderId}
                usedAt={usedAt}
                userEmail={user?.email ?? null}
              />
            </article>
          )}
        </section>

        {!inApp && (
          <section className="resume-steps">
            <h2>How the Resume Makeover works</h2>
            <ol>
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className="resume-step-num">{i + 1}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </main>
  );
}
