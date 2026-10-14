"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Site-wide "special offer" popup for Internal HR, shown to visitors who
// don't have Internal HR access (signed out, or signed in without it).
// app/layout.tsx decides eligibility on the server (never for members,
// admins or the Android app); this component only handles timing and UI.
// Shown once per browser session, a few seconds after the page loads.

const SEEN_KEY = "fo-offer-popup-seen";
const OPEN_DELAY_MS = 1200;
// Pages where the popup would be in the way or redundant.
const HIDDEN_PREFIXES = ["/internal-openings", "/admin", "/login", "/signup", "/auth", "/payment", "/checkout"];

type Props = {
  price: number;
  regularPrice: number;
  saleActive: boolean;
  saleEndsAt: string; // ISO date
  saleEndLabel: string;
};

function timeLeft(endsAt: string) {
  const ms = Date.parse(endsAt) - Date.now();
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return { d, h, m, s };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function OfferPopup({ price, regularPrice, saleActive, saleEndsAt, saleEndLabel }: Props) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(() => (saleActive ? timeLeft(saleEndsAt) : null));
  const dialogRef = useRef<HTMLDivElement>(null);
  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));

  // Open once per session, after a short delay.
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

  // Esc to close, lock page scroll, focus the close button.
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
    if (!open || !saleActive) return;
    const i = setInterval(() => setLeft(timeLeft(saleEndsAt)), 1000);
    return () => clearInterval(i);
  }, [open, saleActive, saleEndsAt]);

  if (!open || hidden) return null;
  const onSale = saleActive && left !== null && price < regularPrice;

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

        <p className="offer-pop-eyebrow">{onSale ? "🪔 Dasara Special Offer" : "Members only"}</p>
        <h2 id="offer-pop-title">Internal HR Openings</h2>
        <p className="offer-pop-sub">
          Roles shared directly by HRs &amp; recruiters — earlier access and far fewer applicants than public job portals.
        </p>

        <div className="offer-pop-rule" />

        <div className="offer-pop-price">
          {onSale && <span className="offer-pop-was">₹{regularPrice}</span>}
          <span className="offer-pop-now">₹{price}</span>
          <span className="offer-pop-period">for 3 months · one-time payment</span>
        </div>

        <div className="offer-pop-rule" />

        <ul className="offer-pop-perks">
          <li>
            <b>Direct</b>HR-shared roles
          </li>
          <li>
            <b>Early</b>access to fresh openings
          </li>
          <li>
            <b>6</b>interview question kits (PDF)
          </li>
        </ul>

        <a className="offer-pop-cta" href="/internal-openings#unlock-internal-hr" onClick={() => setOpen(false)}>
          Unlock for ₹{price}
        </a>

        {onSale && left ? (
          <p className="offer-pop-timer" aria-live="off">
            Offer ends in{" "}
            <b>
              {left.d > 0 ? `${left.d}d ` : ""}
              {pad(left.h)}h {pad(left.m)}m {pad(left.s)}s
            </b>{" "}
            · till {saleEndLabel}
          </p>
        ) : null}
        <button className="offer-pop-later" onClick={() => setOpen(false)} type="button">
          Maybe later
        </button>
      </div>
    </div>
  );
}
