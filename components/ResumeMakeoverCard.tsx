"use client";

import { useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";

// Resume Makeover (app/resume/page.tsx) — included with Full Access since
// 13 Nov 2026; there is no separate payment any more.
//   • Full Access member → fills details + resume → POST /api/resume-review/member
//     (1 makeover per 3-month plan).
//   • Everyone else → "Included with Full Access" → /unlock.
//   • An old paid ₹199 order still waiting for its file (pendingOrderId) keeps
//     its upload step → POST /api/resume-review/upload.

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function ResumeMakeoverCard({
  isSignedIn,
  isMember,
  usedAt,
  userEmail,
  fullAccessPrice,
  pendingOrderId,
}: {
  isSignedIn: boolean;
  isMember: boolean;
  /** When this member last used their makeover in the current plan (null = available). */
  usedAt: string | null;
  userEmail: string | null;
  fullAccessPrice: number;
  pendingOrderId: string | null;
}) {
  const [done, setDone] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryEmail, setDeliveryEmail] = useState(userEmail ?? "");

  function pickFile(f: File | null) {
    setError(null);
    if (!f) return setFile(null);
    if (f.size > MAX_BYTES) {
      setFile(null);
      return setError("Please choose a file under 4 MB.");
    }
    if (!/\.(pdf|docx?)$/i.test(f.name)) {
      setFile(null);
      return setError("Please upload a PDF or Word (.doc / .docx) file.");
    }
    setFile(f);
  }

  async function send(url: string, fd: FormData) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "That didn't go through — please try again.");
      track("resume_makeover_submitted");
      setDone(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="resume-done" role="status">
        <span className="resume-done-icon" aria-hidden="true">✓</span>
        <h3>Got it! Your resume is with our team.</h3>
        <p>
          We&apos;ll send your rebuilt, ATS-ready resume to <strong>{deliveryEmail || userEmail}</strong> within 24
          hours. Keep an eye on your inbox (and spam folder).
        </p>
        <Link href="/opportunities" className="btn btn-secondary btn-sm">
          Browse openings meanwhile
        </Link>
      </div>
    );
  }

  // Legacy: someone who paid ₹199 earlier but never uploaded their file.
  if (pendingOrderId) {
    return (
      <div className="resume-form">
        <p className="resume-form-note">✅ Your earlier payment is confirmed. Just upload your current resume to finish.</p>
        <label className="resume-file">
          <input type="file" accept={ACCEPT} onChange={(e) => pickFile(e.target.files?.[0] ?? null)} disabled={busy} />
          <span>{file ? file.name : "Choose your resume (PDF or Word, max 4 MB)"}</span>
        </label>
        {error && <p className="resume-error">{error}</p>}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!file || busy}
          onClick={() => {
            if (!file) return;
            const fd = new FormData();
            fd.append("orderId", pendingOrderId);
            fd.append("resume", file);
            void send("/api/resume-review/upload", fd);
          }}
        >
          {busy ? "Uploading..." : "Send my resume"}
        </button>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="resume-form">
        <Link
          href={isSignedIn ? "/unlock" : `/login?next=${encodeURIComponent("/unlock")}`}
          className="btn btn-primary"
          onClick={() => track("resume_makeover_unlock_clicked")}
        >
          Get Full Access — ₹{fullAccessPrice}
        </Link>
        <p className="resume-form-note">
          Resume review by top MNC HRs and a 90% ATS-friendly resume built by our team are included free with Full
          Access (₹{fullAccessPrice} for 3 months), along with HR emails, recruiter numbers and apply links.
        </p>
      </div>
    );
  }

  if (usedAt) {
    return (
      <div className="resume-form">
        <p className="resume-form-note">
          ✅ You used your Resume Makeover on{" "}
          {new Date(usedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. It&apos;s 1
          makeover per 3-month plan — you get a new one when you renew.
        </p>
      </div>
    );
  }

  return (
    <form
      className="resume-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!file) return setError("Please attach your current resume.");
        const fd = new FormData(e.currentTarget);
        fd.set("resume", file);
        void send("/api/resume-review/member", fd);
      }}
    >
      <p className="resume-form-note">✅ Included in your Full Access plan — no payment needed.</p>
      <div className="resume-form-grid">
        <label>
          Full name *
          <input name="fullName" required maxLength={80} autoComplete="name" />
        </label>
        <label>
          Email to receive your new resume *
          <input
            name="email"
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            value={deliveryEmail}
            onChange={(e) => setDeliveryEmail(e.target.value)}
            placeholder="you@gmail.com"
          />
        </label>
        <label>
          WhatsApp / phone
          <input name="phone" maxLength={20} inputMode="tel" autoComplete="tel" placeholder="+91 98xxx xxxxx" />
        </label>
        <label>
          Role you&apos;re applying for *
          <input name="targetRole" required maxLength={100} placeholder="e.g. Data Analyst, SDE, Business Analyst" />
        </label>
        <label>
          Experience
          <select name="experienceLevel" defaultValue="Fresher">
            <option>Final-year student</option>
            <option>Fresher</option>
            <option>Less than 1 year</option>
            <option>1–2 years</option>
          </select>
        </label>
      </div>
      <label>
        Anything we should know? <span className="resume-optional">(optional)</span>
        <textarea name="notes" rows={2} maxLength={600} placeholder="e.g. Targeting MNCs, want to highlight my internship" />
      </label>
      <label className="resume-file">
        <input type="file" accept={ACCEPT} onChange={(e) => pickFile(e.target.files?.[0] ?? null)} required />
        <span>{file ? `📎 ${file.name}` : "📎 Attach your current resume (PDF or Word, max 4 MB)"}</span>
      </label>
      {error && <p className="resume-error">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Sending..." : "Send my resume"}
      </button>
    </form>
  );
}
