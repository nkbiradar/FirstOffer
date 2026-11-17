import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "When a FirstOffer unlock payment is eligible for a refund.",
};

export default function RefundPolicyPage() {
  return (
    <main className="page">
      <span className="eyebrow">
        <span className="eyebrow-dot" />
        Legal
      </span>
      <h1 style={{ marginTop: 14 }}>Refund Policy</h1>
      <p style={{ marginTop: 6, fontSize: 13.5 }}>
        Last updated: November 17, 2026
      </p>

      <p style={{ marginTop: 20 }}>
        A single one-time payment gets you instant access to the application link, form, HR
        contact, or apply instructions on every opportunity on FirstOffer, delivered the moment
        your payment is confirmed. Because that access is granted to you immediately and
        can&apos;t be &quot;returned,&quot; refunds work differently than they would for a physical
        product.
      </p>

      <h2 style={{ marginTop: 32 }}>General rule: no refund once unlocked</h2>
      <p style={{ marginTop: 12 }}>
        Once a payment succeeds and application details become visible on your screen, that unlock
        isn&apos;t refundable. This is standard for instantly-delivered digital content, and it&apos;s
        what lets us keep membership pricing predictable instead of building in a buffer for
        refund abuse.
      </p>

      <h2 style={{ marginTop: 32 }}>When you are eligible for a refund</h2>
      <p style={{ marginTop: 12 }}>
        Apart from the Internal HR Interview Call Promise and the older Interview Call Guarantee below, we&apos;ll also refund you if either of these happens:
      </p>
      <p style={{ marginTop: 12 }}>
        <strong>Payment succeeded but the unlock failed.</strong> If Razorpay charged you but the
        site shows an error instead of the application details, that&apos;s a bug on our end, not
        something you did — contact us with your payment ID and we&apos;ll either fix the unlock
        manually or refund you, whichever you&apos;d prefer.
      </p>
      <p style={{ marginTop: 12 }}>
        <strong>The listing that triggered your payment turns out to be fraudulent or a
        duplicate.</strong> If the opportunity you were viewing when you paid is later confirmed to
        be fake, a scam, or a duplicate of another listing already on the site, you&apos;re entitled
        to a full refund even after the unlock.
      </p>

      <h2 id="internal-hr-promise" style={{ marginTop: 32, scrollMarginTop: 90 }}>
        🛡️ Internal HR Interview Call Promise (purchases from 17 Nov 2026)
      </h2>
      <p style={{ marginTop: 12 }}>
        If you buy the Internal HR plan and don&apos;t get a single interview call during your 3 months of access,
        we&apos;ll give you <strong>the next 3 months of Internal HR free</strong>. This is an access extension, not a
        cash refund.
      </p>
      <p style={{ marginTop: 12 }}>
        <strong>Who it&apos;s for:</strong> members who actually used the plan — you applied to at least 10 openings or
        referral openings on FirstOffer during your 3 months.
      </p>
      <p style={{ marginTop: 12 }}>
        <strong>How to claim:</strong> email{" "}
        <a href="mailto:support@firstoffer.online">support@firstoffer.online</a> from the email address you signed up
        with, within 7 days after your access ends, with a line confirming you didn&apos;t receive any interview call.
        We&apos;ll extend your access within 2 working days. One free extension per member.
      </p>
      <p style={{ marginTop: 12 }}>
        FirstOffer shares openings, referrals and resources — hiring decisions are always made by the companies, so we
        can&apos;t promise a job. This promise is our way of standing behind the plan.
      </p>

      <h2 id="interview-guarantee" style={{ marginTop: 32, scrollMarginTop: 90 }}>
        🛡️ Interview Call Guarantee (Full Access purchases up to 25 Oct 2026)
      </h2>
      <p style={{ marginTop: 12 }}>
        This guarantee is no longer offered for new purchases. It still applies to everyone who bought
        Full Access on or before 25 October 2026: if you bought the Full Access plan and don&apos;t get a single interview call in your first month
        (30 days from your payment date), we&apos;ll give you a <strong>full refund</strong>.
      </p>
      <p style={{ marginTop: 12 }}>
        <strong>How to claim:</strong> once your first month is over, email{" "}
        <a href="mailto:support@firstoffer.online">support@firstoffer.online</a> from the email address you
        signed up with, within 7 days of the month ending. Include:
      </p>
      <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.7 }}>
        <li>A screenshot of your payment showing the purchase date (UPI app, bank SMS or Razorpay receipt)</li>
        <li>Your Razorpay payment ID, if you have it</li>
        <li>A line confirming you didn&apos;t receive any interview call during that month</li>
      </ul>
      <p style={{ marginTop: 12 }}>
        One refund per person. Your Full Access ends once the refund is processed. Accounts suspended
        for sharing (see <Link href="/terms#personal-use">Personal use only</Link>) aren&apos;t eligible.
      </p>

      <h2 style={{ marginTop: 32 }}>How to request a refund</h2>
      <p style={{ marginTop: 12 }}>
        Email us at <a href="mailto:support@firstoffer.online">support@firstoffer.online</a> with
        your Razorpay payment ID (from your payment confirmation) and a link to the opportunity.
        We&apos;ll review it and get back to you within a few days.
      </p>

      <h2 style={{ marginTop: 32 }}>Refund timeline</h2>
      <p style={{ marginTop: 12 }}>
        Approved refunds are processed back to your original payment method through Razorpay,
        which typically takes 5–7 business days to reflect, depending on your bank.
      </p>

      <p style={{ marginTop: 32 }}>
        See also our <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <p style={{ marginTop: 40, fontSize: 12.5, color: "var(--color-text-tertiary)" }}>
        This is a first draft matching how the unlock feature actually works today. It isn&apos;t
        legal advice, and it&apos;s worth a quick sanity check against Razorpay&apos;s own merchant
        refund-policy requirements before this is treated as final.
      </p>
    </main>
  );
}
