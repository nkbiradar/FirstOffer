import type { ReactNode } from "react";
import { Inter, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getUser, isAdminEmail } from "@/lib/supabase/auth";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Display face for headings/hero/stat numbers only — see --font-display in
// globals.css. Body copy and UI chrome (buttons, nav, forms) stay on Inter;
// this just gives headlines their own character. Self-hosted by Next at
// build time like Inter already is, so no extra runtime request.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata = {
  // metadataBase resolves every relative openGraph/icon path (and any page
  // that doesn't set its own absolute url) against the real domain instead
  // of localhost — without it, social previews silently break in
  // production. Individual pages (homepage, /opportunities, opportunity
  // detail) override title/description/openGraph with keyword-led copy;
  // this is the fallback for every other page (About, Companies, etc).
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "FirstOffer — Fresher Jobs, IT Openings & Internships",
    template: "%s | FirstOffer",
  },
  description:
    "FirstOffer helps freshers discover fresher jobs, IT openings, internships and off-campus opportunities, collected and organized in one place.",
  robots: { index: true, follow: true },
  openGraph: {
    siteName: "FirstOffer",
    type: "website",
    locale: "en_IN",
    images: [{ url: "/images/hero-journey.webp", width: 1672, height: 941 }],
  },
  twitter: {
    card: "summary_large_image",
  },
  verification: {
    google: "AQXt6ABFULn1M3O6AaFeT1bG0d4qMKZEP7spbzPd3lE",
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Fetched once here (a Server Component) and passed down, rather than
  // Navbar fetching it client-side — every page already goes through this
  // layout, so this is the one place the whole site's auth state is known.
  const user = await getUser();
  const navUser = user ? { email: user.email ?? null } : null;
  // Same reasoning as Step 8: the public site shouldn't advertise the admin
  // area to regular visitors. But the actual admin, once signed in, needs a
  // way back into /admin that isn't "remember the URL" — so the nav link is
  // gated on this instead of removed outright. isAdminEmail() reuses the
  // `user` already fetched above rather than a second Supabase round-trip.
  const isAdmin = isAdminEmail(user?.email);

  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <div className="site-shell">
          <Navbar user={navUser} isAdmin={isAdmin} />
          {children}
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
