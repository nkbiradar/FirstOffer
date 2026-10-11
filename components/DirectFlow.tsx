"use client";

import { useEffect, useRef, useState } from "react";

// Homepage "No middlemen" animation — a ~5 second story that plays once
// when it scrolls into view: Student → LIVE jobs → HR / company, with the
// four direct application channels floating in around the company node,
// then the tagline. Pure CSS animations (styles: ".dflow" in globals.css);
// this component only adds a class when the block becomes visible.
//
// Progressive enhancement: the server-rendered markup shows the finished
// state. Only after hydration does it arm (hide) the parts and then play
// them, so no-JS visitors, crawlers and reduced-motion users always see the
// complete, static graphic.

function StudentIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="30" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width="30">
      <path d="M22 9 12 4 2 9l10 5 10-5Z" strokeLinejoin="round" />
      <path d="M6 11v4.5c0 1.4 2.7 3 6 3s6-1.6 6-3V11" strokeLinecap="round" />
      <path d="M22 9v5" strokeLinecap="round" />
    </svg>
  );
}

function JobsIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="30" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width="30">
      <rect height="13" rx="2.5" width="18" x="3" y="7" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18" strokeLinecap="round" />
    </svg>
  );
}

function CompanyIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="30" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" width="30">
      <path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V21M15 10h3.5A1.5 1.5 0 0 1 20 11.5V21M2.5 21h19" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8h3M8 12h3M8 16h3" strokeLinecap="round" />
    </svg>
  );
}

const CHANNELS = [
  {
    label: "HR Email",
    icon: (
      <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="16">
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Google Form",
    icon: (
      <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="16">
        <rect height="18" rx="2" width="14" x="5" y="3" />
        <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "HR Contact",
    icon: (
      <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="16">
        <path
          d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 7 7l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Official Apply Link",
    icon: (
      <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="16">
        <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function DirectFlow() {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"static" | "armed" | "playing">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    setState("armed");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("playing");
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-label="How FirstOffer works: students connect directly to live jobs and the hiring company, with no middlemen"
      className={`dflow ${state === "armed" ? "is-armed" : ""} ${state === "playing" ? "is-playing" : ""}`}
      ref={ref}
    >
      <div aria-hidden="true" className="dflow-glow dflow-glow-a" />
      <div aria-hidden="true" className="dflow-glow dflow-glow-b" />

      <div className="dflow-track">
        <div className="dflow-node dflow-n1">
          <span className="dflow-orb">
            <StudentIcon />
          </span>
          <span className="dflow-text">
            <span className="dflow-label">You</span>
            <span className="dflow-sub">Fresher / student</span>
          </span>
        </div>

        <div aria-hidden="true" className="dflow-line dflow-l1">
          <span className="dflow-fill" />
          <span className="dflow-dot" />
        </div>

        <div className="dflow-node dflow-n2">
          <span className="dflow-orb dflow-orb-live">
            <JobsIcon />
            <span className="dflow-live">
              <i />
              LIVE
            </span>
          </span>
          <span className="dflow-text">
            <span className="dflow-label">Live jobs</span>
            <span className="dflow-sub">Fresh every day</span>
          </span>
        </div>

        <div aria-hidden="true" className="dflow-line dflow-l2">
          <span className="dflow-fill" />
          <span className="dflow-dot" />
        </div>

        <div className="dflow-node dflow-n3">
          <span className="dflow-orb dflow-orb-hr">
            <CompanyIcon />
          </span>
          <span className="dflow-text">
            <span className="dflow-label">HR &amp; company</span>
            <span className="dflow-sub">Apply at the source</span>
          </span>
        </div>

        <ul className="dflow-chips">
          {CHANNELS.map((c, i) => (
            <li className={`dflow-chip dflow-chip-${i + 1}`} key={c.label}>
              {c.icon}
              {c.label}
            </li>
          ))}
        </ul>
      </div>

      <p className="dflow-tagline">
        No Middlemen. <span>Just Direct Opportunities.</span>
      </p>
    </section>
  );
}
