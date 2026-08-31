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
// to apply" instructions are all hidden until the signed-in visitor pays
// once for platform access (see app/opportunities/[id]/page.tsx). Once
// unlocked, the real ApplyButton/apply instructions render in this same
// spot instead.
export default function UnlockContactCard({
  isSignedIn,
  price,
}: {
  isSignedIn: boolean;
  price: number;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  async function handleUnlock() {
    // Custom Vercel Analytics events — this is the site's entire revenue
    // funnel, so these five events are what let the "how many people who
    // click Unlock actually pay" question get answered from real data
    // instead of a guess. See rebuild-plan.md Step 19.
    track("unlock_clicked");

    if (!isSignedIn) {
      track("unlock_login_redirect");
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
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
        body: JSON.stringify({}),
      });
      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        track("order_create_failed", { error: orderData.error ?? "unknown" });
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
        description: "Full platform access",
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
            body: JSON.stringify(response),
          });
          if (verifyResponse.ok) {
            track("payment_succeeded", { price });
            router.refresh();
          } else {
            track("payment_verify_failed");
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
        track("payment_failed");
        setError("Payment failed — try again.");
        setIsLoading(false);
      });

      track("checkout_opened", { price });
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
        Premium
      </span>
      <p className="unlock-contact-title">Full access required</p>
      <p className="unlock-contact-desc">
        Pay ₹{price} once via UPI — unlock every company's application link, HR email, and contact on FirstOffer. All future opportunities included.
      </p>
      <p className="unlock-contact-highlight">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          <strong>One-time access</strong> — every HR email, apply link, and contact on FirstOffer. Unlocks every opportunity, now and future ones.
        </span>
      </p>
      <button className="btn btn-primary btn-sm" type="button" onClick={handleUnlock} disabled={isLoading}>
        {isLoading ? "Opening payment..." : `Get Full Access for ₹${price}`}
      </button>
      {error && <p className="unlock-contact-error">{error}</p>}
    </div>
  );
}
