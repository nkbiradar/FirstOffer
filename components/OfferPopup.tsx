"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Site-wide Full Access offer popup, shown to visitors who don't have full
// access (signed out, or signed in without it). app/layout.tsx decides
// eligibility on the server (never for members, admins or the Android
// app); this component only handles timing and UI.
// Shown once per browser session, within a second of the page loading.
// The countdown is to the real, announced price rise (lib/payments/razorpay.ts
// FULL_ACCESS_PRICE_RISE_AT) — when it passes, the timer disappears and the
// popup shows the new regular price.

const SEEN_KEY = "fo-offer-popup-seen";
const OPEN_DELAY_MS = 500;
// Pages where the popup would be in the way or redundant.
const HIDDEN_PREFIXES = ["/unlock", "/internal-openings", "/admin", "/login", "/signup", "/auth", "/payment", "/checkout"];

type Props = {
  price: number;
  nextPrice: number;
  risePending: boolean;
  riseAt: string; // ISO date
  riseLabel: string;
};

function timeLeft(endsAt: string) {
  const ms = Date.parse(endsAt) - Date.now();
  if (ms <= 0) return null;
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms % 86_400_000) / 3_600_000),
    m: Math.floor((ms % 3_600_000) / 60_000),
    s: Math.floor((ms % 60_000) / 1000),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function OfferPopup({ price, nextPrice, risePending, riseAt, riseLabel }: Props) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(() => (risePending ? timeLeft(riseAt) : null));
  const dialogRef = useRef<HTMLDivElement>(null);
  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));

  // Open once per session, half a second after load.
  useEffect(() => {
    if (hidden) return;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* storage blocked — still show once */
    }
    if (seen) return;
    const t = setTimeout(() => {
      setOpen(true);
      try {
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
    }, OPEN_DELAY_MS);
    return () => clearTimeout(t);
  }, [hidden]);

  // Esc to close, lock page scroll, focus the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Live countdown while open.
  useEffect(() => {
    if (!open || !risePending) return;
    const i = setInterval(() => setLeft(timeLeft(riseAt)), 1000);
    return () => clearInterval(i);
  }, [open, risePending, riseAt]);

  if (!open || hidden) return null;
  const counting = risePending && left !== null;
  const perDay = Math.max(1, Math.round(price / 90));

  return (
    <div className="offer-pop-backdrop" onClick={() => setOpen(false)} role="presentation">
      <div
        aria-labelledby="offer-pop-title"
        aria-modal="true"
        className="offer-pop"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <button aria-label="Close offer" className="offer-pop-close" onClick={() => setOpen(false)} type="button">
          <svg fill="none" height="22" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="22">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <p className="offer-pop-eyebrow">{counting ? `🔥 Limited offer · ends ${riseLabel}` : "FirstOffer Full Access"}</p>
        <h2 id="offer-pop-title">Apply directly. Get hired faster.</h2>
        <p className="offer-pop-sub">
          HR emails, recruiter numbers, Google Forms &amp; official apply links — for every opportunity on FirstOffer.
        </p>

        <div className="offer-pop-rule" />

        <div className="offer-pop-price">
          {counting && <span className="offer-pop-was">₹{nextPrice}</span>}
          <span className="offer-pop-now">₹{price}</span>
          {counting && <span className="offer-pop-off">{Math.round((1 - price / nextPrice) * 100)}% OFF</span>}
          <span className="offer-pop-period">for 3 months · just ₹{perDay}/day</span>
          {counting && <span className="offer-pop-next">Price becomes ₹{nextPrice} after {riseLabel}</span>}
        </div>

        <div className="offer-pop-rule" />

        <ul className="offer-pop-perks">
          <li>
            <b>2,000+</b>opportunities posted
          </li>
          <li>
            <b>Direct</b>HR contacts &amp; forms
          </li>
          <li>
            <b>Daily</b>fresh roles added
          </li>
        </ul>

        <a className="offer-pop-cta" href="/unlock" onClick={() => setOpen(false)}>
          {counting ? `Grab it for ₹${price}` : `Unlock for ₹${price}`}
        </a>

        {counting && left ? (
          <div className="offer-pop-countdown" aria-live="off">
            <span className="offer-pop-countdown-label">Offer ends in</span>
            <div className="offer-pop-countdown-boxes">
              {[
                [left.d, "days"],
                [left.h, "hrs"],
                [left.m, "min"],
                [left.s, "sec"],
              ].map(([v, l]) => (
                <span key={l as string}>
                  <b>{pad(v as number)}</b>
                  {l}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <button className="offer-pop-later" onClick={() => setOpen(false)} type="button">
          Maybe later
        </button>
      </div>
    </div>
  );
}
