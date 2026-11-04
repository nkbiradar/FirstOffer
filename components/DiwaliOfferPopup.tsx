"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Homepage-only Diwali offer popup (Full Access + Internal HR). The homepage
// decides eligibility on the server: only while the sale is running, never
// in the Android app, and a plan the visitor already owns is left out. This
// component handles timing and UI only: once per browser session, shortly
// after the page loads. Prices come from lib/payments/razorpay.ts.

const SEEN_KEY = "fo-diwali-popup-seen";
const OPEN_DELAY_MS = 900;

type Plan = { name: string; tagline: string; price: number; was?: number; href: string; cta: string; featured?: boolean };

type Props = { endsAt: string; endLabel: string; plans: Plan[] };

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

function Burst({ x, y, r, color, delay }: { x: number; y: number; r: number; color: string; delay: number }) {
  const rays = Array.from({ length: 12 }, (_, i) => (i * Math.PI * 2) / 12);
  return (
    <g className="dw-burst" style={{ animationDelay: `${delay}s`, transformOrigin: `${x}px ${y}px` }}>
      {rays.map((a, i) => (
        <line
          key={i}
          stroke={color}
          strokeLinecap="round"
          strokeWidth={2.2}
          x1={x + Math.cos(a) * r * 0.35}
          x2={x + Math.cos(a) * r}
          y1={y + Math.sin(a) * r * 0.35}
          y2={y + Math.sin(a) * r}
        />
      ))}
      {rays.map((a, i) => (
        <circle cx={x + Math.cos(a + 0.26) * r * 0.75} cy={y + Math.sin(a + 0.26) * r * 0.75} fill={color} key={`d${i}`} r={1.6} />
      ))}
    </g>
  );
}

function Diya({ x, delay }: { x: number; delay: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <ellipse className="dw-glow" cx={0} cy={118} fill="url(#dwGlow)" rx={22} ry={14} style={{ animationDelay: `${delay}s` }} />
      <path className="dw-flame" d="M0 100 C 5 108, 5 114, 0 118 C -5 114, -5 108, 0 100 Z" fill="url(#dwFlame)" style={{ animationDelay: `${delay}s` }} />
      <path d="M-18 120 Q 0 140 18 120 Z" fill="url(#dwDiya)" />
      <path d="M-18 120 L 18 120" stroke="#fcd34d" strokeWidth={1.5} />
    </g>
  );
}

function Art() {
  return (
    <svg aria-hidden="true" className="dw-art" preserveAspectRatio="xMidYMid slice" viewBox="0 0 520 150">
      <defs>
        <linearGradient id="dwSky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1e1033" />
          <stop offset="1" stopColor="#0f0a1a" />
        </linearGradient>
        <radialGradient id="dwGlow">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dwFlame" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="dwDiya" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#9a3412" />
        </linearGradient>
      </defs>
      <rect fill="url(#dwSky)" height="150" width="520" />
      {[
        [40, 30], [120, 14], [205, 40], [300, 18], [380, 46], [470, 22], [90, 70], [450, 80], [255, 70], [500, 60], [20, 90],
      ].map(([cx, cy], i) => (
        <circle className="dw-star" cx={cx} cy={cy} fill="#fde68a" key={i} r={1.3} style={{ animationDelay: `${(i % 5) * 0.4}s` }} />
      ))}
      <Burst color="#f472b6" delay={0} r={34} x={78} y={46} />
      <Burst color="#fbbf24" delay={0.7} r={42} x={258} y={38} />
      <Burst color="#60a5fa" delay={1.3} r={30} x={430} y={50} />
      <Burst color="#34d399" delay={1.9} r={22} x={170} y={74} />
      <Burst color="#fb923c" delay={2.5} r={24} x={352} y={80} />
      <text fill="url(#dwFlame)" fontFamily="Georgia, 'Times New Roman', serif" fontSize="26" fontStyle="italic" fontWeight="700" textAnchor="middle" x="260" y="128">
        Happy Diwali
      </text>
      <Diya delay={0} x={60} />
      <Diya delay={0.4} x={160} />
      <Diya delay={0.8} x={360} />
      <Diya delay={1.2} x={460} />
    </svg>
  );
}

export default function DiwaliOfferPopup({ endsAt, endLabel, plans }: Props) {
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(() => timeLeft(endsAt));
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* storage blocked — still show once */
    }
    if (seen || !timeLeft(endsAt)) return;
    const t = setTimeout(() => {
      setOpen(true);
      try {
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
    }, OPEN_DELAY_MS);
    return () => clearTimeout(t);
  }, [endsAt]);

  useEffect(() => {
    if (!open) return;
    const tick = setInterval(() => setLeft(timeLeft(endsAt)), 1000);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      clearInterval(tick);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, endsAt]);

  if (!open || !left) return null;
  const close = () => setOpen(false);

  return (
    <div className="dw-overlay" onClick={close} role="presentation">
      <div
        aria-labelledby="dw-title"
        aria-modal="true"
        className="dw-card"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <button aria-label="Close offer" className="dw-close" onClick={close} type="button">
          ×
        </button>
        <Art />
        <div className="dw-body">
          <span className="dw-eyebrow">🪔 Special Diwali Offer · ends {endLabel}</span>
          <h2 id="dw-title">
            Light up your <span>job search</span> this Diwali
          </h2>
          <p className="dw-sub">Apply directly to real HRs. One-time payment, no auto-debit.</p>

          <div aria-label="Time left in the offer" className="dw-timer">
            {[
              [left.d, "days"],
              [left.h, "hrs"],
              [left.m, "mins"],
              [left.s, "secs"],
            ].map(([v, l]) => (
              <span key={l as string}>
                <b>{pad(v as number)}</b>
                <small>{l}</small>
              </span>
            ))}
          </div>

          <div className="dw-plans">
            {plans.map((p) => {
              const off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0;
              return (
                <Link className={`dw-plan${p.featured ? " dw-plan-featured" : ""}`} href={p.href} key={p.name} onClick={close}>
                  {p.featured && <span className="dw-badge">Most popular</span>}
                  <span className="dw-plan-name">{p.name}</span>
                  <span className="dw-plan-tag">{p.tagline}</span>
                  <span className="dw-price">
                    <b>₹{p.price}</b>
                    {p.was ? <s>₹{p.was}</s> : null}
                    {off > 0 && <em>{off}% OFF</em>}
                  </span>
                  <span className="dw-plan-cta">{p.cta} →</span>
                </Link>
              );
            })}
          </div>

          <button className="dw-later" onClick={close} type="button">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
