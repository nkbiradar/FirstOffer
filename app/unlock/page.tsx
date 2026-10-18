import type { Metadata } from "next";
import Link from "next/link";
import UnlockContactCard from "@/components/UnlockContactCard";
import AppMembersOnlyNote from "@/components/AppMembersOnlyNote";
import { getUser } from "@/lib/supabase/auth";
import { hasFullAccess } from "@/lib/data/opportunity-unlocks";
import { isAppRequest } from "@/lib/nativeAppServer";
import {
  FULL_ACCESS_NEXT_PRICE_INR,
  FULL_ACCESS_PRICE_RISE_LABEL,
  getFullAccessPriceInr,
  isFullAccessPriceRisePending,
} from "@/lib/payments/razorpay";

// Direct checkout page for Full Access — the target of the offer popup and
// the homepage pricing card, so buying doesn't require opening a job first.
export const metadata: Metadata = {
  title: "Unlock Full Access",
  description: "Unlock direct HR emails, recruiter numbers, Google Forms and apply links for every fresher opportunity on FirstOffer.",
  robots: { index: false, follow: true },
};

export default async function UnlockPage() {
  const [user, inApp] = await Promise.all([getUser(), isAppRequest()]);
  const unlocked = user ? await hasFullAccess(user.id) : false;
  const price = getFullAccessPriceInr();
  const risePending = isFullAccessPriceRisePending();

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 640, paddingTop: 32, paddingBottom: 64 }}>
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          Full Access · 3 months
        </span>
        <h1 style={{ marginTop: 12 }}>Apply directly to every opening</h1>
        <p className="hint" style={{ fontSize: 16, marginBottom: 24 }}>
          One payment unlocks the HR email, recruiter number, Google Form and official apply link on every
          opportunity — including new ones added daily.
          {risePending && (
            <>
              {" "}
              <strong>
                Offer: ₹{price} instead of ₹{FULL_ACCESS_NEXT_PRICE_INR} — ends {FULL_ACCESS_PRICE_RISE_LABEL}.
              </strong>
            </>
          )}
        </p>

        {unlocked ? (
          <div className="empty-state">
            <h3>Your full access is active ✅</h3>
            <p>Every apply detail on FirstOffer is unlocked for you.</p>
            <Link className="btn btn-primary btn-sm" href="/opportunities">
              Browse live openings
            </Link>
          </div>
        ) : inApp ? (
          <AppMembersOnlyNote isSignedIn={Boolean(user)} next="/unlock" what="Full access is available to FirstOffer members." />
        ) : (
          <UnlockContactCard
            isSignedIn={Boolean(user)}
            descriptionOverride="Skip crowded job portals. Get the direct HR email, recruiter number, official Google Form or application link on every opportunity — including new roles added every day."
            loginNext="/unlock"
            titleOverride="Unlock every opportunity on FirstOffer"
            price={price}
            priceNote={
              risePending
                ? `🔥 Offer: ₹${FULL_ACCESS_NEXT_PRICE_INR} → ₹${price} for 3 months, ends ${FULL_ACCESS_PRICE_RISE_LABEL}.`
                : `Just ₹${Math.round(price / 3)}/month — one payment covers 3 months.`
            }
            product="full_access"
          />
        )}
      </div>
    </main>
  );
}
