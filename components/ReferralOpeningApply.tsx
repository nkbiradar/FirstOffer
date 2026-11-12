"use client";

import { useState } from "react";
import type { ReferralFields } from "@/lib/data/referral-openings";

// Field list is duplicated (labels only) from lib/data/referral-openings so this
// client bundle doesn't pull in the server-only Supabase admin client.
const FIELDS: { key: string; label: string; type: "url" | "text" | "textarea"; placeholder: string }[] = [
  { key: "linkedin", label: "LinkedIn profile", type: "url", placeholder: "https://linkedin.com/in/your-name" },
  { key: "github", label: "GitHub profile", type: "url", placeholder: "https://github.com/your-username" },
  { key: "coding", label: "Coding profile (LeetCode, CodeChef, Codeforces…)", type: "url", placeholder: "https://leetcode.com/u/your-username" },
  { key: "portfolio", label: "Portfolio / personal website", type: "url", placeholder: "https://your-site.com" },
  { key: "college", label: "College & graduation year", type: "text", placeholder: "IIIT Dharwad, 2026" },
  { key: "experience", label: "Experience / current status", type: "text", placeholder: "Fresher · 6-month internship at …" },
  { key: "notice", label: "Notice period / joining availability", type: "text", placeholder: "Immediate joiner" },
  { key: "notes", label: "Anything else for the referrer", type: "textarea", placeholder: "Skills, projects, why you fit this role…" },
];

export type ReferralOpeningCard = {
  id: string;
  company: string;
  role: string | null;
  location: string | null;
  details: string | null;
  apply_by: string | null;
  fields: ReferralFields;
};

export default function ReferralOpeningApply({
  opening,
  defaults,
  appliedAt,
}: {
  opening: ReferralOpeningCard;
  defaults: Record<string, string>;
  appliedAt: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(appliedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const asked = FIELDS.filter((f) => opening.fields?.[f.key as keyof ReferralFields]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const resume = fd.get("resume");
    if (!(resume instanceof File) || resume.size === 0) return setError("Please attach your resume.");
    if (resume.size > 4 * 1024 * 1024) return setError("Resume must be under 4 MB.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/internal/referral-openings/${opening.id}/apply`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "That didn't go through — please try again.");
      setDone(data.appliedAt ?? new Date().toISOString());
      setOpen(false);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const applyBy = opening.apply_by
    ? new Date(`${opening.apply_by}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : null;

  return (
    <div className="referral-opening">
      <div className="referral-opening-head">
        <div>
          <strong className="referral-opening-company">{opening.company}</strong>
          {(opening.role || opening.location) && (
            <span className="referral-opening-role">{[opening.role, opening.location].filter(Boolean).join(" · ")}</span>
          )}
        </div>
        {applyBy && <span className="referral-opening-deadline">Apply by {applyBy}</span>}
      </div>
      {opening.details && <p className="referral-opening-details">{opening.details}</p>}
      <p className="referral-opening-asks">
        Share: Resume, Email, Mobile
        {asked.map((f) => `, ${f.label.split(" (")[0]}${opening.fields[f.key as keyof ReferralFields] === "required" ? "" : " (optional)"}`).join("")}
      </p>

      {done && !open ? (
        <div className="referral-opening-done">
          <span>
            ✅ Applied on{" "}
            {new Date(done).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — we&apos;ll
            reach out once you&apos;re referred.
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setOpen(true)} type="button">
            Update details
          </button>
        </div>
      ) : !open ? (
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)} type="button">
          Apply for referral
        </button>
      ) : (
        <form className="referral-form" onSubmit={handleSubmit}>
          <label>
            <span>Email ID</span>
            <input autoComplete="email" defaultValue={defaults.email} maxLength={160} name="email" required type="email" />
          </label>
          <label>
            <span>Mobile number</span>
            <input
              autoComplete="tel"
              defaultValue={defaults.mobile}
              inputMode="numeric"
              maxLength={14}
              name="mobile"
              placeholder="10-digit mobile number"
              required
              type="tel"
            />
          </label>
          {asked.map((f) => {
            const required = opening.fields[f.key as keyof ReferralFields] === "required";
            const label = `${f.label}${required ? "" : " (optional)"}`;
            return f.type === "textarea" ? (
              <label className="referral-form-wide" key={f.key}>
                <span>{label}</span>
                <textarea maxLength={1500} name={f.key} placeholder={f.placeholder} required={required} rows={3} />
              </label>
            ) : (
              <label className={f.key === "coding" ? "referral-form-wide" : undefined} key={f.key}>
                <span>{label}</span>
                <input
                  defaultValue={defaults[f.key] ?? ""}
                  maxLength={200}
                  name={f.key}
                  placeholder={f.placeholder}
                  required={required}
                  type={f.type}
                />
              </label>
            );
          })}
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
              {busy ? "Sending…" : `Request referral at ${opening.company}`}
            </button>
            <button className="btn btn-secondary" disabled={busy} onClick={() => setOpen(false)} type="button">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
