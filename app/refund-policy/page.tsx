import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — FirstOffer",
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
        Last updated: [fill in date before publishing]
      </p>

      <p style={{ marginTop: 20 }}>
        Paying to unlock an opportunity gets you instant access to its application link, form, HR
        contact, or apply instructions, delivered the moment your payment is confirmed. Because
        that information is revealed to you immediately and can&apos;t be &quot;returned,&quot; refunds
        work differently than they would for a physical product.
      </p>

      <h2 style={{ marginTop: 32 }}>General rule: no refund once unlocked</h2>
      <p style={{ marginTop: 12 }}>
        Once a payment succeeds and the application details are visible on your screen, that
        unlock isn&apos;t refundable. This is standard for instantly-delivered digital content, and
        it&apos;s what lets us keep the price at a flat ₹49 instead of building in a buffer for
        refund abuse.
      </p>

      <h2 style={{ marginTop: 32 }}>When you are eligible for a refund</h2>
      <p style={{ marginTop: 12 }}>
        We&apos;ll refund you if either of these happens:
      </p>
      <p style={{ marginTop: 12 }}>
        <strong>Payment succeeded but the unlock failed.</strong> If Razorpay charged you but the
        site shows an error instead of the application details, that&apos;s a bug on our end, not
        something you did — contact us with your payment ID and we&apos;ll either fix the unlock
        manually or refund you, whichever you&apos;d prefer.
      </p>
      <p style={{ marginTop: 12 }}>
        <strong>The listing turns out to be fraudulent or a duplicate.</strong> If an opportunity
        you paid to unlock is later confirmed to be fake, a scam, or a duplicate of another listing
        already on the site, you&apos;re entitled to a full refund even after the unlock.
      </p>

      <h2 style={{ marginTop: 32 }}>How to request a refund</h2>
      <p style={{ marginTop: 12 }}>
        Email us at [fill in your support email before publishing] with your Razorpay payment ID
        (from your payment confirmation) and a link to the opportunity. We&apos;ll review it and get
        back to you within a few days.
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
