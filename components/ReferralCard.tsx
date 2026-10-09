"use client";

import { useState } from "react";

type Tier = { at: number; title: string; desc: string };

/** Dashboard "Refer & Earn": link, share, reward ladder, internship application. */
export default function ReferralCard({
  link,
  signups,
  freeMonthEvery,
  internshipAt,
  stipendInr,
  rewardsEarned,
  internshipStatus,
  defaultName,
}: {
  link: string;
  signups: number;
  freeMonthEvery: number;
  internshipAt: number;
  stipendInr: number;
  rewardsEarned: number;
  internshipStatus: string | null;
  defaultName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [applied, setApplied] = useState(Boolean(internshipStatus));

  const stipend = `₹${stipendInr.toLocaleString("en-IN")}/month`;
  const tiers: Tier[] = [
    { at: freeMonthEvery, title: "1 month Full Access free", desc: `Repeats every ${freeMonthEvery} friends.` },
    { at: internshipAt, title: "Growth Internship interview", desc: `1 month, remote · ${stipend} stipend if selected.` },
  ];
  const next = tiers.find((t) => signups < t.at) ?? null;
  const progressTarget = next?.at ?? internshipAt;
  const progressPct = Math.min(100, (signups / progressTarget) * 100);

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

  async function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/referrals/internship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const body = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (!response.ok) {
      setFormError(body.error ?? "Could not submit — please try again.");
      return;
    }
    setApplied(true);
    setShowForm(false);
  }

  const statusText: Record<string, string> = {
    applied: "Application received — we'll contact you for the interview.",
    interview: "Interview stage — check your email/phone.",
    selected: "Selected 🎉 — welcome to the team!",
    rejected: "Not selected this time — thank you for applying.",
    completed: "Internship completed.",
  };

  return (
    <section className="referral" aria-labelledby="referral-title">
      <div className="referral-top">
        <div>
          <p className="referral-eyebrow">Refer &amp; Earn</p>
          <h2 className="referral-title" id="referral-title">
            Invite friends — earn free access and an internship chance
          </h2>
          <p className="referral-sub">A friend counts as soon as they sign up with Google through your link — no purchase needed.</p>
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
          <input className="referral-link" id="referral-link" onFocus={(e) => e.target.select()} readOnly value={link} />
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

      <div className="referral-progress">
        <div className="referral-metric">
          <div className="referral-metric-row">
            <span>{next ? `Friends joined · next: ${next.title}` : "Friends joined with your link"}</span>
            <span className="referral-metric-value">
              {signups}
              <span> / {progressTarget}</span>
            </span>
          </div>
          <div aria-hidden="true" className="referral-bar">
            <span style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <ol className="referral-tiers">
        {tiers.map((tier) => {
          const done = signups >= tier.at;
          return (
            <li className={done ? "is-done" : ""} key={tier.at}>
              <span className="referral-tier-at">{done ? "✓" : tier.at}</span>
              <div className="referral-tier-body">
                <p className="referral-step-title">
                  {tier.at} friends join → {tier.title}
                </p>
                <p className="referral-step-desc">{tier.desc}</p>

                {tier.at === internshipAt && done && !applied && !showForm && (
                  <button className="referral-btn referral-btn-primary referral-tier-cta" onClick={() => setShowForm(true)} type="button">
                    Apply for the interview
                  </button>
                )}
                {tier.at === internshipAt && applied && (
                  <p className="referral-status">{statusText[internshipStatus ?? "applied"] ?? statusText.applied}</p>
                )}
                {tier.at === internshipAt && showForm && (
                  <form className="referral-form" onSubmit={apply}>
                    <input defaultValue={defaultName} name="fullName" placeholder="Full name" required />
                    <input inputMode="tel" name="phone" placeholder="Phone (WhatsApp)" required />
                    <input name="college" placeholder="College" required />
                    <input name="linkedin" placeholder="LinkedIn profile link (optional)" type="url" />
                    <textarea name="why" placeholder="Why do you want to join FirstOffer? (optional)" rows={3} />
                    {formError && <p className="referral-form-error">{formError}</p>}
                    <div className="referral-form-actions">
                      <button className="referral-btn referral-btn-primary" disabled={submitting} type="submit">
                        {submitting ? "Submitting…" : "Submit application"}
                      </button>
                      <button className="referral-btn referral-btn-outline" onClick={() => setShowForm(false)} type="button">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </li>
          );
        })}
        <li className={internshipStatus === "completed" ? "is-done" : ""}>
          <span className="referral-tier-at">{internshipStatus === "completed" ? "✓" : "★"}</span>
          <div className="referral-tier-body">
            <p className="referral-step-title">After the internship</p>
            <p className="referral-step-desc">
              LinkedIn recommendation from the founder + featured on FirstOffer.
            </p>
          </div>
        </li>
      </ol>

      <p className="referral-fine">
        Self-referrals and duplicate accounts are not counted. Reaching {internshipAt} gets you an interview — selection
        isn&apos;t guaranteed.
      </p>
    </section>
  );
}
