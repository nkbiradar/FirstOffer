"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { track } from "@vercel/analytics";

type RazorpaySuccessResponse = {
  razorpay_subscription_id: string;
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
    highlightTitle: string;
    highlightBody: string;
    checkoutDescription: string;
    unlockLabel: (price: number) => string;
    fallbackRedirect: (opportunityId?: string) => string;
  }
> = {
  full_access: {
    eyebrow: "Full Access Membership",
    title: "How to apply is locked",
    priceLine: "Cancel anytime, in one click.",
    description:
      "Most freshers waste weeks applying through crowded portals and hoping someone notices. For less than the price of an auto ride, unlock the direct HR email, official Google Form, or application link on this opportunity — and every opportunity on FirstOffer, including new ones added regularly.",
    highlightTitle: "One membership, every opportunity, unlocked",
    highlightBody:
      "direct HR emails, official Google Forms, and application links, updated as new roles go live. Skip straight to applying instead of guessing.",
    checkoutDescription: "Monthly membership — full site access",
    unlockLabel: (price) => `Unlock everything for ₹${price}/month`,
    fallbackRedirect: (opportunityId) => (opportunityId ? `/opportunities/${opportunityId}` : "/opportunities"),
  },
  internal_hr: {
    eyebrow: "Internal HR Openings",
    title: "This is an internal, HR-shared opening",
    priceLine: "Cancel anytime, in one click.",
    description:
      "This role was shared directly by an HR or recruiter — it isn't posted on the regular job portals, so competition is far lower than a public listing. Unlock it (and every other internal opening as it comes in) for less than the price of an auto ride.",
    highlightTitle: "Direct HR access, before everyone else",
    highlightBody:
      "internal, HR-shared roles with significantly lower competition — early access to openings that may never be widely posted elsewhere.",
    checkoutDescription: "Internal HR Openings membership",
    unlockLabel: (price) => `Unlock Internal Openings — ₹${price}/month`,
    fallbackRedirect: () => "/internal-openings",
  },
};

// Shown in place of every apply route on the opportunity detail page —
// application link, Google Form, HR email/contact, and the free-text "how
// to apply" instructions are all hidden until the signed-in visitor has
// access to whichever product this opportunity belongs to (see
// app/opportunities/[id]/page.tsx). `product` picks which of the site's
// two independent subscriptions this card sells — the ₹49/month full-site
// membership, or the ₹39/month Internal HR Openings membership (see
// lib/payments/razorpay.ts's getProductConfig). Existing lifetime
// customers from the old one-time ₹49 unlock keep that access unchanged
// and never see this card for full_access. Once access is granted, the
// real ApplyButton/apply instructions render in this same spot instead.
export default function UnlockContactCard({
  opportunityId,
  isSignedIn,
  price,
  product = "full_access",
}: {
  opportunityId?: string;
  isSignedIn: boolean;
  price: number;
  product?: Product;
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

  async function handleUnlock() {
    // Custom Vercel Analytics events — this is the site's entire revenue
    // funnel, so these events are what let the "how many people who click
    // Unlock actually pay" question get answered from real data instead
    // of a guess. See rebuild-plan.md Step 19.
    track("unlock_clicked", { opportunityId: opportunityId ?? "", product });

    if (!isSignedIn) {
      track("unlock_login_redirect", { opportunityId: opportunityId ?? "", product });
      router.push(`/login?next=${encodeURIComponent(copy.fallbackRedirect(opportunityId))}`);
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
        body: JSON.stringify({ product }),
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
        subscription_id: subData.subscriptionId,
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

  return (
    <div className={`unlock-contact-card ${product === "internal_hr" ? "unlock-contact-card-internal" : ""}`}>
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
      <p className="unlock-contact-title">{copy.title}</p>
      <p className="unlock-contact-desc" style={{ fontWeight: 700 }}>
        ₹{price}/month. {copy.priceLine}
      </p>
      <p className="unlock-contact-desc">{copy.description}</p>
      <p className="unlock-contact-highlight">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          <strong>{copy.highlightTitle}</strong> — {copy.highlightBody}
        </span>
      </p>
      {paymentSuccess ? (
        <p className="unlock-contact-desc" style={{ fontWeight: 600 }}>
          🎉 Payment confirmed — you&apos;re ready to apply now! Loading your apply details...
        </p>
      ) : (
        <>
          <button className="btn btn-primary btn-sm" type="button" onClick={handleUnlock} disabled={isLoading}>
            {isLoading ? "Opening payment..." : copy.unlockLabel(price)}
          </button>
          <p className="unlock-contact-desc" style={{ fontSize: 12, opacity: 0.75 }}>
            Access unlocks instantly after payment. Renews monthly at ₹{price} — cancel anytime from your dashboard,
            no questions asked.
          </p>
        </>
      )}
      {error && <p className="unlock-contact-error">{error}</p>}
    </div>
  );
}
