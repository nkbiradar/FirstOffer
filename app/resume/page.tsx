import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { getUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAppRequest } from "@/lib/nativeAppServer";
import { RESUME_REVIEW_PRICE_INR, RESUME_REVIEW_MRP_INR } from "@/lib/payments/razorpay";

const OFF_PERCENT = Math.round((1 - RESUME_REVIEW_PRICE_INR / RESUME_REVIEW_MRP_INR) * 100);
import ResumeMakeoverCard from "@/components/ResumeMakeoverCard";

export const metadata: Metadata = {
  title: `Resume Help for Freshers — Free ATS Resume Template & ₹${RESUME_REVIEW_PRICE_INR} Resume Makeover`,
  description:
    "Getting no interview calls? Download a free one-page ATS-friendly resume template, or send us your resume and we'll rebuild it professionally for the role you want — now just ₹" + RESUME_REVIEW_PRICE_INR + ".",
  alternates: { canonical: `${getSiteUrl()}/resume` },
  openGraph: {
    title: "Getting no interview calls? Fix your resume | FirstOffer",
    description: `Free ATS-friendly resume template, or a full ₹${RESUME_REVIEW_PRICE_INR} resume makeover for freshers.`,
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
  { title: `Pay ₹${RESUME_REVIEW_PRICE_INR} once`, body: "Quick UPI or card payment. No subscription, no auto-debit." },
  { title: "Get your new resume", body: "We rebuild it and email the ATS-ready version to your sign-in email." },
];

// Resume Help hub: a free downloadable ATS template (public/resume/*) and
// the paid Resume Makeover (components/ResumeMakeoverCard.tsx →
// app/api/resume-review/*). Inside the Android app the paid half is not
// rendered at all (Google Play payments policy — see lib/nativeAppServer.ts).
export default async function ResumePage() {
  const [user, inApp] = await Promise.all([getUser(), isAppRequest()]);

  // A paid order still waiting for its resume file (tab closed after paying,
  // or the upload failed) — the card resumes at the upload step.
  let pendingOrderId: string | null = null;
  if (user && !inApp) {
    const { data } = await createAdminClient()
      .from("resume_orders")
      .select("razorpay_order_id")
      .eq("user_id", user.id)
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    pendingOrderId = data?.razorpay_order_id ?? null;
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
                <span className="resume-price-old" aria-label={`Original price ₹${RESUME_REVIEW_MRP_INR}`}>
                  ₹{RESUME_REVIEW_MRP_INR}
                </span>
                <strong>₹{RESUME_REVIEW_PRICE_INR}</strong>
                <span className="resume-off-badge">{OFF_PERCENT}% OFF</span>
                <span className="resume-price-note">Limited-time offer · one-time payment</span>
              </div>
              <ul className="resume-checklist">
                {MAKEOVER_POINTS.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <ResumeMakeoverCard
                isSignedIn={Boolean(user)}
                userEmail={user?.email ?? null}
                price={RESUME_REVIEW_PRICE_INR}
                pendingOrderId={pendingOrderId}
              />
            </article>
          )}
        </section>

        {!inApp && (
          <section className="resume-steps">
            <h2>How the ₹{RESUME_REVIEW_PRICE_INR} makeover works</h2>
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
