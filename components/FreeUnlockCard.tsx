"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";

// "🎁 Your first unlock is free" — shown on an opportunity's detail page
// above the paid unlock card, for anyone who hasn't spent their one free
// unlock yet (signed-out visitors are sent to sign in first). Spending it
// calls app/api/free-unlock, then refreshes so the real apply details
// (Google Form / HR email / link) render in place of this card.
export default function FreeUnlockCard({
  opportunityId,
  isSignedIn,
}: {
  opportunityId: string;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function useFreeUnlock() {
    setBusy(true);
    setError(null);
    track("free_unlock_clicked", { opportunityId });
    try {
      const res = await fetch("/api/free-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't unlock — please try again.");
        setBusy(false);
        return;
      }
      track("free_unlock_used", { opportunityId });
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="free-unlock-card">
      <span className="free-unlock-gift" aria-hidden="true">🎁</span>
      <div className="free-unlock-body">
        <p className="free-unlock-title">Your first unlock is on us</p>
        <p className="free-unlock-sub">
          See the real Google Form, HR email or apply link for this job — free, no payment. One free unlock per
          account, so pick a job you really want.
        </p>
        {isSignedIn ? (
          <button type="button" className="btn btn-primary btn-sm free-unlock-btn" onClick={useFreeUnlock} disabled={busy}>
            {busy ? "Unlocking..." : "Use my free unlock on this job"}
          </button>
        ) : (
          <Link
            className="btn btn-primary btn-sm free-unlock-btn"
            href={`/login?next=${encodeURIComponent(`/opportunities/${opportunityId}`)}`}
            onClick={() => track("free_unlock_signin_clicked", { opportunityId })}
          >
            Sign in free to unlock this job
          </Link>
        )}
        {error && <p className="free-unlock-error">{error}</p>}
      </div>
    </div>
  );
}
