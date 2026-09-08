"use client";

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

// Shown in place of every apply route on the opportunity detail page —
// application link, Google Form, HR email/contact, and the free-text "how
// to apply" instructions are all hidden until the signed-in visitor makes
// ONE ₹49 payment (see app/opportunities/[id]/page.tsx). That single
// payment unlocks apply details on every opportunity site-wide, forever —
// not just this one. Once unlocked, the real ApplyButton/apply
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
  // Payment confirmation is currently reconciled by hand on the backend, so
  // access doesn't flip the instant Razorpay confirms — set expectations up
  // front instead of letting the visitor think the payment failed when the
  // page doesn't unlock immediately after paying.
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  async function handleUnlock() {
    // Custom Vercel Analytics events — this is the site's entire revenue
    // funnel, so these five events are what let the "how many people who
    // click Unlock actually pay" question get answered from real data
    // instead of a guess. See rebuild-plan.md Step 19.
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
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId }),
      });
      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        track("order_create_failed", { opportunityId, error: orderData.error ?? "unknown" });
        setError(orderData.error ?? "Could not start payment.");
        setIsLoading(false);
        return;
      }

      if (orderData.alreadyUnlocked) {
        router.refresh();
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "FirstOffer",
        description: "One-time unlock — full site access",
        method: {
          upi: true,
          card: false,
          netbanking: false,
          wallet: false,
          paylater: false,
          emi: false,
        },
        handler: async (response: RazorpaySuccessResponse) => {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, opportunityId }),
          });
          if (verifyResponse.ok) {
            track("payment_succeeded", { opportunityId, price });
            setPaymentSuccess(true);
            router.refresh();
          } else {
            track("payment_verify_failed", { opportunityId });
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
        track("payment_failed", { opportunityId });
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
        One-Time Unlock
      </span>
      <p className="unlock-contact-title">How to apply is locked</p>
      <p className="unlock-contact-desc" style={{ fontWeight: 700 }}>
        Only one-time payment. Lifetime access.
      </p>
      <p className="unlock-contact-desc">
        Pay ₹{price} once via UPI to unlock apply details on this opportunity — and every other opportunity on
        FirstOffer, for good.
      </p>
      <p className="unlock-contact-highlight">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          <strong>One payment, full access forever</strong> — direct HR emails, official Google Forms, and
          application links on every listing. No repeat charges.
        </span>
      </p>
      {paymentSuccess ? (
        <p className="unlock-contact-desc" style={{ fontWeight: 600 }}>
          ✅ Payment received! Your apply access will be activated within 6 hours — please check back and refresh
          this page after that.
        </p>
      ) : (
        <>
          <button className="btn btn-primary btn-sm" type="button" onClick={handleUnlock} disabled={isLoading}>
            {isLoading ? "Opening payment..." : `Unlock everything for ₹${price}`}
          </button>
          <p className="unlock-contact-desc" style={{ fontSize: 12, opacity: 0.75 }}>
            Note: Apply access is activated within 6 hours of payment — it may not unlock instantly.
          </p>
        </>
      )}
      {error && <p className="unlock-contact-error">{error}</p>}
    </div>
  );
}
