import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Starts Google sign-in on the SERVER instead of in the browser.
//
// Why: with the old browser-side start, the PKCE "code verifier" cookie was
// written by JavaScript just before the page navigated to Google. On many
// phones (and some laptops — ad blockers, privacy modes, double taps,
// stale tabs) that cookie was lost or overwritten by the time Google sent
// the user back, giving "Sign-in didn't go through". Here the verifier is
// set as a normal Set-Cookie header on this redirect response, on the exact
// host the callback will come back to, before the browser ever leaves the
// site — the most reliable way to keep it.
//
// ?retry=1 is used by /auth/callback to restart the flow automatically
// once if the verifier still went missing; on a retry Google's account
// picker is skipped, so the user usually just sees a quick bounce.
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const next = safeNext(url.searchParams.get("next"));
  const retry = url.searchParams.get("retry") === "1";
  const loginPath = next.startsWith("/admin") ? "/admin/login" : "/login";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(`${origin}${loginPath}?error=${encodeURIComponent("Sign-in is not configured.")}`);
  }

  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies.push(...(cookiesToSet as typeof pendingCookies));
      },
    },
  });

  const callback = `${origin}/auth/callback?next=${encodeURIComponent(next)}${retry ? "&retry=1" : ""}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback,
      skipBrowserRedirect: true,
      // Account picker on the first try (so people can switch accounts);
      // skipped on the automatic retry so it's seamless.
      queryParams: retry ? undefined : { prompt: "select_account" },
    },
  });

  if (error || !data?.url) {
    console.error("Google sign-in start failed:", error?.message);
    return NextResponse.redirect(
      `${origin}${loginPath}?next=${encodeURIComponent(next)}&error=${encodeURIComponent(
        "Could not start Google sign-in — please try again.",
      )}`,
    );
  }

  const response = NextResponse.redirect(data.url);
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, {
      ...(options as object),
      path: "/",
      sameSite: "lax",
      secure: origin.startsWith("https://"),
      // Long enough for slow sign-ins (OTP, 2-step verification).
      maxAge: 60 * 60,
    });
  }
  // Never cache the redirect — every sign-in needs a fresh verifier.
  response.headers.set("Cache-Control", "no-store");
  return response;
}
