"use client";

import { useState } from "react";

/** Dashboard "Refer & Earn" card: link, copy/share, how it works, progress. */
export default function ReferralCard({
  link,
  signups,
  paid,
  signupsRequired,
  paidRequired,
  rewardsEarned,
}: {
  link: string;
  signups: number;
  paid: number;
  signupsRequired: number;
  paidRequired: number;
  rewardsEarned: number;
}) {
  const [copied, setCopied] = useState(false);

  // Progress toward the NEXT free month.
  const signupsShown = Math.max(0, Math.min(signups - rewardsEarned * signupsRequired, signupsRequired));
  const paidShown = Math.max(0, Math.min(paid - rewardsEarned * paidRequired, paidRequired));

  const shareText =
    `I'm using FirstOffer to find fresher jobs — new internships and off-campus openings every day, ` +
    `with direct HR emails and Google Forms. Sign up free: ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your link:", link);
    }
  }

  const steps = [
    { title: "Share your link", desc: "Send it to friends who are looking for jobs." },
    { title: `${signupsRequired} friends sign up`, desc: "They create a free account with Google." },
    { title: `${paidRequired} of them get Full Access`, desc: "Your free month is added automatically." },
  ];

  return (
    <section className="referral" aria-labelledby="referral-title">
      <div className="referral-top">
        <div>
          <p className="referral-eyebrow">Refer &amp; Earn</p>
          <h2 className="referral-title" id="referral-title">
            Invite friends, get 1 month of Full Access free
          </h2>
          <p className="referral-sub">Earn another free month every time you complete the goal again.</p>
        </div>
        {rewardsEarned > 0 && (
          <span className="referral-earned-pill">
            {rewardsEarned} free month{rewardsEarned > 1 ? "s" : ""} earned
          </span>
        )}
      </div>

      <div className="referral-field">
        <label className="referral-label" htmlFor="referral-link">
          Your referral link
        </label>
        <div className="referral-link-row">
          <input
            className="referral-link"
            id="referral-link"
            onFocus={(e) => e.target.select()}
            readOnly
            value={link}
          />
          <button className="referral-btn referral-btn-primary" onClick={copy} type="button">
            {copied ? "Copied" : "Copy"}
          </button>
          <a
            className="referral-btn referral-btn-outline"
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16" fill="#25D366">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.1.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </div>

      <ol className="referral-steps">
        {steps.map((step, i) => (
          <li key={step.title}>
            <span className="referral-step-num">{i + 1}</span>
            <div>
              <p className="referral-step-title">{step.title}</p>
              <p className="referral-step-desc">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="referral-progress">
        <div className="referral-metric">
          <div className="referral-metric-row">
            <span>Friends signed up</span>
            <span className="referral-metric-value">
              {signupsShown}
              <span> / {signupsRequired}</span>
            </span>
          </div>
          <div aria-hidden="true" className="referral-bar">
            <span style={{ width: `${(signupsShown / signupsRequired) * 100}%` }} />
          </div>
        </div>
        <div className="referral-metric">
          <div className="referral-metric-row">
            <span>Friends with Full Access</span>
            <span className="referral-metric-value">
              {paidShown}
              <span> / {paidRequired}</span>
            </span>
          </div>
          <div aria-hidden="true" className="referral-bar">
            <span style={{ width: `${(paidShown / paidRequired) * 100}%` }} />
          </div>
        </div>
      </div>

      <p className="referral-fine">
        Only new accounts created through your link count. Self-referrals and duplicate accounts are not counted.
      </p>
    </section>
  );
}
