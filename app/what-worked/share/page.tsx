import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { getUser } from "@/lib/supabase/auth";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import InAppBrowserWarning from "@/components/InAppBrowserWarning";
import { APPLICATION_RANGES, WHAT_WORKED_TAGS } from "@/lib/data/what-worked";

export const metadata: Metadata = {
  title: "Share what worked for you — FirstOffer",
  description: "Started getting interview calls after a dry spell? Share what you changed to help other freshers.",
  alternates: { canonical: `${getSiteUrl()}/what-worked/share` },
};

type SearchParams = { [key: string]: string | string[] | undefined };

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

// Form for /what-worked. Open to any signed-in user (no payment needed).
// Posts to app/api/what-worked/route.ts, which saves a draft and emails
// the admin; nothing is public until it's published at /admin/what-worked.
export default async function ShareWhatWorkedPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const sent = first(params.sent) === "1";
  const error = first(params.error);
  const user = await getUser();

  if (sent) {
    return (
      <main className="admin-login">
        <div className="card admin-login-card story-card">
          <span className="eyebrow" style={{ justifySelf: "start" }}>
            <span className="eyebrow-dot" />
            Story received
          </span>
          <h1>Thank you for sharing 🙌</h1>
          <p className="admin-login-sub" style={{ margin: 0, fontSize: 15 }}>
            We&apos;ll review it shortly. Once it&apos;s live on the What Worked page, it could be exactly what another
            fresher needs to hear.
          </p>
          <Link className="btn btn-primary" href="/what-worked">
            Read other stories
          </Link>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="admin-login">
        <div className="card admin-login-card story-card">
          <span className="eyebrow" style={{ justifySelf: "start" }}>
            <span className="eyebrow-dot" />
            What worked for you
          </span>
          <h1>Went from no calls to interview calls?</h1>
          <p className="admin-login-sub" style={{ fontSize: 14 }}>
            Sign in with Google to share what you changed. It takes 2 minutes and you can stay anonymous.
          </p>
          <InAppBrowserWarning />
          <GoogleSignInButton next="/what-worked/share" label="Continue with Google" />
        </div>
      </main>
    );
  }

  return (
    <main className="admin-login">
      <form className="card admin-login-card story-card ww-form" method="post" action="/api/what-worked">
        <span className="eyebrow" style={{ justifySelf: "start" }}>
          <span className="eyebrow-dot" />
          What worked for you
        </span>
        <h1>Help a fresher who&apos;s stuck where you were</h1>
        <p className="admin-login-sub" style={{ fontSize: 14 }}>
          Tell us what wasn&apos;t working, what you changed, and what happened. Be specific — that&apos;s what helps.
        </p>

        {error && <p className="admin-login-error">{error}</p>}

        <div className="story-grid">
          <label>
            Your name *
            <input autoComplete="name" maxLength={80} name="display_name" required />
          </label>
          <label>
            College
            <input maxLength={120} name="college" placeholder="e.g. NMIT" />
          </label>
          <label>
            Graduation batch
            <input inputMode="numeric" maxLength={10} name="graduation_batch" placeholder="e.g. 2025" />
          </label>
          <label>
            Role you were applying for
            <input maxLength={100} name="target_role" placeholder="e.g. Software Engineer" />
          </label>
        </div>

        <label className="story-consent">
          <input name="is_anonymous" type="checkbox" value="yes" />
          <span>Show my story as <strong>Anonymous</strong> (hide my name and college)</span>
        </label>

        <fieldset className="story-outcome">
          <legend>How many applications before things changed?</legend>
          {APPLICATION_RANGES.map((r, i) => (
            <label className="story-choice" key={r}>
              <input defaultChecked={i === 1} name="applications_before" type="radio" value={r} /> {r}
            </label>
          ))}
        </fieldset>

        <label>
          What wasn&apos;t working before?
          <textarea
            maxLength={400}
            name="what_wasnt_working"
            placeholder="e.g. I applied to 120 jobs on job portals with the same resume and got no replies."
            rows={3}
          />
        </label>

        <label>
          What did you change? * <span className="story-private">(one change per line)</span>
          <textarea
            maxLength={800}
            name="what_changed"
            placeholder={"e.g. Rewrote my resume with numbers in every project\nApplied within 24 hours of a job being posted\nEmailed HRs directly with a 3-line note"}
            required
            rows={5}
          />
        </label>

        <label>
          What happened after? *
          <input maxLength={200} name="result" placeholder="e.g. Got 3 interview calls in 2 weeks" required />
        </label>

        <fieldset className="story-outcome ww-tag-picks">
          <legend>Which of these helped? (tick all that apply)</legend>
          {WHAT_WORKED_TAGS.map((t) => (
            <label className="story-choice" key={t.slug}>
              <input name="tags" type="checkbox" value={t.slug} /> {t.label}
            </label>
          ))}
        </fieldset>

        <p className="story-signed-in">
          Signed in as <strong>{user.email}</strong>. Your email stays private.
        </p>

        <input aria-hidden="true" autoComplete="off" className="story-hp" name="website" tabIndex={-1} type="text" />

        <label className="story-consent">
          <input name="consent" required type="checkbox" value="yes" />
          <span>
            This is my real experience, and FirstOffer may show it on its website and social media (anonymously if I
            ticked that box).
          </span>
        </label>

        <button type="submit">Share my story</button>
      </form>
    </main>
  );
}
