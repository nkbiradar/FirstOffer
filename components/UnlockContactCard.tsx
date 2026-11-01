"use client";

import PlanTags from "@/components/PlanTags";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { track } from "@vercel/analytics";

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

type Product = "full_access" | "internal_hr";

// Copy/labels that differ between the two subscription products this card
// can sell. Kept as a lookup (rather than scattering `product === "..."`
// checks through the JSX below) so the two pitches are easy to compare and
// edit side by side.
const PRODUCT_COPY: Record<
  Product,
  {
    eyebrow: string;
    title: string;
    priceLine: string;
    description: string;
    benefits: string[];
    checkoutDescription: string;
    unlockLabel: (price: number) => string;
    fallbackRedirect: (opportunityId?: string) => string;
  }
> = {
  full_access: {
    eyebrow: "Full Access Membership",
    title: "How to apply is locked",
    priceLine: "one-time payment",
    description:
      "Most freshers waste weeks applying through crowded portals and hoping someone notices. For less than the price of an auto ride, unlock the direct HR email, official Google Form, or application link on this opportunity — and every opportunity on FirstOffer, including new ones added regularly.",
    benefits: [
      "Direct HR emails and recruiter numbers",
      "Official Google Forms and apply links",
      "New fresher roles added every day",
    ],
    checkoutDescription: "3-month membership — full site access",
    unlockLabel: (price) => `Get full access for ₹${price}`,
    fallbackRedirect: (opportunityId) => (opportunityId ? `/opportunities/${opportunityId}` : "/opportunities"),
  },
  internal_hr: {
    eyebrow: "Internal HR Openings",
    title: "This is an internal, HR-shared opening",
    priceLine: "one-time payment",
    description:
      "This role was shared directly by an HR or recruiter — it isn't posted on the regular job portals, so competition is far lower than a public listing. Unlock it (and every other internal opening as it comes in) for less than the price of an auto ride.",
    benefits: [
      "Openings shared directly by HRs and recruiters",
      "Far less competition than public job portals",
      "Early access to roles before they're widely posted",
    ],
    checkoutDescription: "Internal HR Openings membership",
    unlockLabel: (price) => `Unlock internal openings for ₹${price}`,
    fallbackRedirect: () => "/internal-openings",
  },
};

