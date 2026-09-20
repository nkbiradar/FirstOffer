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
// started the flow (not always /login) with a human-readable error —
// three failure modes look identical to the user otherwise but have very
// different causes:
//   1. Google redirects back WITHOUT a `code`, instead with its own
//      `error`/`error_description` — most commonly because the Google
//      Cloud OAuth consent screen is still in "Testing" status and the
//      account that just signed in hasn't been added as a Test User there.
//   2. Google redirects back WITH a `code`, but the PKCE "code verifier"
//      cookie set when the flow started isn't there anymore ("code
//      verifier not found/expired" in Supabase's error text). This isn't a
//      config bug — it happens when the visitor's browser couldn't hold
//      onto that cookie across the round trip through Google, which is
//      common inside an app's built-in browser (Instagram, Facebook,
//      LinkedIn, TikTok, or Android's generic WebView) rather than a real
//      browser — see components/InAppBrowserWarning.tsx, which tries to
//      warn about this BEFORE it happens. Given the raw Supabase message
//      ("PKCE code verifier not found in storage...") means nothing to a
//      job-seeker, this case gets its own plain-language explanation.
//   3. Some other exchange failure (expired/already-used code, provider
//      misconfigured in the Supabase dashboard, etc.) — shown as-is.
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

    const isMissingVerifier = /code verifier/i.test(error.message);
    const userMessage = isMissingVerifier
      ? "Sign-in didn't go through — this usually happens when the page was opened inside another app's built-in browser (like Instagram, Facebook, or WhatsApp). Tap the ⋯ / ⋮ menu and choose \"Open in Chrome\" (or your default browser), then try again."
      : `Could not complete Google sign-in: ${error.message}`;

    return NextResponse.redirect(
      `${origin}${loginPath}?next=${encodeURIComponent(next)}&error=${encodeURIComponent(userMessage)}`,
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
