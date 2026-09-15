"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";

// Small client island for /dashboard's "Site access" panel — the rest of
// that page is a server component, so cancellation (which needs a click
// handler) is split out here rather than making the whole dashboard a
// client component. Calls app/api/subscriptions/cancel/route.ts, which
// cancels at cycle end (access keeps working until the period already
// paid for ends) rather than instantly.
export default function CancelSubscriptionButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleCancel() {
    setIsLoading(true);
    setError(null);
    track("subscription_cancel_clicked");
    try {
      const response = await fetch("/api/subscriptions/cancel", { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Could not cancel. Try again.");
        setIsLoading(false);
        return;
      }
      track("subscription_cancelled");
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setIsLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button className="btn btn-secondary btn-sm" type="button" onClick={() => setConfirming(true)}>
        Cancel membership
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        You&apos;ll keep full access until the current period ends — no refund, no immediate cutoff.
      </p>
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
