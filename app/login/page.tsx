import GoogleSignInButton from "@/components/GoogleSignInButton";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Job-seeker-facing sign-in — separate from /admin/login. The only reason
// to sign in as a regular user is application tracking (see
// components/ApplyTracker.tsx); browsing/searching/applying to
// opportunities never requires an account.
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
        <p className="admin-login-sub">Sign in to track which opportunities you&apos;ve applied to.</p>

        {error && <p className="admin-login-error">{error}</p>}

        <GoogleSignInButton next={next} label="Continue with Google" />

        <p className="hint">No account needed to browse opportunities — this is only for tracking applications.</p>
      </div>
    </main>
  );
}
