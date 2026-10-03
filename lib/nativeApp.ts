// The FirstOffer Android app (Capacitor) loads this live site in a WebView
// and appends "FirstOfferApp" to the user agent (capacitor.config.ts ->
// android.appendUserAgent). Client-side only: navigator isn't available
// during server render.
export function isFirstOfferApp(): boolean {
  return typeof navigator !== "undefined" && /FirstOfferApp/.test(navigator.userAgent);
}

// Google blocks OAuth inside embedded WebViews, so inside the app the
// Google screen opens in a Chrome Custom Tab (android MainActivity) and
// Supabase must send the user back to the app via this deep link — not to
// the https callback, which would finish sign-in inside Chrome instead.
// Must be listed in Supabase -> Authentication -> URL Configuration ->
// Redirect URLs.
export const APP_AUTH_CALLBACK = "com.firstoffer.app://auth/callback";
