import { headers } from "next/headers";

// Server-side twin of lib/nativeApp.ts's isFirstOfferApp(): true when the
// request comes from the FirstOffer Android app's WebView, which appends
// "FirstOfferApp" to its user agent (capacitor.config.ts ->
// android.appendUserAgent).
//
// Used to keep every price and purchase call-to-action out of the app.
// Google Play's Payments policy requires Play Billing for in-app sales of
// digital content, so the app sells nothing and does not point users to
// buy elsewhere. Members who already paid on the website still get full
// access in the app (access checks are per-account and unchanged).
export async function isAppRequest(): Promise<boolean> {
  const h = await headers();
  return /FirstOfferApp/.test(h.get("user-agent") ?? "");
}
