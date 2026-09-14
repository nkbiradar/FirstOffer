import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

// Security headers, applied to every response this proxy sees (matcher
// below excludes static assets, which get equivalent headers for free from
// Vercel's default caching behavior and aren't script/HTML responses).
//
// script-src lists a per-request nonce (threaded to Server Components via
// the "x-nonce" request header, see lib/security/csp.ts) rather than
// 'unsafe-inline', so the site's own JSON-LD structured-data scripts keep
// working while arbitrary injected inline scripts don't. Razorpay's
// checkout script is a static <script src> tag (not injected by a nonced
// script), so its host is allowlisted directly instead of relying on
// 'strict-dynamic'.
//
// connect-src/frame-src include Razorpay's domains because the checkout
// modal it opens is an iframe that talks to Razorpay's own API -- without
// these the payment flow breaks, so if you ever see the "Unlock contact"
// button fail silently with a console CSP error, check here first.
function buildSecurityHeaders(nonce: string): Headers {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isDev = process.env.NODE_ENV !== "production";

  // @vercel/analytics loads its script from a same-origin path
  // (/_vercel/insights/script.js, proxied by Vercel's edge network) in
  // production -- 'self' already covers it there. Only in local `next dev`
  // does it fall back to an external debug script for testing without a
  // real deployment, so that host is only ever added below in the dev
  // branch and never reaches the production CSP.
  const scriptSrc = isDev
    ? // Next.js dev mode (HMR/Fast Refresh) needs 'unsafe-eval'; this branch
      // never ships to production.
      `'self' 'nonce-${nonce}' 'unsafe-eval' https://checkout.razorpay.com https://va.vercel-scripts.com`
    : `'self' 'nonce-${nonce}' https://checkout.razorpay.com`;

  const connectSrc = isDev
    ? `'self' ${supabaseUrl} https://*.razorpay.com https://va.vercel-scripts.com https://vitals.vercel-insights.com`
    : `'self' ${supabaseUrl} https://*.razorpay.com`;

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src ${connectSrc}`,
    `frame-src https://*.razorpay.com`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  const headers = new Headers();
  headers.set("Content-Security-Policy", csp);
  headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\")",
  );
  return headers;
}

function withSecurityHeaders(response: NextResponse, securityHeaders: Headers): NextResponse {
  securityHeaders.forEach((value, key) => response.headers.set(key, value));
  return response;
}

// Only /admin routes require authentication. The public site is open to
// everyone, and /admin/login itself must stay reachable so an admin can
// actually sign in.
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const securityHeaders = buildSecurityHeaders(nonce);

  // Forwarded as a request header so Server Components can read it back via
  // lib/security/csp.ts's getNonce() and stamp it onto inline <script> tags.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin/login") {
    return withSecurityHeaders(response, securityHeaders);
  }

  if (!pathname.startsWith("/admin")) {
    return withSecurityHeaders(response, securityHeaders);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return withSecurityHeaders(response, securityHeaders);
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Always call getUser() to refresh the session token if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectToLogin = () => {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", pathname);
    return withSecurityHeaders(NextResponse.redirect(redirectUrl), securityHeaders);
  };

  if (!user) {
    return redirectToLogin();
  }

  const isAdmin = Boolean(
    user.email && adminEmails().includes(user.email.toLowerCase()),
  );
  if (!isAdmin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", pathname);
    redirectUrl.searchParams.set(
      "error",
      `Access denied: ${user.email ?? "your account"} is not an allowlisted admin.`
    );
    return withSecurityHeaders(NextResponse.redirect(redirectUrl), securityHeaders);
  }

  return withSecurityHeaders(response, securityHeaders);
}

export const config = {
  matcher: [
    // Run on every route except static assets and Next's own image
    // optimizer -- those aren't HTML/script responses and don't need a CSP.
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)",
  ],
};
