import FounderNote from "@/components/FounderNote";

export default function AboutPage() {
  return (
    <main className="page">
      <span className="eyebrow">
        <span className="eyebrow-dot" />
        About FirstOffer
      </span>
      <h1 style={{ marginTop: 14 }}>Built for freshers, not another job board.</h1>
      <p style={{ marginTop: 14 }}>
        FirstOffer collects fresher-focused opportunities — internships, full-time roles, and
        off-campus drives — and presents them in one clean, searchable place. No clutter: just
        find an opportunity and apply directly, on the company&apos;s own terms.
      </p>

      <h2 style={{ marginTop: 32 }}>The 48-hour promise</h2>
      <p style={{ marginTop: 12 }}>
        Every opportunity we publish comes down automatically 48 hours after it goes live —
        whether or not it&apos;s still open. That&apos;s deliberate: companies close their hiring
        windows fast, and a listing that&apos;s still up after the role is filled just wastes your
        time. If it&apos;s on FirstOffer, it&apos;s recent. If it&apos;s not here anymore, we&apos;ve
        already pulled it down for you.
      </p>

      <h2 style={{ marginTop: 32 }}>Sign in only when you open a role</h2>
      <p style={{ marginTop: 12 }}>
        Searching and browsing every listing never requires an account. Opening an individual
        opportunity to see the full details asks for a quick, free Google sign-in first — it takes
        a few seconds, and it&apos;s also what lets you keep track of what you&apos;ve applied to
        and note whether you heard back.
      </p>

      <h2 style={{ marginTop: 32 }}>Who&apos;s behind FirstOffer</h2>
      <p style={{ marginTop: 12 }}>
        FirstOffer is built and run by a 2026 Computer Science graduate who went through the same off-campus job hunt —
        scattered Telegram groups, expired links and hidden HR contacts. Every opening here is checked and posted by
        hand, and every payment and support request is handled personally.
      </p>
      <div style={{ marginTop: 16 }}>
        <FounderNote />
      </div>
    </main>
  );
}
