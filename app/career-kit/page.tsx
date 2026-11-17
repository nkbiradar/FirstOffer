import type { Metadata } from "next";
import Link from "next/link";
import UnlockContactCard from "@/components/UnlockContactCard";
import AppMembersOnlyNote from "@/components/AppMembersOnlyNote";
import { isAppRequest } from "@/lib/nativeAppServer";
import { getUser } from "@/lib/supabase/auth";
import { hasCareerKitAccess } from "@/lib/data/subscriptions";
import { CAREER_KIT_FILES } from "@/lib/career-kit";
import { getInternalPriceInr } from "@/lib/payments/razorpay";
import { getSiteUrl } from "@/lib/site-url";


export const metadata: Metadata = {
  title: "Career Kit 2027 — 3,100+ HR Contacts & 500+ Career Links",
  description: `Everything a fresher needs to reach HRs directly: 3,100+ HR contacts, 12-country HR email directory, 500+ company career links, referral guide, referral mail template and ATS resume template. Included with the FirstOffer Internal HR plan.`,
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
  const internalPrice = getInternalPriceInr();

  return (
    <main className="page page-wide">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumbs-sep" aria-hidden="true">/</span>
          <span className="breadcrumbs-current" aria-current="page">Career Kit 2027</span>
        </nav>

        <section className="ck-hero">
          <span className="ck-badge">✨ 2027 Updated · Included with Internal HR</span>
          <h1>
            The complete <span className="ck-mark">job-search kit</span> for freshers
          </h1>
          <p>
            Stop waiting on job portals. Reach HRs directly with 3,100+ verified HR contacts, a 12-country HR email
            directory, 500+ company career links, and the exact referral mail and resume format that get replies.
          </p>
          {!owned && !inApp && (
            <div className="ck-price">
              <strong>Included in Internal HR</strong>
              <span className="ck-once">
                ₹{internalPrice} for 3 months · plus referrals, HR-shared openings &amp; interview kits
              </span>
            </div>
          )}
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
                <li>🤝 Plus company-wise referrals &amp; HR-shared openings</li>
                <li>🔒 Secure UPI / card payment via Razorpay</li>
              </ul>
            </section>

            <aside className="ck-buy" id="buy">
              {inApp ? (
                <AppMembersOnlyNote
                  isSignedIn={Boolean(user)}
                  next="/career-kit"
                  what="The Career Kit is included for FirstOffer Internal HR members."
                />
              ) : (
                <UnlockContactCard
                  isSignedIn={Boolean(user)}
                  loginNext="/career-kit#buy"
                  price={internalPrice}
                  priceNote="📇 The full Career Kit 2027 is included with Internal HR — download everything right after payment."
                  product="internal_hr"
                />
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
