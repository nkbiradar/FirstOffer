"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

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

// Shown in place of the raw HR Email/HR Contact lines on the opportunity
// detail page when the signed-in visitor hasn't paid to reveal them yet
// (see app/opportunities/[id]/page.tsx). Does not touch the main "Apply
// Now" button/logic at all — that's unchanged and still works exactly as
// before, including its mailto: fallback when HR email is an opportunity's
// only apply route.
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
    if (!isSignedIn) {
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
        description: "Unlock HR contact info",
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
            router.refresh();
          } else {
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
        setError("Payment failed — try again.");
        setIsLoading(false);
      });

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
      <p className="unlock-contact-title">HR contact details are locked</p>
      <p className="unlock-contact-desc">Pay ₹{price} via UPI to reveal the direct HR email/contact for this opportunity.</p>
      <button className="btn btn-primary btn-sm" type="button" onClick={handleUnlock} disabled={isLoading}>
        {isLoading ? "Opening payment..." : `Unlock for ₹${price}`}
      </button>
      {error && <p className="unlock-contact-error">{error}</p>}
    </div>
  );
}
