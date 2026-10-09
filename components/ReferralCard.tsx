"use client";

import { useState } from "react";

type ClaimKind = "profile_push" | "goodies";
type FormKind = ClaimKind | "internship";

/** Dashboard "Refer & Earn": link, share, reward ladder, reward claims. */
export default function ReferralCard({
  link,
  signups,
  freeMonthEvery,
  profilePushAt,
  internshipAt,
  goodiesAt,
  rewardsEarned,
  internshipStatus,
  claims,
  defaultName,
}: {
  link: string;
  signups: number;
  freeMonthEvery: number;
  profilePushAt: number;
  internshipAt: number;
  goodiesAt: number;
  rewardsEarned: number;
  internshipStatus: string | null;
  claims: Partial<Record<ClaimKind, "pending" | "done">>;
  defaultName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [openForm, setOpenForm] = useState<FormKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<Partial<Record<FormKind, string>>>({
    ...claims,
    ...(internshipStatus ? { internship: internshipStatus } : {}),
  });

  const milestones = [freeMonthEvery, profilePushAt, internshipAt, goodiesAt].sort((a, b) => a - b);
  const nextAt = milestones.find((m) => signups < m) ?? null;
  const progressTarget = nextAt ?? goodiesAt;
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

  async function submit(kind: FormKind, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const url = kind === "internship" ? "/api/referrals/internship" : "/api/referrals/claim";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kind === "internship" ? data : { ...data, kind }),
    });
    const body = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (!response.ok) {
      setFormError(body.error ?? "Could not submit — please try again.");
      return;
    }
    setClaimed((c) => ({ ...c, [kind]: kind === "internship" ? "applied" : "pending" }));
    setOpenForm(null);
  }

  const internshipText: Record<string, string> = {
    applied: "Application received — we'll contact you for the interview.",
    interview: "Interview stage — check your email/phone.",
    selected: "Selected — welcome to the team!",
    rejected: "Not selected this time — thank you for applying.",
    completed: "Internship completed.",
  };
  const claimText: Record<ClaimKind, Record<string, string>> = {
    profile_push: {
      pending: "Request received — we'll share your profile and update you.",
      done: "Your profile has been shared with 5 hiring companies.",
    },
    goodies: { pending: "Claim received — we'll ship your goodies soon.", done: "Goodies shipped." },
  };

  function renderForm(kind: FormKind) {
    return (
      <form className="referral-form" onSubmit={(e) => submit(kind, e)}>
        <input defaultValue={defaultName} name="fullName" placeholder="Full name" required />
        <input inputMode="tel" name="phone" placeholder="Phone (WhatsApp)" required />
        {kind === "profile_push" && (
          <>
            <input name="targetRole" placeholder="Target role (e.g. Software Engineer, Data Analyst)" required />
            <input name="resumeUrl" placeholder="Resume link (Google Drive, viewable by anyone)" required type="url" />
            <input name="linkedin" placeholder="LinkedIn profile link (optional)" type="url" />
          </>
        )}
        {kind === "internship" && (
          <>
            <input name="college" placeholder="College" required />
            <input name="linkedin" placeholder="LinkedIn profile link (optional)" type="url" />
            <textarea name="why" placeholder="Why do you want to join FirstOffer? (optional)" rows={3} />
          </>
        )}
        {kind === "goodies" && (
          <>
            <textarea name="address" placeholder="Full delivery address" required rows={3} />
            <input inputMode="numeric" maxLength={6} name="pincode" placeholder="Pincode" required />
            <select defaultValue="M" name="tshirtSize">
              <option value="S">T-shirt size: S</option>
              <option value="M">T-shirt size: M</option>
              <option value="L">T-shirt size: L</option>
              <option value="XL">T-shirt size: XL</option>
              <option value="XXL">T-shirt size: XXL</option>
            </select>
          </>
        )}
        {formError && <p className="referral-form-error">{formError}</p>}
        <div className="referral-form-actions">
          <button className="referral-btn referral-btn-primary" disabled={submitting} type="submit">
            {submitting ? "Submitting…" : "Submit"}
          </button>
          <button className="referral-btn referral-btn-outline" onClick={() => setOpenForm(null)} type="button">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  function renderAction(kind: FormKind, at: number, label: string) {
    const status = claimed[kind];
    if (status) {
      const text =
        kind === "internship" ? internshipText[status] ?? internshipText.applied : claimText[kind][status];
      return <p className="referral-status">{text}</p>;
    }
    if (signups < at) return null;
    if (openForm === kind) return renderForm(kind);
    return (
      <button
        className="referral-btn referral-btn-primary referral-tier-cta"
        onClick={() => {
          setFormError(null);
          setOpenForm(kind);
        }}
        type="button"
      >
        {label}
      </button>
    );
  }

  const tiers = [
    {
      at: freeMonthEvery,
      title: "1 month Full Access free",
      desc: `Added automatically. Repeats every ${freeMonthEvery} friends.`,
      action: null,
    },
    {
      at: profilePushAt,
      title: "Your profile pushed to 5 hiring companies",
      desc: "FirstOffer shares your resume directly with 5 companies that are hiring for your role.",
      action: renderAction("profile_push", profilePushAt, "Submit your profile"),
    },
    {
      at: internshipAt,
      title: "Growth Internship interview + FirstOffer goodies",
      desc: "1 month, remote — work with the FirstOffer team. Plus a FirstOffer goodies pack.",
      action: (
        <div className="referral-actions-stack">
          {renderAction("internship", internshipAt, "Apply for the interview")}
          {renderAction("goodies", goodiesAt, "Claim your goodies")}
        </div>
      ),
    },
  ];

  return (
    <section aria-labelledby="referral-title" className="referral">
      <div className="referral-top">
        <div>
          <p className="referral-eyebrow">Refer &amp; Earn</p>
          <h2 className="referral-title" id="referral-title">
            Invite friends — get free access, a profile push to hiring companies and more
          </h2>
          <p className="referral-sub">
            A friend counts as soon as they sign up with Google through your link — no purchase needed.
          </p>
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
            <svg aria-hidden="true" fill="#25D366" height="16" viewBox="0 0 24 24" width="16">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.1.3.7 1.2 1.5 1.9 1 .9 1.9 1.2 2.2 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />
            </svg>
            WhatsApp
          </a>
        </div>
      </div>

      <div className="referral-progress">
        <div className="referral-metric">
          <div className="referral-metric-row">
            <span>{nextAt ? `Friends joined · next reward at ${nextAt}` : "Friends joined with your link"}</span>
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
                {tier.action}
              </div>
            </li>
          );
        })}
        <li className={claimed.internship === "completed" ? "is-done" : ""}>
          <span className="referral-tier-at">{claimed.internship === "completed" ? "✓" : "★"}</span>
          <div className="referral-tier-body">
            <p className="referral-step-title">After the internship</p>
            <p className="referral-step-desc">LinkedIn recommendation from the founder + featured on FirstOffer.</p>
          </div>
        </li>
      </ol>

      <p className="referral-fine">
        Only new accounts created through your link count; self-referrals and duplicate accounts are removed. A profile
        push shares your resume with hiring companies — it doesn&apos;t guarantee an interview. Reaching {internshipAt}{" "}
        gets you an interview; selection isn&apos;t guaranteed.
      </p>
    </section>
  );
}