// Shown in place of every apply route on the opportunity detail page —
// application link, Google Form, HR email/contact, and the free-text "how
// to apply" instructions are all hidden until the signed-in visitor has
// access to whichever product this opportunity belongs to (see
// app/opportunities/[id]/page.tsx). `product` picks which of the site's
// two independent subscriptions this card sells — the full-site membership
// (₹99/month regular, ₹49/month for founding members — see `priceNote` and
// lib/data/subscriptions.ts's hasLegacyFullAccessPricing()), or the
// ₹149/month Internal HR Openings membership (see lib/payments/razorpay.ts's
// getProductConfig). Existing lifetime
// customers from the old one-time ₹49 unlock keep that access unchanged
// and never see this card for full_access. Once access is granted, the
// real ApplyButton/apply instructions render in this same spot instead.
// Checkout itself is a plain one-time Razorpay Order (30 days of access
// per payment), not a recurring Autopay Subscription — see
// app/api/subscriptions/create/route.ts's comment for why.
export default function UnlockContactCard({
  opportunityId,
  isSignedIn,
  price,
  wasPrice,
  product = "full_access",
  priceNote,
  memberLabel,
  loginNext,
  titleOverride,
  descriptionOverride,
  variant = "default",
}: {
  /** "checkout": compact card for /unlock — price, coupon and pay button
   * only (the page itself explains the benefits). */
  variant?: "default" | "checkout";
  /** Replace the default card headline / body (e.g. on the /unlock page). */
  titleOverride?: string;
  descriptionOverride?: string;
  opportunityId?: string;
  /** Where to return after sign-in (defaults to the product's fallback page). */
  loginNext?: string;
  isSignedIn: boolean;
  price: number;
  /** Optional struck-through "was" price shown before `price` during an
   * offer (e.g. Diwali ₹299 → ₹199). Display only — never charged. */
  wasPrice?: number;
  product?: Product;
  /** Optional line shown right under the price — e.g. telling a founding
   * member their rate is locked in, or telling a new visitor pricing has
   * changed. Left out entirely (no fallback text) when not passed, so
   * callers that don't need it (internal_hr, today) render exactly as
   * before. */
  priceNote?: string;
  /** "40+"-style count of paid members (getPaidMemberLabel); full_access only. */
  memberLabel?: string | null;
}) {
  const router = useRouter();
  const copy = PRODUCT_COPY[product];
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  // Verification (app/api/subscriptions/verify/route.ts) flips the
  // subscription to "active" synchronously, so access is unlocked
  // instantly — this flag just holds the confirmation on screen for a
  // moment before router.refresh() swaps this card out for the real
  // ApplyButton, so the visitor actually sees the "you're ready to apply"
  // moment instead of the UI silently changing under them.
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Optional partner/promo coupon (e.g. "ALGOCRUX") — see
  // lib/payments/coupons.ts and app/api/subscriptions/validate-coupon.
  // Hidden behind a small toggle so the default checkout stays exactly as
  // it was for the vast majority of visitors who don't have a code.
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountedInr: number } | null>(null);

  async function handleApplyCoupon() {
    const code = couponInput.trim();
    if (!code) return;

    setCouponChecking(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/subscriptions/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, product }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponApplied({ code: data.code, discountedInr: data.discountedInr });
        track("coupon_applied", { opportunityId: opportunityId ?? "", product, code: data.code });
      } else {
        setCouponApplied(null);
        setCouponError(data.error ?? "That coupon code isn't valid.");
      }
    } catch {
      setCouponError("Network error — try again.");
    } finally {
      setCouponChecking(false);
    }
  }

  function handleRemoveCoupon() {
    setCouponApplied(null);
    setCouponInput("");
    setCouponError(null);
    setShowCouponInput(false);
  }

  async function handleUnlock() {
    // Custom Vercel Analytics events — this is the site's entire revenue
    // funnel, so these events are what let the "how many people who click
    // Unlock actually pay" question get answered from real data instead
    // of a guess. See rebuild-plan.md Step 19.
    track("unlock_clicked", { opportunityId: opportunityId ?? "", product });

    if (!isSignedIn) {
      track("unlock_login_redirect", { opportunityId: opportunityId ?? "", product });
      router.push(`/login?next=${encodeURIComponent(loginNext ?? copy.fallbackRedirect(opportunityId))}`);
      return;
    }

    if (!scriptReady || !window.Razorpay) {
      setError("Payment isn't ready yet — try again in a moment.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const subResponse = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, couponCode: couponApplied?.code }),
      });
      const subData = await subResponse.json();

      if (!subResponse.ok) {
        track("subscription_create_failed", { opportunityId: opportunityId ?? "", product, error: subData.error ?? "unknown" });
        setError(subData.error ?? "Could not start payment.");
        setIsLoading(false);
        return;
      }

      if (subData.alreadyUnlocked) {
        router.refresh();
        return;
      }

      const razorpay = new window.Razorpay({
        key: subData.keyId,
        order_id: subData.orderId,
        name: "FirstOffer",
        description: copy.checkoutDescription,
        method: {
          upi: true,
          card: true,
          netbanking: false,
          wallet: false,
          paylater: false,
          emi: false,
        },
        handler: async (response: RazorpaySuccessResponse) => {
          const verifyResponse = await fetch("/api/subscriptions/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyResponse.ok) {
            track("subscription_payment_succeeded", { opportunityId: opportunityId ?? "", product, price });
            setPaymentSuccess(true);
            // Brief pause so the success message is actually seen before this
            // card is replaced by the real ApplyButton on refresh.
            setTimeout(() => router.refresh(), 1600);
          } else {
            track("subscription_verify_failed", { opportunityId: opportunityId ?? "", product });
            setError("Payment succeeded but confirmation failed — refresh in a minute, or contact support.");
          }
          setIsLoading(false);
        },
        modal: {
          ondismiss: () => setIsLoading(false),
        },
        theme: { color: "#0a0a0a" },
      });

      razorpay.on("payment.failed", () => {
        track("subscription_payment_failed", { opportunityId: opportunityId ?? "", product });
        setError("Payment failed — try again.");
        setIsLoading(false);
      });

      track("checkout_opened", { opportunityId: opportunityId ?? "", product, price });
      razorpay.open();
    } catch {
      setError("Network error — try again.");
      setIsLoading(false);
    }
  }

  // Price block: the coupon price (if any) is the headline, struck against
  // the base price; otherwise an offer's display-only `wasPrice` is struck.
  const displayPrice = couponApplied?.discountedInr ?? price;
  const strikePrice = couponApplied ? price : wasPrice && wasPrice > price ? wasPrice : undefined;
  const pctOff = strikePrice ? Math.round((1 - displayPrice / strikePrice) * 100) : 0;

  return (
    <div
      className={`unlock-contact-card ${product === "internal_hr" ? "unlock-contact-card-internal" : ""} ${
        variant === "checkout" ? "unlock-contact-card-checkout" : ""
      }`}
    >
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />
      <span className="unlock-contact-eyebrow">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {copy.eyebrow}
      </span>
      {product === "full_access" && variant !== "checkout" && <PlanTags memberLabel={memberLabel} />}
      {variant !== "checkout" && <p className="unlock-contact-title">{titleOverride ?? copy.title}</p>}
      {priceNote && <p className="unlock-contact-price-note">{priceNote}</p>}
      <div className="unlock-price">
        <div className="unlock-price-row">
          <span className="unlock-price-now">₹{displayPrice}</span>
          {strikePrice && (
            <s className="unlock-price-was" aria-label={`Original price ₹${strikePrice}`}>
              ₹{strikePrice}
            </s>
          )}
          {pctOff > 0 && <span className="unlock-price-off">{pctOff}% off</span>}
        </div>
        <p className="unlock-price-meta">
          for 3 months, about ₹{(displayPrice / 90).toFixed(1)} a day
        </p>
      </div>
      {variant !== "checkout" && <p className="unlock-contact-desc">{descriptionOverride ?? copy.description}</p>}
      {variant !== "checkout" && (
      <ul className="unlock-benefits">
        {copy.benefits.map((b) => (
          <li key={b}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {b}
          </li>
        ))}
      </ul>
      )}
      {paymentSuccess ? (
        <p className="unlock-contact-desc" style={{ fontWeight: 600 }}>
          🎉 Payment confirmed — you&apos;re ready to apply now! Loading your apply details...
        </p>
      ) : (
        <>
          {isSignedIn && (
            <div className="unlock-contact-coupon">
              {couponApplied ? (
                <p className="unlock-contact-coupon-applied">
                  Coupon <strong>{couponApplied.code}</strong> applied — ₹{couponApplied.discountedInr} for your
                  first month.{" "}
                  <button type="button" className="unlock-contact-coupon-remove" onClick={handleRemoveCoupon}>
                    Remove
                  </button>
                </p>
              ) : showCouponInput ? (
                <div className="unlock-contact-coupon-row">
                  <input
                    type="text"
                    className="unlock-contact-coupon-field"
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    disabled={couponChecking}
                  />
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={handleApplyCoupon}
                    disabled={couponChecking || !couponInput.trim()}
                  >
                    {couponChecking ? "Checking..." : "Apply"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="unlock-contact-coupon-toggle"
                  onClick={() => setShowCouponInput(true)}
                >
                  Have a coupon code?
                </button>
              )}
              {couponError && <p className="unlock-contact-error">{couponError}</p>}
            </div>
          )}
          <button className="btn btn-primary unlock-contact-cta" type="button" onClick={handleUnlock} disabled={isLoading}>
            {isLoading ? "Opening payment..." : copy.unlockLabel(displayPrice)}
          </button>
          <ul className="unlock-trust" aria-label="Payment details">
            <li>One-time payment, no auto-renewal</li>
            <li>Instant access</li>
            <li>Secure checkout via Razorpay</li>
          </ul>
        </>
      )}
      {error && <p className="unlock-contact-error">{error}</p>}
    </div>
  );
}
