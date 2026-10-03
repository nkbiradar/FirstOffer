import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — FirstOffer",
  description: "How FirstOffer collects, uses, and protects your data.",
};

// Grounded in what this codebase actually does -- no clause here describes
// a data flow that isn't real. Google OAuth + application tracking is the
// only optional account; the Resume Keyword Matcher never persists a
// resume anywhere (see app/api/resume-match/route.ts); push notification
// subscriptions aren't tied to an account; the paid membership never
// touches card/UPI details server-side (Razorpay's own checkout handles
// that); Vercel Analytics is the only usage tracking, and Vercel's
// implementation doesn't use cookies or store IP addresses.
//
// Updated to reflect the current membership model (monthly full_access /
// internal_hr products, not the old one-time unlock) and to add the
// sections a DPDP Act, 2023 "Notice" expects -- age requirement, a named
// Grievance Officer, and a Data Protection Board complaint route -- ahead
// of the Act's substantive obligations coming into force. Still a first
// draft, not a substitute for a lawyer's review -- see the notice below
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
        Last updated: October 3, 2026
      </p>

      <p style={{ marginTop: 20 }}>
        This policy explains what FirstOffer (&quot;we&quot;, &quot;us&quot;) collects when you use{" "}
        firstoffer.online, why we collect it, and who we share it with. Searching and browsing
        listings never requires an account, but opening an individual opportunity&apos;s full
        details does — this policy covers what we collect once you sign in, plus the few things
        we collect even if you never sign in at all (see Resume Keyword Matcher and Push
        notifications below).
      </p>

      <h2 style={{ marginTop: 32 }}>What we collect</h2>
      <p style={{ marginTop: 12 }}>
        If you sign in with Google, we receive your email address, name, and profile picture from
        Google — we never see or store your Google password. If you mark an opportunity as
        applied, we store which opportunity, when, and — if you choose to answer — whether you
        heard back.
      </p>
      <p style={{ marginTop: 12 }}>
        If you use the Resume Keyword Matcher, your resume file is read in memory just long enough
        to extract its text and compare it against that opportunity&apos;s listed skills and
        requirements. The file and its extracted text are never written to disk, Supabase, or any
        database table — once your results are shown, nothing from that resume is kept anywhere.
      </p>
      <p style={{ marginTop: 12 }}>
        If you turn on push notifications, we store your browser&apos;s push subscription (an
        endpoint address and encryption keys the browser itself generates) and basic browser
        information, so we know where to deliver &quot;new opportunity&quot; alerts. This isn&apos;t
        linked to a FirstOffer account — you can turn it on or off independently of signing in.
      </p>
      <p style={{ marginTop: 12 }}>
        If you subscribe to full access or Internal HR Openings, we store the Razorpay order ID,
        payment ID, amount, status, which 30-day period it covers, and which discount code (if
        any) you used. Each membership period is a single payment that covers 30 days — it is not
        an auto-renewing or auto-debited subscription, so continuing after a period ends is your
        choice, made the same way as your first payment. We do not receive or store your card
        number, UPI ID, or any other payment credential — that exchange happens directly between
        you and Razorpay inside their own checkout.
      </p>
      <p style={{ marginTop: 12 }}>
        We also collect basic, privacy-preserving usage analytics (which pages are visited, which
        opportunities get unlocked) through Vercel Analytics, which does not use cookies and does
        not store your IP address.
      </p>

      <h2 style={{ marginTop: 32 }}>Why we collect it</h2>
      <p style={{ marginTop: 12 }}>
        To run your signed-in session, to power the &quot;mark as applied&quot; tracking feature you
        opt into, to compare a resume against a specific opportunity when you ask us to, to deliver
        new-opportunity alerts you&apos;ve opted into, to fulfill your membership payment and know
        your access is current, and to understand which parts of the site are actually useful so we
        can improve it.
      </p>

      <h2 style={{ marginTop: 32 }}>Who we share it with</h2>
      <p style={{ marginTop: 12 }}>
        We use a small number of service providers to run FirstOffer: Supabase (database and
        authentication), Google (sign-in), Razorpay (payment processing), and Vercel (hosting and
        analytics). Each only receives what it needs to do its job. We do not sell your data, and
        we do not share it with recruiters, advertisers, or any other third party for marketing
        purposes.
      </p>

      <h2 style={{ marginTop: 32 }}>Age requirement</h2>
      <p style={{ marginTop: 12 }}>
        FirstOffer is intended for users aged 18 and older. We don&apos;t knowingly collect data
        from anyone younger. If you believe a user under 18 has an account or has given us data,
        please email us at the address below and we&apos;ll delete the account and associated data
        promptly.
      </p>

      <h2 style={{ marginTop: 32 }}>Cookies</h2>
      <p style={{ marginTop: 12 }}>
        We use one cookie, set by Supabase, to keep you signed in. We don&apos;t use advertising or
        cross-site tracking cookies.
      </p>

      <h2 style={{ marginTop: 32 }}>Your data, your control</h2>
      <p style={{ marginTop: 12 }}>
        You can stop using your account at any time by signing out, and you can turn off push
        notifications at any time from your browser or device settings. To access, correct, or
        delete your account and associated data, contact us at the address below — we&apos;ll
        process the request within a reasonable time, except for records (like payment history) we
        &apos;re required to keep for accounting or legal reasons.
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

      <h2 style={{ marginTop: 32 }}>Grievance Officer &amp; complaints</h2>
      <p style={{ marginTop: 12 }}>
        In line with India&apos;s Digital Personal Data Protection Act, 2023, questions,
        complaints, or requests about your data can be sent to our Grievance Officer:
      </p>
      <p style={{ marginTop: 12 }}>
        Nayan Kumar, Founder — FirstOffer
        <br />
        <a href="mailto:support@firstoffer.online">support@firstoffer.online</a>
      </p>
      <p style={{ marginTop: 12 }}>
        We aim to acknowledge and respond within 7 business days. If you&apos;re not satisfied with
        our response, you may also raise a complaint with the Data Protection Board of India.
      </p>

      <h2 style={{ marginTop: 32 }}>Contact</h2>
      <p style={{ marginTop: 12 }}>
        Questions about this policy or your data — email us at{" "}
        <a href="mailto:support@firstoffer.online">support@firstoffer.online</a>.
      </p>

      <p style={{ marginTop: 40, fontSize: 12.5, color: "var(--color-text-tertiary)" }}>
        This is a first draft written to accurately describe what FirstOffer actually does with
        data today. It isn&apos;t legal advice, and we&apos;d recommend a quick review by a lawyer
        familiar with Indian data-protection law (the DPDP Act) before treating it as final.
      </p>
    </main>
  );
}
