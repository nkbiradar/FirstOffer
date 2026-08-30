import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — FirstOffer",
  description: "The terms that govern using FirstOffer.",
};

export default function TermsPage() {
  return (
    <main className="page">
      <span className="eyebrow">
        <span className="eyebrow-dot" />
        Legal
      </span>
      <h1 style={{ marginTop: 14 }}>Terms of Service</h1>
      <p style={{ marginTop: 6, fontSize: 13.5 }}>
        Last updated: [fill in date before publishing]
      </p>

      <p style={{ marginTop: 20 }}>
        By using firstoffer.app, you agree to these terms. If you don&apos;t agree, please don&apos;t
        use the site.
      </p>

      <h2 style={{ marginTop: 32 }}>What FirstOffer is</h2>
      <p style={{ marginTop: 12 }}>
        FirstOffer is a discovery site that collects internship, full-time, and off-campus
        opportunities and presents them in one place. We are not a recruiter, staffing agency, or
        employer, and we are not a party to any application, interview, offer, or employment
        relationship that results from using the site. When you apply, you&apos;re applying directly
        to the company through their own link, form, or email.
      </p>

      <h2 style={{ marginTop: 32 }}>Eligibility</h2>
      <p style={{ marginTop: 12 }}>
        You need to be legally able to enter into a binding agreement in your jurisdiction to use
        FirstOffer, and to use the paid unlock feature specifically, you need to be able to make
        an online payment in your own name or with permission from whoever&apos;s payment method
        you&apos;re using.
      </p>

      <h2 style={{ marginTop: 32 }}>Accounts</h2>
      <p style={{ marginTop: 12 }}>
        Browsing and applying never require an account. Signing in with Google is optional and
        only needed for the &quot;mark as applied&quot; tracking feature and for paid unlocks. You&apos;re
        responsible for whatever happens through your account while you&apos;re signed in.
      </p>

      <h2 style={{ marginTop: 32 }}>Listing accuracy</h2>
      <p style={{ marginTop: 12 }}>
        We curate every listing by hand and automatically remove it 48 hours after it&apos;s
        published (see <Link href="/about">About</Link>), but we can&apos;t guarantee that every
        listing is accurate, still open, or legitimate at the moment you view it — that&apos;s
        ultimately the posting company&apos;s information, not ours. Always verify details with the
        company directly before relying on them.
      </p>

      <h2 style={{ marginTop: 32 }}>Paid unlocks</h2>
      <p style={{ marginTop: 12 }}>
        Some opportunities require a one-time payment to reveal the application link, form, HR
        contact, or apply instructions. Prices are shown before you pay and may change over time.
        Payments are processed by Razorpay; we never see or store your card or UPI details. See
        our <Link href="/refund-policy">Refund Policy</Link> for what happens if something goes
        wrong with a payment.
      </p>

      <h2 style={{ marginTop: 32 }}>Acceptable use</h2>
      <p style={{ marginTop: 12 }}>
        Don&apos;t scrape, bulk-download, or republish FirstOffer&apos;s listings elsewhere; don&apos;t try
        to bypass the unlock feature; don&apos;t use the site to spam or defraud companies or other
        users; don&apos;t attempt to disrupt the site&apos;s normal operation.
      </p>

      <h2 style={{ marginTop: 32 }}>Third-party links</h2>
      <p style={{ marginTop: 12 }}>
        Once you click through to apply, you&apos;re on the company&apos;s own site, form, or email
        client, governed by their terms and privacy practices, not ours.
      </p>

      <h2 style={{ marginTop: 32 }}>Limitation of liability</h2>
      <p style={{ marginTop: 12 }}>
        FirstOffer is provided &quot;as is.&quot; We do our best to keep listings accurate and current,
        but we&apos;re not liable for a listing being wrong, stale, or fraudulent, for any outcome
        of an application you make through the site, or for any action taken by a company you
        applied to.
      </p>

      <h2 style={{ marginTop: 32 }}>Termination</h2>
      <p style={{ marginTop: 12 }}>
        We may suspend or close an account that misuses the site. You can stop using FirstOffer,
        or ask us to delete your account, at any time.
      </p>

      <h2 style={{ marginTop: 32 }}>Governing law</h2>
      <p style={{ marginTop: 12 }}>
        These terms are governed by the laws of India, and any dispute will be handled in the
        courts of [fill in your city/jurisdiction before publishing].
      </p>

      <h2 style={{ marginTop: 32 }}>Changes to these terms</h2>
      <p style={{ marginTop: 12 }}>
        If we make a meaningful change, we&apos;ll update the date at the top of this page.
      </p>

      <h2 style={{ marginTop: 32 }}>Contact</h2>
      <p style={{ marginTop: 12 }}>
        Questions about these terms — [fill in your support email before publishing].
      </p>

      <p style={{ marginTop: 40, fontSize: 12.5, color: "var(--color-text-tertiary)" }}>
        This is a first draft, written to match how FirstOffer actually works today. It isn&apos;t
        legal advice — a quick review by a lawyer before this is treated as final is worth it,
        especially the business-details placeholders here and on the Privacy and Refund pages.
      </p>
    </main>
  );
}
