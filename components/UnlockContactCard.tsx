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
// to unlock (see app/opportunities/[id]/page.tsx). Once unlocked, the real
// ApplyButton/apply instructions render in this same spot instead.
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
        description: "Unlock application details",
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
        Premium
      </span>
      <p className="unlock-contact-title">How to apply is locked</p>
      <p className="unlock-contact-desc">
        Pay ₹{price} via UPI to unlock the application link, Google Form, and HR email/contact for this opportunity.
      </p>
      <button className="btn btn-primary btn-sm" type="button" onClick={handleUnlock} disabled={isLoading}>
        {isLoading ? "Opening payment..." : `Unlock for ₹${price}`}
      </button>
      {error && <p className="unlock-contact-error">{error}</p>}
    </div>
  );
}
