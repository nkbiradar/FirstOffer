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

// Shown in place of every apply route on the opportunity detail page —
// application link, Google Form, HR email/contact, and the free-text "how
// to apply" instructions are all hidden until the signed-in visitor has
// full access (see app/opportunities/[id]/page.tsx). Full access now comes
// from a ₹49/month recurring subscription (see
// app/api/subscriptions/create/route.ts) — existing lifetime customers
// from the old one-time ₹49 unlock keep that access unchanged and never
// see this card. Once access is granted, the real ApplyButton/apply
// instructions render in this same spot instead.
export default function UnlockContactCard({
  opportunityId,
  isSignedIn,
  price,
}: {
  opportunityId: string;
  isSignedIn: boolean;
  price: number;
}) {
  const router = useRouter();
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
    track("unlock_clicked", { opportunityId });

    if (!isSignedIn) {
      track("unlock_login_redirect", { opportunityId });
      router.push(`/login?next=${encodeURIComponent(`/opportunities/${opportunityId}`)}`);
      return;
    }

    if (!scriptReady || !window.Razorpay) {
      setError("Payment isn't ready yet — try again in a moment.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const subResponse = await fetch("/api/subscriptions/create", { method: "POST" });
      const subData = await subResponse.json();

      if (!subResponse.ok) {
        track("subscription_create_failed", { opportunityId, error: subData.error ?? "unknown" });
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
        description: "Monthly membership — full site access",
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
            track("subscription_payment_succeeded", { opportunityId, price });
            setPaymentSuccess(true);
            // Brief pause so the success message is actually seen before this
            // card is replaced by the real ApplyButton on refresh.
            setTimeout(() => router.refresh(), 1600);
          } else {
            track("subscription_verify_failed", { opportunityId });
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
        track("subscription_payment_failed", { opportunityId });
        setError("Payment failed — try again.");
        setIsLoading(false);
      });

      track("checkout_opened", { opportunityId, price });
      razorpay.open();
    } catch {
      setError("Network error — try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="unlock-contact-card">
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
        Full Access Membership
      </span>
      <p className="unlock-contact-title">How to apply is locked</p>
      <p className="unlock-contact-desc" style={{ fontWeight: 700 }}>
        ₹{price}/month. Cancel anytime, in one click.
      </p>
      <p className="unlock-contact-desc">
        Most freshers waste weeks applying through crowded portals and hoping someone notices. For less than the
        price of an auto ride, unlock the direct HR email, official Google Form, or application link on this
        opportunity — and every opportunity on FirstOffer, including new ones added regularly.
      </p>
      <p className="unlock-contact-highlight">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          <strong>One membership, every opportunity, unlocked</strong> — direct HR emails, official Google Forms,
          and application links, updated as new roles go live. Skip straight to applying instead of guessing.
        </span>
      </p>
      {paymentSuccess ? (
        <p className="unlock-contact-desc" style={{ fontWeight: 600 }}>
          🎉 Payment confirmed — you&apos;re ready to apply now! Loading your apply details...
        </p>
      ) : (
        <>
          <button className="btn btn-primary btn-sm" type="button" onClick={handleUnlock} disabled={isLoading}>
            {isLoading ? "Opening payment..." : `Unlock everything for ₹${price}/month`}
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
