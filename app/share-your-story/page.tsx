import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { getUser } from "@/lib/supabase/auth";
import { hasEverPaid } from "@/lib/data/subscriptions";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import InAppBrowserWarning from "@/components/InAppBrowserWarning";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const metadata: Metadata = {
  title: "Share your story — got an interview or offer?",
  description:
    "Got an interview call or an offer through FirstOffer? Tell us — your story helps other freshers keep going.",
  alternates: { canonical: `${getSiteUrl()}/share-your-story` },
};

// "Got an interview / got selected" form — ONLY for signed-in users who have
// paid FirstOffer at least once (hasEverPaid). Posts to
// app/api/stories/route.ts, which saves a DRAFT testimonial and emails the
// admin; the admin verifies it and publishes it from /admin/testimonials.
// Share this link with members (WhatsApp, email): /share-your-story
export default async function ShareYourStoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sent = firstValue(params.sent) === "1";
  const error = firstValue(params.error);

  const user = await getUser();

  // Signed out: sign in first (Google), then come straight back here.
  if (!user && !sent) {
    return (
      <main className="admin-login">
        <div className="card admin-login-card story-card">
          <span className="eyebrow" style={{ justifySelf: "start" }}>
            <span className="eyebrow-dot" />
            Share your story
          </span>
          <h1>Got an interview call or an offer? 🎉</h1>
          <p className="admin-login-sub" style={{ fontSize: 14 }}>
            Sign in with the Google account you use on FirstOffer to share your story.
          </p>
          <InAppBrowserWarning />
          <GoogleSignInButton next="/share-your-story" label="Continue with Google" />
        </div>
      </main>
    );
  }

  // Signed in but never paid: this form is for members only.
  if (user && !sent && !(await hasEverPaid(user.id))) {
    return (
      <main className="admin-login">
        <div className="card admin-login-card story-card">
          <span className="eyebrow" style={{ justifySelf: "start" }}>
            <span className="eyebrow-dot" />
            Members only
          </span>
          <h1>This form is for FirstOffer members</h1>
          <p className="admin-login-sub" style={{ fontSize: 14 }}>
            Story sharing is open to members who have unlocked access on FirstOffer. You&apos;re signed in as{" "}
            <strong>{user.email}</strong>. If you paid with a different Google account, sign out and sign in with
            that one.
          </p>
          <Link className="btn btn-secondary" href="/">
            Back to FirstOffer
          </Link>
        </div>
      </main>
    );
  }

  if (sent) {
    return (
      <main className="admin-login">
        <div className="card admin-login-card story-card">
          <span className="eyebrow" style={{ justifySelf: "start" }}>
            <span className="eyebrow-dot" />
            Story received
          </span>
          <h1>🎉 Congratulations, and thank you!</h1>
          <p className="admin-login-sub" style={{ margin: 0, fontSize: 15 }}>
            We&apos;ll take a quick look and may reach out on your account email before featuring your story.
            Every story like yours keeps another fresher going.
          </p>
          <Link className="btn btn-primary" href="/">
            Back to FirstOffer
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-login">
      <form className="card admin-login-card story-card" method="post" action="/api/stories">
        <span className="eyebrow" style={{ justifySelf: "start" }}>
          <span className="eyebrow-dot" />
          Share your story
        </span>
        <h1>Got an interview call or an offer? 🎉</h1>
        <p className="admin-login-sub" style={{ fontSize: 14 }}>
          Tell us about it. Your story helps other freshers know it&apos;s possible. Takes 1 minute.
        </p>

        {error && <p className="admin-login-error">{error}</p>}

        <fieldset className="story-outcome">
          <legend>What happened?</legend>
          <label className="story-choice">
            <input type="radio" name="outcome" value="interview" defaultChecked /> Got an interview call
          </label>
          <label className="story-choice">
            <input type="radio" name="outcome" value="selected" /> Got selected / got an offer
          </label>
        </fieldset>

        <div className="story-grid">
          <label>
            Your name *
            <input name="student_name" required maxLength={80} autoComplete="name" />
          </label>
          <label>
            Company *
            <input name="company_name" required maxLength={100} placeholder="e.g. Infosys" />
          </label>
          <label>
            Role
            <input name="role" maxLength={100} placeholder="e.g. Software Engineer Intern" />
          </label>
          <label>
            College
            <input name="college" maxLength={120} placeholder="e.g. NMIT" />
          </label>
          <label>
            Graduation batch
            <input name="graduation_batch" maxLength={10} inputMode="numeric" placeholder="e.g. 2025" />
          </label>
        </div>

        <p className="story-signed-in">
          Signed in as <strong>{user?.email}</strong>. We&apos;ll only use it to contact you about your story.
        </p>

        <label>
          LinkedIn profile <span className="story-private">(optional, private)</span>
          <input name="linkedin_url" type="url" maxLength={300} placeholder="https://linkedin.com/in/..." />
        </label>

        <label>
          Your story in a line or two
          <textarea
            name="quote"
            maxLength={400}
            rows={3}
            placeholder="e.g. Applied on the company's form through FirstOffer and got a call within 4 days."
          />
        </label>

        {/* Honeypot for bots — hidden from real users. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="story-hp" aria-hidden="true" />

        <label className="story-consent">
          <input type="checkbox" name="consent" value="yes" required />
          <span>
            I&apos;m okay with FirstOffer showing my name, college, company and story on its website and social media.
            My email and LinkedIn stay private.
          </span>
        </label>

        <button type="submit">Share my story</button>
      </form>
    </main>
  );
}
