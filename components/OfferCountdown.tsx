"use client";

import { useEffect, useState } from "react";

// Live "Offer ends in" countdown to a REAL deadline (the offer's end date in
// lib/payments/razorpay.ts). Renders nothing once the deadline has passed,
// and nothing on the server (avoids a hydration mismatch on the seconds).

function left(endsAt: string) {
  const ms = Date.parse(endsAt) - Date.now();
  if (ms <= 0) return null;
  return [
    [Math.floor(ms / 86_400_000), "days"],
    [Math.floor((ms % 86_400_000) / 3_600_000), "hrs"],
    [Math.floor((ms % 3_600_000) / 60_000), "mins"],
    [Math.floor((ms % 60_000) / 1000), "secs"],
  ] as const;
}

export default function OfferCountdown({ endsAt, label = "Offer ends in" }: { endsAt: string; label?: string }) {
  const [parts, setParts] = useState<ReturnType<typeof left> | undefined>(undefined);

  useEffect(() => {
    setParts(left(endsAt));
    const i = setInterval(() => setParts(left(endsAt)), 1000);
    return () => clearInterval(i);
  }, [endsAt]);

  if (parts === null) return null;
  return (
    <div className="fp-countdown" aria-live="off">
      <span className="fp-countdown-label">
        <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="16">
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2M9 2h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label}
      </span>
      <span className="fp-countdown-boxes">
        {(parts ?? [
          [0, "days"],
          [0, "hrs"],
          [0, "mins"],
          [0, "secs"],
        ]).map(([v, l]) => (
          <span key={l}>
            <b>{parts ? String(v).padStart(2, "0") : "--"}</b>
            {l}
          </span>
        ))}
      </span>
    </div>
  );
}
