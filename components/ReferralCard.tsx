"use client";

import { useState } from "react";

/** Dashboard "Refer & Earn" card: link, copy/share buttons, progress. */
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
  const signupsNow = signups - rewardsEarned * signupsRequired;
  const paidNow = paid - rewardsEarned * paidRequired;
  const signupsShown = Math.max(0, Math.min(signupsNow, signupsRequired));
  const paidShown = Math.max(0, Math.min(paidNow, paidRequired));

  const shareText =
    `Hey! I'm using FirstOffer to find fresher jobs — new internships & off-campus openings daily with direct HR emails and Google Forms. ` +
    `Sign up free with my link: ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your link:", link);
    }
  }

  return (
    <section className="referral-card">
      <div className="referral-head">
        <span className="referral-badge">🎁 Refer &amp; Earn</span>
        <h2 className="referral-title">Get 1 month of Full Access free</h2>
        <p className="referral-sub">
          Invite <strong>{signupsRequired} friends</strong> with your link. When <strong>{paidRequired} of them</strong>{" "}
          buy Full Access, your free month is added automatically. Do it again for another month.
        </p>
      </div>

      <div className="referral-link-row">
        <input aria-label="Your referral link" className="referral-link" readOnly value={link} onFocus={(e) => e.target.select()} />
        <button className="btn btn-primary btn-sm" onClick={copy} type="button">
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        <a
          className="btn btn-sm referral-wa"
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          Share on WhatsApp
        </a>
      </div>

      <div className="referral-progress">
        <div>
          <div className="referral-progress-label">
            <span>Friends signed up</span>
            <strong>
              {signupsShown} / {signupsRequired}
            </strong>
          </div>
          <div className="referral-bar">
            <span style={{ width: `${(signupsShown / signupsRequired) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="referral-progress-label">
            <span>Friends who bought Full Access</span>
            <strong>
              {paidShown} / {paidRequired}
            </strong>
          </div>
          <div className="referral-bar referral-bar-paid">
            <span style={{ width: `${(paidShown / paidRequired) * 100}%` }} />
          </div>
        </div>
      </div>

      {rewardsEarned > 0 && (
        <p className="referral-earned">
          🎉 You&apos;ve earned {rewardsEarned} free month{rewardsEarned > 1 ? "s" : ""} so far — already added to your
          account.
        </p>
      )}
      <p className="referral-fine">
        Only new accounts that sign up with Google through your link count. Your own accounts don&apos;t count.
      </p>
    </section>
  );
}
