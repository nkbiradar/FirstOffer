"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";

type Product = "full_access" | "internal_hr";

const CONFIRM_COPY: Record<Product, string> = {
  full_access:
    "You'll keep full access until the current period ends — no refund, no immediate cutoff.",
  internal_hr:
    "You'll keep access to Internal HR Openings until the current period ends — no refund, no immediate cutoff.",
};

const LABEL_COPY: Record<Product, string> = {
  full_access: "Cancel membership",
  internal_hr: "Cancel Internal HR Openings",
};

// Small client island for /dashboard's subscription panels — the rest of
// that page is a server component, so cancellation (which needs a click
// handler) is split out here rather than making the whole dashboard a
// client component. Calls app/api/subscriptions/cancel/route.ts with the
// given `product` (defaults to "full_access"), which cancels at cycle end
// (access keeps working until the period already paid for ends) rather
// than instantly. Reused as-is for both the ₹49/month full-access panel
// and the ₹39/month Internal HR Openings panel — cancelling one never
// touches the other, since each is its own row in `subscriptions`.
export default function CancelSubscriptionButton({
  product = "full_access",
}: {
  product?: Product;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleCancel() {
    setIsLoading(true);
    setError(null);
    track("subscription_cancel_clicked", { product });
    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Could not cancel. Try again.");
        setIsLoading(false);
        return;
      }
      track("subscription_cancelled", { product });
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setIsLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button className="btn btn-secondary btn-sm" type="button" onClick={() => setConfirming(true)}>
        {LABEL_COPY[product]}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
      <p style={{ fontSize: 13, opacity: 0.8 }}>{CONFIRM_COPY[product]}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-secondary btn-sm" type="button" onClick={handleCancel} disabled={isLoading}>
          {isLoading ? "Cancelling..." : "Yes, cancel"}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isLoading}
          style={{ opacity: 0.75 }}
        >
          Keep membership
        </button>
      </div>
      {error && <p className="unlock-contact-error">{error}</p>}
    </div>
  );
}
