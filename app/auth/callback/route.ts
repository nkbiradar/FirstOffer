import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase redirects here after Google finishes its side of the OAuth flow
// (configured as the app's redirectTo in GoogleSignInButton). Exchanges the
// one-time `code` for a real session (sets the auth cookies), then sends the
// browser on to wherever the sign-in was started from (`next`) — /admin for
// the admin login page, or back to whatever page a job seeker clicked
// "Mark as Applied" from for the public login page.
//
// On failure, sends the browser back to whichever login page actually
// started the flow (not always /login) and includes the real error text —
// two failure modes look identical to the user otherwise but have very
// different causes:
//   1. Google redirects back WITHOUT a `code`, instead with its own
//      `error`/`error_description` — most commonly because the Google
//      Cloud OAuth consent screen is still in "Testing" status and the
//      account that just signed in hasn't been added as a Test User there.
//   2. Google redirects back WITH a `code`, but Supabase's exchange fails
//      (expired/already-used code, PKCE verifier cookie mismatch, provider
//      misconfigured in the Supabase dashboard, etc).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";
  const loginPath = next.startsWith("/admin") ? "/admin/login" : "/login";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Google OAuth callback: exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(
      `${origin}${loginPath}?next=${encodeURIComponent(next)}&error=${encodeURIComponent(
        `Could not complete Google sign-in: ${error.message}`,
      )}`,
    );
  }

  const googleError = searchParams.get("error_description") || searchParams.get("error");
  const message = googleError
    ? `Google sign-in was blocked: ${googleError}`
    : "Could not sign in with Google — please try again.";

  if (googleError) {
    console.error("Google OAuth callback: Google returned an error instead of a code:", googleError);
  }

  return NextResponse.redirect(
    `${origin}${loginPath}?next=${encodeURIComponent(next)}&error=${encodeURIComponent(message)}`,
  );
}
