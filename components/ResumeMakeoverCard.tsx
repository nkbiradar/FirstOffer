"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { track } from "@vercel/analytics";

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

// Resume Makeover checkout (app/resume/page.tsx). Flow:
//   1. student fills details + picks their resume file
//   2. POST /api/resume-review/create → Razorpay Checkout
//   3. POST /api/resume-review/verify → order marked 'paid'
//   4. POST /api/resume-review/upload → resume emailed to the admin
// If step 4 fails (or the tab was closed after paying), the page passes
// `pendingOrderId` back in and this card shows just the upload step.
// The Window.Razorpay type is declared globally in UnlockContactCard.tsx.

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type Stage = "form" | "upload" | "done";

export default function ResumeMakeoverCard({
  isSignedIn,
  userEmail,
  price,
  pendingOrderId,
}: {
  isSignedIn: boolean;
  userEmail: string | null;
  price: number;
  pendingOrderId: string | null;
}) {
  const [stage, setStage] = useState<Stage>(pendingOrderId ? "upload" : "form");
  const [orderId, setOrderId] = useState<string | null>(pendingOrderId);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

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

  async function upload(forOrderId: string, resume: File) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("orderId", forOrderId);
      fd.append("resume", resume);
      const res = await fetch("/api/resume-review/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStage("upload");
        setError(data.error ?? "Upload failed — please try again.");
        return;
      }
      track("resume_makeover_submitted");
      setStage("done");
    } catch {
      setStage("upload");
      setError("Network error — your payment is safe. Please try the upload again.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return setError("Please attach your current resume.");
    if (!scriptReady || !window.Razorpay) return setError("Payment isn't ready yet — try again in a moment.");

    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    track("resume_makeover_clicked");

    try {
      const res = await fetch("/api/resume-review/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fd.get("fullName"),
          phone: fd.get("phone"),
          targetRole: fd.get("targetRole"),
          experienceLevel: fd.get("experienceLevel"),
          notes: fd.get("notes"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start payment.");
        setBusy(false);
        return;
      }

      const resume = file;
      const rzp = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        name: "FirstOffer",
        description: "Resume Makeover",
        prefill: { email: userEmail ?? undefined, contact: String(fd.get("phone") ?? "") || undefined },
        method: { upi: true, card: true, netbanking: false, wallet: false, paylater: false, emi: false },
        handler: async (response: RazorpaySuccessResponse) => {
          const verify = await fetch("/api/resume-review/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (!verify.ok) {
            setError("Payment went through but confirmation failed — refresh this page in a minute to upload your resume.");
            setBusy(false);
            return;
          }
          track("resume_makeover_paid", { price });
          setOrderId(response.razorpay_order_id);
          await upload(response.razorpay_order_id, resume);
        },
        modal: { ondismiss: () => setBusy(false) },
        theme: { color: "#0a0a0a" },
      });
      rzp.on("payment.failed", () => {
        setError("Payment failed — please try again.");
        setBusy(false);
      });
      rzp.open();
    } catch {
      setError("Network error — try again.");
      setBusy(false);
    }
  }

  if (stage === "done") {
    return (
      <div className="resume-done" role="status">
        <span className="resume-done-icon" aria-hidden="true">✓</span>
        <h3>Got it! Your resume is with our team.</h3>
        <p>
          We&apos;ll send your rebuilt, ATS-ready resume to <strong>{userEmail}</strong>. Keep an eye on your inbox
          (and spam folder) — we may email you if we need any details.
        </p>
        <Link href="/opportunities" className="btn btn-secondary btn-sm">
          Browse openings meanwhile
        </Link>
      </div>
    );
  }

  if (stage === "upload" && orderId) {
    return (
      <div className="resume-form">
        <p className="resume-form-note">
          ✅ Your ₹{price} payment is confirmed. Just upload your current resume to finish.
        </p>
        <label className="resume-file">
          <input type="file" accept={ACCEPT} onChange={(e) => pickFile(e.target.files?.[0] ?? null)} disabled={busy} />
          <span>{file ? file.name : "Choose your resume (PDF or Word, max 4 MB)"}</span>
        </label>
        {error && <p className="resume-error">{error}</p>}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!file || busy}
          onClick={() => file && upload(orderId, file)}
        >
          {busy ? "Uploading..." : "Send my resume"}
        </button>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="resume-form">
        <Link href={`/login?next=${encodeURIComponent("/resume#makeover")}`} className="btn btn-primary">
          Get my resume fixed — ₹{price}
        </Link>
        <p className="resume-form-note">Quick Google sign-in so we know where to send your new resume.</p>
      </div>
    );
  }

  return (
    <form className="resume-form" onSubmit={handlePay}>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />
      <div className="resume-form-grid">
        <label>
          Full name *
          <input name="fullName" required maxLength={80} autoComplete="name" />
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
        {busy ? "Opening payment..." : `Pay ₹${price} & send my resume`}
      </button>
      <p className="resume-form-note">
        One-time payment via UPI or card. No subscription. Signed in as <strong>{userEmail}</strong>.
      </p>
    </form>
  );
}
