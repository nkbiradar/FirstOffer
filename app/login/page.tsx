import GoogleSignInButton from "@/components/GoogleSignInButton";
import InAppBrowserWarning from "@/components/InAppBrowserWarning";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Job-seeker-facing sign-in — separate from /admin/login. Opening an
// individual opportunity's details now requires signing in first (see
// components/OpportunityCard.tsx, which routes signed-out visitors here
// with ?next=/opportunities/{id}); it also doubles as application tracking
// (see components/ApplyTracker.tsx). Only searching/filtering the listing
// pages themselves (e.g. /opportunities) stays account-free.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const next = firstValue(params.next) || "/";
  const error = firstValue(params.error);

  return (
    <main className="admin-login">
      <div className="card admin-login-card">
        <span className="eyebrow" style={{ justifySelf: "start" }}>
          <span className="eyebrow-dot" />
          Sign in
        </span>
        <h1>Welcome to FirstOffer</h1>
        <p className="admin-login-sub">Sign in to view opportunity details and track what you&apos;ve applied to.</p>

        {error && <p className="admin-login-error">{error}</p>}
        <InAppBrowserWarning />

        <GoogleSignInButton next={next} label="Continue with Google" />

        <p className="hint">Searching and filtering listings is always free — signing in is just for opening a role and tracking your applications.</p>
      </div>
    </main>
  );
}
