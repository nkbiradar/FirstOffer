import type { Metadata } from "next";
import Link from "next/link";
import UnlockContactCard from "@/components/UnlockContactCard";
import AppMembersOnlyNote from "@/components/AppMembersOnlyNote";
import WhatWorked from "@/components/WhatWorked";
import OffCampusCompare from "@/components/OffCampusCompare";
import HiredCompanies from "@/components/HiredCompanies";
import OfferCountdown from "@/components/OfferCountdown";
import SafePay from "@/components/SafePay";
import { STUDENT_COUNT_LABEL } from "@/components/PlanTags";
import { getPublishedTestimonialsCached, getSiteStatsCached } from "@/lib/data/cached";
import { getUser } from "@/lib/supabase/auth";
import { hasFullAccess } from "@/lib/data/opportunity-unlocks";
import { isAppRequest } from "@/lib/nativeAppServer";
import {
  FULL_ACCESS_SALE_END_LABEL,
  FULL_ACCESS_SALE_ENDS_AT,
  FULL_ACCESS_SALE_MRP_INR,
  getFullAccessPriceInr,
  isFullAccessSaleActive,
} from "@/lib/payments/razorpay";

// Direct checkout page for Full Access — dark, two-column layout: what you
// get on the left, a sticky checkout card on the right. Prices and the
// offer come from lib/payments/razorpay.ts.
export const metadata: Metadata = {
  title: "Unlock Full Access",
  description:
    "Unlock direct HR emails, recruiter numbers, Google Forms and apply links for every fresher opportunity on FirstOffer.",
  robots: { index: false, follow: true },
};

const BENEFITS: { title: string; text: string; icon: string }[] = [
  {
    title: "Direct HR emails & recruiter numbers",
    text: "Write to the person who actually shortlists — not a portal inbox.",
    icon: "M4 6h16v12H4z M4 7l8 6 8-6",
  },
  {
    title: "Official Google Forms & apply links",
    text: "The company's own application route on every listing.",
    icon: "M14 3H6v18h12V7l-4-4Z M14 3v4h4 M9 13l2 2 4-4",
  },
  {
    title: "New roles every day",
    text: "Fresh fresher jobs and internships, each live for 48 hours.",
    icon: "M12 7v5l3 2 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
  },
  {
    title: "Resume Keyword Matcher",
    text: "Check how well your resume fits a role before you apply.",
    icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z M20 20l-4-4",
  },
];

const STEPS = [
  { n: "1", title: "Pay once", text: "UPI or card via Razorpay. No auto-debit." },
  { n: "2", title: "Unlocked instantly", text: "Every apply detail opens right away." },
  { n: "3", title: "Apply to the HR", text: "Email, form or link — straight to the company." },
];

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} viewBox="0 0 24 24" width="20">
      {d.split(" M").map((seg, i) => (
        <path d={i === 0 ? seg : `M${seg}`} key={i} />
      ))}
    </svg>
  );
}

export default async function UnlockPage() {
  const [user, inApp, stats, testimonials] = await Promise.all([
    getUser(),
    isAppRequest(),
    getSiteStatsCached(),
    getPublishedTestimonialsCached(),
  ]);
  const unlocked = user ? await hasFullAccess(user.id) : false;
  const price = getFullAccessPriceInr();
  const saleActive = isFullAccessSaleActive();

  return (
    <main className="home-dark uk">
      <div aria-hidden="true" className="uk-glow" />
      <div className="container uk-wrap">
        <div className="uk-grid">
          {/* Left: what you get */}
          <section className="uk-info">
            <span className="uk-eyebrow">
              <span className="uk-dot" /> Full Access · 3 months
            </span>
            <h1>
              Apply directly to <span>every opening</span>
            </h1>
            <p className="uk-sub">
              One payment unlocks the HR email, recruiter number, Google Form and official apply link on every
              opportunity — including the new ones added every day.
            </p>

            <div className="uk-proof">
              {[
                { v: STUDENT_COUNT_LABEL, l: "students joined", show: true },
                { v: String(stats.totalInterviews), l: "interview calls", show: stats.totalInterviews > 0 },
                { v: String(stats.totalOffers), l: "offers received", show: stats.totalOffers > 0 },
              ]
                .filter((x) => x.show)
                .map((x) => (
                  <div key={x.l}>
                    <b>{x.v}</b>
                    <span>{x.l}</span>
                  </div>
                ))}
            </div>

            <h2 className="uk-h2">What you get</h2>
            <ul className="uk-benefits">
              {BENEFITS.map((b) => (
                <li key={b.title}>
                  <span className="uk-ico">
                    <Icon d={b.icon} />
                  </span>
                  <span>
                    <strong>{b.title}</strong>
                    <small>{b.text}</small>
                  </span>
                </li>
              ))}
            </ul>

            <h2 className="uk-h2">How it works</h2>
            <ol className="uk-steps">
              {STEPS.map((s) => (
                <li key={s.n}>
                  <span className="uk-step-n">{s.n}</span>
                  <strong>{s.title}</strong>
                  <small>{s.text}</small>
                </li>
              ))}
            </ol>
          </section>

          {/* Right: checkout */}
          <aside className="uk-checkout">
            {unlocked ? (
              <div className="uk-active">
                <span className="uk-active-ico">✓</span>
                <h3>Your Full Access is active</h3>
                <p>Every apply detail on FirstOffer is unlocked for you.</p>
                <Link className="fp-cta fp-cta-primary" href="/opportunities">
                  Browse live openings
                </Link>
              </div>
            ) : inApp ? (
              <AppMembersOnlyNote isSignedIn={Boolean(user)} next="/unlock" what="Full access is available to FirstOffer members." />
            ) : (
              <>
                {saleActive && (
                  <div className="uk-offer">
                    <span className="uk-offer-tag">Limited-time offer · ends {FULL_ACCESS_SALE_END_LABEL}</span>
                    <OfferCountdown endsAt={FULL_ACCESS_SALE_ENDS_AT} />
                  </div>
                )}
                <UnlockContactCard
                  isSignedIn={Boolean(user)}
                  loginNext="/unlock"
                  price={price}
                  product="full_access"
                  variant="checkout"
                  wasPrice={saleActive ? FULL_ACCESS_SALE_MRP_INR : undefined}
                />
                <SafePay />
                <p className="uk-rule">
                  One account = one user, one device. Sharing your account or copying opportunities gets it banned
                  without refund. <Link href="/terms#personal-use">Terms</Link>
                </p>
              </>
            )}
          </aside>
        </div>
      </div>

      {!unlocked && <HiredCompanies testimonials={testimonials} />}

      {!unlocked && (
        <div className="container uk-more">
          <WhatWorked />
        </div>
      )}
      {!unlocked && !inApp && (
        <div className="container" style={{ maxWidth: 1180, paddingBottom: 64 }}>
          <OffCampusCompare totalInterviews={stats.totalInterviews} totalStartups={stats.totalStartups} />
        </div>
      )}
    </main>
  );
}
