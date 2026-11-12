"use client";

import { useState } from "react";

// Internal HR "Referrals" sign-up. Posts to app/api/internal/referral-profile,
// which emails the resume + contact details to the admin.
export default function ReferralProfileForm({
  defaultEmail,
  defaultMobile,
  defaultLinkedin = "",
  defaultGithub = "",
  defaultCoding = "",
  submittedAt,
}: {
  defaultEmail: string;
  defaultMobile: string;
  defaultLinkedin?: string;
  defaultGithub?: string;
  defaultCoding?: string;
  /** When they last shared their details (null = never). */
  submittedAt: string | null;
}) {
  const [done, setDone] = useState<string | null>(submittedAt);
  const [editing, setEditing] = useState(!submittedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const resume = fd.get("resume");
    if (!(resume instanceof File) || resume.size === 0) return setError("Please attach your resume.");
    if (resume.size > 4 * 1024 * 1024) return setError("Resume must be under 4 MB.");

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/internal/referral-profile", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "That didn't go through — please try again.");
        return;
      }
      setDone(data.submittedAt ?? new Date().toISOString());
      setEditing(false);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done && !editing) {
    const when = new Date(done).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return (
      <div className="referral-done">
        <p>
          <strong>✅ You&apos;re on the referral list.</strong> Shared on {when}. Whenever a company hires through
          referrals, our employees will refer you and we&apos;ll reach out on your email or mobile.
        </p>
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} type="button">
          Update resume / details
        </button>
      </div>
    );
  }

  return (
    <form className="referral-form" onSubmit={handleSubmit}>
      <label>
        <span>Email ID</span>
        <input autoComplete="email" defaultValue={defaultEmail} maxLength={160} name="email" required type="email" />
      </label>
      <label>
        <span>Mobile number</span>
        <input
          autoComplete="tel"
          defaultValue={defaultMobile}
          inputMode="numeric"
          maxLength={14}
          name="mobile"
          placeholder="10-digit mobile number"
          required
          type="tel"
        />
      </label>
      <label>
        <span>LinkedIn profile (optional)</span>
        <input
          defaultValue={defaultLinkedin}
          maxLength={200}
          name="linkedin"
          placeholder="https://linkedin.com/in/your-name"
          type="url"
        />
      </label>
      <label>
        <span>GitHub profile (optional)</span>
        <input
          defaultValue={defaultGithub}
          maxLength={200}
          name="github"
          placeholder="https://github.com/your-username"
          type="url"
        />
      </label>
      <label className="referral-form-wide">
        <span>Coding profile, if any (LeetCode, CodeChef, Codeforces, HackerRank…)</span>
        <input
          defaultValue={defaultCoding}
          maxLength={200}
          name="coding"
          placeholder="https://leetcode.com/u/your-username"
          type="url"
        />
      </label>
      <label className="referral-form-file">
        <span>Resume (PDF or Word, under 4 MB)</span>
        <input
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          name="resume"
          required
          type="file"
        />
      </label>
      {error && <p className="referral-form-error">{error}</p>}
      <div className="referral-form-actions">
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy ? "Sharing…" : done ? "Update my details" : "Share for referrals"}
        </button>
        {done && (
          <button className="btn btn-secondary" disabled={busy} onClick={() => setEditing(false)} type="button">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
