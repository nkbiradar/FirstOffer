"use client";

import { useEffect, useState } from "react";

// Signals for "this page is open inside another app's built-in browser,
// not a real browser" — the Facebook/Instagram/TikTok/LinkedIn apps all
// stamp their own marker into the user agent, and Android's generic
// WebView (used by many other apps, including most links opened from
// WhatsApp/Telegram/Gmail on Android) is identifiable by the "; wv)" token
// that never appears in real Chrome's user agent.
const IN_APP_BROWSER_PATTERNS = [
  /FBAN|FBAV|FB_IAB/i,
  /Instagram/i,
  /Line\//i,
  /MicroMessenger/i,
  /TikTok|musical_ly/i,
  /Twitter/i,
  /LinkedInApp/i,
  /; wv\)/i,
];

function isLikelyInAppBrowser(userAgent: string): boolean {
  return IN_APP_BROWSER_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Google's sign-in flow needs a short-lived cookie to survive the round
 * trip through Google's own consent screen and back to this site — that
 * works fine in a real browser, but the embedded browser inside apps like
 * Instagram, Facebook, LinkedIn, or TikTok (and Android's generic WebView,
 * which is what many links opened from other apps use) frequently can't
 * hold onto it, which otherwise shows up to the visitor as a confusing
 * "PKCE code verifier not found" error only AFTER they've gone through the
 * whole Google flow and it silently failed. There's nothing this site's own
 * code can do to fix another app's embedded browser, so this warns BEFORE
 * that happens instead — see app/auth/callback/route.ts for the
 * after-the-fact version of this same explanation, for whoever doesn't see
 * (or doesn't act on) this banner first.
 *
 * Checked client-side only (navigator.userAgent isn't available during
 * server render) — starts hidden and only appears once the check runs, so
 * there's nothing to hide for visitors on a real browser.
 */
export default function InAppBrowserWarning() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    setShowWarning(isLikelyInAppBrowser(navigator.userAgent));
  }, []);

  if (!showWarning) return null;

  return (
    <p className="login-browser-notice" role="alert">
      Google sign-in often fails inside another app&apos;s built-in browser. Tap the <strong>⋯</strong> /{" "}
      <strong>⋮</strong> menu above and choose &ldquo;Open in Chrome&rdquo; (or your default browser) first.
    </p>
  );
}
