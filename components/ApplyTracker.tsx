"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Small "Mark as Applied" toggle on the opportunity detail page — separate
// from the actual apply link/button (ApplyButton in that page), which is
// unchanged. Signed-out visitors get sent to /login with a `next` back to
// this opportunity rather than the button silently doing nothing.
export default function ApplyTracker({
  opportunityId,
  initialApplied,
  isSignedIn,
}: {
  opportunityId: string;
  initialApplied: boolean;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [applied, setApplied] = useState(initialApplied);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (!isSignedIn) {
      router.push(`/login?next=${encodeURIComponent(`/opportunities/${opportunityId}`)}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = applied
        ? await fetch(`/api/applications/${opportunityId}`, { method: "DELETE" })
        : await fetch("/api/applications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ opportunityId }),
          });

      if (!response.ok) {
        setError("Couldn't update — try again.");
        return;
      }
      setApplied(!applied);
    } catch {
      setError("Network error — try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="apply-tracker">
      <button
        className={`btn btn-sm ${applied ? "btn-applied" : "btn-secondary"}`}
        type="button"
        onClick={toggle}
        disabled={isLoading}
      >
        {applied ? "✓ Applied" : "Mark as Applied"}
      </button>
      {error && <span className="apply-tracker-error">{error}</span>}
    </div>
  );
}
