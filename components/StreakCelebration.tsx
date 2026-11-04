"use client";

import { useCallback, useEffect, useState } from "react";
import { STREAK_EVENT, type StreakState } from "@/lib/streak-events";

// One-time "🔥 7-day streak!" moment when a student's apply streak reaches
// 3, 7, 14 or 30 days — on the day they hit it, once per milestone.
const MILESTONES = [3, 7, 14, 30];
const COPY: Record<number, string> = {
  3: "Three days in a row — you're building the habit that gets interview calls.",
  7: "You've applied every day for a week. Students who apply consistently get more interview calls — keep going.",
  14: "Two weeks of daily applying. That's real consistency — your next call could be any day now.",
  30: "A full month of daily applying. Seriously impressive — keep that momentum.",
};
const SITE = "https://www.firstoffer.online";

function todayKey() {
  return new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
}

export default function StreakCelebration({ initial }: { initial: StreakState }) {
  const [shown, setShown] = useState<number | null>(null);

  const consider = useCallback((s: StreakState) => {
    if (!s.appliedToday || !MILESTONES.includes(s.current)) return;
    const key = `fo-streak-cel-${s.current}-${todayKey()}`;
    try {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, "1");
    } catch {
      /* storage blocked — still celebrate once this visit */
    }
    setShown(s.current);
  }, []);

  useEffect(() => {
    consider(initial);
    const on = (e: Event) => consider((e as CustomEvent<StreakState>).detail);
    window.addEventListener(STREAK_EVENT, on);
    return () => window.removeEventListener(STREAK_EVENT, on);
  }, [consider, initial]);

  useEffect(() => {
    if (shown === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShown(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shown]);

  if (shown === null) return null;
  const text = `🔥 I've applied to jobs ${shown} days in a row on FirstOffer — fresher jobs & internships with direct HR emails and apply links. Check it out: ${SITE}`;

  return (
    <div className="sc-overlay" onClick={() => setShown(null)} role="presentation">
      <div aria-labelledby="sc-title" aria-modal="true" className="sc-card" onClick={(e) => e.stopPropagation()} role="dialog">
        <div aria-hidden="true" className="sc-flame">
          🔥
        </div>
        <h2 id="sc-title">{shown}-day streak!</h2>
        <p>{COPY[shown]}</p>
        <a
          className="sc-share"
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          onClick={() => setShown(null)}
          rel="noopener noreferrer"
          target="_blank"
        >
          Share on WhatsApp
        </a>
        <button className="sc-close" onClick={() => setShown(null)} type="button">
          Continue
        </button>
      </div>
    </div>
  );
}
