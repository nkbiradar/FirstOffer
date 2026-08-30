import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — FirstOffer",
  description: "How FirstOffer collects, uses, and protects your data.",
};

// Grounded in what this codebase actually does — no clause here describes
// a data flow that isn't real. Google OAuth + application tracking is the
// only optional account; the paid unlock never touches card/UPI details
// server-side (Razorpay's own checkout handles that); Vercel Analytics
// (added alongside this page) is the only usage tracking, and Vercel's
// implementation doesn't use cookies or store IP addresses.
//
// This is a first draft to get real compliance surface area in place
// quickly, not a substitute for a lawyer's review — see the notice below
// and in rebuild-plan.md Step 19.
export default function PrivacyPolicyPage() {
  return (
    <main className="page">
      <span className="eyebrow">
        <span className="eyebrow-dot" />
        Legal
      </span>
      <h1 style={{ marginTop: 14 }}>Privacy Policy</h1>
      <p style={{ marginTop: 6, fontSize: 13.5 }}>
        Last updated: [fill in date before publishing]
      </p>

      <p style={{ marginTop: 20 }}>
        This policy explains what FirstOffer (&quot;we&quot;, &quot;us&quot;) collects when you use{" "}
        firstoffer.app, why we collect it, and who we share it with. Browsing and applying to
        opportunities never requires an account — this policy mostly applies to the parts of the
        site where you choose to sign in.
      </p>

      <h2 style={{ marginTop: 32 }}>What we collect</h2>
      <p style={{ marginTop: 12 }}>
        If you sign in with Google, we receive your email address, name, and profile picture from
        Google — we never see or store your Google password. If you mark an opportunity as
        applied, we store which opportunity, when, and — if you choose to answer — whether you
        heard back. If you pay to unlock an opportunity&apos;s application details, we store the
        Razorpay order ID, payment ID, amount, and status for that transaction. We do not receive
        or store your card number, UPI ID, or any other payment credential — that exchange happens
        directly between you and Razorpay inside their own checkout.
      </p>
      <p style={{ marginTop: 12 }}>
        We also collect basic, privacy-preserving usage analytics (which pages are visited, which
        opportunities get unlocked) through Vercel Analytics, which does not use cookies and does
        not store your IP address.
      </p>

      <h2 style={{ marginTop: 32 }}>Why we collect it</h2>
      <p style={{ marginTop: 12 }}>
        To run your signed-in session, to power the &quot;mark as applied&quot; tracking feature you
        opt into, to fulfill a paid unlock and prevent being charged twice for the same
        opportunity, and to understand which parts of the site are actually useful so we can
        improve it.
      </p>

      <h2 style={{ marginTop: 32 }}>Who we share it with</h2>
      <p style={{ marginTop: 12 }}>
        We use a small number of service providers to run FirstOffer: Supabase (database and
        authentication), Google (sign-in), Razorpay (payment processing), and Vercel (hosting and
        analytics). Each only receives what it needs to do its job. We do not sell your data, and
        we do not share it with recruiters, advertisers, or any other third party for marketing
        purposes.
      </p>

      <h2 style={{ marginTop: 32 }}>Cookies</h2>
      <p style={{ marginTop: 12 }}>
        We use one cookie, set by Supabase, to keep you signed in. We don&apos;t use advertising or
        cross-site tracking cookies.
      </p>

      <h2 style={{ marginTop: 32 }}>Your data, your control</h2>
      <p style={{ marginTop: 12 }}>
        You can stop using your account at any time by signing out. To have your account and
        associated data deleted, contact us at the address below — we&apos;ll process the request
        within a reasonable time, except for records (like payment history) we&apos;re required to
        keep for accounting or legal reasons.
      </p>

      <h2 style={{ marginTop: 32 }}>Security</h2>
      <p style={{ marginTop: 12 }}>
        We rely on Google for authentication and Razorpay for payment handling, so we never store
        passwords or payment credentials ourselves. We take reasonable technical measures to
        protect the data we do hold, but no system is perfectly secure, and we can&apos;t guarantee
        absolute security.
      </p>

      <h2 style={{ marginTop: 32 }}>Changes to this policy</h2>
      <p style={{ marginTop: 12 }}>
        If this policy changes in a meaningful way, we&apos;ll update the date at the top of this
        page.
      </p>

      <h2 style={{ marginTop: 32 }}>Contact</h2>
      <p style={{ marginTop: 12 }}>
        Questions about this policy or your data — [fill in your support email before publishing].
      </p>

      <p style={{ marginTop: 40, fontSize: 12.5, color: "var(--color-text-tertiary)" }}>
        This is a first draft written to accurately describe what FirstOffer actually does with
        data today. It isn&apos;t legal advice, and we&apos;d recommend a quick review by a lawyer
        familiar with Indian data-protection law (the DPDP Act) before treating it as final —
        especially the business-details placeholders on this and the Terms and Refund pages.
      </p>
    </main>
  );
}
