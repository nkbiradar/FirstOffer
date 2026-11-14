import type { Metadata } from "next";
import Link from "next/link";
import UnlockContactCard from "@/components/UnlockContactCard";
import AppMembersOnlyNote from "@/components/AppMembersOnlyNote";
import { isAppRequest } from "@/lib/nativeAppServer";
import { getUser } from "@/lib/supabase/auth";
import { hasCareerKitAccess } from "@/lib/data/subscriptions";
import { CAREER_KIT_FILES } from "@/lib/career-kit";
import { CAREER_KIT_MRP_INR, CAREER_KIT_PRICE_INR } from "@/lib/payments/razorpay";
import { getSiteUrl } from "@/lib/site-url";

const OFF = Math.round((1 - CAREER_KIT_PRICE_INR / CAREER_KIT_MRP_INR) * 100);

export const metadata: Metadata = {
  title: `Career Kit 2027 — 3,100+ HR Contacts, 500+ Career Links & Resume Template | ₹${CAREER_KIT_PRICE_INR} Lifetime`,
  description: `Everything a fresher needs to reach HRs directly: 3,100+ HR contacts, 12-country HR email directory, 500+ company career links, referral guide, referral mail template and ATS resume template. One-time ₹${CAREER_KIT_PRICE_INR}, lifetime access.`,
  alternates: { canonical: `${getSiteUrl()}/career-kit` },
};

const STATS = [
  { big: "3,100+", small: "HR contacts" },
  { big: "740+", small: "HR emails · 12 countries" },
  { big: "500+", small: "Company career links" },
  { big: "8", small: "Files · instant download" },
];

// Career Kit 2027: one-time ₹179 lifetime product (product "career_kit").
// Buyers see their downloads (served by app/api/career-kit); everyone else
// sees the pitch and the checkout card. No prices or purchase buttons inside
// the Android app (Google Play policy — see lib/nativeAppServer.ts).
export default async function CareerKitPage() {
  const [user, inApp] = await Promise.all([getUser(), isAppRequest()]);
  const owned = user ? await hasCareerKitAccess(user.id) : false;

  return (
    <main className="page page-wide">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <span className="breadcrumbs-current" aria-current="page">Career Kit 2027</span>
        </nav>

        <section className="ck-hero">
          <span className="ck-badge">✨ 2027 Updated · Lifetime access</span>
          <h1>
            The complete <span className="ck-mark">job-search kit</span> for freshers
          </h1>
          <p>
            Stop waiting on job portals. Reach HRs directly with 3,100+ verified HR contacts, a 12-country HR email
            directory, 500+ company career links, and the exact referral mail and resume format that get replies.
          </p>
          {!owned && !inApp && (
            <div className="ck-price">
              <s aria-label={`Original price ₹${CAREER_KIT_MRP_INR}`}>₹{CAREER_KIT_MRP_INR}</s>
              <strong>₹{CAREER_KIT_PRICE_INR}</strong>
              <span className="ck-off">{OFF}% OFF</span>
              <span className="ck-once">One-time payment · Lifetime access</span>
            </div>
          )}
          {!owned && !inApp && <p className="ck-urgency">⏳ Launch price — prices will increase soon.</p>}
          <div className="ck-stats">
            {STATS.map((s) => (
              <div className="ck-stat" key={s.small}>
                <strong>{s.big}</strong>
                <span>{s.small}</span>
              </div>
            ))}
          </div>
        </section>

        {owned ? (
          <section className="ck-downloads" aria-labelledby="ck-dl-title">
            <h2 id="ck-dl-title">✅ Your Career Kit — download anytime</h2>
            <p className="ck-sub">You have lifetime access. Every 2027 update we add shows up here automatically.</p>
            <div className="ck-grid">
              {CAREER_KIT_FILES.map((f) => (
                <div className="ck-item" key={f.key}>
                  <span className="ck-item-emoji" aria-hidden="true">{f.emoji}</span>
                  <div className="ck-item-text">
                    <strong>{f.title}</strong>
                    <span>{f.detail}</span>
                  </div>
                  <a className="btn btn-primary btn-sm" href={`/api/career-kit?file=${f.key}`}>
                    Download {f.format}
                  </a>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="ck-layout">
            <section className="ck-included" aria-labelledby="ck-inc-title">
              <h2 id="ck-inc-title">What&apos;s inside the kit</h2>
              <div className="ck-grid">
                {CAREER_KIT_FILES.map((f) => (
                  <div className="ck-item" key={f.key}>
                    <span className="ck-item-emoji" aria-hidden="true">{f.emoji}</span>
                    <div className="ck-item-text">
                      <strong>{f.title}</strong>
                      <span>{f.detail}</span>
                    </div>
                    <span className="ck-format">{f.format}</span>
                  </div>
                ))}
              </div>
              <ul className="ck-why">
                <li>📥 Instant download right after payment</li>
                <li>♾️ Pay once, keep it forever — no renewal</li>
                <li>🔄 Free 2027 updates included</li>
                <li>🔒 Secure UPI / card payment via Razorpay</li>
              </ul>
            </section>

            <aside className="ck-buy" id="buy">
              {inApp ? (
                <AppMembersOnlyNote
                  isSignedIn={Boolean(user)}
                  next="/career-kit"
                  what="The Career Kit is available to FirstOffer members who own it."
                />
              ) : (
                <UnlockContactCard
                  isSignedIn={Boolean(user)}
                  loginNext="/career-kit#buy"
                  price={CAREER_KIT_PRICE_INR}
                  priceNote={`🔥 Launch offer: ₹${CAREER_KIT_MRP_INR} → ₹${CAREER_KIT_PRICE_INR}. Prices will increase soon.`}
                  product="career_kit"
                  wasPrice={CAREER_KIT_MRP_INR}
                />
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
