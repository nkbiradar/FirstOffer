"use client";

import { useState } from "react";
import type { ApplicationOutcome } from "@/types/supabase";

const OUTCOME_LABEL: Record<ApplicationOutcome, string> = {
  interview: "Got an interview",
  offer: "Got an offer",
  rejected: "Not selected",
  no_response: "No response yet",
};

const OUTCOME_BADGE_CLASS: Record<ApplicationOutcome, string> = {
  interview: "outcome-badge-interview",
  offer: "outcome-badge-offer",
  rejected: "outcome-badge-rejected",
  no_response: "outcome-badge-no_response",
};

const PROMPT_OPTIONS: { value: ApplicationOutcome; label: string }[] = [
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "no_response", label: "No response" },
];

// Sits below (not inside) OpportunityCard on /applications — the card is a
// single full-card <Link>, so a second interactive control has to live
// outside it rather than nested inside, same reasoning as ApplyTracker on
// the opportunity detail page. `eligibleForPrompt` is computed server-side
// (in app/applications/page.tsx, from applied_at) rather than with
// Date.now() in here, so the server-rendered and hydrated markup match —
// no client-only "3 days" math in the render path.
export default function OutcomeTracker({
  opportunityId,
  appliedLabel,
  initialOutcome,
  eligibleForPrompt,
}: {
  opportunityId: string;
  appliedLabel: string | null;
  initialOutcome: ApplicationOutcome | null;
  eligibleForPrompt: boolean;
}) {
  const [outcome, setOutcome] = useState(initialOutcome);
  const [editing, setEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setOutcomeValue(value: ApplicationOutcome) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/applications/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome: value }),
      });
      if (!response.ok) {
        setError("Couldn't save — try again.");
        return;
      }
      setOutcome(value);
      setEditing(false);
    } catch {
      setError("Network error — try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const showPrompt = editing || (!outcome && eligibleForPrompt);

  return (
    <div className="outcome-tracker">
      {appliedLabel && <span className="outcome-applied-label">Applied {appliedLabel}</span>}

      {outcome && !editing && (
        <button
          type="button"
          className={`outcome-badge ${OUTCOME_BADGE_CLASS[outcome]}`}
          onClick={() => setEditing(true)}
        >
          {OUTCOME_LABEL[outcome]}
          <span className="outcome-badge-edit">Change</span>
        </button>
      )}

      {showPrompt && (
        <div className="outcome-prompt">
          <span className="outcome-prompt-label">Did you hear back?</span>
          <div className="outcome-prompt-options">
            {PROMPT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="outcome-prompt-btn"
                disabled={isLoading}
                onClick={() => setOutcomeValue(option.value)}
              >
                {option.label}
              </button>
            ))}
            {editing && (
              <button type="button" className="outcome-prompt-cancel" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {error && <span className="apply-tracker-error">{error}</span>}
    </div>
  );
}
