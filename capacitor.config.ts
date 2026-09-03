import type { CapacitorConfig } from "@capacitor/cli";

// FirstOffer is a server-rendered Next.js app (cookie-based Supabase auth,
// middleware, API routes, React Server Components) — it cannot be
// statically exported into a local `www/` bundle without a rewrite (see
// rebuild-plan.md's "Capacitor Android conversion" note). Instead this
// config points the native WebView straight at the live production site,
// same as visiting it in a browser — zero web-app code changes, zero risk
// of drifting out of sync with the real backend/auth/payment logic.
//
// `www/` still exists (Capacitor's CLI requires `webDir` to exist to scaffold
// the native project) but is only ever a fallback splash shown for an
// instant before the WebView navigates to `server.url`.
const config: CapacitorConfig = {
  appId: "com.firstoffer.app",
  appName: "FirstOffer",
  webDir: "www",
  server: {
    // The live site. Everything (auth, opportunities, admin, payments)
    // loads from here — same origin as the website itself, so cookies,
    // sessions and CORS all behave exactly as they do in a normal browser.
    // Points at the production custom domain, not the vercel.app deployment
    // URL, so the app matches whatever OAuth/Supabase redirect allowlists
    // are configured for firstoffer.online.
    url: "https://firstoffer.online",
    androidScheme: "https",
    cleartext: false,
    // Domains that are allowed to load INSIDE the app's WebView instead of
    // being kicked out to the system browser (see MainActivity.java's
    // shouldOverrideUrlLoading for the actual routing logic). Needed for
    // flows that must stay inside the WebView to work at all:
    //   - accounts.google.com / *.google.com — Google OAuth sign-in
    //   - *.supabase.co — Supabase auth token exchange
    //   - checkout.razorpay.com / api.razorpay.com — the ₹49 UPI checkout
    // Everything else (company career pages, Google Forms, mailto:) opens
    // in Chrome Custom Tabs or the system browser/mail app instead — see
    // Phase 5 in the conversion report for why.
    allowNavigation: [
      "firstoffer.online",
      "*.google.com",
      "accounts.google.com",
      "*.supabase.co",
      "*.razorpay.com",
      "checkout.razorpay.com",
      "api.razorpay.com",
    ],
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#4f46e5",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
